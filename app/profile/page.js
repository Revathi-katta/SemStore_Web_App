'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    photoURL: '',
    name: '',
    email: '',
    phone: '',
    batch: '',
    branch: '',
    bio: ''
  });
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/'); // redirect to home if not logged in
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setForm({
          photoURL: data.photoURL || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          batch: data.batch || '',
          branch: data.branch || '',
          bio: data.bio || ''
        });
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // update photoURL in form and Firestore
    setForm(prev => ({ ...prev, photoURL: downloadURL }));
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { photoURL: downloadURL });

    alert("Profile photo updated!");
    };

  const handleSave = async () => {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, form);
    alert('Profile updated!');
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

return (

  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-4 px-4 md:px-8 font-sans transition-all duration-500">
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-2 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold text-[#00274D] text-center mb-6">
      My Profile
    </h1>

    <div className="flex flex-col items-center space-y-2">
      <label
        htmlFor="photo-upload"
        className="cursor-pointer group relative"
        title="Click to change profile"
      >
        <img
          src={form.photoURL || '/default-avatar.png'}
          alt="Profile"
          className="w-24 h-24 rounded-full shadow-md border-4 border-yellow-300 transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-0 right-0 bg-yellow-400 text-[#00274D] text-xs px-2 py-0.5 rounded-full shadow">
          Edit
        </span>
      </label>
      <input
        type="file"
        id="photo-upload"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />
    </div>

    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Name:
        <input
          name="name"
          value={form.name}
          readOnly
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Email:
        <input
          name="email"
          value={form.email}
          readOnly
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Phone Number:
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Batch:
        <input
          name="batch"
          value={form.batch}
          onChange={handleChange}
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Branch:
        <input
          name="branch"
          value={form.branch}
          onChange={handleChange}
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Bio:
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          className="w-full mt-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition resize-none"
        />
      </label>
    </div>

    <button
      onClick={handleSave}
      className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-[#00274D] font-semibold px-4 py-2 rounded shadow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
    >
      Save Changes
    </button>
  </div>
</div>
);
}