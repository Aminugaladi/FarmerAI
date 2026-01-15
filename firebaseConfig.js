import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAKq6RhjlPZCwKIdVKOIIh3-8-KiqssajI",
    authDomain: "farmerai-74776.firebaseapp.com",
    projectId: "farmerai-74776",
    storageBucket: "farmerai-74776.firebasestorage.app",
    messagingSenderId: "380244902172",
    appId: "1:380244902172:web:c71a356574350e9274fad9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Fitar da kayan aikin da za mu yi amfani da su
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;