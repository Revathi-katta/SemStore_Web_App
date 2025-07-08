import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  // Optional: UI hint to prefer IITGN accounts
  provider.setCustomParameters({
    hd: "iitgn.ac.in"
  });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // ✅ IITGN email domain check (with alert that shows properly)
  if (!user.email.endsWith("@iitgn.ac.in")) {
    setTimeout(() => {
      alert("Only IITGN email addresses are allowed.");
    }, 0);
    await signOut(auth);
    console.warn("Blocked non-IITGN email");
    return null; // or just end the function

  }

  console.log("🧩 Raw Firebase user:", user);
  const userRef = doc(db, "users", user.uid);
  let docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      phone: "",
      batch: "",
      branch: "",
      role: "viewer",
      createdAt: new Date()
    });

    // Re-fetch after setting to get the role
    docSnap = await getDoc(userRef);
  }

  // Force token refresh to get latest custom claims
  await auth.currentUser.getIdToken(true);
  const idTokenResult = await auth.currentUser.getIdTokenResult();
  const customRole = idTokenResult.claims.role || "viewer";

  console.log("✅ Final returned user object:", {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    role: customRole
  });

  const userData = docSnap.exists() ? docSnap.data() : {};

  return {
    uid: user.uid,
    displayName: user.displayName || userData.name || "",
    email: user.email || userData.email || "",
    photoURL: user.photoURL || userData.photoURL || "",
    role: customRole
  };
}

// Logout function
export async function logout() {
  await signOut(auth);
}
