// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
// TODO: Replace with your actual config
const firebaseConfig = {
apiKey: "YOUR_FULL_API_KEY_HERE", 
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize Analytics
const auth = getAuth(app); // Initialize Auth
const db = getFirestore(app); // Initialize Firestore

// 1. --- AUTHENTICATION FUNCTIONS ---

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userStatus = document.getElementById('user-status');
const signupBtn = document.getElementById('signup-btn');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const firestoreSection = document.getElementById('firestore-section');

// Sign Up
signupBtn.addEventListener('click', async () => {
    try {
        await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        userStatus.textContent = "Signed up successfully!";
        logEvent(analytics, 'sign_up'); // Log Analytics Event
    } catch (error) {
        userStatus.textContent = `Error: ${error.message}`;
    }
});

// Sign In
signinBtn.addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        userStatus.textContent = "Signed in successfully!";
    } catch (error) {
        userStatus.textContent = `Error: ${error.message}`;
    }
});

// Sign Out
signoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    userStatus.textContent = "Signed out.";
});


// 2. --- FIRESTORE FUNCTIONS ---

const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note-btn');
const notesList = document.getElementById('notes-list');

// Add Note
addNoteBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user && noteInput.value.trim() !== '') {
        try {
            await addDoc(collection(db, "notes"), {
                uid: user.uid,
                text: noteInput.value,
                timestamp: serverTimestamp()
            });
            noteInput.value = '';
            logEvent(analytics, 'add_note', { item_name: 'user_note' }); // Log Analytics Event
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    } else {
        alert("Please sign in and enter a note.");
    }
});

// Real-time Listener (gets called when auth state changes AND when notes change)
let unsubscribeFromNotes = null;

function subscribeToUserNotes(uid) {
    // If we have an old listener, stop it first
    if (unsubscribeFromNotes) {
        unsubscribeFromNotes();
    }

    // Create a query to only get notes belonging to the current user (by UID)
    const q = query(collection(db, "notes"), where("uid", "==", uid));

    // Listen for real-time updates
    unsubscribeFromNotes = onSnapshot(q, (querySnapshot) => {
        notesList.innerHTML = ''; // Clear the list
        querySnapshot.forEach((doc) => {
            const li = document.createElement('li');
            li.textContent = doc.data().text;
            notesList.appendChild(li);
        });
    });
}


// 3. --- AUTH STATE OBSERVER (The glue that manages UI) ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        document.getElementById('auth-section').style.display = 'none';
        firestoreSection.style.display = 'block';
        signoutBtn.style.display = 'block';
        userStatus.textContent = `Hello, ${user.email} (${user.uid}).`;

        // Start listening to their notes
        subscribeToUserNotes(user.uid);

    } else {
        // User is signed out
        document.getElementById('auth-section').style.display = 'block';
        firestoreSection.style.display = 'none';
        signoutBtn.style.display = 'none';
        userStatus.textContent = 'Please sign in or sign up.';
        
        // Stop listening to notes
        if (unsubscribeFromNotes) {
            unsubscribeFromNotes();
            unsubscribeFromNotes = null;
        }
        notesList.innerHTML = '';
    }
});

// Log a page view event (Analytics will automatically track the page view, 
// but you can log a specific custom event for the initial load)
logEvent(analytics, 'page_load', { page_title: 'mini_project_home' });