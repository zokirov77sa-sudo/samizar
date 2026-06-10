import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAV7_yW-B99ClgT82Cf_4PpjTbx2zDtg7c",
  authDomain: "bmc-qr-2f96c.firebaseapp.com",
  projectId: "bmc-qr-2f96c",
  storageBucket: "bmc-qr-2f96c.firebasestorage.app",
  messagingSenderId: "1008286606002",
  appId: "1:1008286606002:web:3c09f2143a34a7737e9fab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
