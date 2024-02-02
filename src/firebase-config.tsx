import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD7a9v-5gcmfWAVjy91ZeF8h2ploYZ3rV0",
  authDomain: "vipose-database-3f874.firebaseapp.com",
  projectId: "vipose-database-3f874",
  storageBucket: "vipose-database-3f874.appspot.com",
  messagingSenderId: "503540199793",
  appId: "1:503540199793:web:fb1087ab64fc12eb09c6d0"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

export { firebaseApp };