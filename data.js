// MedReform Data Layer — Enhanced with Real Timestamps, Admin Auth, Flagging

const STORE_KEY = 'medreform_ideas_v2';
const VOTED_KEY = 'medreform_voted_v2';
const ADMIN_KEY = 'medreform_admin_v2';
const FLAGS_KEY = 'medreform_flags_v2';

const DEFAULT_ADMIN_PASSWORD = 'MedReform2025';

// Migration: convert old format to new format
function migrateIdeas(oldIdeas) {
  const now = Date.now();
  return oldIdeas.map((idea, idx) => ({
    ...idea,
    submittedAt: now - (idx * 24 * 60 * 60 * 1000),
    flagCount: 0,
    flagged: false,
    comments: (idea.comments || []).map(c => ({
      ...c,
      submittedAt: now - (24 * 60 * 60 * 1000)
    }))
  }));
}

const SEED_IDEAS = [
  { id:1, votes:47, category:'infrastructure', title:'Outsource hostel and campus facility management to a private contractor', text:'The administration is not equipped to run facilities. Outsourcing hostel maintenance, groundskeeping, and pest control to a professional FM company removes this from the medical college\'s plate entirely. NMC doesn\'t prohibit this. Cost can be built into hostel fees.', author:'Anonymous Resident', role:'PG Resident', submittedAt: Date.now() - 3*24*60*60*1000, feasibility:78, status:'submitted', comments:[{text:'This would be transformative.',author:'You',submittedAt:Date.now()-2*24*60*60*1000}], flagCount:0, flagged:false },
  { id:2, votes:38, category:'governance',     title:'Mandatory HoD rotation every 3 years with performance review', text:'Several department heads have held their chairs for 8–12 years. Stale leadership = stale departments. Institute a formal rotation policy tied to CBME and research output benchmarks. AIIMS Delhi does this. We should too.', author:'Junior Faculty', role:'Junior Faculty', submittedAt: Date.now() - 5*24*60*60*1000, feasibility:45, status:'reviewed', comments:[], flagCount:0, flagged:false },
  { id:3, votes:31, category:'safety',         title:'Emergency snake response protocol + habitat removal drive', text:'This is a physical safety issue that has persisted for years. Immediate fix: empanel a professional pest control/wildlife service. Medium term: clear overgrown vegetation in a 100m radius around hostels. This costs less than ₹2L and could be done in a week.', author:'3rd Year Student', role:'MBBS Student (Clinical)', submittedAt: Date.now() - 7*24*60*60*1000, feasibility:90, status:'implemented', comments:[], flagCount:0, flagged:false },
  { id:4, votes:24, category:'governance',     title:'Digital grievance portal with mandatory 14-day resolution SLA', text:'Current system: complain to warden → warden files report → nothing. Proposed: an online portal where complaints are timestamped, assigned to a named responsible officer, and tracked publicly. No new budget needed — just implementation.', author:'Anonymous Student', role:'MBBS Student (Phase II)', submittedAt: Date.now() - 7*24*60*60*1000, feasibility:62, status:'submitted', comments:[], flagCount:0, flagged:false },
  { id:5, votes:18, category:'academic',       title:'Quarterly guest lecture series from AIIMS Kalyani faculty', text:'AIIMS Kalyani is 10 minutes away. A formal MoU for quarterly joint seminars would cost almost nothing but dramatically update clinical exposure. This is a massive underutilized proximity advantage.', author:'Senior Faculty', role:'Senior Faculty', submittedAt: Date.now() - 14*24*60*60*1000, feasibility:70, status:'submitted', comments:[], flagCount:0, flagged:false },
  { id:6, votes:12, category:'infrastructure', title:'Decentralize minor maintenance budgets to department level', text:'Departments currently wait months for a ₹5000 repair because everything routes through central admin. Give each department a small discretionary maintenance budget for non-capital items. Faster turnaround, less bottleneck.', author:'Anonymous Faculty', role:'Junior Faculty', submittedAt: Date.now() - 14*24*60*60*1000, feasibility:55, status:'rejected', comments:[], flagCount:0, flagged:false },
  { id:7, votes:8,  category:'governance',     title:'Student representation on college academic committee', text:'No state college in WB has formal student reps on the academic committee. One elected student from each batch, non-voting observer status, to surface ground realities the administration systematically fails to hear.', author:'Anonymous', role:'MBBS Student (Clinical)', submittedAt: Date.now() - 21*24*60*60*1000, feasibility:38, status:'submitted', comments:[], flagCount:0, flagged:false },
];

// ADMIN AUTH
function getAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return session;
  } catch (e) { return null; }
}

function setAdminSession(password) {
  if (password !== DEFAULT_ADMIN_PASSWORD) return false;
  try {
    const session = { authenticated: true, loginTime: Date.now(), expiresAt: Date.now() + 8*60*60*1000 };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
    return true;
  } catch (e) { return false; }
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEY);
}

function isAdminLoggedIn() {
  return getAdminSession() !== null;
}

// DATA RETRIEVAL
function getIdeas() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { 
      const p = JSON.parse(raw); 
      if (Array.isArray(p) && p.length) return p;
    }
  } catch (e) { console.error('Failed to load ideas:', e); }
  return SEED_IDEAS.map(i => JSON.parse(JSON.stringify(i)));
}

function saveIdeas(ideas) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error('Failed to save ideas:', e);
    showToast('⚠️ Storage full. Changes may not save.', '⚠️');
  }
}

function getVoted() {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    return new Set(JSON.parse(raw || '[]'));
  } catch (e) { return new Set(); }
}

function saveVoted(set) {
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
  } catch (e) { console.error('Failed to save votes:', e); }
}

// FLAGS / SPAM DETECTION
function getFlags() {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    return JSON.parse(raw || '{}');
  } catch (e) { return {}; }
}

function saveFlags(flags) {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch (e) { console.error('Failed to save flags:', e); }
}

function flagIdea(ideas, ideaId, reason) {
  const flags = getFlags();
  const key = `idea_${ideaId}`;
  if (!flags[key]) flags[key] = [];
  flags[key].push({ reason, timestamp: Date.now() });
  saveFlags(flags);
  const idea = ideas.find(i => i.id === ideaId);
  if (idea) {
    idea.flagCount = (idea.flagCount || 0) + 1;
    if (idea.flagCount >= 3) idea.flagged = true;
  }
}

function unflagIdea(ideas, ideaId) {
  const flags = getFlags();
  delete flags[`idea_${ideaId}`];
  saveFlags(flags);
  const idea = ideas.find(i => i.id === ideaId);
  if (idea) { idea.flagCount = 0; idea.flagged = false; }
}

// HTML ESCAPING
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function sanitizeText(s, maxLen) {
  let text = String(s).trim().substring(0, maxLen);
  return escHtml(text);
}

// FORMATTING & DISPLAY
function formatTime(timestamp) {
  if (typeof timestamp !== 'number') return 'unknown';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusLabel(status) {
  const labels = { 'submitted': 'Submitted', 'reviewed': 'Under Review', 'implemented': 'Implemented', 'rejected': 'Not Viable' };
  return labels[status] || status;
}

function statusColorBg(status) {
  const colors = { 'submitted': 'rgba(251, 191, 36, 0.12)', 'reviewed': 'rgba(96, 165, 250, 0.12)', 'implemented': 'rgba(74, 222, 128, 0.12)', 'rejected': 'rgba(248, 113, 113, 0.12)' };
  return colors[status] || 'rgba(122, 148, 133, 0.12)';
}

// SEARCH & FILTERING
function searchIdeas(ideas, query) {
  if (!query || !query.trim()) return ideas;
  const q = query.toLowerCase();
  return ideas.filter(i => 
    i.title.toLowerCase().includes(q) || 
    i.text.toLowerCase().includes(q) ||
    i.author.toLowerCase().includes(q) ||
    i.role.toLowerCase().includes(q)
  );
}

function findSimilarIdeas(ideas, newTitle, newText, excludeId) {
  const titleWords = newTitle.toLowerCase().split(/\s+/);
  const textWords = newText.toLowerCase().split(/\s+/);
  const searchWords = new Set([...titleWords, ...textWords].filter(w => w.length > 3));
  
  return ideas
    .filter(i => i.id !== excludeId)
    .map(idea => {
      const ideaWords = new Set((idea.title + ' ' + idea.text).toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...searchWords].filter(w => ideaWords.has(w)).length;
      const similarity = overlap / Math.max(searchWords.size, 1);
      return { idea, similarity };
    })
    .filter(({ similarity }) => similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ idea }) => idea);
}

// TOTAL VOTES
function totalVotes(ideas) {
  return ideas.reduce(function(s, i) { return s + i.votes; }, 0);
}

// FEASIBILITY COLOR
function feasColor(f) {
  return f > 70 ? 'var(--accent)' : f > 40 ? 'var(--amber)' : 'var(--red)';
}

// UI NOTIFICATIONS
function showToast(msg, icon) {
  var t = document.getElementById('toast');
  if (!t) return;
  var toastText = t.querySelector('.toast-text');
  var toastIcon = t.querySelector('.toast-icon');
  if (toastText) toastText.textContent = msg;
  if (toastIcon) toastIcon.textContent = icon || '✓';
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3500);
}

function statusColor(status) {
  if (status === 'implemented') return 'var(--accent)';
  if (status === 'reviewed') return 'var(--blue)';
  if (status === 'rejected') return 'var(--red)';
  return 'var(--amber)';
}

// COMMENTS MANAGEMENT
function addComment(ideas, ideaId, text, author) {
  const idea = ideas.find(i => i.id === ideaId);
  if (!idea) return false;
  const comment = { text: sanitizeText(text, 500), author: sanitizeText(author || 'You', 100), submittedAt: Date.now() };
  idea.comments.push(comment);
  return true;
}

function getComments(ideas, ideaId) {
  const idea = ideas.find(i => i.id === ideaId);
  return idea ? (idea.comments || []) : [];
}

function deleteComment(ideas, ideaId, commentIndex) {
  const idea = ideas.find(i => i.id === ideaId);
  if (idea && idea.comments[commentIndex]) {
    idea.comments.splice(commentIndex, 1);
    return true;
  }
  return false;
}

// IDEA OPERATIONS
function createIdea(data) {
  const ideas = getIdeas();
  const maxId = Math.max(0, ...ideas.map(i => i.id));
  const newIdea = {
    id: maxId + 1,
    votes: 0,
    category: data.category || 'governance',
    title: sanitizeText(data.title, 150),
    text: sanitizeText(data.text, 1000),
    author: data.anonymous ? 'Anonymous' : sanitizeText(data.author || 'Anonymous', 100),
    role: sanitizeText(data.role || 'Other', 50),
    submittedAt: Date.now(),
    feasibility: parseInt(data.feasibility) || 50,
    status: 'submitted',
    comments: [],
    flagCount: 0,
    flagged: false
  };
  ideas.push(newIdea);
  saveIdeas(ideas);
  return newIdea;
}

function updateIdeaStatus(ideas, ideaId, newStatus) {
  const idea = ideas.find(i => i.id === ideaId);
  if (idea && ['submitted', 'reviewed', 'implemented', 'rejected'].includes(newStatus)) {
    idea.status = newStatus;
    return true;
  }
  return false;
}

function deleteIdea(ideas, ideaId) {
  const index = ideas.findIndex(i => i.id === ideaId);
  if (index !== -1) {
    ideas.splice(index, 1);
    return true;
  }
  return false;
}

function exportData(ideas) {
  const data = { exportedAt: new Date().toISOString(), totalIdeas: ideas.length, totalVotes: totalVotes(ideas), ideas };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medreform-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
