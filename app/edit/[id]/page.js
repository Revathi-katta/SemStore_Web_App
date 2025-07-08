"use client"; // ✅ required for hooks

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Pencil } from "lucide-react";
export default function EditResourcePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    courseTitle: "",
    description: "",
    type: "pdf",
    courseCode: "",
    year: "",
    semester: "",
    branch: "",
    professor: "",
    urls: [],
    files: [],
  });

    useEffect(() => {
    const fetchData = async () => {
        if (!id) return;

        console.log("📥 Resource ID from useParams:", id);
        try {
        let snap = await getDoc(doc(db, "resources", id));

        if (!snap.exists()) {
            console.log("🔁 Not in resources. Checking pendingResources...");
            snap = await getDoc(doc(db, "pendingResources", id));
            if (!snap.exists()) {
            // ❌ Don't redirect multiple times
            setLoading(false);
            alert("❌ Resource not found. It may have been deleted or moved.");
            return;
            }
        }

        const data = snap.data();
        setForm({
            ...form,
            ...data,
            urls: data.urls || [],
            files: [],
        });
        } catch (err) {
        console.error("❌ Error fetching:", err);
        alert("Failed to load resource.");
        } finally {
        setLoading(false);
        }
    };

    fetchData();
    }, [id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileRemove = (index) => {
    const updatedUrls = [...form.urls];
    updatedUrls.splice(index, 1);
    setForm((prev) => ({ ...prev, urls: updatedUrls }));
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "semstore_unsigned");
    formData.append("folder", "semstore/resources");

    const res = await fetch("https://api.cloudinary.com/v1_1/dgtxlrgzs/auto/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error("Cloudinary upload failed");
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let newUrls = [...form.urls];
      for (const file of form.files) {
        const uploadedUrl = await uploadToCloudinary(file);
        newUrls.push(uploadedUrl);
      }

      await updateDoc(doc(db, "resources", id), {
        courseTitle: form.courseTitle,
        description: form.description,
        type: form.type,
        courseCode: form.courseCode,
        year: form.year,
        semester: form.semester,
        branch: form.branch,
        professor: form.professor,
        urls: newUrls,
      });

      alert("✅ Resource updated.");
      router.push("/repository");
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Error updating resource.");
    }
  };

  if (loading) return <p className="p-10 text-center">Loading...</p>;

  const acceptedTypes = {
    pdf: ".pdf",
    image: ".jpg,.jpeg,.png",
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-10 px-4 flex items-center justify-center font-sans transition-all duration-500">
    <div className="w-full max-w-xl p-6 bg-white rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.01] space-y-6">
      <div className="flex items-center justify-center gap-2 text-[#00274D]">
        <Pencil className="w-6 h-6" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-center">
          Edit Resource
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="courseTitle"
          name="courseTitle"
          value={form.courseTitle}
          onChange={handleChange}
          placeholder="Course Title"
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          autoComplete="off"
        />

        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          autoComplete="off"
        />

        <select
          id="type"
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
            id="urls"
            name="urls"
            value={form.urls[0] || ""}
            onChange={(e) => setForm({ ...form, urls: [e.target.value] })}
            placeholder="Edit link here"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            autoComplete="off"
          />
        ) : (
          <>
            <div className="space-y-1">
              {form.urls.map((url, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border border-gray-200 p-2 rounded-lg bg-gray-50"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-xs text-blue-600 underline"
                  >
                    {url.split("/").pop().split("?")[0]}
                  </a>
                  <button
                    onClick={() => handleFileRemove(i)}
                    type="button"
                    className="text-red-500 font-bold ml-4 hover:text-red-700 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input
              id="fileInput"
              type="file"
              multiple
              accept={acceptedTypes[form.type]}
              onChange={handleFileAdd}
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
          </>
        )}

        <input
          id="courseCode"
          name="courseCode"
          value={form.courseCode}
          onChange={handleChange}
          placeholder="Course Code"
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          autoComplete="off"
        />

        <input
          id="year"
          name="year"
          value={form.year}
          onChange={handleChange}
          placeholder="Year"
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          autoComplete="off"
        />

        <select
          id="semester"
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
          id="branch"
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
          id="professor"
          name="professor"
          value={form.professor}
          onChange={handleChange}
          placeholder="Professor Name"
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          autoComplete="off"
        />

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg shadow transition w-full"
        >
          💾 Save Changes
        </button>
      </form>
    </div>
  </div>
);
}