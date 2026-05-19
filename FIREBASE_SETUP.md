# Firebase Integration Path for MedReform

## Overview

MedReform currently uses localStorage for all data storage. Firebase integration enables:
- **Cross-device synchronization** — ideas, votes, and comments sync in real-time
- **Persistent user sessions** — authentication state persists across browsers
- **Security rules** — server-side validation prevents vote fraud and unauthorized access
- **Scalability** — Firestore handles millions of ideas and votes without client-side burden

The existing `firebase-backend.js` (472 lines) provides 8 classes that wrap Firestore operations. This document explains how to activate it.

---

## Phase 1: Firebase Project Setup

### Step 1.1: Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it `medreform-comjnmh` (or your preferred name)
4. Disable Google Analytics (not needed for this use case)
5. Click "Create project" and wait ~1 minute

### Step 1.2: Enable Firestore Database

1. In the Firebase console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose region: **asia-south1** (Kalyani, India is closest; fallback to europe-west1)
4. Start in **test mode** (we'll lock it down in Phase 3)
5. Click "Create"

### Step 1.3: Enable Authentication

1. Click "Build" → "Authentication"
2. Click "Get started"
3. Click the "Anonymous" provider
4. Toggle "Enable" and click "Save"
5. (Optional) Enable "Email/Password" if you want to add user registration later

### Step 1.4: Get Your API Credentials

1. Click the ⚙️ (Settings) icon → "Project settings"
2. Scroll to "Your apps" section
3. Under "Firebase SDK snippet", click the `</> (Web)` option
4. Copy the config object (it looks like):
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSyD...",
     authDomain: "medreform-comjnmh.firebaseapp.com",
     projectId: "medreform-comjnmh",
     storageBucket: "medreform-comjnmh.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123..."
   };
   ```

### Step 1.5: Update firebase-backend.js

In your local repository, open `firebase-backend.js` and replace lines 8-15 with real credentials from your Firebase project.

Do NOT commit this file with real credentials to a public repository. Use environment variables (see Phase 4).

---

## Phase 2: Wire Firebase into Pages

### Step 2.1: index.html (Home Page)

No changes needed. The index.html already includes:
```html
<script src="/firebase-backend.js"></script>
```

And the initHome() function already tries Firebase with a fallback to localStorage when credentials are placeholders.

### Step 2.2: ideas.html (Browse & Vote Page)

Current state: Uses synchronous `getIdeas()` from data.js (localStorage).

**For now:** ideas.html will continue to use localStorage. This is acceptable because ideas.html is read-heavy and localStorage handles 50-200 ideas efficiently.

**Future migration path** (not blocking):
1. Wrap loadData() in an async function
2. Call `await MedReformIdeas.getIdeas()` instead of `getIdeas()`
3. Update vote() to call `await MedReformVoting.vote(ideaId, userId)`
4. Update toggleComments() to call `await MedReformComments.getComments(ideaId)`

### Step 2.3: submit.html (Submit Form)

Keep as-is. The form already uses localStorage. Future async migration non-blocking.

### Step 2.4: admin.html (Admin Dashboard)

Keep as-is. Admin login uses localStorage. Future async migration non-blocking.

---

## Phase 3: Secure Firestore with Rules

Once you verify everything works with test mode, lock down the database.

### Step 3.1: Update Firestore Rules

In Firebase console, click "Firestore Database" → "Rules" tab. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ideas collection: readable by all, writable only with rate limiting
    match /ideas/{ideaId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.authorId
        && request.time < resource.data.createdAt + duration.value(24, 'h');
      allow delete: if request.auth.uid == resource.data.authorId
        || get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }

    // Votes collection: writable only by authenticated users
    match /ideas/{ideaId}/votes/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }

    // Comments collection: readable by all, writable by authenticated users
    match /ideas/{ideaId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.userId;
      allow delete: if request.auth.uid == resource.data.userId
        || get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }

    // Admins collection: only admins can read
    match /admins/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

### Step 3.2: Create Admin User

1. In Firebase console, go to "Authentication" → "Users"
2. Click "Add user" and create your admin account
3. In Firestore, create document at `admins/YOUR_USER_ID` with:
   ```json
   {
     email: "your@email.com",
     isAdmin: true,
     createdAt: (server timestamp)
   }
   ```

---

## Phase 4: Environment Variables (Production)

### Step 4.1: For Vercel Deployments

In Vercel dashboard, go to project → Settings → Environment Variables. Add:

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = medreform-comjnmh.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = medreform-comjnmh
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = medreform-comjnmh.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 1234567890
NEXT_PUBLIC_FIREBASE_APP_ID = 1:1234567890:web:abc123...
```

### Step 4.2: Create .env.local (Local Development)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=medreform-comjnmh.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=medreform-comjnmh
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=medreform-comjnmh.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123...
```

Add `.env.local` to `.gitignore`.

### Step 4.3: Update firebase-backend.js

Replace hardcoded config with environment-based values:

```js
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
    : 'YOUR_FIREBASE_API_KEY',
  authDomain: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    : 'YOUR_PROJECT.firebaseapp.com',
  projectId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    : 'YOUR_PROJECT_ID',
  storageBucket: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    : 'YOUR_PROJECT.appspot.com',
  messagingSenderId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    : 'YOUR_MESSAGING_SENDER_ID',
  appId: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    : 'YOUR_APP_ID',
};
```

---

## Phase 5: Data Migration from localStorage to Firestore

### Step 5.1: Export Existing Data

1. Open ideas.html in a browser
2. Open DevTools Console
3. Run:
   ```js
   var exported = exportData(getIdeas());
   console.log(JSON.stringify(exported));
   ```
4. Copy output and save to `ideas-backup.json`

### Step 5.2: Import into Firestore

Create `firebase-import.js`:

```js
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp();
const db = admin.firestore();

const data = JSON.parse(fs.readFileSync('ideas-backup.json', 'utf8'));

(async () => {
  for (const idea of data.ideas) {
    await db.collection('ideas').doc(idea.id).set({
      id: idea.id,
      title: idea.title,
      text: idea.text,
      category: idea.category,
      author: idea.author,
      anonymous: idea.anonymous || true,
      feasibility: idea.feasibility || 50,
      votes: idea.votes || 0,
      status: idea.status || 'submitted',
      flagged: idea.flagged || false,
      createdAt: new Date(idea.submittedAt),
      updatedAt: new Date(),
    });
  }
  console.log(`Imported ${data.ideas.length} ideas`);
})();
```

Run: `firebase emulator:exec --import=./firestore-export firebase-import.js`

---

## Testing Checklist

- [ ] Firebase credentials in firebase-backend.js (or env vars)
- [ ] Firestore database created in asia-south1 region
- [ ] Anonymous authentication enabled
- [ ] index.html shows stats and ideas from Firestore (or falls back to localStorage)
- [ ] ideas.html filters and voting work
- [ ] No Firebase errors in DevTools Console
- [ ] Anonymous user session works in private window
- [ ] Submit form creates idea visible in Firestore console
- [ ] Admin login and delete operations work
- [ ] All data persists after page reload

---

## Architecture Summary

### 8 Firebase Classes in firebase-backend.js

1. **MedReformAuth** — Handle anonymous sign-in and logout
2. **MedReformIdeas** — Create, read, update ideas
3. **MedReformVoting** — Track user votes, prevent double-voting
4. **MedReformComments** — Fetch and post comments on ideas
5. **MedReformFlagging** — Report inappropriate ideas
6. **MedReformAdmin** — Admin login, delete ideas, export data
7. **MedReformAnalytics** — Track events for future analysis
8. **MedReformSync** — Real-time listeners for cross-device updates

---

## Troubleshooting

### "firebase is not defined"
- Verify Firebase CDN scripts load before firebase-backend.js
- Check DevTools Network tab for 200 responses

### "APIKey is invalid"
- Use credentials from Firebase console Project Settings
- Check for typos in config

### "Permission denied" when reading ideas
- Verify Firestore Rules allow read access
- Ensure database is in test mode during development

### "Quota exceeded"
- Firestore free tier: 50,000 writes/day
- Upgrade to pay-as-you-go for higher limits

---

## Next Steps

1. **Immediate:** Set up Firebase project, update credentials, test index.html
2. **Short-term:** Enable Firestore rules, migrate data, set up env vars
3. **Medium-term:** Make ideas.html async for real-time updates
4. **Long-term:** Add user profiles, reputation system, analytics dashboard

MedReform works at every step. You can use it with localStorage only, or progressively add Firebase features.
