# Firebase Architecture for MedReform

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MedReform Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Browser / Client                               │  │
│  │  ┌────────────┬───────────┬────────────┬────────────┐    │  │
│  │  │ index.html │ideas.html │submit.html │admin.html  │    │  │
│  │  └────────────┴───────────┴────────────┴────────────┘    │  │
│  │           ↓                                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         data.js (localStorage layer)               │  │  │
│  │  │  - getIdeas(), createIdea(), voteIdea()           │  │  │
│  │  │  - deleteIdea(), exportData()                      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │           ↓                                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │      firebase-backend.js (Firebase layer)         │  │  │
│  │  │  ┌──────────────────────────────────────────┐      │  │  │
│  │  │  │ 8 Classes:                               │      │  │  │
│  │  │  │ - MedReformAuth (anonymous signin)      │      │  │  │
│  │  │  │ - MedReformIdeas (CRUD ideas)           │      │  │  │
│  │  │  │ - MedReformVoting (vote tracking)       │      │  │  │
│  │  │  │ - MedReformComments (discussion)        │      │  │  │
│  │  │  │ - MedReformFlagging (moderation)        │      │  │  │
│  │  │  │ - MedReformAdmin (admin operations)     │      │  │  │
│  │  │  │ - MedReformAnalytics (events)           │      │  │  │
│  │  │  │ - MedReformSync (realtime listeners)    │      │  │  │
│  │  │  └──────────────────────────────────────────┘      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │           ↓                                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │    Firebase SDK                                   │  │  │
│  │  │  (CDN: gstatic.com/firebasejs)                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓ HTTPS                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  Firebase     │
                    │  (Google CDN) │
                    └───────────────┘
                            ↓
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼──────┐ ┌───▼────┐ ┌────▼──────┐
        │  Firestore │ │  Auth  │ │ Realtime  │
        │  Database  │ │ Service│ │ Listeners │
        └────────────┘ └────────┘ └───────────┘
```

---

## Data Flow Layers

### Layer 1: localStorage (Current Default)

```
Browser Memory
    ↓
data.js ← getIdeas(), createIdea(), voteIdea()
    ↓
localStorage API (browser storage)
    ↓
User's device only
```

**Characteristics:**
- No network required (offline-first)
- No cross-device sync
- Limited to ~5MB per domain
- Perfect for 50-200 ideas
- Acceptable for campus use

### Layer 2: Firebase (New)

```
Browser Memory
    ↓
firebase-backend.js ← MedReformIdeas, MedReformVoting, etc.
    ↓
Firebase Authentication ← anonymous signin
    ↓
Firestore Database ← ideas, votes, comments collections
    ↓
Google Cloud (multi-region)
    ↓
All devices + server-side rules
```

**Characteristics:**
- Network required (real-time sync)
- Cross-device synchronization
- Unlimited scale (millions of ideas)
- Server-side security rules
- Perfect for large deployments

### Current Hybrid Approach

```
index.html  ──→ Firebase (renderHomeIdeas)
             └─→ Fallback to localStorage if Firebase unavailable

ideas.html  ──→ localStorage (current, fast)
             └─→ Could upgrade to Firebase later (non-blocking)

submit.html ──→ localStorage (current, simple)
             └─→ Could upgrade to Firebase later (non-blocking)

admin.html  ──→ localStorage (current, internal use)
             └─→ Could upgrade to Firebase later (non-blocking)
```

This is intentional. index.html benefits most from Firestore (stats update in real-time). Other pages work fine with localStorage.

---

## Firestore Data Structure

### Collection: `ideas`

```
ideas/
  {ideaId1}/
    title: "Improve cafeteria food quality"
    text: "..."
    category: "welfare"
    author: "Anonymous" | "Name"
    anonymous: true | false
    feasibility: 65
    votes: 24
    status: "submitted" | "implemented" | "rejected"
    flagged: false
    createdAt: 2026-01-15T10:30:00Z
    updatedAt: 2026-01-15T10:30:00Z
    
    votes/
      {userId1}/: true        ← User voted for this idea
      {userId2}/: true
    
    comments/
      {commentId1}/
        text: "Great idea!"
        author: "Anonymous" | "Name"
        userId: "firebase-user-id"
        createdAt: 2026-01-15T11:00:00Z
        updatedAt: 2026-01-15T11:00:00Z
      
      {commentId2}/
        text: "..."
        ...
```

### Collection: `admins`

```
admins/
  {adminUserId1}/
    email: "admin@example.com"
    isAdmin: true
    createdAt: 2026-01-10T00:00:00Z
```

---

## Security Rules (Firestore)

### Public Read, Authenticated Write

```
ideas/{ideaId} {
  allow read: if true;           ← Anyone can read
  allow create: if auth != null;  ← Only authenticated users
}
```

### User-Scoped Write

```
ideas/{ideaId}/votes/{userId} {
  allow read: if true;
  allow write: if auth.uid == userId;  ← Only owner can vote
}
```

### Admin-Only Delete

```
ideas/{ideaId} {
  allow delete: if auth.uid in getAdmin(auth.uid).isAdmin;
}
```

**See `firestore-rules.txt` for complete rules.**

---

## Authentication Flow

### Anonymous Sign-In (Default)

```
User opens page
    ↓
MedReformAuth.signInAnonymously()
    ↓
Firebase generates anonymous UID
    ↓
User can vote, comment, submit ideas
    ↓
No personal info collected (only UID)
    ↓
Session persists across page reloads
    ↓
User can optionally sign out
```

### Optional Email Sign-In (Future)

```
User clicks "Sign up"
    ↓
Enters email + password
    ↓
MedReformAuth.createUserWithEmailAndPassword()
    ↓
Firebase stores email hash, returns UID
    ↓
User's account persists, can sign in elsewhere
```

---

## Performance Characteristics

### localStorage vs Firestore

| Operation | localStorage | Firestore |
|-----------|--------------|-----------|
| Read 50 ideas | ~1ms | ~50ms (network) |
| Filter 50 ideas | ~5ms | Instant (client-side) |
| Vote | ~1ms + save | ~100ms + save |
| Real-time updates | ❌ Poll only | ✅ Live listeners |
| Cross-device sync | ❌ Manual pull | ✅ Automatic |
| Storage limit | 5MB | Unlimited |
| Offline support | ✅ Works | ⚠️ Cached only |
| Quota | Unlimited | 50K writes/day |

**Decision:** Hybrid approach balances speed (localStorage for ideas.html) with real-time updates (Firestore for index.html).

---

## Migration Path from localStorage to Firestore

### Phase 1: Dual-Write (Week 1)

```
User submits idea
    ↓
createIdea() ← writes to localStorage (fast response)
    ↓
Also calls MedReformIdeas.createIdea() → Firestore (eventual consistency)
    ↓
Result: Data in both places
```

Benefits:
- No downtime
- Easy rollback (keep localStorage)
- Verify Firestore data accuracy

### Phase 2: Dual-Read (Week 2)

```
Page loads
    ↓
Try Firestore.getIdeas()
    ↓
If successful, use Firestore data
    ↓
If failed, fall back to localStorage
    ↓
Result: Real-time data from Firestore, fallback to cache
```

### Phase 3: Firestore-Primary (Week 3+)

```
Remove localStorage writes
    ↓
All data read from Firestore only
    ↓
localStorage used only for session state (filters, preferences)
    ↓
Result: Single source of truth (Firestore)
```

**Current status:** Phase 1 for index.html, Phase 0 for other pages (not blocking).

---

## Quota & Billing

### Free Tier (Spark Plan)

- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- No real-time listeners

### Estimated Usage (180 active users)

```
Reading ideas.html:
  - 180 users × 5 page views/day × 1 read = 900 reads/day ✅ Well under quota

Voting:
  - 180 users × 1 vote/day = 180 writes/day ✅ Well under quota

Comments:
  - 50 comments/day = 50 writes/day ✅ Well under quota

Total: ~950 reads, ~230 writes per day → ~$0/month 💰
```

### Scaling Beyond Free Tier

If usage exceeds free tier (pay-as-you-go):
- $0.06 per 100K reads
- $0.18 per 100K writes
- Estimated: $10-50/month for 1000 active users

---

## Monitoring & Debugging

### Firestore Console

```
1. Go to https://console.firebase.google.com/
2. Select your project → Firestore Database
3. View real-time data in collections
4. Check "Usage" tab for quota monitoring
```

### Browser DevTools Console

```javascript
// Check Firebase initialization
console.log(firebase.auth().currentUser);  // Should show anonymous user

// Check Firestore connection
console.log(firebase.firestore());  // Should show initialized instance

// View errors
// Look for "firebase" or "firestore" errors in Console tab
```

### Network Tab

```
POST https://firestore.googleapis.com/...  200 OK
GET  https://firestore.googleapis.com/...  200 OK
```

All requests should be 200 OK. If 403 Forbidden, check security rules.

---

## Troubleshooting Decision Tree

```
Page doesn't load stats?
├─ Check DevTools Console for errors
├─ Firebase not initialized?
│  └─ Verify apiKey is correct
├─ "Permission denied"?
│  └─ Check Firestore Rules allow reads
└─ Firestore empty?
   └─ Run firebase-import.js or submit new ideas

Vote not working?
├─ localStorage error?
│  └─ Clear browser storage, reload
├─ Firebase error?
│  └─ Check auth: console.log(firebase.auth().currentUser)
└─ Rules blocking write?
   └─ Verify allow write: if auth != null

Data not persisting?
├─ Check localStorage: console.log(localStorage.getItem('medr
eform-ideas'))
├─ Check Firestore console → ideas collection
└─ Check Network tab for failed requests
```

---

## Next Steps

1. **Complete:** firebase-backend.js (already in repo)
2. **Complete:** index.html Firebase integration (already done)
3. **In progress:** Credential setup (see FIREBASE_QUICK_START.md)
4. **Optional:** ideas.html async refactor (non-blocking)
5. **Optional:** submit.html Firestore integration (non-blocking)
6. **Optional:** Real-time listeners for live updates

All subsequent upgrades are incremental. MedReform works fully with localStorage; Firebase enhances it.
