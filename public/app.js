import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- CONFIGURATION ---
const ADMIN_EMAIL = "2k23.csiot2311374@gmail.com"; 

// --- PASTE FIREBASE CONFIG HERE ---
const firebaseConfig = {
  
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const writeBtn = document.getElementById('write-btn');
const contactBtn = document.getElementById('contact-btn');
const authModal = document.getElementById('auth-modal');
const editorModal = document.getElementById('editor-modal');
const searchInput = document.getElementById('search-input');

// Container References
const recentContainer = document.getElementById('recent-container');
const allPostsContainer = document.getElementById('all-posts-container');
const viewAllBtnContainer = document.getElementById('view-all-btn-container');
const viewAllBtn = document.getElementById('view-all-btn');

// View References
const homeView = document.getElementById('home-view');
const fullPostView = document.getElementById('full-post-view');
const allPostsView = document.getElementById('all-posts-view'); // New View
const fullPostContent = document.getElementById('full-post-content');
const backHomeBtn = document.getElementById('back-home-btn');
const backHomeFromAllBtn = document.getElementById('back-home-from-all-btn'); // New Back Button

let isEditingId = null;
let allPostsMap = {}; 
let allPostsArray = []; // Store sorted posts array

// --- 1. AUTHENTICATION ---
loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));

document.getElementById('signin-action').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (e) { document.getElementById('login-error').textContent = e.message; }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email !== ADMIN_EMAIL) { alert("Access Denied"); signOut(auth); return; }
        
        authModal.classList.add('hidden');
        loginBtn.classList.add('hidden');
        if(contactBtn) contactBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        writeBtn.classList.remove('hidden');
        
        // Re-render posts to show admin tools
        renderPosts();
    } else {
        loginBtn.classList.remove('hidden');
        if(contactBtn) contactBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        writeBtn.classList.add('hidden');
        
        renderPosts(); // Hide admin tools
    }
});

// --- 2. EDITOR LOGIC ---
writeBtn.addEventListener('click', () => openEditor());
document.getElementById('close-editor').addEventListener('click', () => editorModal.classList.add('hidden'));

function openEditor(post = null, id = null) {
    editorModal.classList.remove('hidden');
    isEditingId = id;
    const title = document.getElementById('post-title');
    const content = document.getElementById('post-content');
    const image = document.getElementById('post-image');
    
    if (post) {
        document.getElementById('editor-title').textContent = "Edit Post";
        document.getElementById('publish-btn').textContent = "Update Post";
        title.value = post.title;
        content.value = post.content;
        image.value = post.imageUrl;
    } else {
        document.getElementById('editor-title').textContent = "Create New Post";
        document.getElementById('publish-btn').textContent = "Publish Post";
        title.value = ''; content.value = ''; image.value = '';
    }
}

document.getElementById('publish-btn').addEventListener('click', async () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').value;
    const finalImage = image.trim() !== "" ? image : "https://images.unsplash.com/photo-1499750310159-5254f5337ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    if (!title || !content) return alert("Please fill title and content");

    try {
        const postData = {
            title: title,
            content: content,
            imageUrl: finalImage,
            uid: auth.currentUser.uid,
            author: auth.currentUser.email,
            timestamp: serverTimestamp()
        };

        if (isEditingId) {
            await updateDoc(doc(db, "posts", isEditingId), postData);
            alert("Updated!");
        } else {
            await addDoc(collection(db, "posts"), postData);
            alert("Published!");
        }
        editorModal.classList.add('hidden');
    } catch (e) {
        console.error("Error", e);
        alert("Error saving: " + e.message);
    }
});

// --- 3. READ & DISPLAY LOGIC ---

window.editPostUI = (id, event) => { 
    event.stopPropagation(); 
    if(allPostsMap[id]) openEditor(allPostsMap[id], id); 
};

window.deletePostUI = async (id, event) => { 
    event.stopPropagation(); 
    if(confirm("Delete this post?")) await deleteDoc(doc(db, "posts", id)); 
};

// --- NAVIGATION LOGIC ---

// Go to Full Post
window.viewPost = (id) => {
    const post = allPostsMap[id];
    if (!post) return;

    homeView.classList.add('hidden');
    allPostsView.classList.add('hidden');
    fullPostView.classList.remove('hidden');
    window.scrollTo(0, 0);

    const date = post.timestamp ? post.timestamp.toDate().toDateString() : 'Recent';

    fullPostContent.innerHTML = `
        <div class="article-header">
            <h1>${post.title}</h1>
            <div class="article-meta">Published on ${date} • By Aman Kumar</div>
        </div>
        <img src="${post.imageUrl}" class="article-img" onerror="this.src='https://placehold.co/800x400?text=No+Image'">
        <div class="article-content">${post.content}</div>
    `;
};

// Go to All Posts Page
viewAllBtn.addEventListener('click', () => {
    homeView.classList.add('hidden');
    fullPostView.classList.add('hidden');
    allPostsView.classList.remove('hidden');
    window.scrollTo(0, 0);
    
    // Render ALL posts here
    allPostsContainer.innerHTML = '';
    allPostsArray.forEach(data => {
        allPostsContainer.innerHTML += createPostHTML(data.post, data.id);
    });
});

// Back to Home from Full Post
backHomeBtn.addEventListener('click', () => {
    fullPostView.classList.add('hidden');
    homeView.classList.remove('hidden');
});

// Back to Home from All Posts
backHomeFromAllBtn.addEventListener('click', () => {
    allPostsView.classList.add('hidden');
    homeView.classList.remove('hidden');
});


// --- POST RENDERING HELPER ---
function createPostHTML(post, id) {
    const user = auth.currentUser;
    const isAdmin = user && user.email === ADMIN_EMAIL;
    
    const date = post.timestamp ? post.timestamp.toDate().toDateString() : 'Just now';
    const previewText = post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content;
    const imgHtml = `<img src="${post.imageUrl}" class="recent-img" onerror="this.src='https://placehold.co/200x140?text=No+Image'">`;

    const adminTools = isAdmin ? `
        <div class="admin-tools">
            <i class="fas fa-edit" onclick="editPostUI('${id}', event)"> Edit</i>
            <i class="fas fa-trash" onclick="deletePostUI('${id}', event)" style="margin-left:10px;"> Delete</i>
        </div>` : '';

    return `
        <div class="recent-item" data-id="${id}" onclick="viewPost('${id}')">
            ${imgHtml}
            <div class="recent-info">
                <h3>${post.title}</h3>
                <span style="font-size:0.8rem; color:#999;">${date}</span>
                <p>${previewText} <span class="read-more-link">Read More</span></p>
                ${adminTools}
            </div>
        </div>
    `;
}

// --- MAIN RENDER FUNCTION ---
function renderPosts() {
    recentContainer.innerHTML = '';
    
    // Only render first 6 on Home Page
    const recentPosts = allPostsArray.slice(0, 6);
    
    if (recentPosts.length === 0) {
        recentContainer.innerHTML = '<p>No posts found.</p>';
    } else {
        recentPosts.forEach(data => {
            recentContainer.innerHTML += createPostHTML(data.post, data.id);
        });
    }

    // Toggle "Read More Stories" button
    if (allPostsArray.length > 6) {
        viewAllBtnContainer.classList.remove('hidden');
    } else {
        viewAllBtnContainer.classList.add('hidden');
    }
}

// --- REALTIME LISTENER ---
const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    allPostsArray = []; // Reset array
    allPostsMap = {};
    
    snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const id = docSnap.id;
        allPostsMap[id] = post;
        allPostsArray.push({ post, id });
    });

    renderPosts();
});

// Search
searchInput.addEventListener('keyup', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.recent-item');
    items.forEach(item => {
        const title = item.querySelector('h3').innerText.toLowerCase();
        const content = item.querySelector('p').innerText.toLowerCase();
        item.style.display = (title.includes(term) || content.includes(term)) ? 'block' : 'none';
    });
});