// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBIVKfwg9zAZUcqTrO7_GXAStVJMYJkiNU",
    authDomain: "phantom-loop-tt-club.firebaseapp.com",
    projectId: "phantom-loop-tt-club",
    storageBucket: "phantom-loop-tt-club.firebasestorage.app",
    messagingSenderId: "292238379033",
    appId: "1:292238379033:web:6d0d56aa1a05cc094dc288",
    measurementId: "G-8S8FRCKPNZ"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, addDoc, updateDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export Firebase functions
window.FirebaseDB = {
    db,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy
};
