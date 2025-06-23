'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  getDocs,
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
      await addDoc(collection(db, 'resources'), approvedData);
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
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">Pending Resource Approvals</h1>

      {pending.length === 0 ? (
        <p>No pending uploads.</p>
      ) : (
        pending.map((res) => (
          <div key={res.id} className="border p-4 rounded space-y-2 shadow-sm">
            <h2 className="text-lg font-semibold">{res.courseTitle || 'Untitled Course'}</h2>
            {res.description && <p>{res.description}</p>}
            <p>
              <strong>Course:</strong> {res.courseCode} | <strong>Semester:</strong> {res.semester}
            </p>
            <p>
              <strong>Branch:</strong> {res.branch} | <strong>Type:</strong> {res.type}
            </p>
            <p><strong>Professor:</strong> {res.professor || 'N/A'}</p>
            <p>
              <strong>Uploaded by:</strong> {res.uploadedBy?.name} ({res.uploadedBy?.email})
            </p>

            {res.urls?.length > 0 && (
              <div className="mt-2">
                <strong>Files/Links:</strong>
                <ul className="list-disc ml-6 mt-1">
                  {res.urls.map((url, idx) => (
                    <li key={idx}>
                      <a href={url} target="_blank" className="text-blue-600 underline">
                        View Resource {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleApprove(res)}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(res.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
