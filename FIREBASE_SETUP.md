# 🔥 Firebase Setup Guide for MedReform

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Visit: https://console.firebase.google.com
- Click "Add project"
- Name: `medreform-comjnmh`
- Accept terms, create project (takes ~30 seconds)

### 1.2 Enable Firestore Database
1. In left menu: "Build" → "Firestore Database"
2. Click "Create database"
3. Choose region: `us-central1` (or closest to India: `asia-south1`)
4. Security rules: Start in **test mode** (we'll secure later)
5. Click "Enable"

### 1.3 Enable Authentication
1. In left menu: "Build" → "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Optional: Enable "Google" sign-in for easier UX

### 1.4 Get Your Credentials
1. Go to Project Settings (⚙️ icon, top right)
2. Under "Your apps", click "</>" (Web)
3. Register app as `medreform-web`
4. Copy the Firebase config object

---

## Step 2: Update Firebase Config

In your project, open `firebase-backend.js` and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // ← From step 1.4
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};
```

With your actual values from Firebase console.

---

## Step 3: Create Firestore Collections

In Firebase Console:

### 3.1 Create `ideas` Collection
1. Click "Start collection"
2. Collection ID: `ideas`
3. Add first document with auto-ID
4. Add fields:
   ```
   title: string
   text: string
   category: string
   author: string
   userId: string
   role: string
   feasibility: number
   status: string
   votes: number
   voterIds: array
   comments: array
   flagCount: number
   flagged: boolean
   createdAt: timestamp
   updatedAt: timestamp
   ```
5. Save (doesn't matter what values, collection is created)

### 3.2 Create `users` Collection
1. Click "Start collection"
2. Collection ID: `users`
3. Add first document with same process
4. Fields:
   ```
   email: string
   name: string
   role: string
   isAdmin: boolean
   createdAt: timestamp
   submittedIdeas: array
   votedIdeas: array
   ```

### 3.3 Create `flags` Collection
1. Click "Start collection"
2. Collection ID: `flags`
3. Fields:
   ```
   ideaId: string
   reason: string
   reportedBy: string
   createdAt: timestamp
   ```

---

## Step 4: Set Firestore Security Rules

In Firebase Console:

1. Go to "Firestore Database"
2. Click "Rules" tab (at top)
3. Replace with this:

```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read all ideas
    match /ideas/{ideaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.userId || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Allow users to read all users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Flags collection - admin only
    match /flags/{flagId} {
      allow read: if isAdmin();
      allow create: if request.auth != null;
      allow delete: if isAdmin();
    }
    
    // Helper function
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

4. Click "Publish"

---

## Step 5: Add Firebase to Your HTML

In each HTML file (`index.html`, `ideas.html`, `submit.html`, `admin.html`), add this before closing `</body>`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js"></script>

<!-- Your backend -->
<script src="/firebase-backend.js"></script>
```

---

## Step 6: Create First Admin User

1. Open your app in browser
2. Go to login/register page
3. Create account with your email
4. In Firebase Console:
   - Go to "Firestore Database"
   - Find `users` collection
   - Find your user document
   - Edit `isAdmin` field: change to `true`
   - Save

Now you're admin! ✅

---

## Step 7: Test Backend

### Test 1: Register & Login
- Register with email/password
- Logout
- Login with same credentials
- Should work ✓

### Test 2: Submit Idea
- Login
- Go to Submit page
- Fill form, submit
- Check Firestore: idea should appear in `ideas` collection ✓

### Test 3: Vote on Idea
- Click ▲ vote button
- Vote count should increase
- Refresh page: vote should persist ✓

### Test 4: Admin Dashboard
- Login as admin
- Go to `/admin`
- Should see dashboard (not login screen)
- Should see stats and all ideas ✓

---

## Firestore Rules Explained

The rules ensure:

```
Public Read: Anyone can read ideas (not authenticated)
Create Ideas: Only logged-in users
Update Ideas: Author + Admins only
Delete Ideas: Admins only
User Profiles: Users can read all, edit own
Flags: Only admins can read/delete
```

For production, tighten to:
```firestore-rules
// Only authenticated users can read ideas
match /ideas/{ideaId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.userId || isAdmin();
  allow delete: if isAdmin();
}
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Config error "projectId not set" | Check firebase config has all 6 values |
| Auth not working | Enable "Email/Password" in Firebase Console |
| Firestore permission denied | Check security rules, make sure you're logged in |
| Data not saving | Check Firestore Rules, make sure app has permission |
| Real-time updates slow | Verify internet connection, Firestore live listeners working |

---

## Next Steps

1. ✅ Firebase project created
2. ✅ Firestore collections set up
3. ✅ Security rules configured
4. ✅ First admin user created
5. → Migrate frontend to use Firebase
6. → Test everything works
7. → Deploy to production

---

## Production Checklist

Before launching publicly:

- [ ] Change Firestore rules from test mode to production
- [ ] Enable email verification
- [ ] Setup password reset email
- [ ] Enable reCAPTCHA (prevent bot registrations)
- [ ] Setup admin approval flow for new users
- [ ] Enable backup & restore
- [ ] Monitor Firestore usage (free tier: 50K reads/day)
- [ ] Setup alerts for quota exceeded

---

**Firebase is now ready!** Next: Update frontend code to use `firebase-backend.js`
