import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTc2P5qXtC2ulB4-JXQDO-nu-WcbOQEps",
  authDomain: "vernay-hotel-reservation.firebaseapp.com",
  projectId: "vernay-hotel-reservation",
  storageBucket: "vernay-hotel-reservation.firebasestorage.app",
  messagingSenderId: "432918529616",
  appId: "1:432918529616:web:3b914bf313619e124bb355",
  measurementId: "G-29MV16849J"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase Config:", firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);