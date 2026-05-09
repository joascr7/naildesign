import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAm7QTy7biMwzqdTRiQUbjukUx15XuJmEQ",
  authDomain: "unhasemgel-6c12b.firebaseapp.com",
  projectId: "unhasemgel-6c12b",
  storageBucket: "unhasemgel-6c12b.firebasestorage.app",
  messagingSenderId: "470977448687",
  appId: "1:470977448687:web:16989c6b9a1f8c3522e91a"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);