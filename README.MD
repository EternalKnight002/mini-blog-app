# Aman Kumar - Personal Blog

A modern, dark-themed personal blog built with Firebase and vanilla JavaScript. Features a sleek design with smooth animations and full mobile responsiveness.


## 🌟 Features

- **Dark Mode Design**: Elegant dark theme with smooth animations
- **Firebase Backend**: Real-time database with Firestore
- **Admin Authentication**: Secure admin panel for content management
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Blog posts update automatically without page refresh
- **Search Functionality**: Search through blog posts by title and content
- **Image Support**: Add cover images to blog posts
- **Admin Tools**: Edit and delete posts with admin privileges

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Fonts**: Google Fonts (Playfair Display, Lato)
- **Icons**: Font Awesome 6.4.0
- **Version Control**: Firebase SDK 10.1.0

## 📁 Project Structure

```
my-mini-app/
├── public/
│   ├── index.html          # Main HTML file
│   ├── app.js              # Firebase logic & functionality
│   └── hero.jpg            # About section image
├── firebase.json           # Firebase hosting configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── .firebaserc             # Firebase project configuration
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project created

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-mini-app
   ```

2. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Configure Firebase**
   - Open `public/app.js`
   - Replace the `firebaseConfig` object with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

5. **Set Admin Email**
   - In `public/app.js`, update the `ADMIN_EMAIL` constant:
   ```javascript
   const ADMIN_EMAIL = "your-admin-email@gmail.com";
   ```

6. **Initialize Firebase**
   ```bash
   firebase init
   ```
   - Select Firestore and Hosting
   - Choose your existing project
   - Use default settings (public folder: `public`)

7. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 🔐 Admin Access

### Setting Up Admin Account

1. Go to Firebase Console → Authentication → Users
2. Add a new user with the email you set as `ADMIN_EMAIL`
3. Use this email to sign in on your blog

### Admin Features

- **Write Button**: Create new blog posts
- **Edit Icon**: Modify existing posts (visible on hover)
- **Delete Icon**: Remove posts (visible on hover)
- **Sign Out**: Logout from admin mode

## 📝 Creating a Blog Post

1. Sign in with admin credentials
2. Click the "Write" button in navigation
3. Fill in:
   - **Title**: Blog post title
   - **Image URL**: Cover image URL (right-click any image → Copy Image Address)
   - **Content**: Your blog content
4. Click "Publish Post"

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `public/index.html`:

```css
:root {
  --bg-color: #0a0a0a;           /* Main background */
  --bg-secondary: #1a1a1a;       /* Secondary background */
  --text-color: #e0e0e0;         /* Main text color */
  --text-secondary: #b0b0b0;     /* Secondary text */
  --accent-color: #ffffff;        /* Accent color */
  --border-color: #2a2a2a;       /* Border color */
}
```

### Changing Hero Image

Replace the image URL in the `<img>` tag inside the hero section:

```html
<img src="YOUR_IMAGE_URL" alt="Background" class="hero-bg">
```

### Updating About Section

1. Replace `hero.jpg` in the `public/` folder
2. Update the about text in `index.html`:

```html
<p>Your custom about text here...</p>
```

## 🔒 Security Rules

The Firestore security rules are configured to:
- Allow anyone to **read** blog posts
- Allow only **authenticated users** to create posts
- Allow only **post authors** to edit/delete their own posts

```javascript
match /posts/{postId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.uid;
}
```

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: Below 480px

## 🌐 Deployment

### Deploy to Firebase Hosting

```bash
firebase deploy
```

### Deploy only Hosting

```bash
firebase deploy --only hosting
```

### Deploy only Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 🐛 Troubleshooting

### Posts not loading
- Check Firebase configuration in `app.js`
- Verify Firestore rules are deployed
- Check browser console for errors

### Authentication issues
- Ensure admin email matches in Firebase Console
- Verify Firebase Authentication is enabled
- Clear browser cache and cookies

### Images not displaying
- Verify image URLs are accessible
- Use direct image links (not Google Drive/Dropbox share links)
- Try using HTTPS URLs

## 📧 Contact

- **Email**: resoamankumar@gmail.com
- **GitHub**: [@EternalKnight002](https://github.com/EternalKnight002)
- **Twitter**: [@Eternalknigh](https://x.com/Eternalknigh)
- **LinkedIn**: [Aman Kumar](https://linkedin.com/in/aman-kumar-537a73296)

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Google Fonts for typography
- Font Awesome for icons
- Unsplash for placeholder images

---
