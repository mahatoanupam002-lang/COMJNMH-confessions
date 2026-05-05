'use client'

import { useState, useEffect, useRef } from 'react'

const CATS = ['governance', 'safety', 'academic', 'infrastructure', 'welfare']
const CAT_LABELS = { governance: 'Governance', safety: 'Safety', academic: 'Academic', infrastructure: 'Infrastructure', welfare: 'Student Welfare' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const hr   = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  const wk   = Math.floor(diff / 604800000)
  if (min < 2)  return 'Just now'
  if (min < 60) return `${min}m ago`
  if (hr  < 24) return `${hr}h ago`
  if (day <  7) return `${day} day${day > 1 ? 's' : ''} ago`
  return `${wk} week${wk > 1 ? 's' : ''} ago`
}

export default function Home() {
  const [ideas,      setIdeas]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selectedCat,setSelectedCat]= useState('governance')
  const [anonMode,   setAnonMode]   = useState(false)
  const [sortMode,   setSortMode]   = useState('top')
  const [catFilter,  setCatFilter]  = useState('all')
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [role,       setRole]       = useState('')
  const [feasibility,setFeasibility]= useState(50)
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState({ show: false, msg: '', icon: '✓' })
  const [votedIds,   setVotedIds]   = useState(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('votedIds') || '[]')) }
    catch { return new Set() }
  })
  const titleRef = useRef(null)

  useEffect(() => { fetchIdeas() }, [])

  async function fetchIdeas() {
    try {
      const res  = await fetch('/api/ideas')
      const data = await res.json()
      setIdeas(Array.isArray(data) ? data : [])
    } catch {
      showToast('Failed to load ideas', '⚠')
    } finally {
      setLoading(false)
    }
  }

  async function submitIdea() {
    if (!title.trim() || !desc.trim()) {
      showToast('Please fill in title and description', '⚠')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          description: desc.trim(),
          category:    selectedCat,
          author:      anonMode ? 'Anonymous' : (role || 'Community Member'),
          role:        role || 'Community Member',
          feasibility,
        }),
      })
      if (!res.ok) throw new Error()
      const newIdea = await res.json()
      setIdeas(prev => [newIdea, ...prev])
      setTitle(''); setDesc(''); setFeasibility(50)
      showToast('Idea submitted. Thank you.')
    } catch {
      showToast('Submission failed. Try again.', '⚠')
    } finally {
      setSubmitting(false)
    }
  }

  async function vote(id) {
    const alreadyVoted = votedIds.has(id)
    const action = alreadyVoted ? 'unvote' : 'vote'
    const delta  = alreadyVoted ? -1 : 1

    // Optimistic update
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + delta } : i))
    const next = new Set(votedIds)
    alreadyVoted ? next.delete(id) : next.add(id)
    setVotedIds(next)
    localStorage.setItem('votedIds', JSON.stringify([...next]))

    try {
      await fetch('/api/vote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
    } catch {
      // Revert on failure
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes - delta } : i))
      const revert = new Set(next)
      alreadyVoted ? revert.add(id) : revert.delete(id)
      setVotedIds(revert)
      localStorage.setItem('votedIds', JSON.stringify([...revert]))
    }
  }

  function showToast(msg, icon = '✓') {
    setToast({ show: true, msg, icon })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const filtered = ideas
    .filter(i => catFilter === 'all' || i.category === catFilter)
    .sort((a, b) => {
      if (sortMode === 'top')      return b.votes - a.votes
      if (sortMode === 'new')      return new Date(b.created_at) - new Date(a.created_at)
      if (sortMode === 'feasible') return b.feasibility - a.feasibility
      return 0
    })

  const totalVotes = ideas.reduce((s, i) => s + i.votes, 0)
  const catCounts  = CATS.reduce((acc, cat) => {
    acc[cat] = ideas.filter(i => i.category === cat).length
    return acc
  }, {})
  const maxCatCount = Math.max(1, ...Object.values(catCounts))

  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header>
        <div className="logo">
          <div className="logo-mark">M+</div>
          <div>
            <div className="logo-text">MedReform</div>
            <div className="logo-sub">COMJNMH · Kalyani</div>
          </div>
        </div>
        <div className="header-right">
          <span className="badge live">Open Platform</span>
          <span className="badge">Est. 2025</span>
          <button className="btn-primary" onClick={() => titleRef.current?.focus()}>+ Submit Idea</button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-tag">🏥 Student &amp; Faculty Reform Initiative</div>
        <h1>Fix what&apos;s <em>broken.</em><br />Build what&apos;s missing.</h1>
        <p>A structured space for students, residents, and faculty to surface real problems and propose actionable solutions for COMJNMH Kalyani — anonymously if needed.</p>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">{ideas.length}</span>
            <span className="stat-label">Ideas submitted</span>
          </div>
          <div className="stat">
            <span className="stat-number">{totalVotes}</span>
            <span className="stat-label">Votes cast</span>
          </div>
          <div className="stat">
            <span className="stat-number">{ideas.filter(i => i.author !== 'Anonymous').length + ideas.filter(i => i.author === 'Anonymous').length}</span>
            <span className="stat-label">Contributors</span>
          </div>
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Implemented</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <div className="main">
        <div className="content-col">

          {/* SUBMIT FORM */}
          <div className="submit-panel">
            <div className="panel-title">Submit an idea or problem</div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Category</label>
              <div className="category-chips">
                {CATS.map(cat => (
                  <button
                    key={cat}
                    className={`chip cat-${cat}${selectedCat === cat ? ' active' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    {CAT_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="e.g. Outsource hostel maintenance to private firm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label>Your role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="">Select role</option>
                  <option>MBBS Student (Phase I)</option>
                  <option>MBBS Student (Phase II)</option>
                  <option>MBBS Student (Clinical)</option>
                  <option>PG Resident</option>
                  <option>Junior Faculty</option>
                  <option>Senior Faculty</option>
                  <option>Staff</option>
                  <option>Alumni</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Describe the problem &amp; your proposed solution</label>
              <textarea
                placeholder="What's broken? What would fix it? Be specific — vague complaints get less traction than concrete proposals."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={2000}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Feasibility (your estimate) — {feasibility}%</label>
              <input
                type="range"
                min="0" max="100"
                value={feasibility}
                onChange={e => setFeasibility(parseInt(e.target.value))}
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>

            <div className="submit-footer">
              <div className="anon-toggle" onClick={() => setAnonMode(m => !m)}>
                <div className={`toggle${anonMode ? ' on' : ''}`} />
                <span>{anonMode ? 'Posting anonymously' : 'Post anonymously'}</span>
              </div>
              <button className="btn-primary" onClick={submitIdea} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit →'}
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filters">
            <span className="filter-label">Sort:</span>
            {[['top', 'Top voted'], ['new', 'Newest'], ['feasible', 'Most feasible']].map(([mode, label]) => (
              <button
                key={mode}
                className={`filter-btn${sortMode === mode ? ' active' : ''}`}
                onClick={() => setSortMode(mode)}
              >{label}</button>
            ))}
            <span className="filter-label" style={{ marginLeft: '8px' }}>Filter:</span>
            {[['all', 'All'], ['governance', 'Governance'], ['safety', 'Safety'], ['academic', 'Academic']].map(([cat, label]) => (
              <button
                key={cat}
                className={`filter-btn${catFilter === cat ? ' active' : ''}`}
                onClick={() => setCatFilter(cat)}
              >{label}</button>
            ))}
          </div>

          {/* IDEAS LIST */}
          <div className="ideas-list">
            {loading && <div className="loading-state">Loading ideas…</div>}
            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <h3>No ideas yet in this category</h3>
                <p>Be the first to submit one.</p>
              </div>
            )}
            {filtered.map((idea, idx) => (
              <div key={idea.id} className="idea-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="vote-col">
                  <button
                    className={`vote-btn${votedIds.has(idea.id) ? ' voted' : ''}`}
                    onClick={() => vote(idea.id)}
                  >▲</button>
                  <div className="vote-count">{idea.votes}</div>
                </div>
                <div className="idea-body">
                  <div className="idea-meta">
                    <span className={`cat-badge ${idea.category}`}>{idea.category}</span>
                    <span className="idea-author">{idea.author}</span>
                    <span className="idea-time">{timeAgo(idea.created_at)}</span>
                  </div>
                  <div className="idea-title">{idea.title}</div>
                  <div className="idea-text">{idea.description}</div>
                  <div className="idea-footer">
                    <span className="idea-action">💬 Discuss</span>
                    <span className="idea-action">🔗 Share</span>
                    <div className="feasibility">
                      <span>Feasibility</span>
                      <div className="feasibility-bar">
                        <div
                          className="feasibility-fill"
                          style={{
                            width: `${idea.feasibility}%`,
                            background: idea.feasibility > 70
                              ? 'var(--accent)'
                              : idea.feasibility > 40
                                ? 'var(--amber)'
                                : 'var(--red)',
                          }}
                        />
                      </div>
                      <span>{idea.feasibility}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <div className="sidebar">

          <div className="sidebar-card">
            <div className="sidebar-title">Known Problems</div>
            {[
              { dot: 'critical', name: 'Campus snake sightings',    desc: 'Recurring, unresolved\nMultiple years, zero action' },
              { dot: 'critical', name: 'Hostel hygiene',            desc: 'Chronic complaints\nNo facility management' },
              { dot: 'moderate', name: 'Library outdated',          desc: 'No new acquisitions\nsince 2021 reported' },
              { dot: 'moderate', name: 'CBME compliance gap',       desc: 'DOPS logged on paper\nnot in practice' },
              { dot: 'tracked',  name: 'Equipment procurement lag', desc: 'Clinical depts most affected\n12–18 mo average delay' },
            ].map(p => (
              <div key={p.name} className="problem-item">
                <div className={`problem-dot ${p.dot}`} />
                <div>
                  <div className="problem-name">{p.name}</div>
                  <div className="problem-desc" style={{ whiteSpace: 'pre-line' }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">Ideas by Category</div>
            {[
              { cat: 'Governance',     key: 'governance',     color: 'var(--blue)' },
              { cat: 'Safety',         key: 'safety',         color: 'var(--red)' },
              { cat: 'Academic',       key: 'academic',       color: 'var(--amber)' },
              { cat: 'Infrastructure', key: 'infrastructure', color: 'var(--accent)' },
              { cat: 'Welfare',        key: 'welfare',        color: '#c084fc' },
            ].map(({ cat, key, color }) => (
              <div key={key} className="cat-row">
                <span className="cat-name">{cat}</span>
                <div className="cat-bar-wrap">
                  <div className="cat-bar-fill" style={{ width: `${(catCounts[key] / maxCatCount) * 100}%`, background: color }} />
                </div>
                <span className="cat-count">{catCounts[key]}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">Top Contributors</div>
            {[
              { initials: 'AR', name: 'Anonymous Resident', role: 'PG · Surgery',      score: 47 },
              { initials: 'S3', name: '3rd Year Student',   role: 'MBBS · Clinical',   score: 31 },
              { initials: 'JF', name: 'Junior Faculty',     role: 'Dept. of Medicine', score: 28 },
            ].map(c => (
              <div key={c.initials} className="contributor">
                <div className="avatar">{c.initials}</div>
                <div className="contributor-info">
                  <div className="contributor-name">{c.name}</div>
                  <div className="contributor-role">{c.role}</div>
                </div>
                <div className="contributor-score">{c.score}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <span className="toast-icon">{toast.icon}</span>
        <span>{toast.msg}</span>
      </div>
    </>
  )
}
