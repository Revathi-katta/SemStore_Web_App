// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCCDpJo0LFm7rotRgcCEAdd5RVE5OunqkI",
  authDomain: "sem-store-ac0c7.firebaseapp.com",
  projectId: "sem-store-ac0c7",
  storageBucket: "sem-store-ac0c7.appspot.com",
  messagingSenderId: "699788713657",
  appId: "1:699788713657:web:b2601c04c048cac42c0568"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
