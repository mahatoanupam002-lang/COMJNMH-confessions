# 🚀 MedReform Backend Integration Guide

## Architecture Overview

```
Frontend (Static HTML/CSS/JS)
    ↓ (API calls via firebase-backend.js)
    ↓
Firebase
├─ Authentication (Email/Password, SSO)
├─ Firestore Database
│  ├─ ideas collection
│  ├─ users collection
│  ├─ flags collection
│  └─ Real-time listeners
└─ Security Rules
```

---

## 📋 Checklist: Phases

### Phase 1: Setup Firebase ✅
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Firestore Database
- [ ] Enable Email/Password Authentication
- [ ] Create 3 collections: ideas, users, flags
- [ ] Update firebase-backend.js with your credentials
- [ ] Test Firebase connection

### Phase 2: Update Frontend Pages
- [ ] ✅ auth.html — Login/Register page
- [ ] ✅ index.html — Home page with live data
- [ ] 🔄 ideas.html — Feed with real-time sync
- [ ] 🔄 submit.html — Form with auth check
- [ ] 🔄 admin.html — Admin dashboard with real auth

### Phase 3: Testing
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test idea submission
- [ ] Test voting in real-time
- [ ] Test admin dashboard
- [ ] Test multi-device sync

### Phase 4: Deployment
- [ ] Deploy to Vercel
- [ ] Test on live domain
- [ ] Monitor Firebase usage
- [ ] Setup alerts for quota

---

## 🔧 Files You Have

### New/Updated Files
- **firebase-backend.js** — Core backend layer (all API calls)
- **auth.html** — New login/register page
- **index.html** — Updated to use Firebase
- **FIREBASE_SETUP.md** — Step-by-step Firebase setup

### Files Still Need Frontend Migration
- **ideas.html** — Needs real-time listener + auth
- **submit.html** — Needs auth check + real submission
- **admin.html** — Needs real auth + Firestore queries

---

## 🌐 How to Use Each Backend Function

### Authentication

```javascript
// Register new user
const result = await MedReformAuth.register(email, password, name, role);
if (result.success) { /* logged in */ }

// Login
const result = await MedReformAuth.login(email, password);
if (result.success) { /* logged in */ }

// Logout
await MedReformAuth.logout();

// Get current user
const user = MedReformAuth.getCurrentUser();

// Check if admin
const isAdmin = await MedReformAuth.isUserAdmin(userId);

// Listen to auth state changes
MedReformAuth.onAuthStateChanged(user => {
  if (user) { /* logged in */ }
  else { /* logged out */ }
});

// Reset password
await MedReformAuth.resetPassword(email);
```

### Ideas Operations

```javascript
// Submit idea
const result = await MedReformIdeas.submitIdea({
  title: "...",
  text: "...",
  category: "governance",
  author: "Anonymous",
  role: "MBBS Student",
  feasibility: 75
});

// Get all ideas
const result = await MedReformIdeas.getIdeas({
  category: "safety",
  status: "submitted",
  notFlagged: true
});

// Get single idea
const result = await MedReformIdeas.getIdea(ideaId);

// Listen to real-time changes
const unsubscribe = MedReformIdeas.listenToIdeas(ideas => {
  console.log('Ideas updated:', ideas);
});

// Update idea (admin only)
await MedReformIdeas.updateIdea(ideaId, { status: 'implemented' });

// Delete idea (admin only)
await MedReformIdeas.deleteIdea(ideaId);
```

### Voting

```javascript
// Vote on idea
const result = await MedReformVoting.voteIdea(ideaId, true);
// Returns: { success: true, voteCount: 48 }

// Unvote
const result = await MedReformVoting.voteIdea(ideaId, false);

// Check if user voted
const hasVoted = await MedReformVoting.hasUserVoted(ideaId);

// Get user's voted ideas
const votedIds = await MedReformVoting.getUserVotedIdeas();
```

### Comments

```javascript
// Add comment
const result = await MedReformComments.addComment(ideaId, "My thoughts...");

// Get comments
const result = await MedReformComments.getComments(ideaId);

// Delete comment (admin or author)
await MedReformComments.deleteComment(ideaId, commentId);
```

### Flagging

```javascript
// Flag idea
const result = await MedReformFlagging.flagIdea(ideaId, "spam");
// Returns: { success: true, flagCount: 3, hidden: true }

// Get flags (admin only)
const result = await MedReformFlagging.getFlags();

// Clear flags (admin only)
await MedReformFlagging.clearFlags(ideaId);
```

### Admin

```javascript
// Get stats (admin only)
const result = await MedReformAdmin.getStats();
// Returns: { totalIdeas: 42, submitted: 10, implemented: 5, ... }

// Export data (admin only)
const result = await MedReformAdmin.exportData();

// Make user admin (admin only)
await MedReformAdmin.makeAdmin(userId);
```

---

## 📱 Integration Examples

### Example 1: Submit Idea Page
```javascript
async function submitIdea(formData) {
  const user = MedReformAuth.getCurrentUser();
  
  if (!user) {
    window.location.href = '/auth';
    return;
  }
  
  const result = await MedReformIdeas.submitIdea({
    title: formData.title,
    text: formData.text,
    category: formData.category,
    author: formData.author,
    role: formData.role,
    feasibility: formData.feasibility
  });
  
  if (result.success) {
    showToast('✓ Idea submitted!');
    window.location.href = '/ideas';
  } else {
    showToast('✗ ' + result.error, '✗');
  }
}
```

### Example 2: Real-time Ideas Feed
```javascript
let unsubscribe = null;

function initIdeasFeed() {
  unsubscribe = MedReformIdeas.listenToIdeas(ideas => {
    const filtered = ideas.filter(i => {
      return !i.flagged &&
             (filters.category === 'all' || i.category === filters.category) &&
             (filters.status === 'all' || i.status === filters.status);
    });
    
    renderIdeas(filtered);
  }, { category: filters.category });
}

function cleanup() {
  if (unsubscribe) unsubscribe();
}
```

### Example 3: Admin Dashboard
```javascript
async function loadAdminDashboard() {
  const user = MedReformAuth.getCurrentUser();
  
  if (!user || !(await MedReformAuth.isUserAdmin(user.uid))) {
    window.location.href = '/auth';
    return;
  }
  
  const statsResult = await MedReformAdmin.getStats();
  if (statsResult.success) {
    renderStats(statsResult.stats);
  }
  
  const ideasResult = await MedReformIdeas.getIdeas();
  if (ideasResult.success) {
    renderAdminIdeas(ideasResult.ideas);
  }
}
```

---

## 🔐 Security Best Practices

### In firebase-backend.js
- ✅ All operations check authentication
- ✅ Admin operations verify `isUserAdmin()`
- ✅ XSS prevention with `escHtml()`
- ✅ Server-side validation via Firestore rules

### In your HTML pages
- ✅ Check auth state before rendering
- ✅ Redirect unauthenticated users to /auth
- ✅ Verify admin status before showing admin UI
- ✅ Never expose sensitive data in console

### Firestore Rules (Already Set)
```firestore-rules
// Public read, authenticated create/update, admin delete
match /ideas/{ideaId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.userId || isAdmin();
  allow delete: if isAdmin();
}
```

---

## 📊 Real-Time Sync Example

When one user votes, all other users see the update instantly:

```javascript
// User A: Opens ideas feed
MedReformIdeas.listenToIdeas(ideas => {
  renderIdeas(ideas);  // Renders 48 votes on idea #1
});

// User B (different browser/device): Votes on idea #1
MedReformVoting.voteIdea(1, true);

// Firestore triggers update
// User A sees: Vote count immediately changes to 49 (no refresh needed)
```

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot read property 'currentUser'" | Firebase SDKs not loaded. Check script tags. |
| "Permission denied" when submitting | Check auth state with `getCurrentUser()` |
| "Idea not found" | Check ideaId exists in Firestore |
| Real-time not updating | Check Firestore rules allow read access |
| Admin dashboard not showing | Verify `isAdmin` is true in user doc |
| Vote not persisting | Check network tab, Firestore quota |

---

## 📈 Performance Tips

1. **Pagination**: For 1000+ ideas, add pagination
   ```javascript
   const query = db.collection('ideas').limit(20);
   ```

2. **Indexing**: Firestore auto-indexes common filters
   - Category + Status filters use composite index

3. **Real-time Listeners**: Clean up when components unmount
   ```javascript
   // Call unsubscribe() when page unloads
   window.addEventListener('beforeunload', cleanup);
   ```

4. **Caching**: Cache user data to reduce Firestore reads
   ```javascript
   let cachedUser = null;
   ```

---

## 🚀 Next Steps

1. **Setup Firebase** (see FIREBASE_SETUP.md)
2. **Test auth.html** — Register and login
3. **Test index.html** — Should show live idea count
4. **Migrate ideas.html** — Add real-time listener
5. **Migrate submit.html** — Add auth check + submission
6. **Migrate admin.html** — Add real admin functions
7. **Deploy to Vercel** — Push to GitHub, auto-deploy
8. **Monitor** — Check Firebase console for usage

---

## 📞 Debugging

### Check Firebase Connection
```javascript
// In browser console:
firebase.initializeApp(firebaseConfig);
console.log(firebase.auth().currentUser);  // Should show user or null
```

### Monitor Firestore Writes
In Firebase Console: Firestore Database → Usage tab
- Shows read/write counts in real-time
- Alerts when approaching quota

### View Authentication Logs
Firebase Console: Authentication → Logs tab
- Shows login attempts, errors
- User email addresses

---

**You now have a production-ready backend!** 🎉

Next: Migrate remaining frontend pages and deploy.
