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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold mb-4">Upload Resource</h1>

      <input
        type="text"
        name="courseTitle"
        placeholder="Course Title"
        value={form.courseTitle}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <textarea
        name="description"
        placeholder="Description (e.g. MidSem Qpaper, Assignment 2 solutions)"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <select
        name="type"
        value={form.type}
        onChange={handleChange}
        className="w-full border p-2 rounded"
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
          className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded bg-gray-50"
          />
          {form.files.length > 0 && (
            <div className="space-y-2 mt-2">
              {form.files.map((file, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border p-2 rounded bg-gray-100"
                >
                  <span className="truncate max-w-xs">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        files: prev.files.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-red-500 hover:text-red-700 font-bold ml-4"
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
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        name="year"
        placeholder="Year (e.g. 2024)"
        value={form.year}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <select
        name="semester"
        value={form.semester}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Semester</option>
        <option value="Semester 1 (Monsoon)">Semester 1 (Monsoon)</option>
        <option value="Semester 2 (Winter)">Semester 2 (Winter)</option>
      </select>

      <select
        name="branch"
        value={form.branch}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Branch</option>
        <option value="Artificial Intelligence">Artificial Intelligence</option>
        <option value="Chemical Engineering">Chemical Engineering</option>
        <option value="Civil Engineering">Civil Engineering</option>
        <option value="Computer Science & Engineering">
          Computer Science & Engineering
        </option>
        <option value="Electrical Engineering">Electrical Engineering</option>
        <option value="Integrated Circuit Design & Technology">
          Integrated Circuit Design & Technology
        </option>
        <option value="Materials Engineering">Materials Engineering</option>
        <option value="Mechanical Engineering">Mechanical Engineering</option>
      </select>

      <input
        type="text"
        name="professor"
        placeholder="Professor Name"
        value={form.professor}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full text-xs text-white text-center"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className={`px-4 py-2 rounded text-white w-full ${
          isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
