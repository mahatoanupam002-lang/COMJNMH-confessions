// Shared data + localStorage utilities across all pages

const STORE_KEY = 'comjnmh_ideas_v1';
const VOTED_KEY = 'comjnmh_voted_v1';

const SEED_IDEAS = [
  { id:1, votes:47, category:'infrastructure', title:'Outsource hostel and campus facility management to a private contractor', text:'The administration is not equipped to run facilities. Outsourcing hostel maintenance, groundskeeping, and pest control to a professional FM company removes this from the medical college\'s plate entirely. NMC doesn\'t prohibit this. Cost can be built into hostel fees.', author:'Anonymous Resident', role:'PG Resident', time:'3 days ago', feasibility:78, status:'submitted', comments:[] },
  { id:2, votes:38, category:'governance',     title:'Mandatory HoD rotation every 3 years with performance review', text:'Several department heads have held their chairs for 8–12 years. Stale leadership = stale departments. Institute a formal rotation policy tied to CBME and research output benchmarks. AIIMS Delhi does this. We should too.', author:'Junior Faculty', role:'Junior Faculty', time:'5 days ago', feasibility:45, status:'reviewed', comments:[] },
  { id:3, votes:31, category:'safety',         title:'Emergency snake response protocol + habitat removal drive', text:'This is a physical safety issue that has persisted for years. Immediate fix: empanel a professional pest control/wildlife service. Medium term: clear overgrown vegetation in a 100m radius around hostels. This costs less than ₹2L and could be done in a week.', author:'3rd Year Student', role:'MBBS Student (Clinical)', time:'1 week ago', feasibility:90, status:'implemented', comments:[] },
  { id:4, votes:24, category:'governance',     title:'Digital grievance portal with mandatory 14-day resolution SLA', text:'Current system: complain to warden → warden files report → nothing. Proposed: an online portal where complaints are timestamped, assigned to a named responsible officer, and tracked publicly. No new budget needed — just implementation.', author:'Anonymous Student', role:'MBBS Student (Phase II)', time:'1 week ago', feasibility:62, status:'submitted', comments:[] },
  { id:5, votes:18, category:'academic',       title:'Quarterly guest lecture series from AIIMS Kalyani faculty', text:'AIIMS Kalyani is 10 minutes away. A formal MoU for quarterly joint seminars would cost almost nothing but dramatically update clinical exposure. This is a massive underutilized proximity advantage.', author:'Senior Faculty', role:'Senior Faculty', time:'2 weeks ago', feasibility:70, status:'submitted', comments:[] },
  { id:6, votes:12, category:'infrastructure', title:'Decentralize minor maintenance budgets to department level', text:'Departments currently wait months for a ₹5000 repair because everything routes through central admin. Give each department a small discretionary maintenance budget for non-capital items. Faster turnaround, less bottleneck.', author:'Anonymous Faculty', role:'Junior Faculty', time:'2 weeks ago', feasibility:55, status:'rejected', comments:[] },
  { id:7, votes:8,  category:'governance',     title:'Student representation on college academic committee', text:'No state college in WB has formal student reps on the academic committee. One elected student from each batch, non-voting observer status, to surface ground realities the administration systematically fails to hear.', author:'Anonymous', role:'MBBS Student (Clinical)', time:'3 weeks ago', feasibility:38, status:'submitted', comments:[] },
];

function getIdeas() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) return p; }
  } catch {}
  return SEED_IDEAS.map(i => Object.assign({}, i));
}

function saveIdeas(ideas) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(ideas)); } catch {}
}

function getVoted() {
  try { return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || '[]')); } catch {}
  return new Set();
}

function saveVoted(set) {
  try { localStorage.setItem(VOTED_KEY, JSON.stringify([...set])); } catch {}
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function totalVotes(ideas) {
  return ideas.reduce(function(s, i) { return s + i.votes; }, 0);
}

function feasColor(f) {
  return f > 70 ? 'var(--accent)' : f > 40 ? 'var(--amber)' : 'var(--red)';
}

function showToast(msg, icon) {
  var t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent  = msg;
  document.getElementById('toast-icon').textContent = icon || '✓';
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function statusColor(status) {
  if (status === 'implemented') return 'var(--accent)';
  if (status === 'reviewed') return 'var(--blue)';
  if (status === 'rejected') return 'var(--red)';
  return 'var(--amber)'; // submitted
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Search and filter utility
function searchIdeas(ideas, query) {
  if (!query) return ideas;
  var q = query.toLowerCase();
  return ideas.filter(function(i) {
    return i.title.toLowerCase().includes(q) || 
           i.text.toLowerCase().includes(q) ||
           i.author.toLowerCase().includes(q);
  });
}

// Comments management
function addComment(ideas, ideaId, comment) {
  var idea = ideas.find(function(i) { return i.id === ideaId; });
  if (idea) {
    if (!idea.comments) idea.comments = [];
    idea.comments.push(comment);
    return true;
  }
  return false;
}

function getComments(ideas, ideaId) {
  var idea = ideas.find(function(i) { return i.id === ideaId; });
  return idea ? (idea.comments || []) : [];
}

// Similar ideas detection (basic string similarity)
function findSimilarIdeas(ideas, newTitle, newText, excludeId) {
  var combined = (newTitle + ' ' + newText).toLowerCase();
  var words = combined.split(/\s+/).filter(function(w) { return w.length > 3; });
  
  return ideas.filter(function(idea) {
    if (idea.id === excludeId) return false;
    var existingText = (idea.title + ' ' + idea.text).toLowerCase();
    var matches = words.filter(function(w) { return existingText.includes(w); });
    return matches.length > words.length * 0.3; // >30% word overlap
  });
}
