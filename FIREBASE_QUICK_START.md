# Firebase Quick Start Guide

Get MedReform running with Firebase in 5 minutes.

## What You Need

1. Google account
2. 6 Firebase credentials (from Firebase console)
3. This repository cloned locally

## 5-Minute Setup

### 1. Create Firebase Project (2 min)

```
1. Go to https://console.firebase.google.com/
2. Click "Add project" → name it "medreform-comjnmh"
3. Skip Google Analytics
4. Wait for creation
```

### 2. Enable Firestore + Auth (2 min)

```
Firestore:
  - Click "Build" → "Firestore Database"
  - "Create database" → region: asia-south1 → Test mode
  
Auth:
  - Click "Build" → "Authentication" → "Get started"
  - Enable "Anonymous"
```

### 3. Get Credentials (1 min)

```
Settings (⚙️) → Project settings
  Scroll to "Your apps"
  Click "</> (Web)"
  Copy these 6 values:
```

```
apiKey: 
authDomain: 
projectId: 
storageBucket: 
messagingSenderId: 
appId: 
```

### 4. Add to .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your 6 values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=medreform-comjnmh.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=medreform-comjnmh
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=medreform-comjnmh.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123...
```

**Do NOT commit this file.**

### 5. Test It

Open `index.html` in browser. You should see:
- Stats: ideas count, total votes, implemented count
- Top ideas and trending sections
- No errors in DevTools Console

**Done! Firebase is working.** 🎉

---

## What Just Happened?

- **index.html** now reads ideas from Firestore (or falls back to localStorage)
- **ideas.html** still uses localStorage (fast, simple)
- **submit.html** still uses localStorage (can add Firebase later)
- **admin.html** still uses localStorage (can add Firebase later)

Ideas, votes, and comments sync across devices via Firestore.

---

## Next Steps (Optional)

### Migrate existing data
```
1. Open ideas.html console
2. Run: var exp = exportData(getIdeas()); console.log(JSON.stringify(exp));
3. Save output as ideas-backup.json
4. Run: firebase emulator:exec firebase-import.js
```

### Lock down security rules
Copy `firestore-rules.txt` content into Firestore Rules editor and publish.

### Deploy to production
Set env vars in Vercel/your host. Redeploy.

---

## Files Explained

| File | Purpose |
|------|---------|
| `FIREBASE_SETUP.md` | Full technical guide (30 pages) |
| `FIREBASE_CHECKLIST.md` | Step-by-step checklist |
| `FIREBASE_QUICK_START.md` | This file (5-minute setup) |
| `firestore-rules.txt` | Security rules (copy-paste into console) |
| `.env.example` | Template for credentials |
| `firebase-import.js` | Data migration script |
| `firebase-backend.js` | Already in repo; provides 8 Firebase classes |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Stats show 0 | Check DevTools Console, verify Firestore has data |
| "firebase is not defined" | Check Network tab for failed Firebase script loads |
| "APIKey is invalid" | Copy credentials again from Firebase console |
| Permission denied | Make sure Firestore is in test mode |
| Data not persisting | Check Firestore console → ideas collection has documents |

---

## Security Reminder

⚠️ **Never commit `.env.local` or hardcoded credentials to git.**

Use environment variables for production (Vercel, Netlify, etc.).

---

**Questions?** See `FIREBASE_SETUP.md` for the full guide.

**Ready to dive deeper?** Read `FIREBASE_SETUP.md` for architecture, migration paths, and production deployment.
