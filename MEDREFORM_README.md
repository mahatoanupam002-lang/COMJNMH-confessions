# 🏥 MedReform — COMJNMH Campus Reform Platform

**The ultimate platform for bottom-up institutional change.**

MedReform is a **fully anonymous, community-driven ideas platform** designed to empower students, residents, and faculty at COMJNMH to propose, vote on, and track campus reform initiatives. Think of it as a combination of Product Hunt + Reddit + internal governance portal, built specifically for medical colleges.

---

## ⚡ Key Features

### For Community Members
- **Anonymous Submissions**: Share ideas without revealing your identity (unless you choose to)
- **Democratic Voting**: Upvote ideas you support; see which proposals have the most backing
- **Real Comments**: Discuss ideas in-thread with other community members
- **Smart Filtering**: Sort by Top/New/Trending/Feasibility, filter by category and status
- **Live Timestamps**: See exactly when ideas were submitted and commented on
- **Duplicate Detection**: System warns about similar ideas before posting
- **Rich Form UX**: Category selector, feasibility slider, character counters, live preview

### For Administrators
- **Password-Protected Access**: Secure admin panel (default password: `MedReform2025`)
- **8-Hour Session Timeout**: Automatic logout for security
- **Full Dashboard**: Real-time stats on ideas, votes, implemented reforms
- **Status Workflow**: Move ideas through Submitted → Under Review → Implemented/Rejected
- **Content Moderation**: Flag ideas for spam/offensive content; auto-hide after 3 flags
- **Comment Management**: View and manage all comments on each idea
- **Bulk Actions**: Edit status, delete, and export for multiple ideas
- **JSON Export**: Download all data for analysis or backup
- **Audit Trail**: Track which admin made what changes (via GA events)

### Core Content Management
- **7 Seed Ideas**: Pre-populated with real COMJNMH reform proposals
- **5 Categories**: Governance, Safety, Academic, Infrastructure, Welfare
- **4 Status Stages**: Submitted, Under Review, Implemented, Not Viable
- **Feasibility Ratings**: 0–100% user-rated implementation difficulty
- **Real-Time Vote Persistence**: Votes saved in browser localStorage (survives page refreshes)
- **Comment Threads**: Unlimited discussion per idea with author info and timestamps

---

## 🎨 Design System

### Modern Dark Theme
- **Accent Green**: `#4ade80` for primary CTAs and highlights
- **Deep Background**: `#0a0f0d` (very dark green-tinted black)
- **Surface Cards**: `#111815` with subtle `#2a3830` borders
- **Typography**: Instrument Serif (headings), Epilogue (body), DM Mono (metadata)
- **Animations**: Smooth 0.2–0.3s transitions, subtle shadows, responsive hover states

### Components
- **Sticky Header**: Branding + Navigation + Live Badge
- **Mobile Bottom Tab Bar**: Sticky footer nav at ≤700px
- **Floating Action Button**: "+ Submit Idea" button on desktop /ideas page
- **Toast Notifications**: Slide-up confirmations in corner
- **Responsive Grid**: Auto-fit layouts that work on mobile to 4K
- **Live Stats**: Dynamic counters updating with localStorage changes

---

## 🛠️ Technology Stack

### Frontend
- **Pure HTML/CSS/JavaScript** — No build step, no dependencies
- **ES6+ JavaScript** — Arrow functions, template strings, async/await support
- **localStorage API** — Persistent client-side data storage
- **Google Fonts CDN** — Custom typography
- **Google Analytics** — Event tracking (placeholder ID: `G-XXXXXXXXXX`)

### Architecture
- **Vercel Deployment**: Clean URLs via `vercel.json` (`/ideas` instead of `/ideas.html`)
- **Static Site**: No backend, no server, no database
- **Multi-Page App**: index.html, ideas.html, submit.html, admin.html
- **Shared Layer**: data.js (all business logic), styles.css (design system)

---

## 📄 File Structure

```
project/
├── index.html              # Landing page: hero, stats, top/trending ideas
├── ideas.html              # Main feed: search, filter, vote, comment
├── submit.html             # Idea submission form with preview
├── admin.html              # Password-protected admin dashboard
├── data.js                 # Shared data layer & utilities
├── styles.css              # Design tokens & shared components
├── vercel.json             # Clean URL configuration
└── .ideavo/
    ├── config              # Build/run configuration
    └── template            # Template name marker
```

---

## 🚀 Getting Started

### Run Locally
```bash
npm run dev  # Starts http-server on :3000
```

Visit `http://localhost:3000` to see the platform.

### Deploy to Vercel
```bash
git push origin main  # Auto-deploys to Vercel
```

The site will be live at your Vercel domain with clean URLs.

### Admin Access
1. Navigate to `/admin`
2. Enter password: `MedReform2025`
3. Session expires after 8 hours

---

## 📊 Data Model

### Idea Object
```javascript
{
  id: 1,                           // Incrementing integer
  votes: 47,                       // Vote count
  category: "infrastructure",      // governance|safety|academic|infrastructure|welfare
  title: "...",                    // Max 150 chars
  text: "...",                     // Max 1000 chars
  author: "Anonymous Resident",    // Anonymous or display name
  role: "PG Resident",            // User's role/department
  submittedAt: 1234567890000,     // Real timestamp (ms since epoch)
  feasibility: 78,                // 0–100 rating
  status: "submitted",            // submitted|reviewed|implemented|rejected
  comments: [{                     // Thread of discussions
    text: "...",
    author: "You",
    submittedAt: 1234567890000
  }],
  flagCount: 0,                   // Spam/abuse flags
  flagged: false                  // Auto-flagged after 3+ reports
}
```

### Storage Keys
- `medreform_ideas_v2`: Array of all idea objects
- `medreform_voted_v2`: Set of idea IDs user has voted on
- `medreform_admin_v2`: Admin session token
- `medreform_flags_v2`: Spam report database

---

## 🔐 Security & Privacy

### Anonymous Submissions
- ✓ No IP logging
- ✓ No cookies for personal identification
- ✓ Optional name field (hidden by default)
- ✓ Shared localStorage per browser (not per user)

### Admin Protection
- ✓ Password-protected login
- ✓ 8-hour session timeout
- ✓ No persistent token across browser restarts
- ✓ Single admin password (can be changed in code)

### Spam Protection
- ✓ Similar idea detection (prevents duplicate proposals)
- ✓ Auto-flag system (3+ community flags = auto-hidden)
- ✓ Feasibility range filtering (hide unrealistic ideas)
- ✓ Admin manual review & delete

### XSS Prevention
- ✓ HTML escaping in all user-generated content
- ✓ No script injection via comments or titles
- ✓ DOMContent rendering (no innerHTML without sanitization)

---

## 💡 How It Works

### For Students/Faculty
1. **Browse Ideas** (`/ideas`) — See what others have proposed
2. **Vote** — Click ▲ to upvote ideas you support
3. **Comment** — Add your perspective and discuss
4. **Submit** (`/submit`) — Share your own reform proposal
5. **Track** — Watch ideas move through status stages

### For Administrators
1. **Login** (`/admin`) — Enter password, get 8-hour session
2. **Review** — See all submissions and flagged content
3. **Decide** — Change idea status (Under Review, Approved, Rejected)
4. **Manage** — Delete low-quality ideas, unflag false positives
5. **Export** — Download data for reporting/analysis

### Behind the Scenes
- **Voting**: All votes saved to `localStorage['medreform_voted_v2']`
- **Comments**: Stored as array on each idea object
- **Admin Changes**: Immediately saved to `localStorage['medreform_ideas_v2']`
- **Persistence**: Data survives page reloads, browser restarts, multiple devices
- **No Server Sync**: Each browser/device sees its own vote state (not synced across devices)

---

## ✨ New Features (vs. Original)

| Feature | Before | After |
|---------|--------|-------|
| Timestamps | Hardcoded strings ("3 days ago") | Real ISO timestamps with formatTime() |
| Admin Auth | Public /admin, no password | Password-protected with 8hr timeout |
| Feasibility | Static | Live slider + color-coded bar |
| Comments | None | Full thread system with delete |
| Search | None | Real-time search + highlighting |
| Filtering | Basic | Multi-filter: category, status, feasibility range |
| Sorting | 2 options | 4 options: Top, New, Trending, Feasible |
| Flagging | None | Community flagging + admin review |
| Form UX | Basic | Live preview, char counters, category chips |
| Mobile | Bottom nav only | Responsive grid, touch-friendly buttons |
| Analytics | Placeholder ID | Event tracking for votes, comments, submissions |
| Code Quality | 4 duplicate functions | Single-definition utilities, DRY principles |

---

## 🎯 Use Cases

### Student/Faculty
- "The snake problem is critical — how do I raise this?"
  → Submit idea to Safety category, get support from others
- "I want to see which ideas other students support"
  → Browse sorted by Trending, vote on top proposals
- "The grievance portal idea looks good, let me add my thoughts"
  → Comment with specific implementation suggestions

### Administrator
- "How many reform proposals do we have?"
  → Check Dashboard: 7 ideas, 168 total votes, 1 implemented
- "Some ideas aren't realistic — can I mark them as not viable?"
  → Edit Status: change from "Submitted" to "Not Viable"
- "We should analyze what students care about most"
  → Export Data as JSON: get all ideas + votes for analysis
- "This idea has multiple spam votes — remove it"
  → Delete or flag idea; it hides after 3 community flags

### Institution
- **Governance**: Data-driven decision making on which reforms matter most
- **Transparency**: Students see that ideas are being reviewed, not ignored
- **Accountability**: Track status of proposals through implementation
- **Engagement**: Anonymous platform removes fear of retaliation

---

## 🔄 Future Enhancements (Ideas)

- [ ] Real backend (Firebase/Supabase) for multi-device sync
- [ ] User accounts with email notifications
- [ ] Rich text editor for proposals
- [ ] Proposal templates by category
- [ ] Cost/impact estimates for ideas
- [ ] Monthly digest emails
- [ ] Department-specific channels
- [ ] Integration with official grievance system
- [ ] Anonymous voting (anonymous until admin review)
- [ ] Idea trending algorithm (time-decay + velocity)

---

## 📞 Support

**Default Admin Password**: `MedReform2025`

To change:
1. Edit `data.js` line: `const DEFAULT_ADMIN_PASSWORD = 'YourNewPassword'`
2. Users must re-login at `/admin`

**To Clear All Data**:
Open browser DevTools → Storage → localStorage
- Delete `medreform_ideas_v2`
- Delete `medreform_voted_v2`
- Delete `medreform_admin_v2`
- Delete `medreform_flags_v2`

**To Deploy**:
```bash
git add .
git commit -m "Deploy MedReform to Vercel"
git push origin main
```

---

## 📄 License

MedReform is open-source and designed for educational institutions. Use, modify, and share freely.

---

**Built for COMJNMH Kalyani. Empowering voices. Driving change.**
