# MedReform — Quick Setup Guide

## 🚀 Local Development

```bash
# Run the dev server
npm run dev

# Visit
http://localhost:3000
```

The site will be live with hot-reload disabled (http-server is static).

---

## 🔐 Admin Access

**URL**: `http://localhost:3000/admin`  
**Password**: `MedReform2025`

Features:
- ✓ View all ideas with live stats
- ✓ Change idea status (Submitted → Under Review → Implemented/Rejected)
- ✓ Delete low-quality ideas
- ✓ Flag spam/abusive content
- ✓ View & manage comments
- ✓ Export all data as JSON
- ✓ Auto-logout after 8 hours

---

## 📝 Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Landing page, stats, top ideas |
| Ideas | `/ideas` | Main feed with search, vote, comment |
| Submit | `/submit` | Form to propose ideas anonymously |
| Admin | `/admin` | Moderation dashboard (password-protected) |

---

## 💾 Data Storage (localStorage)

**Keys**:
- `medreform_ideas_v2` — All ideas (array)
- `medreform_voted_v2` — Your votes (set of IDs)
- `medreform_admin_v2` — Admin session
- `medreform_flags_v2` — Spam reports

**To Clear All Data**:
```javascript
// Open DevTools Console and run:
localStorage.removeItem('medreform_ideas_v2');
localStorage.removeItem('medreform_voted_v2');
localStorage.removeItem('medreform_admin_v2');
localStorage.removeItem('medreform_flags_v2');
```

---

## 🎨 Customization

### Change Admin Password
Edit `data.js` line ~5:
```javascript
const DEFAULT_ADMIN_PASSWORD = 'YourNewPassword';
```

### Change Brand Colors
Edit `styles.css`:
```css
--accent: #4ade80;     /* Primary green */
--bg: #0a0f0d;         /* Dark background */
--surface: #111815;    /* Card surface */
```

### Change Seed Ideas
Edit `data.js` SEED_IDEAS array (lines 14–23)

### Add More Categories
Edit `data.js` and add to category filters in HTML pages

---

## 🚢 Deploy to Vercel

```bash
# Connect GitHub repo to Vercel
# Auto-deploys on every push

git add .
git commit -m "Deploy MedReform to Vercel"
git push origin main
```

**Clean URLs** are automatically configured in `vercel.json`:
- `/ideas` works (not `/ideas.html`)
- `/submit` works (not `/submit.html`)
- `/admin` works (not `/admin.html`)

---

## 📊 How Voting Works

1. **Vote**: Click ▲ button on any idea
2. **Stored**: Your vote saved to `localStorage['medreform_voted_v2']`
3. **Persists**: Vote survives page reload and browser restart
4. **Per-Browser**: Vote state is per browser (not synced across devices)
5. **Unvote**: Click ▲ again to remove your vote

**Note**: This is a **local-only** voting system. Votes are not synced to a backend.

---

## 🔍 Search & Filter

- **Search**: Text input searches title, description, author, role
- **Sort**: Top (votes) / New (timestamp) / Trending (votes with time-decay) / Feasible (rating)
- **Category**: Filter by governance, safety, academic, infrastructure, welfare
- **Status**: Filter by submitted, under review, implemented, rejected
- **Feasibility Range**: Dual-handle slider (0–100%)

---

## 💬 Comments System

- **Add Comment**: Expand comments section, type, click "Post"
- **Limit**: 500 characters max per comment
- **Display**: Shows author name and timestamp
- **Storage**: Saved with the idea in localStorage
- **No Deletion**: Users can't delete their own comments (admin only)

---

## 🚩 Spam/Flagging

**Community Flagging**:
- Admin can flag ideas for spam, offensive content, or misinformation
- 3+ flags = idea auto-marked as `flagged: true`
- Flagged ideas show red border and flag badge on admin dashboard

**Detection**:
- Duplicate ideas: System alerts before submitting if similar idea exists
- Character limits: 150 chars max for title, 1000 for description

---

## 📱 Mobile Support

- Responsive design works on all screen sizes
- Mobile nav appears at ≤700px
- Touch-friendly buttons and input
- Sticky header on all pages

---

## 🐛 Troubleshooting

**"Admin password doesn't work"**
→ Password is case-sensitive: `MedReform2025`

**"My votes disappeared"**
→ Clear browser cache/history → localStorage data is gone
→ Each browser session has separate votes

**"Can't see new ideas"**
→ Refresh page (F5) to reload from localStorage
→ Ideas are stored per-browser, not synced across devices

**"Comment section is empty"**
→ Ideas load from seed data if localStorage is empty
→ Try adding a new comment to see it appear

**"Admin logout not working"**
→ Logout clears session; visit /admin and login again
→ Automatic logout happens after 8 hours

---

## 📈 Analytics

Google Analytics events are tracked:
- `submit.idea_created` — Idea submitted
- `ideas.vote` — Vote cast
- `ideas.comment_posted` — Comment added
- `admin.status_changed` — Admin changed idea status
- `admin.idea_deleted` — Admin deleted idea
- `admin.data_exported` — Admin exported data

**Setup GA**: Edit Google Analytics ID in HTML files (currently placeholder `G-XXXXXXXXXX`)

---

## ✅ Checklist Before Production

- [ ] Change admin password (`DEFAULT_ADMIN_PASSWORD` in data.js)
- [ ] Update Google Analytics ID in HTML files
- [ ] Update `og-image.png` path or create real image
- [ ] Test on mobile (iPhone, Android)
- [ ] Test voting flow end-to-end
- [ ] Test admin login and status changes
- [ ] Clear localStorage and test with fresh seed data
- [ ] Deploy to Vercel
- [ ] Test on live domain
- [ ] Share URL with COMJNMH community

---

**Questions?** This platform is designed to be self-contained and deployable with zero backend dependencies.
