import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_t_Pkahvy4Jx2Nn5Rvc4shSmIAcksdlU",
  authDomain: "expense-tracker-95268.firebaseapp.com",
  projectId: "expense-tracker-95268",
  storageBucket: "expense-tracker-95268.firebasestorage.app",
  messagingSenderId: "1045879624637",
  appId: "1:1045879624637:web:5e4ceec5f99f9e219738d4",
  measurementId: "G-JKNRF830TR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
