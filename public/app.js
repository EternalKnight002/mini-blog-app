// Import functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
    apiKey: "YOUR_FULL_API_KEY_HERE", 
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTS ---
const authSection = document.getElementById('auth-section');
const createPostSection = document.getElementById('create-post-section');
const postsContainer = document.getElementById('posts-container');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const signoutBtn = document.getElementById('signout-btn');
const userDisplay = document.getElementById('user-display');
const authMessage = document.getElementById('auth-message');

// --- 1. AUTHENTICATION ---

// Toggle Login Form
authToggleBtn.addEventListener('click', () => {
    if (authSection.classList.contains('hidden')) {
        authSection.classList.remove('hidden');
        authToggleBtn.textContent = "Close";
    } else {
        authSection.classList.add('hidden');
        authToggleBtn.textContent = "Sign In / Up";
    }
});

// Sign Up
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        authMessage.textContent = "Welcome! You are now signed up.";
        authSection.classList.add('hidden');
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

// Sign In
document.getElementById('signin-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authMessage.textContent = "Welcome back!";
        authSection.classList.add('hidden');
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

// Sign Out
signoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    userDisplay.textContent = "";
});

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        createPostSection.classList.remove('hidden');
        authToggleBtn.classList.add('hidden');
        signoutBtn.classList.remove('hidden');
        userDisplay.textContent = `User: ${user.email}`;
    } else {
        // User is logged out
        createPostSection.classList.add('hidden');
        authToggleBtn.classList.remove('hidden');
        signoutBtn.classList.add('hidden');
        userDisplay.textContent = "";
    }
});

// --- 2. BLOG POST LOGIC ---

// Publish Post
document.getElementById('publish-btn').addEventListener('click', async () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const user = auth.currentUser;

    if (user && title && content) {
        try {
            await addDoc(collection(db, "posts"), {
                title: title,
                content: content,
                authorEmail: user.email,
                uid: user.uid,
                timestamp: serverTimestamp()
            });
            // Clear inputs
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            alert("Post published!");
            logEvent(analytics, 'publish_post');
        } catch (e) {
            console.error("Error adding post: ", e);
            alert("Error publishing post.");
        }
    } else {
        alert("Please fill in all fields.");
    }
});

// Read Posts (Real-time Listener)
// Note: We use 'posts' collection now, and order by timestamp descending
const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = ''; // Clear list
    
    if (snapshot.empty) {
        postsContainer.innerHTML = '<p>No posts yet. Be the first to write one!</p>';
        return;
    }

    snapshot.forEach((doc) => {
        const post = doc.data();
        
        // Create HTML for each post card
        const postDiv = document.createElement('div');
        postDiv.classList.add('blog-post');
        
        const date = post.timestamp ? post.timestamp.toDate().toLocaleDateString() : 'Just now';
        
        postDiv.innerHTML = `
            <h3>${post.title}</h3>
            <div class="meta">By ${post.authorEmail} on ${date}</div>
            <p>${post.content}</p>
        `;
        
        postsContainer.appendChild(postDiv);
    });
});