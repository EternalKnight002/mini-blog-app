// Import functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- CONFIGURATION ---
// 1. SET YOUR EMAIL HERE (Only this email can login)
const ADMIN_EMAIL = "2k23.csiot2311374@gmail.com"; 

// 2. PASTE FIREBASE CONFIG HERE
const firebaseConfig = {
  
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const writeBtn = document.getElementById('write-btn');
const authModal = document.getElementById('auth-modal');
const editorModal = document.getElementById('editor-modal');
const trendingContainer = document.getElementById('trending-container');
const recentContainer = document.getElementById('recent-container');

// Editor State
let isEditingId = null; // Stores ID if we are editing, null if creating new

// --- 1. AUTHENTICATION & SECURITY ---

// Login Open
loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));

// Login Action
document.getElementById('signin-action').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // Auth listener will handle the rest
    } catch (e) { 
        document.getElementById('login-error').textContent = e.message; 
    }
});

// Logout Action
logoutBtn.addEventListener('click', () => signOut(auth));

// Auth Monitor (The Security Check)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // SECURITY CHECK: Is this the admin?
        if (user.email !== ADMIN_EMAIL) {
            alert("Access Denied: You are not the author.");
            signOut(auth);
            return;
        }

        // If Admin:
        authModal.classList.add('hidden');
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        writeBtn.classList.remove('hidden'); // Show "Write" button
    } else {
        // If Guest:
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        writeBtn.classList.add('hidden');
    }
});

// --- 2. EDITOR LOGIC (Create & Edit) ---

// Open Editor (New Post)
writeBtn.addEventListener('click', () => {
    openEditor(); 
});

// Close Editor
document.getElementById('close-editor').addEventListener('click', () => {
    editorModal.classList.add('hidden');
});

// Helper to Open Editor
function openEditor(post = null, id = null) {
    editorModal.classList.remove('hidden');
    
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');
    const imageInput = document.getElementById('post-image');
    const trendingCheck = document.getElementById('is-trending');
    const submitBtn = document.getElementById('publish-btn');
    const editorTitle = document.getElementById('editor-title');

    if (post) {
        // EDIT MODE
        isEditingId = id;
        editorTitle.textContent = "Edit Post";
        submitBtn.textContent = "Update Post";
        titleInput.value = post.title;
        contentInput.value = post.content;
        imageInput.value = post.imageUrl;
        trendingCheck.checked = post.isTrending;
    } else {
        // CREATE MODE
        isEditingId = null;
        editorTitle.textContent = "Create New Post";
        submitBtn.textContent = "Publish Post";
        titleInput.value = '';
        contentInput.value = '';
        imageInput.value = '';
        trendingCheck.checked = false;
    }
}

// Publish / Update Action
document.getElementById('publish-btn').addEventListener('click', async () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').value;
    const isTrending = document.getElementById('is-trending').checked;
    
    const finalImage = image.trim() !== "" ? image : "https://images.unsplash.com/photo-1499750310159-5254f5337ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    if (!title || !content) return alert("Please fill title and content");

    try {
        const postData = {
            title: title,
            content: content,
            imageUrl: finalImage,
            isTrending: isTrending,
            timestamp: serverTimestamp() // Updates time on edit too
        };

        if (isEditingId) {
            // UPDATE existing
            await updateDoc(doc(db, "posts", isEditingId), postData);
            alert("Post Updated!");
        } else {
            // CREATE new
            postData.author = auth.currentUser.email; // Only set author on create
            await addDoc(collection(db, "posts"), postData);
            alert("Post Published!");
        }
        
        editorModal.classList.add('hidden');

    } catch (e) {
        console.error("Error", e);
        alert("Error saving post.");
    }
});

// --- 3. READ & DISPLAY LOGIC ---

// Make functions available globally so HTML onclick can find them
window.editPostUI = (id) => {
    // Find the post data from our local cache or just DOM? 
    // Since we don't have a global array, let's fetch it or pass data via closure. 
    // Easier way: We have the snapshot. Let's just re-fetch that single doc to be safe.
    // Or better: Attach data to the button.
    // For simplicity in this structure:
    const postCard = document.querySelector(`[data-id="${id}"]`);
    if(!postCard) return;
    
    // Scrape data from hidden fields or just attributes?
    // Let's use a cleaner approach: Global Map
    const post = allPostsMap[id];
    if(post) openEditor(post, id);
};

window.deletePostUI = async (id) => {
    if(confirm("Are you sure you want to delete this post?")) {
        await deleteDoc(doc(db, "posts", id));
    }
};

let allPostsMap = {}; // Cache posts for editing

const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    trendingContainer.innerHTML = '';
    recentContainer.innerHTML = '';
    allPostsMap = {}; // Reset cache

    const user = auth.currentUser;
    const isAdmin = user && user.email === ADMIN_EMAIL;

    let hasTrending = false;

    snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const id = docSnap.id;
        allPostsMap[id] = post; // Save for editing

        const date = post.timestamp ? post.timestamp.toDate().toDateString() : 'Just now';
        
        // Admin Tools HTML
        const adminTools = isAdmin ? `
            <div class="admin-tools">
                <i class="fas fa-edit admin-icon" onclick="editPostUI('${id}')"></i>
                <i class="fas fa-trash admin-icon" onclick="deletePostUI('${id}')"></i>
            </div>
        ` : '';

        // TRENDING CARD
        if (post.isTrending === true) {
            hasTrending = true;
            trendingContainer.innerHTML += `
                <div class="card" data-id="${id}">
                    <img src="${post.imageUrl}" class="card-img" alt="Blog Image">
                    <div class="card-body">
                        <span class="card-date">${date}</span>
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        ${adminTools}
                    </div>
                </div>
            `;
        } 
        // RECENT LIST
        else {
            recentContainer.innerHTML += `
                <div class="recent-item" data-id="${id}">
                    <img src="${post.imageUrl}" class="recent-img" alt="Thumbnail">
                    <div class="recent-info" style="flex:1;">
                        <h3>${post.title}</h3>
                        <span class="card-date">${date}</span>
                        <p>${post.content.substring(0, 150)}...</p>
                        ${adminTools}
                    </div>
                </div>
            `;
        }
    });

    if (!hasTrending) trendingContainer.innerHTML = '<p>No trending posts yet.</p>';
    if (recentContainer.innerHTML === '') recentContainer.innerHTML = '<p>No recent posts.</p>';
});

// Search
document.getElementById('search-input').addEventListener('keyup', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.card, .recent-item').forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(term) ? "flex" : "none";
        if(item.classList.contains('card') && text.includes(term)) item.style.display = "block";
    });
});