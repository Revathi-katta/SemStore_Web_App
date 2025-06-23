'use client';

import { useState, useEffect } from 'react';
import { loginWithGoogle, logout } from '../lib/firebaseAuth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Login failed: No authenticated user.");
        return;
      }

      // Get role from custom claims
      const tokenResult = await currentUser.getIdTokenResult(true);
      const roleFromClaims = tokenResult.claims.role || 'viewer';

      // Save to Firestore (merge only if new or updated)
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        role: roleFromClaims,
      }, { merge: true });

      // Set state
      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        role: roleFromClaims,
      });
      setRole(roleFromClaims);
    } catch (e) {
      console.error('Login failed:', e);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const tokenResult = await currentUser.getIdTokenResult();
      const roleFromClaims = tokenResult.claims.role || 'viewer';

      const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const storedPhoto = docSnap.exists() ? docSnap.data().photoURL : null;

      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL || storedPhoto,
        role: roleFromClaims,
      });
      setRole(roleFromClaims);
    };

    fetchUser();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      {!user ? (
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`px-6 py-3 rounded-xl shadow-md text-white ${
            isLoggingIn ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoggingIn ? 'Logging in...' : 'Login with IITGN Google'}
        </button>
      ) : (
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link href="/repository">
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Browse Resources
              </button>
            </Link>

            <Link href="/profile">
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                View / Edit Profile
              </button>
            </Link>

            <Link href="/upload">
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Upload Resource
              </button>
            </Link>

            {(role === 'admin' || role === 'contributor') && (
              <Link href="/pending">
                <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                  Review Pending Uploads
                </button>
              </Link>
            )}
          </div>

          <h1 className="text-xl font-bold mb-2">Welcome, {user.displayName}!</h1>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto mt-4 shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mt-4 shadow bg-gray-300 flex items-center justify-center text-sm text-gray-600">
              No Photo
            </div>
          )}

          <p className="text-gray-600">{user.email}</p>
          {role && (
            <p className="mt-2 text-sm text-gray-500">Role: {role}</p>
          )}

          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </main>
  );
}
