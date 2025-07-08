// app/admin/UsersTab.js
"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function UsersTab() {
  const [email, setEmail] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [newRole, setNewRole] = useState("");

  const handleSearch = async () => {
    try {
      const usersSnap = await getDoc(doc(db, "emailToUid", email));
      if (!usersSnap.exists()) {
        alert("User not found.");
        return;
      }

      const uid = usersSnap.data().uid;
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        alert("User not found in users collection.");
        return;
      }

      setUserInfo({ uid, ...userDoc.data() });
    } catch (err) {
      console.error(err);
      alert("Error fetching user.");
    }
  };

  const handleRoleChange = async () => {
    try {
      const res = await fetch("/admin/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userInfo.uid,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Role updated");
        setUserInfo(null);
        setEmail("");
        setNewRole("");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("❌ Failed to update role:", err);
      alert("Error updating role.");
    }
  };

return (
  <div>
    <h2 className="text-xl md:text-2xl font-extrabold text-[#00274D] mb-4 text-center">
      User Role Management
    </h2>

    <div className="flex flex-col items-center space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter user email"
        className="border border-gray-300 p-3 rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow transition"
      >
        Search
      </button>
    </div>

    {userInfo && (
      <div className="mt-6 w-full max-w-md mx-auto border border-gray-200 p-5 rounded-2xl shadow bg-white space-y-3 transition-transform duration-300 hover:scale-[1.01]">
        <p className="text-gray-700">
          <strong>Name:</strong> {userInfo.name}
        </p>
        <p className="text-gray-700">
          <strong>Email:</strong> {userInfo.email}
        </p>
        <p className="text-gray-700">
          <strong>Current Role:</strong> {userInfo.role}
        </p>

        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        >
          <option value="">Select new role</option>
          <option value="viewer">Viewer</option>
          <option value="contributor">Contributor</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleRoleChange}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow transition w-full"
        >
          ✅ Update Role
        </button>
      </div>
    )}
  </div>
);
}
