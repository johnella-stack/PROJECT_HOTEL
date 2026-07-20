import { auth, db } from "../firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("User created:", credential.user.uid);

    await updateProfile(credential.user, {
      displayName: name,
    });

    console.log("Profile updated");

    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        uid: credential.user.uid,
        name,
        email,
        role: "guest",
        createdAt: serverTimestamp(),
      }
    );

    console.log("Firestore document created");

    return {
      uid: credential.user.uid,
      name,
      email,
      role: "guest",
    };
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    throw err;
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{
  name: string;
  email: string;
  role: "guest" | "admin";
}> {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  console.log("Logged in UID:", credential.user.uid);

  const ref = doc(db, "users", credential.user.uid);
  console.log("Looking for:", ref.path);

  const snap = await getDoc(ref);

  console.log("Document exists:", snap.exists());

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  console.log("Document data:", snap.data());

  const data = snap.data();

  return {
    name: data.name,
    email: data.email,
    role: (data.role ?? "guest") as "guest" | "admin",
  };
}