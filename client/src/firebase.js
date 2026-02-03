// Firebase configuration for client app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtIrdtpoVtCneyE75kDvoO2b8zFGGkT4I",
  authDomain: "hurai-77f8d.firebaseapp.com",
  projectId: "hurai-77f8d",
  storageBucket: "hurai-77f8d.firebasestorage.app",
  messagingSenderId: "525826542494",
  appId: "1:525826542494:web:6a0cdb28bc83edf043648f",
  measurementId: "G-MJTSZC40NR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
