"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // ✅ added
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import {
  Trash2, Pencil, Flag, FolderOpen, Folder,
} from "lucide-react";



export default function RepositoryPage() {
  const [resources, setResources] = useState([]);
  const [groupedResources, setGroupedResources] = useState({});
  const [folderOpenState, setFolderOpenState] = useState({});
  const [fuzzySearchTerm, setFuzzySearchTerm] = useState("");
  const [filters, setFilters] = useState({
    courseCode: "",
    year: "",
    branch: "",
    type: "",
    semester: "",
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("viewer");

  const router = useRouter();

  // ✅ Wait for auth to be ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const data = userDoc.exists() ? userDoc.data() : null;
          setUserRole(data?.role || "viewer");
        } catch (err) {
          console.error("❌ Error fetching user role:", err);
        }
      }
    });

    return () => unsubscribe(); // cleanup
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      const snapshot = await getDocs(collection(db, "resources"));
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setResources(all);
    };
    fetchResources();
  }, []);

  useEffect(() => {
    let filtered = [...resources];

    if (filters.courseCode)
      filtered = filtered.filter(
        (r) =>
          r.courseCode?.toLowerCase() === filters.courseCode.toLowerCase()
      );
    if (filters.year) filtered = filtered.filter((r) => r.year === filters.year);
    if (filters.branch) filtered = filtered.filter((r) => r.branch === filters.branch);
    if (filters.type) filtered = filtered.filter((r) => r.type === filters.type);
    if (filters.semester) filtered = filtered.filter((r) => r.semester === filters.semester);

    if (fuzzySearchTerm.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ["courseCode", "courseTitle", "description", "branch", "type", "professor"],
        threshold: 0.3,
      });
      filtered = fuse.search(fuzzySearchTerm).map((result) => result.item);
    }

    const grouped = {};
    filtered.forEach((res) => {
      const key = `${res.courseCode} ${res.courseTitle}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(res);
    });

    setGroupedResources(grouped);

    const initialState = {};
    Object.keys(grouped).forEach((folder) => {
      initialState[folder] = false;
    });
    setFolderOpenState(initialState);
  }, [resources, filters, fuzzySearchTerm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFolder = (folderName) => {
    setFolderOpenState((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleReport = async (file) => {
    const reason = prompt(
      "Why are you reporting this resource?\n(e.g., wrong file/info, outdated, abuse)"
    );
    if (!reason) return;

    const user = auth.currentUser;
    if (!user) return alert("Please log in to report.");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userInfo = userDoc.exists() ? userDoc.data() : {};

    try {
      await setDoc(doc(db, "reports", file.id), {
        resourceId: file.id,
        courseCode: file.courseCode || "",
        reason,
        reportedBy: {
          uid: user.uid,
          name: userInfo.name || "Unknown",
          email: user.email,
        },
        timestamp: serverTimestamp(),
      });

      alert("✅ Thank you. Your report has been submitted.");
    } catch (err) {
      console.error("❌ Report failed:", err);
      alert("❌ Failed to submit report. Try again.");
    }
  };



  if (!currentUser) {
    return <p className="text-center mt-10 text-gray-600">Loading user info...</p>;
  }

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-8 px-4 md:px-8 font-sans transition-all duration-500">
    <h1 className="text-3xl md:text-4xl font-extrabold text-center text-[#00274D] mb-10 animate-fade-in-up">
      🎓 Sem-Store Course Repository
    </h1>

    {/* Search & Filters */}
<div className="flex flex-wrap gap-3 mb-10 animate-fade-in-up justify-center">
  <input
    type="text"
    placeholder="🔍 Search (title, code, prof, etc.)"
    value={fuzzySearchTerm}
    onChange={(e) => setFuzzySearchTerm(e.target.value)}
    className="flex-grow min-w-[200px] max-w-[300px] border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  />

  <input
    type="text"
    name="courseCode"
    placeholder="Course Code"
    value={filters.courseCode}
    onChange={handleFilterChange}
    className="w-32 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  />

  <select
    name="year"
    value={filters.year}
    onChange={handleFilterChange}
    className="w-28 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  >
    <option value="">Year</option>
    {[...Array(6)].map((_, i) => {
      const y = (2020 + i).toString();
      return (
        <option key={y} value={y}>
          {y}
        </option>
      );
    })}
  </select>

  <select
    name="semester"
    value={filters.semester}
    onChange={handleFilterChange}
    className="w-40 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  >
    <option value="">Semester</option>
    <option value="Semester 1 (Monsoon)">Sem 1 (Monsoon)</option>
    <option value="Semester 2 (Winter)">Sem 2 (Winter)</option>
  </select>

  <select
    name="type"
    value={filters.type}
    onChange={handleFilterChange}
    className="w-28 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  >
    <option value="">Type</option>
    <option value="pdf">PDF</option>
    <option value="link">Link</option>
    <option value="image">Image</option>
  </select>

  <select
    name="branch"
    value={filters.branch}
    onChange={handleFilterChange}
    className="w-48 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition bg-white"
  >
    <option value="">Branch</option>
    <option value="Artificial Intelligence">AI</option>
    <option value="Chemical Engineering">Chemical Engg</option>
    <option value="Civil Engineering">Civil Engg</option>
    <option value="Computer Science & Engineering">CSE</option>
    <option value="Electrical Engineering">EE</option>
    <option value="Integrated Circuit Design & Technology">ICDT</option>
    <option value="Materials Engineering">Materials Engg</option>
    <option value="Mechanical Engineering">Mech Engg</option>
  </select>
</div>



    {Object.entries(groupedResources).length === 0 ? (
      <p className="text-center text-gray-500 text-lg mt-20 animate-fade-in-up">
        😕 No matching resources found.
      </p>
    ) : (
      <div className="space-y-6 animate-fade-in-up">
        {Object.entries(groupedResources).map(([folderName, files]) => (
          <div
            key={folderName}
            className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition p-4"
          >
            <button
              onClick={() => toggleFolder(folderName)}
              className="text-lg md:text-xl font-semibold text-[#00274D] mb-3 w-full text-left focus:outline-none flex items-center gap-2 transition"
            >
              {folderOpenState[folderName] ? (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 text-blue-500" />
              )}
              {folderName} {folderOpenState[folderName] ? "▾" : "▸"}
            </button>

            {folderOpenState[folderName] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  const dateStr = file.timestamp?.toDate
                    ? file.timestamp.toDate().toLocaleDateString()
                    : "Unknown";
                  const canEditOrDelete =
                    currentUser?.uid === file.uploadedBy?.uid &&
                    (userRole === "contributor" || userRole === "admin");

                  return (
                    <div
                      key={file.id}
                      className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition flex flex-col justify-between space-y-2"
                    >
                      {/* Title + buttons row */}
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-[#00274D] break-words max-w-[70%]">
                          {file.description || "No Description"}
                        </div>

                        <div className="flex gap-1 flex-wrap">
                          {canEditOrDelete && (
                            <>
                              <button
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to delete this upload?")) return;
                                  try {
                                    await deleteDoc(doc(db, "resources", file.id));
                                    setResources((prev) =>
                                      prev.filter((r) => r.id !== file.id)
                                    );
                                    alert("✅ Upload deleted.");
                                  } catch (err) {
                                    console.error("❌ Delete failed:", err);
                                    alert("❌ Error deleting upload.");
                                  }
                                }}
                                className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs flex items-center gap-1 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                              <button
                                onClick={() => router.push(`/edit/${file.id}`)}
                                className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs flex items-center gap-1 transition"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleReport(file)}
                            className="px-2 py-1 rounded bg-amber-300 hover:bg-amber-400 text-[#00274D] text-xs flex items-center gap-1 transition"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </button>
                        </div>
                      </div>

                      {/* File URLs */}
                      <div className="pl-2 border-l-4 border-blue-300 mt-2 flex flex-col gap-1">
                        {file.urls?.map((url, i) => {
                          const filename = decodeURIComponent(
                            url.split("/").pop().split("?")[0]
                          );
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 font-medium underline hover:text-blue-900 transition break-words"
                            >
                              {filename}
                            </a>
                          );
                        })}
                      </div>

                      {/* Metadata */}
                      <div className="text-sm text-gray-600 mt-1 leading-snug space-y-0.5">
                        <div>
                          📄 <strong>Type:</strong> {file.type?.toUpperCase() || "N/A"}
                        </div>
                        <div>
                          👤 <strong>By:</strong> {file.uploadedBy?.name || "Unknown"} (
                          {file.uploadedBy?.email})
                        </div>
                        <div>
                          🗓️ <strong>Date:</strong> {dateStr}
                        </div>
                        <div>
                          📘 <strong>Course:</strong> {file.courseCode || "N/A"} (
                          {file.year}, {file.branch})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
}