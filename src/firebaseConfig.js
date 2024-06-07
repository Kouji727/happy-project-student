// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage"; // Import getStorage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const apiKey = process.env.REACT_APP_API_KEY;


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCq_Wf4ElXvWWIDbdpUWAj6NUeK59PBORE",
  authDomain: "happy-project-c9185.firebaseapp.com",
  projectId: "happy-project-c9185",
  storageBucket: "happy-project-c9185.appspot.com",
  messagingSenderId: "675125926535",
  appId: "1:675125926535:web:4b373842304a3de1443622"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };