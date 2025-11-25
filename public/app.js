import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- CONFIGURATION ---
const ADMIN_EMAIL = "placeholder"; // <--- Only this email can see the Write button

// --- PASTE FIREBASE CONFIG HERE ---
// (I am keeping the keys you shared in the file content, but remember to verify them)
const firebaseConfig = {
    placeholders
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
const recentContainer = document.getElementById('recent-container');
const searchInput = document.getElementById('search-input');

// View Containers
const homeView = document.getElementById('home-view');
const fullPostView = document.getElementById('full-post-view');
const fullPostContent = document.getElementById('full-post-content');
const backHomeBtn = document.getElementById('back-home-btn');

let isEditingId = null;
let allPostsMap = {}; 

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
        
        // LOGGED IN (Admin Mode)
        authModal.classList.add('hidden');
        loginBtn.classList.add('hidden');
        if(contactBtn) contactBtn.classList.add('hidden');
        
        logoutBtn.classList.remove('hidden');
        writeBtn.classList.remove('hidden'); // Show Write Button
    } else {
        // LOGGED OUT
        loginBtn.classList.remove('hidden');
        if(contactBtn) contactBtn.classList.remove('hidden');
        
        logoutBtn.classList.add('hidden');
        writeBtn.classList.add('hidden'); // Hide Write Button
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

window.viewPost = (id) => {
    const post = allPostsMap[id];
    if (!post) return;

    homeView.classList.add('hidden');
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

backHomeBtn.addEventListener('click', () => {
    fullPostView.classList.add('hidden');
    homeView.classList.remove('hidden');
});

const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    recentContainer.innerHTML = '';
    allPostsMap = {}; 
    const user = auth.currentUser;
    const isAdmin = user && user.email === ADMIN_EMAIL;

    if (snapshot.empty) {
        recentContainer.innerHTML = '<p>No posts found.</p>';
        return;
    }

    snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const id = docSnap.id;
        allPostsMap[id] = post;

        const date = post.timestamp ? post.timestamp.toDate().toDateString() : 'Just now';
        const previewText = post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content;
        const imgHtml = `<img src="${post.imageUrl}" class="recent-img" onerror="this.src='https://placehold.co/200x140?text=No+Image'">`;

        const adminTools = isAdmin ? `
            <div class="admin-tools">
                <i class="fas fa-edit" onclick="editPostUI('${id}', event)"> Edit</i>
                <i class="fas fa-trash" onclick="deletePostUI('${id}', event)" style="margin-left:10px;"> Delete</i>
            </div>` : '';

        const html = `
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
        recentContainer.innerHTML += html;
    });
});

searchInput.addEventListener('keyup', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.recent-item');
    items.forEach(item => {
        const title = item.querySelector('h3').innerText.toLowerCase();
        const content = item.querySelector('p').innerText.toLowerCase();
        item.style.display = (title.includes(term) || content.includes(term)) ? 'block' : 'none';
    });
});