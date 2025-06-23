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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md space-y-4">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>

            <div className="text-center">
            <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-block"
                title="Click to change profile"
            >
                <img
                src={form.photoURL || '/default-avatar.png'}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto shadow-md"
                />
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



      <label className="block">
        Name:
        <input
          name="name"
          value={form.name}
          readOnly
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Email:
        <input
          name="email"
          value={form.email}
          readOnly
          className="w-full border p-2 rounded"
        />
      </label>


      <label className="block">
        Phone Number:
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Batch:
        <input
          name="batch"
          value={form.batch}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Branch:
        <input
          name="branch"
          value={form.branch}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Bio:
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
      </label>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Changes
      </button>
    </div>
  );
}
