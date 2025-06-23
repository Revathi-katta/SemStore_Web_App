"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // ✅ added
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";

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

  const handleDelete = async (resourceId) => {
    const confirmDelete = confirm("Are you sure you want to delete this resource?");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "resources", resourceId));
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      alert("✅ Deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete the resource.");
    }
  };

  if (!currentUser) {
    return <p className="text-center mt-10 text-gray-600">Loading user info...</p>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-8">🎓 Sem-Store Course Repository</h1>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-10">
        <input
          type="text"
          placeholder="🔍 Search (title, code, prof, etc.)"
          value={fuzzySearchTerm}
          onChange={(e) => setFuzzySearchTerm(e.target.value)}
          className="border p-2 rounded col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          name="courseCode"
          placeholder="Course (e.g. CS101)"
          value={filters.courseCode}
          onChange={handleFilterChange}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Years</option>
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
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Semesters</option>
          <option value="Semester 1 (Monsoon)">Semester 1 (Monsoon)</option>
          <option value="Semester 2 (Winter)">Semester 2 (Winter)</option>
        </select>

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="link">Link</option>
          <option value="image">Image</option>
        </select>

        <select
          name="branch"
          value={filters.branch}
          onChange={handleFilterChange}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Branches</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Chemical Engineering">Chemical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Integrated Circuit Design & Technology">Integrated Circuit Design & Technology</option>
          <option value="Materials Engineering">Materials Engineering</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
        </select>
      </div>

      {Object.entries(groupedResources).length === 0 ? (
        <p className="text-center text-gray-400 text-lg mt-20">😕 No matching resources found.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResources).map(([folderName, files]) => (
            <div key={folderName} className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 p-5 rounded-xl shadow">
              <button
                onClick={() => toggleFolder(folderName)}
                className="text-xl font-bold text-blue-800 mb-1 w-full text-left focus:outline-none"
              >
                📁 {folderName} {folderOpenState[folderName] ? "▾" : "▸"}
              </button>

              {folderOpenState[folderName] && (
                <ul className="space-y-4">
                  {files.map((file, idx) =>
                    file.urls?.map((url, i) => {
                      const filename = decodeURIComponent(url.split("/").pop().split("?")[0]);
                      const dateStr = file.timestamp?.toDate
                        ? file.timestamp.toDate().toLocaleDateString()
                        : "Unknown";

                      const canEditOrDelete =
                        currentUser?.uid === file.uploadedBy?.uid &&
                        (userRole === "contributor" || userRole === "admin");

                      return (
                        <li
                          key={`${idx}-${i}`}
                          className="border border-blue-100 rounded-md p-3 bg-white hover:bg-blue-50 transition"
                        >
                          {canEditOrDelete && (
                            <div className="mt-2 flex gap-3 text-sm">
                              <button
                                onClick={() => handleDelete(file.id)}
                                className="text-red-600 hover:text-red-800 underline"
                              >
                                🗑 Delete
                              </button>
                              <button
                                onClick={() => router.push(`/edit/${file.id}`)}
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                ✏ Edit
                              </button>
                            </div>
                          )}

                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold underline"
                          >
                            {filename}
                          </a>
                          <span className="text-gray-700 text-sm ml-1">
                            ({file.description}, {file.year}, {file.branch})
                          </span>
                          <div className="text-sm text-gray-600 ml-2 mt-1 leading-snug">
                            • <strong>Type:</strong> {file.type?.toUpperCase() || "N/A"} <br />
                            • <strong>Uploaded by:</strong> {file.uploadedBy?.name || "Unknown"} ({file.uploadedBy?.email}) <br />
                            • <strong>Uploaded on:</strong> {dateStr}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
