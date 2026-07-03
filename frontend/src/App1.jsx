import { useState, useEffect, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES = {
  watching:          { label: 'Watching',       color: 'var(--green)',  bg: 'var(--green-bg)'  },
  'plan-to-watch':   { label: 'Plan to Watch',  color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
  'on-hold':         { label: 'On Hold',         color: 'var(--amber)',  bg: 'var(--amber-bg)'  },
  dropped:           { label: 'Dropped',         color: 'var(--red)',    bg: 'var(--red-bg)'    },
  completed:         { label: 'Completed',       color: 'var(--gray)',   bg: 'var(--gray-bg)'   },
}

const UNFINISHED_STATUSES = ['watching', 'plan-to-watch', 'on-hold', 'dropped']

const NAV = [
  { id: 'all',            label: 'All Active',    statuses: UNFINISHED_STATUSES },
  { id: 'watching',       label: 'Watching',      statuses: ['watching']        },
  { id: 'plan-to-watch',  label: 'Plan to Watch', statuses: ['plan-to-watch']   },
  { id: 'on-hold',        label: 'On Hold',       statuses: ['on-hold']         },
  { id: 'dropped',        label: 'Dropped',       statuses: ['dropped']         },
]

const BLANK = { name: '', link: '', episode: '0', total_episodes: '', status: 'watching', notes: '' }

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data.errors || [data.error]).join(', '))
  return data
}

const api = {
  getAll:         ()      => apiFetch('/animes'),
  create:         (body)  => apiFetch('/animes', { method: 'POST', body: JSON.stringify(body) }),
  update:         (id, b) => apiFetch(`/animes/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  patchEpisode:   (id, ep) => apiFetch(`/animes/${id}/episode`, { method: 'PATCH', body: JSON.stringify({ episode: ep }) }),
  remove:         (id)    => apiFetch(`/animes/${id}`, { method: 'DELETE' }),
}

// ─── Reusable components ─────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUSES[status]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const styles = {
    success: { bg: 'var(--green-bg)', border: 'var(--green)', color: 'var(--green)' },
    error:   { bg: 'var(--red-bg)',   border: 'var(--red)',   color: 'var(--red)'   },
    info:    { bg: 'var(--blue-bg)',  border: 'var(--blue)',  color: 'var(--blue)'  },
  }
  const s = styles[toast.type] || styles.success
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '10px 16px', borderRadius: 'var(--radius-md)',
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      {toast.msg}
    </div>
  )
}

function Btn({ onClick, variant = 'default', style = {}, children, disabled }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 'var(--radius-md)',
    fontSize: 13, fontWeight: 500, border: 'none',
    transition: 'opacity 0.15s, background 0.15s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
  const variants = {
    default: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
    primary: { background: 'var(--accent)',   color: '#fff' },
    ghost:   { background: 'transparent',     color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:  { background: 'var(--red-bg)',   color: 'var(--red)',            border: '1px solid transparent' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
}

// ─── AnimeForm ────────────────────────────────────────────────────────────────

function AnimeForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm]   = useState(initial || BLANK)
  const [errors, setErrors] = useState({})

  // Keep in sync when editing a different anime
  useEffect(() => { setForm(initial || BLANK); setErrors({}) }, [initial])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())                         e.name = 'Name is required'
    if (form.episode === '' || isNaN(form.episode)) e.episode = 'Must be a number'
    if (Number(form.episode) < 0)                  e.episode = 'Cannot be negative'
    if (form.total_episodes !== '') {
      if (isNaN(form.total_episodes) || Number(form.total_episodes) < 1)
        e.total_episodes = 'Must be a positive number'
      else if (Number(form.episode) > Number(form.total_episodes))
        e.episode = 'Cannot exceed total episodes'
    }
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({
      name:           form.name.trim(),
      link:           form.link.trim(),
      episode:        Number(form.episode),
      total_episodes: form.total_episodes !== '' ? Number(form.total_episodes) : null,
      status:         form.status,
      notes:          form.notes.trim(),
    })
  }

  return (
    <div style={{
      background: 'var(--bg-main)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20,
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
        {initial?.id ? 'Edit anime' : 'Add anime'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Name *" error={errors.name}>
            <input style={inputStyle} placeholder="e.g. Fullmetal Alchemist" value={form.name} onChange={set('name')} />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Streaming link">
            <input style={inputStyle} placeholder="https://..." value={form.link} onChange={set('link')} />
          </Field>
        </div>
        <Field label="Current episode *" error={errors.episode}>
          <input style={inputStyle} type="number" min="0" placeholder="0" value={form.episode} onChange={set('episode')} />
        </Field>
        <Field label="Total episodes" error={errors.total_episodes}>
          <input style={inputStyle} type="number" min="1" placeholder="Leave blank if unknown" value={form.total_episodes} onChange={set('total_episodes')} />
        </Field>
        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={set('status')}>
            {Object.entries(STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <input style={inputStyle} placeholder="Optional notes" value={form.notes} onChange={set('notes')} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Add to vault'}
        </Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ─── AnimeRow ─────────────────────────────────────────────────────────────────

function AnimeRow({ anime, onEdit, onDelete, onEpisode }) {
  const [expanded,   setExpanded]   = useState(false)
  const [confirming, setConfirming] = useState(false)

  const progress = anime.total_episodes
    ? Math.min(100, (anime.episode / anime.total_episodes) * 100)
    : null

  // Ep display — e.g. "12" or "12 / 24"
  const epLabel = anime.total_episodes
    ? `${anime.episode} / ${anime.total_episodes}`
    : `Ep ${anime.episode}`

  return (
    <div style={{
      borderBottom: '1px solid var(--border-light)',
      transition: 'background 0.1s',
    }}>
      {/* ── Main row ── */}
      <div
        onClick={() => setExpanded(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 16px', cursor: 'pointer',
          background: expanded ? 'var(--bg-hover)' : 'transparent',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Status dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: STATUSES[anime.status]?.color || 'var(--gray)',
        }} />

        {/* Name */}
        <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', minWidth: 0 }}>
          {anime.name}
        </span>

        {/* Progress bar (if total known) */}
        {progress !== null && (
          <div style={{ width: 80, height: 3, background: 'var(--border)', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        )}

        {/* Episode label */}
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 56, textAlign: 'right' }}>
          {epLabel}
        </span>

        {/* Quick ±1 episode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEpisode(anime.id, anime.episode - 1)}
            style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >−</button>
          <button
            onClick={() => onEpisode(anime.id, anime.episode + 1)}
            style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>

        {/* Chevron */}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ padding: '0 16px 14px 36px', background: 'var(--bg-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <StatusBadge status={anime.status} />
            {anime.link && (
              <a
                href={anime.link} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'underline' }}
                onClick={e => e.stopPropagation()}
              >
                Open stream ↗
              </a>
            )}
            {anime.notes && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{anime.notes}"
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="ghost" onClick={() => onEdit(anime)} style={{ padding: '5px 11px', fontSize: 12 }}>
              Edit
            </Btn>
            {confirming ? (
              <>
                <Btn variant="danger" onClick={() => onDelete(anime.id)} style={{ padding: '5px 11px', fontSize: 12 }}>
                  Confirm remove
                </Btn>
                <Btn variant="ghost" onClick={() => setConfirming(false)} style={{ padding: '5px 11px', fontSize: 12 }}>
                  Cancel
                </Btn>
              </>
            ) : (
              <Btn variant="ghost" onClick={() => setConfirming(true)} style={{ padding: '5px 11px', fontSize: 12, color: 'var(--red)' }}>
                Remove
              </Btn>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
              Added {new Date(anime.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ animes, activeNav, onNav, theme, onThemeToggle }) {
  const counts = {}
  UNFINISHED_STATUSES.forEach(s => { counts[s] = animes.filter(a => a.status === s).length })
  counts.all       = animes.filter(a => UNFINISHED_STATUSES.includes(a.status)).length
  counts.completed = animes.filter(a => a.status === 'completed').length

  const NavItem = ({ id, label, count }) => {
    const active = activeNav === id
    return (
      <button
        onClick={() => onNav(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: 'var(--radius-md)', border: 'none',
          background: active ? 'var(--bg-active)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: active ? 500 : 400,
          textAlign: 'left', cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <span>{label}</span>
        {count > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 18, textAlign: 'right' }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
      height: '100vh', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>AnimeVault</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Track your watchlist</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 10px 6px', textTransform: 'uppercase' }}>
          Active
        </p>
        {NAV.map(n => (
          <NavItem key={n.id} id={n.id} label={n.label} count={n.id === 'all' ? counts.all : counts[n.id] || 0} />
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />

        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 10px 6px', textTransform: 'uppercase' }}>
          Finished
        </p>
        <NavItem id="completed" label="Completed" count={counts.completed} />
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onThemeToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 13, padding: '4px 0',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 15 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          {animes.length} anime{animes.length !== 1 ? 's' : ''} saved
        </p>
      </div>
    </aside>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function MainContent({ animes, activeNav, onEdit, onDelete, onEpisode, onAdd, showForm, editingAnime, onFormSave, onFormCancel, saving }) {
  const [search, setSearch] = useState('')

  // Determine which statuses to show
  const navItem   = NAV.find(n => n.id === activeNav)
  const statuses  = navItem ? navItem.statuses : ['completed']
  const title     = navItem ? navItem.label : 'Completed'

  const list = animes
    .filter(a => statuses.includes(a.status))
    .filter(a => !search.trim() || a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'auto', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-main)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {list.length} {list.length === 1 ? 'title' : 'titles'}
            {search ? ' matching your search' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 180, padding: '6px 10px', fontSize: 13 }}
          />
          {activeNav !== 'completed' && (
            <Btn variant="primary" onClick={onAdd}>
              + Add anime
            </Btn>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 24 }}>
        {showForm && (
          <AnimeForm
            initial={editingAnime}
            onSave={onFormSave}
            onCancel={onFormCancel}
            loading={saving}
          />
        )}

        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>
              {activeNav === 'completed' ? '🎉' : '📺'}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {search
                ? 'No anime match your search'
                : activeNav === 'completed'
                  ? 'No completed anime yet'
                  : 'Nothing here yet — add your first anime'}
            </p>
            {!search && activeNav !== 'completed' && (
              <Btn variant="primary" onClick={onAdd} style={{ marginTop: 14 }}>+ Add anime</Btn>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {/* Column headers */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 16px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-hover)',
            }}>
              <span style={{ width: 8 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</span>
              <span style={{ width: 80, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }} />
              <span style={{ minWidth: 56, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Episode</span>
              <span style={{ width: 60 }} />
              <span style={{ width: 12 }} />
            </div>

            {list.map(anime => (
              <AnimeRow
                key={anime.id}
                anime={anime}
                onEdit={onEdit}
                onDelete={onDelete}
                onEpisode={onEpisode}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [animes,       setAnimes]       = useState([])
  const [activeNav,    setActiveNav]    = useState('all')
  const [showForm,     setShowForm]     = useState(false)
  const [editingAnime, setEditingAnime] = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState(null)
  const [theme,        setTheme]        = useState(() => localStorage.getItem('av-theme') || 'light')

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('av-theme', theme)
  }, [theme])

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Fetch animes on mount
  useEffect(() => {
    api.getAll()
      .then(setAnimes)
      .catch(() => showToast('Could not connect to backend. Is the server running?', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingAnime(null)
    setShowForm(true)
  }

  const handleEdit = (anime) => {
    // Convert DB row to form shape
    setEditingAnime({
      id:            anime.id,
      name:          anime.name,
      link:          anime.link || '',
      episode:       String(anime.episode),
      total_episodes: anime.total_episodes != null ? String(anime.total_episodes) : '',
      status:        anime.status,
      notes:         anime.notes || '',
    })
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAnime(null)
  }

  const handleFormSave = async (data) => {
    setSaving(true)
    try {
      if (editingAnime?.id) {
        const updated = await api.update(editingAnime.id, data)
        setAnimes(prev => prev.map(a => a.id === updated.id ? updated : a))
        showToast('Saved!')
      } else {
        const created = await api.create(data)
        setAnimes(prev => [created, ...prev])
        showToast('Added to vault!')
      }
      setShowForm(false)
      setEditingAnime(null)
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.remove(id)
      setAnimes(prev => prev.filter(a => a.id !== id))
      showToast('Removed', 'info')
    } catch (err) {
      showToast(err.message || 'Could not remove', 'error')
    }
  }

  const handleEpisode = async (id, newEp) => {
    // Optimistic update
    const prev = animes.find(a => a.id === id)
    if (!prev) return
    // Clamp on frontend too
    const clamped = Math.max(0, anime_clamp(newEp, prev.total_episodes))
    setAnimes(list => list.map(a => a.id === id ? { ...a, episode: clamped } : a))
    try {
      const updated = await api.patchEpisode(id, clamped)
      setAnimes(list => list.map(a => a.id === updated.id ? updated : a))
    } catch {
      // Roll back
      setAnimes(list => list.map(a => a.id === id ? prev : a))
      showToast('Could not update episode', 'error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        animes={animes}
        activeNav={activeNav}
        onNav={(id) => { setActiveNav(id); setShowForm(false); setEditingAnime(null) }}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />
      <MainContent
        animes={animes}
        activeNav={activeNav}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onEpisode={handleEpisode}
        onAdd={handleAdd}
        showForm={showForm}
        editingAnime={editingAnime}
        onFormSave={handleFormSave}
        onFormCancel={handleFormCancel}
        saving={saving}
      />
      <Toast toast={toast} />
    </div>
  )
}

// Helper: clamp episode within [0, total]
function anime_clamp(ep, total) {
  if (total != null && ep > total) return total
  return ep
}
