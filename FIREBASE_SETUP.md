# 🔥 Firebase Database Setup Guide

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Create a project"

2. **Project Setup**
   - Project name: `Phantom Loop TT Club`
   - Enable Google Analytics: Optional
   - Click "Create project"

## Step 2: Enable Firestore Database

1. **Navigate to Firestore**
   - In Firebase Console → Build → Firestore Database
   - Click "Create database"

2. **Database Configuration**
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to your region)
   - Click "Done"

## Step 3: Get Firebase Configuration

1. **Go to Project Settings**
   - Click the gear icon → Project settings
   - Scroll down to "Your apps"
   - Click the Web icon (</>)

2. **Register Web App**
   - App nickname: `Phantom Loop TT Club`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

3. **Copy Configuration**
   - Copy the `firebaseConfig` object
   - Replace the placeholder values in `firebase-config.js`

## Step 4: Update Your Files

### Replace your current files with Firebase versions:

1. **Replace `index.html` with `index-firebase.html`**
2. **Replace `app.js` with `app-firebase.js`**
3. **Update `firebase-config.js` with your actual config**

### Example firebase-config.js:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Your actual API key
    authDomain: "phantom-loop-tt-club.firebaseapp.com",
    projectId: "phantom-loop-tt-club",
    storageBucket: "phantom-loop-tt-club.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Deploy to GitHub Pages

```bash
# Add Firebase files
git add firebase-config.js app-firebase.js index-firebase.html FIREBASE_SETUP.md

# Rename files to replace originals
git mv index-firebase.html index.html
git mv app-firebase.js app.js

# Commit and push
git commit -m "Add Firebase database integration"
git push
```

## Step 6: Test Your Database

1. **Visit your GitHub Pages site**
2. **Login as admin** (username: admin, password: admin123)
3. **Add a player** - it will be stored in Firebase
4. **Check Firebase Console** - you should see the data in Firestore

## 🔒 Security Rules (Important!)

After testing, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for now)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 🎯 Benefits of Firebase Database:

✅ **Centralized Storage** - All data in one place
✅ **Real-time Updates** - Changes sync instantly
✅ **Cross-device Access** - Works on any device
✅ **No Export/Import** - Data is always available
✅ **Scalable** - Handles many users
✅ **Free Tier** - 1GB storage, 20K reads/day

## 🚀 Your Club is Now Database-Powered!

- **Admin creates players** → Stored in Firebase
- **Players login anywhere** → Access their data
- **Matches recorded** → Stored in Firebase
- **Attendance tracked** → Stored in Firebase
- **All devices sync** → Real-time updates

## 📱 Next Steps:

1. **Set up Firebase** (follow steps above)
2. **Update your files** with Firebase versions
3. **Deploy to GitHub Pages**
4. **Test with real data**
5. **Share with your players**

Your Phantom Loop TT Club now has a professional database! 🏓✨
