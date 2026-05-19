# Firebase Setup Checklist

Complete this checklist to integrate Firebase with MedReform.

## Phase 1: Firebase Project Creation

- [ ] Go to https://console.firebase.google.com/
- [ ] Create new project named `medreform-comjnmh`
- [ ] Disable Google Analytics
- [ ] Wait for project creation to complete (~1 minute)

## Phase 2: Enable Services

### Firestore Database
- [ ] Click "Build" → "Firestore Database"
- [ ] Click "Create database"
- [ ] Select region: **asia-south1** (or europe-west1)
- [ ] Choose **Test mode** (temporary, for development)
- [ ] Click "Create"

### Authentication
- [ ] Click "Build" → "Authentication"
- [ ] Click "Get started"
- [ ] Enable "Anonymous" provider
- [ ] (Optional) Enable "Email/Password" provider

## Phase 3: Get Credentials

- [ ] Click ⚙️ (Settings) → "Project settings"
- [ ] Scroll to "Your apps" section
- [ ] Click `</> (Web)` to show SDK snippet
- [ ] Copy all 6 config values:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `projectId`
  - [ ] `storageBucket`
  - [ ] `messagingSenderId`
  - [ ] `appId`

## Phase 4: Configure Locally

- [ ] Copy `.env.example` to `.env.local`
- [ ] Paste your 6 credentials into `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Do NOT commit `.env.local` to git

## Phase 5: Test Firebase Connection

- [ ] Open `index.html` in browser
- [ ] Open DevTools Console
- [ ] Look for Firebase initialization logs
- [ ] Verify no "APIKey is invalid" errors
- [ ] Check that stats show (ideas count, votes total, implementations)

### Expected behavior:
- Index page shows seed data from Firestore OR falls back to localStorage
- No console errors about Firebase
- Stats display correctly

## Phase 6: Apply Security Rules (After Testing)

- [ ] Open Firestore Database → "Rules" tab
- [ ] Copy content from `firestore-rules.txt`
- [ ] Paste into Rules editor
- [ ] Click "Publish"
- [ ] Verify deployment succeeds

## Phase 7: Create Admin User (For Admin Panel)

- [ ] Go to "Authentication" → "Users"
- [ ] Click "Add user"
- [ ] Enter your email and temporary password
- [ ] Note your Firebase UID (shown after creation)
- [ ] Go to Firestore console → Create document:
  - [ ] Path: `admins/{YOUR_UID}`
  - [ ] Fields:
    ```
    email: "your@email.com"
    isAdmin: true
    createdAt: (server timestamp)
    ```

## Phase 8: Test Core Features

- [ ] Open `ideas.html` in browser
- [ ] Load ideas (currently from localStorage, that's OK)
- [ ] Vote on an idea (should work)
- [ ] Comment on an idea (should work)
- [ ] Open `submit.html` in new tab
- [ ] Submit a new idea
- [ ] Verify it appears in ideas.html

## Phase 9: Verify Data Persistence

- [ ] Reload `ideas.html` → votes/comments persist ✓
- [ ] Open in new window → can see others' votes ✓
- [ ] Open Firestore console → check `ideas` collection populated ✓

## Phase 10: Migrate Historical Data (Optional)

Only if you have existing ideas in localStorage that you want to keep.

- [ ] Open `ideas.html` console
- [ ] Run: `var exp = exportData(getIdeas()); console.log(JSON.stringify(exp));`
- [ ] Copy output and save as `ideas-backup.json`
- [ ] Run: `firebase emulator:exec firebase-import.js`
- [ ] Verify ideas appear in Firestore console

## Phase 11: Deploy to Production

### For Vercel:
- [ ] Go to Vercel project Settings → Environment Variables
- [ ] Add 6 Firebase credentials as `NEXT_PUBLIC_FIREBASE_*` variables
- [ ] Redeploy project
- [ ] Test live site works with Firestore

### For Other Hosts:
- [ ] Update `firebase-backend.js` to read from environment variables
- [ ] Set environment variables on your host
- [ ] Deploy and test

## Phase 12: Transition to Production Rules

After 1-2 weeks of testing with test mode rules:

- [ ] Review `firestore-rules.txt` security rules
- [ ] Publish stricter rules that only allow authenticated writes
- [ ] Monitor Firestore console for permission denied errors
- [ ] Fix any rule issues that arise

## Phase 13: Monitor and Maintain

- [ ] Check Firestore console weekly for quota usage
- [ ] Monitor error rates in DevTools
- [ ] Keep Firebase SDK updated
- [ ] Back up data monthly (export from Firestore console)

---

## Troubleshooting During Setup

### Firebase not loading?
- [ ] Check DevTools Network tab for failed script loads
- [ ] Verify firebaseapp.com is not blocked by ISP/firewall
- [ ] Check browser console for specific errors

### "Permission denied" errors?
- [ ] Make sure Firestore is in **test mode**
- [ ] Check rules are published correctly
- [ ] Verify user is authenticated (check MedReformAuth logs)

### Stats showing zero on home page?
- [ ] Check if Firebase init succeeded (DevTools Console)
- [ ] Verify fallback to localStorage is working
- [ ] If using real credentials, check Firestore has data

### Data not appearing in Firestore?
- [ ] Check browser console for write errors
- [ ] Verify ideas.html uses createIdea() function
- [ ] Check Firestore Rules allow writes for anonymous users

---

## Success Criteria

✅ All of these should be true:

- [x] Firebase project created and configured
- [x] Firestore database online (asia-south1 region)
- [x] Anonymous authentication enabled
- [x] Credentials in `.env.local` (not committed)
- [x] Index page loads stats and ideas
- [x] Ideas page filters and voting work
- [x] Submit form creates new ideas
- [x] Ideas visible in Firestore console
- [x] No console errors on any page
- [x] Private window session works
- [x] All data persists after reload

---

**You're done!** MedReform now has Firebase backing. Ideas, votes, and comments sync across devices and persist in the cloud.

Future enhancements (non-blocking):
- Real-time updates with Firestore listeners
- Server-side duplicate detection
- User reputation system
- Analytics dashboard
