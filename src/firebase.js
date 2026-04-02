import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHONKYvShnF2Lt9k09ohV0Too17lGN8co",
  authDomain: "katalog-maktika-ec9f7.firebaseapp.com",
  projectId: "katalog-maktika-ec9f7",
  storageBucket: "katalog-maktika-ec9f7.firebasestorage.app",
  messagingSenderId: "1059196317716",
  appId: "1:1059196317716:web:a71424e58b6cbb56bc7701"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);