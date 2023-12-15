import { initializeApp } from "firebase/app";
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC0W4JDH-OiVMtF6fGeASp6w0zBbNjUBiY",
    authDomain: "vipose-databse.firebaseapp.com",
    projectId: "vipose-databse",
    storageBucket: "vipose-databse.appspot.com",
    messagingSenderId: "781883812966",
    appId: "1:781883812966:web:a8e9b4ee05b6f2723e91a7"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);