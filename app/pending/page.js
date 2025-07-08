'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const [pending, setPending] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user role and pending uploads
  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/');
        return;
      }

      let role = null;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

      if (userDoc.exists()) {
        role = userDoc.data().role;
      }

      // If role is missing in Firestore, fall back to custom claims
      if (!role) {
        const token = await currentUser.getIdTokenResult(true);
        role = token.claims.role || 'viewer';
      }

      if (!['admin', 'contributor'].includes(role)) {
        alert('You are not authorized to view this page.');
        router.push('/');
        return;
      }

      setUserRole(role);

      const snapshot = await getDocs(collection(db, 'pendingResources'));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPending(data);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleApprove = async (res) => {
    try {
      const approvedData = {
        ...res,
        approved: true,
        timestamp: serverTimestamp(),
      };

      // ✅ Preserve the same ID when moving from pending → resources
      await setDoc(doc(db, 'resources', res.id), approvedData); // 🛠 changed from addDoc to setDoc

      await deleteDoc(doc(db, 'pendingResources', res.id));
      setPending((prev) => prev.filter((item) => item.id !== res.id));
    } catch (err) {
      console.error('Error approving:', err);
      alert('❌ Error approving. Try again.');
    }
  };


  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, 'pendingResources', id));
      setPending((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('❌ Error rejecting. Try again.');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading pending uploads...</p>;

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-8 px-4 md:px-100 font-sans transition-all duration-500">
    <div className="w-full max-w-4xl p-6 bg-white rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.01] space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-[#00274D] mb-4 text-center">
        🕓 Pending Resource Approvals
      </h1>

      {pending.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10">✅ No pending uploads.</p>
      ) : (
        pending.map((res) => (
          <div
            key={res.id}
            className="border border-gray-200 p-4 rounded-xl bg-white shadow hover:shadow-md transition duration-300 space-y-2"
          >
            <h2 className="text-lg md:text-xl font-bold text-[#00274D]">
              {res.courseTitle || 'Untitled Course'}
            </h2>

            {res.description && (
              <p className="text-gray-700">{res.description}</p>
            )}

            <p className="text-sm text-gray-600">
              <strong>Course:</strong> {res.courseCode || 'N/A'} |{' '}
              <strong>Semester:</strong> {res.semester || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Branch:</strong> {res.branch || 'N/A'} |{' '}
              <strong>Type:</strong> {res.type?.toUpperCase() || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Professor:</strong> {res.professor || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Uploaded by:</strong> {res.uploadedBy?.name || 'Unknown'} (
              {res.uploadedBy?.email || 'Unknown'})
            </p>

            {res.urls?.length > 0 && (
              <div className="mt-2">
                <strong className="text-gray-700">Files/Links:</strong>
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  {res.urls.map((url, idx) => (
                    <li key={idx}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 transition"
                      >
                        View Resource {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={() => handleApprove(res)}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleReject(res.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg shadow transition"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
}
