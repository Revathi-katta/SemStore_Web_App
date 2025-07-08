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
      console.log("🔥 currentUser:", currentUser);
      console.log("🔥 currentUser.photoURL:", currentUser.photoURL);

      const tokenResult = await currentUser.getIdTokenResult(true);
      const roleFromClaims = tokenResult.claims.role || 'viewer';

      const existingDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const fallbackPhoto = existingDoc.exists() ? existingDoc.data().photoURL : "";

      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL || fallbackPhoto,
        role: roleFromClaims,
      }, { merge: true });

      // ✅ Add email → UID mapping for admin panel
      await setDoc(doc(db, 'emailToUid', currentUser.email), {
        uid: currentUser.uid,
      });

      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL || fallbackPhoto, // ✅ fallback used here
        role: roleFromClaims,
      });
      setRole(roleFromClaims);
    } catch (e) {
      console.error('Login failed:', e);

      // ✅ Show specific alert if blocked by IITGN domain check
      if (e.message === "Blocked non-IITGN email") {
        // Do nothing – the alert was already shown in firebaseAuth.js
      } else if (e.code === 'auth/popup-blocked') {
        alert("Popup blocked. Please allow popups and try again.");
      } else {
        alert('Login failed. Please try again.');
      }
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
      console.log("📄 Firestore user doc:", docSnap.exists() ? docSnap.data() : "No doc");
      console.log("📷 currentUser.photoURL:", currentUser.photoURL);
      console.log("📷 storedPhoto:", storedPhoto);

      setUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: storedPhoto || currentUser.photoURL || "",
        role: roleFromClaims,
      });
      setRole(roleFromClaims);
    };

    fetchUser();
  }, []);

    return (
    <main className="min-h-screen flex flex-col bg-white font-sans">
      {!user ? (
        <div
          className="relative flex flex-col justify-center items-center text-center min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url('\Pic1.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/10"></div>


          <div className="relative z-10 max-w-2xl px-6 animate-fade-in-up text-white drop-shadow-lg">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Sem-Store: Curated IITGN Academic Resources
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-200">
              Share, discover, and plan your semester efficiently with contributions from IITGN seniors.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={`px-6 py-3 rounded-full shadow-lg font-semibold tracking-wide text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                isLoggingIn
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-[#00274D] hover:bg-[#001f3a] text-white'
              }`}
            >
              {isLoggingIn ? 'Logging in...' : 'Login with IITGN Email'}
            </button>
          </div>

          <div className="absolute bottom-10 animate-bounce">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

   ) : (
      <>
        {/* Top Navigation Bar */}
        {/* <nav className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 bg-transparent text-white z-20"> */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#00274D] text-white shadow-md">
        <div className="flex items-center space-x-3">
          <img src="/iitgn_logo.png" alt="Logo" className="w-8 h-8 drop-shadow" />
          <span className="font-bold text-xl">Sem Store IIT Gandhinagar</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4 text-sm md:text-base">
          <Link href="/repository" className="hover:text-yellow-400 transition">Resources</Link>
          <Link href="/upload" className="hover:text-yellow-400 transition">Upload</Link>
          <Link href="/profile" className="hover:text-yellow-400 transition">Profile</Link>

          {(role === 'admin' || role === 'contributor') && (
            <Link href="/pending" className="hover:text-yellow-400 transition">
              Review Uploads
            </Link>
          )}

          {role === 'admin' && (
            <Link href="/admin" className="hover:text-yellow-400 transition">Admin</Link>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex flex-col items-start justify-center text-left flex-1 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url('/Pic1.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 max-w-2xl px-6 py-12 md:ml-24 md:mr-auto animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Welcome, {user.displayName}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6">
            Share, discover, and plan your semester efficiently with contributions from IITGN seniors.
          </p>

          <div className="flex flex-wrap justify-start gap-4">
            <Link href="/repository">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-[#00274D] font-medium px-5 py-2.5 rounded shadow transition">
                Browse Resources
              </button>
            </Link>
            <Link href="/upload">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-[#00274D] font-medium px-5 py-2.5 rounded shadow transition">
                Upload
              </button>
            </Link>
            {role === 'admin' && (
              <Link href="/admin">
                <button className="bg-yellow-400 hover:bg-yellow-500 text-[#00274D] font-medium px-5 py-2.5 rounded shadow transition">
                  Admin Panel
                </button>
              </Link>
            )}
          </div>

          <p className="text-gray-300 mt-6">
            {user.email}{" "}
            {role && (
              <span className="italic text-gray-400">| Role: {role}</span>
            )}
          </p>
        </div>
      </section>
    </>
  )}
</main>
    );
}