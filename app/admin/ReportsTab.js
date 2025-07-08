// app/admin/ReportsTab.js
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      const snap = await getDocs(collection(db, "reports"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    };
    fetchReports();
  }, []);

  const handleDeleteResource = async (resourceId) => {
    const confirm = window.confirm("Delete the reported resource?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "resources", resourceId));
      await deleteDoc(doc(db, "reports", resourceId));
      setReports((prev) => prev.filter((r) => r.id !== resourceId));
      alert("✅ Deleted resource and report.");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Error deleting.");
    }
  };

  const handleWarn = (email) => {
    alert(`⚠️ Stub: Send warning to ${email} (to be implemented)`);
  };

return (
  <div>
    <h2 className="text-xl md:text-2xl font-extrabold text-[#00274D] mb-4 text-center">
      Reported Resources
    </h2>

    {reports.length === 0 ? (
      <p className="text-center text-gray-500">✅ No reports found.</p>
    ) : (
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full text-sm bg-white rounded-xl overflow-hidden">
          <thead className="bg-slate-100">
            <tr className="text-left">
              <th className="p-3">Course</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Reported By</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t hover:bg-slate-50 transition">
                <td className="p-3">{r.courseCode || "Unknown"}</td>
                <td className="p-3">{r.reason}</td>
                <td className="p-3">
                  {r.reportedBy?.name} ({r.reportedBy?.email})
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDeleteResource(r.resourceId)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs hover:bg-red-200 transition"
                    >
                      ❌ Delete
                    </button>
                    <button
                      onClick={() => handleWarn(r.reportedBy?.email)}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-xs hover:bg-yellow-200 transition"
                    >
                      ⚠️ Warn
                    </button>
                    <button
                      onClick={() => router.push(`/edit/${r.resourceId}`)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs hover:bg-blue-200 transition"
                    >
                      ✏ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}

