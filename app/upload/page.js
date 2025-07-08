"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [form, setForm] = useState({
    courseTitle: "",
    description: "",
    type: "pdf",
    courseCode: "",
    year: "",
    semester: "",
    branch: "",
    professor: "",
    files: [],
    link: "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You are not logged in. Redirecting...");
        router.push("/");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser(data);
        setRole(data.role || "viewer");
      } else {
        alert("User data not found. Please contact admin.");
      }
    };
    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadToCloudinary = async (file, index, total) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "semstore_unsigned");
    formData.append("folder", "semstore/resources");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dgtxlrgzs/auto/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.secure_url) {
      setProgress(Math.round(((index + 1) / total) * 100));
      return data.secure_url;
    }
    throw new Error("Upload failed");
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setProgress(0);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You are not logged in.");
        return;
      }

      const requiredFields = ["courseTitle", "courseCode", "year"];
      for (const field of requiredFields) {
        if (!form[field]) {
          alert(`Please fill in the ${field}`);
          return;
        }
      }

      const approved = role !== "viewer";
      let urls = [];

      if (form.type === "link") {
        const link = form.link.trim();
        if (!link.startsWith("http")) {
          alert("Please enter a valid URL.");
          return;
        }
        urls.push(link);
        setProgress(100);
      } else {
        if (!form.files || form.files.length === 0) {
          alert("Please upload at least one file.");
          return;
        }
        for (let i = 0; i < form.files.length; i++) {
          const file = form.files[i];
          const url = await uploadToCloudinary(file, i, form.files.length);
          urls.push(url);
        }
      }

      const resourceData = {
        courseTitle: form.courseTitle,
        description: form.description,
        type: form.type,
        courseCode: form.courseCode,
        year: form.year,
        semester: form.semester,
        branch: form.branch,
        professor: form.professor,
        urls,
        uploadedBy: {
          uid: currentUser.uid,
          name: user?.name || currentUser.displayName || "",
          email: user?.email || currentUser.email || "",
        },
        approved,
        timestamp: serverTimestamp(),
      };

      const targetCollection = approved ? "resources" : "pendingResources";
      await addDoc(collection(db, targetCollection), resourceData);

      alert("✅ Resource uploaded successfully!");
      router.push("/");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Upload failed. Check console for error details.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  const acceptedTypes = {
    pdf: ".pdf",
    image: ".jpg,.jpeg,.png",
  };

return (
  <div className="min-h-[calc(100vh-40px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-2 transition-all duration-500 font-sans">

    <div className="w-full max-w-xl p-6 bg-white rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.01]">
      <h1 className="text-2xl font-extrabold text-[#00274D] mb-6 text-center">📤 Upload Resource</h1>

      <div className="space-y-4">
        <input
          type="text"
          name="courseTitle"
          placeholder="Course Title"
          value={form.courseTitle}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />

        <textarea
          name="description"
          placeholder="Description (e.g. MidSem Qpaper, Assignment 2 solutions)"
          value={form.description}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          rows={3}
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="link">Link</option>
        </select>

        {form.type === "link" ? (
          <input
            type="text"
            name="link"
            placeholder="Paste the link here"
            value={form.link}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
        ) : (
          <>
            <input
              type="file"
              multiple
              accept={acceptedTypes[form.type]}
              onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                setForm((prev) => ({
                  ...prev,
                  files: [...prev.files, ...newFiles],
                }));
              }}
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
            {form.files.length > 0 && (
              <div className="space-y-2 mt-2">
                {form.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border border-gray-200 p-2 rounded-lg bg-gray-100"
                  >
                    <span className="truncate max-w-xs text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          files: prev.files.filter((_, i) => i !== index),
                        }))
                      }
                      className="text-red-500 hover:text-red-700 font-bold ml-4 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <input
          type="text"
          name="courseCode"
          placeholder="Course Code (e.g. CS101)"
          value={form.courseCode}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />

        <input
          type="text"
          name="year"
          placeholder="Year (e.g. 2024)"
          value={form.year}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />

        <select
          name="semester"
          value={form.semester}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <option value="">Select Semester</option>
          <option value="Semester 1 (Monsoon)">Semester 1 (Monsoon)</option>
          <option value="Semester 2 (Winter)">Semester 2 (Winter)</option>
        </select>

        <select
          name="branch"
          value={form.branch}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <option value="">Select Branch</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Chemical Engineering">Chemical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Integrated Circuit Design & Technology">Integrated Circuit Design & Technology</option>
          <option value="Materials Engineering">Materials Engineering</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
        </select>

        <input
          type="text"
          name="professor"
          placeholder="Professor Name"
          value={form.professor}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-yellow-400 h-full text-xs text-[#00274D] font-semibold text-center transition-all duration-300"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full px-4 py-3 rounded-lg font-semibold tracking-wide text-lg transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-yellow-400 hover:bg-yellow-500 text-[#00274D]"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Resource"}
        </button>
      </div>
    </div>
  </div>
);

}
