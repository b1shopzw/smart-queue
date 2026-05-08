import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace placeholders with the actual Project credentials from your Firebase Console.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "zimqueue-admin.firebaseapp.com",
  projectId: "zimqueue-admin",
  storageBucket: "zimqueue-admin.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
