import { useState, useEffect, useCallback, useRef } from 'react'

// ─── SVG Icons (inline, no deps) ─────────────────────────────────────────────

function IconTV({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="16 21 16 17 8 17 8 21"/></svg>
}
function IconMovie({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="8" y1="2" x2="8" y2="22"/><line x1="16" y1="2" x2="16" y2="22"/><line x1="2" y1="8" x2="22" y2="8"/></svg>
}
function IconImage({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
}
function IconSun({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
}
function IconMoon({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}
function IconSparkle({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function IconEmpty({ size = 32 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function IconDot({ size = 6 }) {
  return <svg width={size} height={size} viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
}
function IconDownload({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function IconUpload({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}

// ─── Constants ───────────────────────────────────────────────────────────────
const API_URL = ''

const STATUSES = {
  watching: { label: 'Watching', color: 'var(--green)', bg: 'var(--green-bg)' },
  'plan-to-watch': { label: 'Plan to Watch', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'on-hold': { label: 'On Hold', color: 'var(--amber)', bg: 'var(--amber-bg)' },
  dropped: { label: 'Dropped', color: 'var(--red)', bg: 'var(--red-bg)' },
  completed: { label: 'Completed', color: 'var(--gray)', bg: 'var(--gray-bg)' },
}

const UNFINISHED_STATUSES = ['watching', 'plan-to-watch', 'on-hold', 'dropped']

const SEASON_STATUSES = {
  watching: { label: 'Watching', color: 'var(--green)', bg: 'var(--green-bg)' },
  completed: { label: 'Completed', color: 'var(--gray)', bg: 'var(--gray-bg)' },
  'plan-to-watch': { label: 'Plan to Watch', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  'on-hold': { label: 'On Hold', color: 'var(--amber)', bg: 'var(--amber-bg)' },
  dropped: { label: 'Dropped', color: 'var(--red)', bg: 'var(--red-bg)' },
}

const NAV = [
  { id: 'all', label: 'All Active', statuses: UNFINISHED_STATUSES },
  { id: 'watching', label: 'Watching', statuses: ['watching'] },
  { id: 'plan-to-watch', label: 'Plan to Watch', statuses: ['plan-to-watch'] },
  { id: 'on-hold', label: 'On Hold', statuses: ['on-hold'] },
  { id: 'dropped', label: 'Dropped', statuses: ['dropped'] },
]

const BLANK = { name: '', link: '', episode: '1', total_episodes: '', status: 'watching', notes: '', image: null, imageFile: null, type: 'tv', current_season: 1, seasons: [{ season_number: 1, episode_count: '', link: '', season_status: 'watching', current_episode: '1' }] }

// ─── API helpers (updated for multipart form data) ─────────────────────────

async function apiFetchWithImage(path, method, data, imageFile) {
  const formData = new FormData()
  formData.append('data', JSON.stringify(data))
  if (imageFile) formData.append('image', imageFile)

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    body: formData,
  })
  const responseData = await res.json()
  if (!res.ok) throw new Error((responseData.errors || [responseData.error]).join(', '))
  return responseData
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data.errors || [data.error]).join(', '))
  return data
}

const api = {
  getAll: () => apiFetch('/animes'),
  create: (data, image) => apiFetchWithImage('/animes', 'POST', data, image),
  update: (id, data, image, keepImage) => apiFetchWithImage(`/animes/${id}`, 'PUT', { ...data, image_keep: keepImage }, image),
  patchEpisode: (id, ep, season, seasonStatus) => {
    const body = { episode: ep, current_season: season }
    if (seasonStatus) body.season_status = seasonStatus
    return apiFetch(`/animes/${id}/episode`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  patchSeasonStatus: (id, seasonNumber, status) => apiFetch(`/animes/${id}/season-status`, { method: 'PATCH', body: JSON.stringify({ season_number: seasonNumber, status }) }),
  patchStatus: (id, status) => apiFetch(`/animes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id) => apiFetch(`/animes/${id}`, { method: 'DELETE' }),
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
    error: { bg: 'var(--red-bg)', border: 'var(--red)', color: 'var(--red)' },
    info: { bg: 'var(--blue-bg)', border: 'var(--blue)', color: 'var(--blue)' },
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
    transition: 'background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s var(--ease-spring)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  }
  const variants = {
    default: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid transparent' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'scale(1.02)' } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.transform = 'scale(1)' } }}
    >
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
  width: '100%', padding: '7px 10px',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  fontSize: 14, height: 38, outline: 'none', transition: 'border-color 0.15s',
}

// ─── AnimeForm (updated with seasons) ──────────────────────────────────────

function AnimeForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || BLANK)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    setForm(initial || BLANK)
    setErrors({})
    setImageFile(null)
    if (initial?.image) {
      setImagePreview(`${API_URL}/uploads/${initial.image}`)
    } else {
      setImagePreview(null)
    }
  }, [initial])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  const updateSeason = (index, field, value) => {
    setForm(f => {
      const seasons = [...f.seasons]
      seasons[index] = { ...seasons[index], [field]: value }
      // Auto-update season_number if the first season's number field changes
      return { ...f, seasons }
    })
  }

  const addSeason = () => {
    setForm(f => ({
      ...f,
      seasons: [...f.seasons, { season_number: f.seasons.length + 1, episode_count: '', link: '' }],
    }))
  }

  const removeSeason = (index) => {
    setForm(f => {
      const seasons = f.seasons.filter((_, i) => i !== index)
      // Re-number seasons
      return { ...f, seasons: seasons.map((s, i) => ({ ...s, season_number: i + 1 })) }
    })
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.episode === '' || isNaN(form.episode)) e.episode = 'Must be a number'
    if (Number(form.episode) < 1) e.episode = 'Minimum is 1'
    if (form.total_episodes !== '') {
      if (isNaN(form.total_episodes) || Number(form.total_episodes) < 1)
        e.total_episodes = 'Must be a positive number'
    }
    // Validate each season
    form.seasons.forEach((s, i) => {
      if (s.episode_count !== '' && (isNaN(s.episode_count) || Number(s.episode_count) < 1)) {
        e[`season_${i}_count`] = `Season ${s.season_number}: must be a positive number`
      }
    })
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const isMovie = form.type === 'movie'
    const seasons = isMovie
      ? [{ season_number: 1, episode_count: 1, link: form.link.trim() }]
      : form.seasons.map(s => ({
          season_number: Number(s.season_number),
          episode_count: s.episode_count !== '' ? Number(s.episode_count) : null,
          link: s.link.trim(),
          season_status: s.season_status || 'watching',
          current_episode: s.current_episode != null ? Number(s.current_episode) : 1,
        }))

    // Compute total_episodes from seasons if all have counts
    let total = null
    const allHaveCounts = seasons.every(s => s.episode_count !== null)
    if (allHaveCounts) total = seasons.reduce((sum, s) => sum + s.episode_count, 0)

    onSave({
      name: form.name.trim(),
      link: form.link.trim(),
      type: isMovie ? 'movie' : 'tv',
      episode: isMovie ? 1 : Number(form.episode),
      current_season: isMovie ? 1 : (Number(form.current_season) || 1),
      total_episodes: isMovie ? 1 : total,
      status: form.status,
      notes: form.notes.trim(),
      seasons,
      keepImage: initial?.image && !imageFile,
    }, imageFile)
  }

  const isMovie = form.type === 'movie'

  return (
    <div style={{
      maxWidth: 620, width: '100%', margin: '0 auto',
      background: 'var(--bg-main)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      animation: 'formFadeIn 0.35s ease',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {initial?.id ? 'Edit anime' : 'Add anime'}
        </span>
        <button
          onClick={onCancel}
          style={{
            background: 'none', border: 'none', fontSize: 20,
            color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1,
            padding: 0,
          }}
        >×</button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 1. Name */}
        <div>
          <Field label="Name *" error={errors.name}>
            <input style={inputStyle} placeholder="e.g. Fullmetal Alchemist" value={form.name} onChange={set('name')} />
          </Field>
        </div>

        {/* 2. Type */}
        <div>
          <Field label="Type">
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'tv', seasons: f.seasons.length ? f.seasons : [{ season_number: 1, episode_count: '', link: '' }] }))}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 6, height: 34,
                  border: isMovie ? '1px solid var(--border)' : '1px solid var(--accent)',
                  background: isMovie ? 'var(--bg-input)' : 'var(--accent-light)',
                  color: isMovie ? 'var(--text-secondary)' : 'var(--accent)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                }}
              >
                <IconTV size={14} /> TV Series
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'movie', episode: '1', seasons: [] }))}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 6, height: 34,
                  border: isMovie ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isMovie ? 'var(--accent-light)' : 'var(--bg-input)',
                  color: isMovie ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                }}
              >
                <IconMovie size={14} /> Movie
              </button>
            </div>
          </Field>
        </div>

        {/* 3. Cover image */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ width: 130, flexShrink: 0 }}>
            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: 8, aspectRatio: '2/3', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--red)', color: 'white',
                    border: 'none', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ) : (
              <div style={{
                width: '100%', aspectRatio: '2/3',
                borderRadius: 8, border: '2px dashed var(--border)',
                background: 'var(--bg-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: 'var(--text-muted)',
              }}><IconImage size={28} /></div>
            )}
          </div>
          <div style={{ flex: 1, paddingTop: 10 }}>
            <Field label="Cover image">
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                style={{ ...inputStyle, padding: '5px 10px', fontSize: 12, height: 36 }}
              />
            </Field>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Recommended: 2:3 aspect ratio (e.g., 400x600px)
            </p>
          </div>
        </div>

        {/* 4. Status / Link */}
        {isMovie && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={set('status')}>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Streaming link">
              <input style={inputStyle} placeholder="https://..." value={form.link} onChange={set('link')} />
            </Field>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border-light)' }} />

        {/* 5. Seasons (TV) */}
        {!isMovie && (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Seasons
                </span>
                <Btn onClick={addSeason} variant="ghost" style={{ padding: '3px 10px', fontSize: 12 }}>
                  + Add season
                </Btn>
              </div>
              {form.seasons.map((s, i) => (
                <div key={i} style={{
                  background: 'var(--bg-hover)', borderRadius: 8, padding: 12,
                  marginBottom: 8, border: '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Season {s.season_number}
                    </span>
                    {form.seasons.length > 1 && (
                      <button
                        onClick={() => removeSeason(i)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--red)', fontSize: 12, cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <Field label="Status">
                      <select
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, height: 32 }}
                        value={s.season_status || 'watching'}
                        onChange={e => updateSeason(i, 'season_status', e.target.value)}
                      >
                        {Object.entries(SEASON_STATUSES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Episodes" error={errors[`season_${i}_count`]}>
                      <input
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, height: 32 }}
                        type="number" min="1" placeholder="Count"
                        value={s.episode_count}
                        onChange={e => updateSeason(i, 'episode_count', e.target.value)}
                      />
                    </Field>
                    <Field label="Link">
                      <input
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, height: 32 }}
                        placeholder="https://..."
                        value={s.link}
                        onChange={e => updateSeason(i, 'link', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              {form.seasons.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>
                  No seasons yet. Click "+ Add season" to add one.
                </p>
              )}
            </div>

            {/* 6. Current season + Episode */}
            {form.seasons.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Current season">
                  <select style={inputStyle} value={form.current_season} onChange={e => {
                    const newSeason = Number(e.target.value)
                    setForm(f => {
                      const season = f.seasons.find(s => s.season_number === newSeason)
                      return { ...f, current_season: newSeason, episode: season?.current_episode || '1' }
                    })
                  }}>
                    {form.seasons.map((s, i) => (
                      <option key={i} value={s.season_number}>Season {s.season_number}{s.episode_count ? ` (${s.episode_count} ep)` : ''}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Episode *" error={errors.episode}>
                  <input style={inputStyle} type="number" min="0" placeholder="0" value={form.episode} onChange={set('episode')} />
                </Field>
              </div>
            )}
            {form.seasons.length === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Current episode *" error={errors.episode}>
                  <input style={inputStyle} type="number" min="0" placeholder="0" value={form.episode} onChange={set('episode')} />
                </Field>
                <Field label="Total episodes" error={errors.total_episodes}>
                  <input style={inputStyle} type="number" min="1" placeholder="Leave blank if unknown" value={form.total_episodes} onChange={set('total_episodes')} />
                </Field>
              </div>
            )}
          </>
        )}

        {/* Movie info */}
        {isMovie && (
          <div style={{
            background: 'var(--bg-hover)', borderRadius: 8, padding: 12,
            border: '1px solid var(--border-light)',
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <IconMovie size={20} /> A movie is tracked as a single entry. Set status to "Completed" when you've watched it.
            </p>
          </div>
        )}

        {/* 7. Notes */}
        <div>
          <Field label="Notes">
            <input style={inputStyle} placeholder="Optional notes" value={form.notes} onChange={set('notes')} />
          </Field>
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        display: 'flex', gap: 10,
        padding: '14px 20px 18px',
        borderTop: '1px solid var(--border-light)',
      }}>
        <Btn variant="primary" onClick={handleSave} disabled={loading} style={{ flex: 1, justifyContent: 'center', height: 36 }}>
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Add to vault'}
        </Btn>
        <Btn variant="ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center', height: 36 }}>
          Cancel
        </Btn>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeProgress(anime) {
  if (anime.type === 'movie') {
    return anime.status === 'completed' ? 100 : 0
  }
  const seasons = anime.seasons || []
  if (seasons.length === 0) {
    return anime.total_episodes
      ? Math.min(100, (anime.episode / anime.total_episodes) * 100)
      : null
  }
  const totalEpisodes = seasons.reduce((s, s2) => s + (s2.episode_count || 0), 0)
  if (!totalEpisodes) return null
  const watchedBefore = seasons
    .filter(s => s.season_number < (anime.current_season || 1))
    .reduce((s, s2) => s + Number(s2.current_episode || s2.episode_count || 0), 0)
  const totalWatched = watchedBefore + Number(anime.episode || 0)
  return Math.min(100, (totalWatched / totalEpisodes) * 100)
}

function seasonProgress(season) {
  if (!season?.episode_count) return null
  const ep = Number(season.current_episode || 0)
  return Math.min(100, (ep / Number(season.episode_count)) * 100)
}

function deriveAnimeStatus(seasons) {
  seasons = seasons || []
  const sorted = [...seasons].sort((a, b) => a.season_number - b.season_number)
  const firstUncompleted = sorted.find(s => s.season_status !== 'completed')
  return firstUncompleted ? (firstUncompleted.season_status || 'watching') : 'completed'
}

function getCurrentSeason(anime) {
  if (anime.type === 'movie') return null
  const seasons = anime.seasons || []
  return seasons.find(s => s.season_number === (anime.current_season || 1)) || null
}

function getLink(anime) {
  const season = getCurrentSeason(anime)
  return season?.link || anime.link || ''
}

function getEpLabel(anime) {
  if (anime.type === 'movie') return 'Movie'
  const seasons = anime.seasons || []
  if (seasons.length === 0) {
    return anime.total_episodes
      ? `${anime.episode} / ${anime.total_episodes}`
      : `Ep ${anime.episode}`
  }
  const totalInSeason = seasons.find(s => s.season_number === (anime.current_season || 1))?.episode_count
  if (totalInSeason) {
    return `S${anime.current_season || 1} · ${anime.episode} / ${totalInSeason}`
  }
  return `S${anime.current_season || 1} · Ep ${anime.episode}`
}

// ─── AnimeCard (grid view with seasons) ────────────────────────────────────

function AnimeCard({ anime, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const isMovie = anime.type === 'movie'
  const currentSeason = getCurrentSeason(anime)
  const cardProgress = isMovie
    ? (anime.status === 'completed' ? 100 : 0)
    : currentSeason
      ? seasonProgress(currentSeason)
      : computeProgress(anime)
  const epLabel = getEpLabel(anime)
  const link = getLink(anime)

  const imageUrl = anime.image ? `${API_URL}/uploads/${anime.image}` : null

  return (
    <div
      onClick={() => onClick(anime)}
      style={{
        background: 'var(--bg-main)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform 0.25s var(--ease-spring), box-shadow 0.25s var(--ease-spring), border-color 0.25s',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
        e.currentTarget.style.borderColor = 'var(--accent-border)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <div style={{
        position: 'relative',
        aspectRatio: '2/3',
        background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-active) 100%)',
        overflow: 'hidden',
      }}>
        {imageUrl ? (
          <>
            {!imageLoaded && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)' }}><IconImage size={24} /></div>}
            <img
              src={imageUrl}
              alt={anime.name}
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: imageLoaded ? 'block' : 'none',
              }}
            />
          </>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--text-muted)',
          }}>
            <IconMovie size={32} />
          </div>
        )}

        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <StatusBadge status={anime.status} />
        </div>

        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 500, color: 'white',
        }}>
          {isMovie ? <><IconMovie size={12} /> Movie</> : epLabel}
        </div>
      </div>

      <div style={{ padding: '12px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {anime.name}
        </h3>

        {cardProgress !== null && (
          <div style={{ width: '100%', height: 4, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${cardProgress}%`,
              background: cardProgress === 100 ? 'var(--green)' : 'var(--accent)',
              borderRadius: 99, transition: 'width 0.4s var(--ease-spring)',
            }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AnimeModal (detail overlay) ─────────────────────────────────────────────

function AnimeModal({ anime, onClose, onEdit, onDelete, onEpisode, onSeasonStatus, onAnimeStatus }) {
  const [confirming, setConfirming] = useState(false)
  const isMovie = anime.type === 'movie'
  const seasons = anime.seasons || []
  const link = getLink(anime)
  const imageUrl = anime.image ? `${API_URL}/uploads/${anime.image}` : null

  const totalWatched = seasons.length
    ? seasons.filter(s => s.season_number < (anime.current_season || 1)).reduce((s, s2) => s + Number(s2.current_episode || s2.episode_count || 0), 0) + Number(anime.episode || 0)
    : Number(anime.episode || 0)
  const totalEpisodes = seasons.length
    ? seasons.reduce((s, s2) => s + (s2.episode_count || 0), 0)
    : (anime.total_episodes || null)
  const label = getEpLabel(anime)
  const progress = computeProgress(anime)

  const handleEpisode = (delta) => {
    const curSeason = seasons.find(s => s.season_number === (anime.current_season || 1))
    const maxEp = curSeason?.episode_count
    let newEp = Number(anime.episode) + delta
    if (maxEp != null) { if (newEp < 1) newEp = 1; else if (newEp > maxEp) newEp = maxEp }
    else if (newEp < 1) newEp = 1
    onEpisode(anime.id, newEp, anime.current_season || 1)
  }

  const handlePrevSeason = () => {
    const cs = anime.current_season || 1
    if (cs > 1) {
      const prev = seasons.find(s => s.season_number === cs - 1)
      onEpisode(anime.id, prev?.current_episode || 1, cs - 1)
    }
  }

  const handleNextSeason = () => {
    const cs = anime.current_season || 1
    if (cs < seasons.length) {
      const next = seasons.find(s => s.season_number === cs + 1)
      onEpisode(anime.id, next?.current_episode || 1, cs + 1)
    }
  }

  const divider = { height: 1, background: 'var(--border-light)', margin: '0 -28px' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
        }}
      />

      <div style={{
        position: 'relative',
        background: 'var(--bg-main)',
        borderRadius: 16,
        maxWidth: 720, width: '100%',
        maxHeight: '88vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* ── Close ── */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 1,
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-hover)', border: 'none',
            fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >×</button>

        {/* ── Header ── */}
        <div style={{ display: 'flex', gap: 24, padding: 28, paddingBottom: 18 }}>
          {imageUrl ? (
            <div style={{ width: 150, flexShrink: 0 }}>
              <img
                src={imageUrl}
                alt={anime.name}
                style={{ width: '100%', borderRadius: 10, aspectRatio: '2/3', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{
              width: 150, flexShrink: 0, aspectRatio: '2/3',
              background: 'var(--bg-hover)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, color: 'var(--text-muted)',
            }}>
              <IconMovie size={32} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
                {anime.name}
              </h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <StatusBadge status={anime.status} />
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  background: 'var(--bg-hover)', padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)', fontWeight: 500,
                }}>
                  {isMovie ? <><IconMovie size={14} /> Movie</> : <><IconTV size={14} /> TV</>}
                </span>
              </div>
            </div>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', marginTop: 12,
                  background: 'var(--accent)', color: '#fff',
                  borderRadius: 8, fontSize: 14, fontWeight: 500,
                  textDecoration: 'none', alignSelf: 'flex-start',
                  transition: 'opacity 0.2s, transform 0.2s var(--ease-spring)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.03)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                ▶ Watch
              </a>
            )}
          </div>
        </div>

        <div style={divider} />

        {/* ── Body ── */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Notes */}
          {anime.notes && (
            <div style={{
              background: 'var(--accent-light)', borderRadius: 10, padding: 14,
              fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
              border: '1px solid var(--accent-border)',
            }}>
              {anime.notes}
            </div>
          )}

          {/* Seasons (TV) */}
          {!isMovie && seasons.length > 0 && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 8, paddingLeft: 2,
              }}>
                Seasons
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {seasons.map(s => {
                  const sStatus = SEASON_STATUSES[s.season_status] || SEASON_STATUSES.watching
                  const isCurrent = s.season_number === (anime.current_season || 1)
                  const isComplete = s.season_status === 'completed'
                  const maxEp = s.episode_count || anime.total_episodes || 12
                  const isMaxed = isCurrent && Number(anime.episode) >= maxEp
                  const seasonLink = s.link || (seasons.length === 1 ? anime.link : '')
                  return (
                    <div key={s.season_number} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: isCurrent ? 'var(--accent-light)' : 'var(--bg-hover)',
                      borderRadius: 10, padding: '10px 14px',
                      border: isCurrent ? '1px solid var(--accent-border)' : '1px solid transparent',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', minWidth: 0, flex: 1 }}>
                        Season {s.season_number}
                        {(() => {
                          const sMax = s.episode_count || 12
                          const sEp = Number(s.current_episode || (isCurrent ? anime.episode : 1))
                          return <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                            · Ep {Math.min(sEp, sMax)}/{sMax}
                          </span>
                        })()}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 500, color: sStatus.color,
                        background: sStatus.bg, padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                      }}>
                        {isComplete && <span style={{ fontSize: 10 }}>✓</span>}
                        {sStatus.label}
                      </span>
                      {isMaxed && !isComplete && (
                        <button
                          onClick={() => onSeasonStatus(anime.id, s.season_number, 'completed')}
                          style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ✓ Complete
                        </button>
                      )}
                      {seasonLink && (
                        <a
                          href={seasonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 13, color: 'var(--accent)',
                            textDecoration: 'none', fontWeight: 600,
                            whiteSpace: 'nowrap', padding: '5px 8px',
                            borderRadius: 6, transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Watch ↗
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Movie info */}
          {isMovie && (
            <div style={{
              background: 'var(--bg-hover)', borderRadius: 10, padding: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <IconMovie size={28} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>Movie</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {anime.status === 'completed' ? 'Watched' : 'Not yet watched'}
                </p>
              </div>
              {anime.status !== 'completed' && (
                <button
                  onClick={() => onAnimeStatus(anime.id, 'completed')}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--green-bg)', color: 'var(--green)',
                    border: '1px solid var(--green)', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)' }}
                >
                  ✓ Watched
                </button>
              )}
            </div>
          )}

          {/* Progress */}
          <div style={{
            border: '1px solid var(--border-light)', borderRadius: 12, padding: 18,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 12,
            }}>
              Progress
            </p>

            {!isMovie && seasons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {seasons.map(s => {
                  const sp = seasonProgress(s)
                  const sEp = Number(s.current_episode || (s.season_number === (anime.current_season || 1) ? anime.episode : 0))
                  const sMax = s.episode_count || 12
                  return (
                    <div key={s.season_number}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Season {s.season_number} · Ep {Math.min(sEp, sMax)}/{sMax}
                        </span>
                        {sp !== null && (
                          <span style={{ fontSize: 11, color: sp === 100 ? 'var(--green)' : 'var(--text-muted)' }}>
                            {Math.round(sp)}%
                          </span>
                        )}
                      </div>
                      {sp !== null && (
                        <div style={{ width: '100%', height: 4, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${sp}%`,
                            background: sp === 100 ? 'var(--green)' : 'var(--accent)',
                            borderRadius: 99, transition: 'width 0.4s var(--ease-spring)',
                          }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              progress !== null && (
                <div style={{ width: '100%', height: 6, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: progress === 100 ? 'var(--green)' : 'var(--accent)',
                    borderRadius: 99, transition: 'width 0.4s var(--ease-spring)',
                  }} />
                </div>
              )
            )}

            {!isMovie && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={() => handleEpisode(-1)}
                    style={{
                      width: 36, height: 36,
                      border: '1px solid var(--border)', borderRadius: 10,
                      background: 'var(--bg-main)', color: 'var(--text-secondary)',
                      fontSize: 18, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >−</button>
                  <span style={{
                    flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                    textAlign: 'center', background: 'var(--bg-hover)',
                    padding: '7px 0', borderRadius: 10, border: '1px solid var(--border-light)',
                  }}>
                    Ep {anime.episode}
                  </span>
                  <button
                    onClick={() => handleEpisode(1)}
                    style={{
                      width: 36, height: 36,
                      border: '1px solid var(--border)', borderRadius: 10,
                      background: 'var(--bg-main)', color: 'var(--text-secondary)',
                      fontSize: 18, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >+</button>
                </div>
                {seasons.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <button
                      onClick={handlePrevSeason}
                      disabled={(anime.current_season || 1) <= 1}
                      style={{
                        background: 'var(--bg-main)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '5px 12px',
                        fontSize: 13, cursor: (anime.current_season || 1) > 1 ? 'pointer' : 'default',
                        opacity: (anime.current_season || 1) > 1 ? 1 : 0.3,
                        color: 'var(--text-secondary)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { if ((anime.current_season || 1) > 1) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent-border)' } }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >‹ Prev</button>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                      S{anime.current_season || 1} of {seasons.length}
                    </span>
                    <button
                      onClick={handleNextSeason}
                      disabled={(anime.current_season || 1) >= seasons.length}
                      style={{
                        background: 'var(--bg-main)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '5px 12px',
                        fontSize: 13, cursor: (anime.current_season || 1) < seasons.length ? 'pointer' : 'default',
                        opacity: (anime.current_season || 1) < seasons.length ? 1 : 0.3,
                        color: 'var(--text-secondary)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { if ((anime.current_season || 1) < seasons.length) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent-border)' } }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >Next ›</button>
                  </div>
                )}
              </>
            )}

            {anime.status !== 'completed' && (
              <div style={{ marginTop: 4 }}>
                {isMovie ? (
                  <button
                    onClick={() => onAnimeStatus(anime.id, 'completed')}
                    style={{
                      width: '100%', padding: '9px 0',
                      background: 'var(--green-bg)', color: 'var(--green)',
                      border: '1px solid var(--green)', borderRadius: 10,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)' }}
                  >
                    ✓ Mark as watched
                  </button>
                ) : (
                  (() => {
                    const curSeason = seasons.find(s => s.season_number === (anime.current_season || 1))
                    const maxEp = curSeason?.episode_count || anime.total_episodes || 12
                    const atMax = Number(anime.episode) >= maxEp
                    const isLastSeason = (anime.current_season || 1) >= seasons.length
                    if (atMax && isLastSeason) {
                      return (
                        <button
                          onClick={() => onAnimeStatus(anime.id, 'completed')}
                          style={{
                            width: '100%', padding: '9px 0',
                            background: 'var(--green-bg)', color: 'var(--green)',
                            border: '1px solid var(--green)', borderRadius: 10,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)' }}
                        >
                          ✓ Complete anime
                        </button>
                      )
                    }
                    return null
                  })()
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="primary" onClick={() => { onClose(); onEdit(anime) }} style={{ flex: 1, justifyContent: 'center', padding: '9px 14px' }}>
              Edit
            </Btn>
            {confirming ? (
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                <Btn variant="danger" onClick={() => { onClose(); onDelete(anime.id) }} style={{ flex: 1, justifyContent: 'center', padding: '9px 14px' }}>
                  Confirm
                </Btn>
                <Btn variant="ghost" onClick={() => setConfirming(false)} style={{ flex: 1, justifyContent: 'center', padding: '9px 14px' }}>
                  Cancel
                </Btn>
              </div>
            ) : (
              <Btn variant="ghost" onClick={() => setConfirming(true)} style={{ flex: 1, justifyContent: 'center', padding: '9px 14px', color: 'var(--red)' }}>
                Delete
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar (unchanged) ─────────────────────────────────────────────────────

function Sidebar({ animes, activeNav, onNav, theme, onThemeToggle, onExport, onImport }) {
  const counts = {}
  UNFINISHED_STATUSES.forEach(s => { counts[s] = animes.filter(a => a.status === s).length })
  counts.all = animes.filter(a => UNFINISHED_STATUSES.includes(a.status)).length
  counts.completed = animes.filter(a => a.status === 'completed').length
  const importRef = useRef(null)

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
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
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
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>AnimeVault</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Track your watchlist</p>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 10px 8px', textTransform: 'uppercase' }}>
          Active
        </p>
        {NAV.map(n => (
          <NavItem key={n.id} id={n.id} label={n.label} count={n.id === 'all' ? counts.all : counts[n.id] || 0} />
        ))}

        <div style={{ height: 1, background: 'var(--border-light)', margin: '10px 10px' }} />

        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 10px 8px', textTransform: 'uppercase' }}>
          Finished
        </p>
        <NavItem id="completed" label="Completed" count={counts.completed} />
      </nav>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onThemeToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 12, padding: '6px 8px',
            width: '100%', borderRadius: 'var(--radius-sm)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px', marginTop: 2 }}>
          {animes.length} anime{animes.length !== 1 ? 's' : ''}
        </p>

        <div style={{ height: 1, background: 'var(--border-light)', margin: '6px 8px' }} />

        <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 8px 6px', textTransform: 'uppercase' }}>
          Data
        </p>

        <input ref={importRef} type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
          <button onClick={onExport} style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '6px 8px', fontSize: 11, fontWeight: 500,
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <IconDownload size={12} /> Export
          </button>
          <button onClick={() => importRef.current?.click()} style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '6px 8px', fontSize: 11, fontWeight: 500,
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <IconUpload size={12} /> Import
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── MainContent (updated to grid view) ─────────────────────────────────────

function MainContent({ animes, activeNav, onEdit, onDelete, onEpisode, onAdd, onCardClick }) {
  const [search, setSearch] = useState('')

  const navItem = NAV.find(n => n.id === activeNav)
  const statuses = navItem ? navItem.statuses : ['completed']
  const title = navItem ? navItem.label : 'Completed'
  const isCompletedView = activeNav === 'completed'

  const list = animes
    .filter(a => statuses.includes(a.status))
    .filter(a => !search.trim() || a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'auto', background: 'var(--bg-page)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-main)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{title}</h1>
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
          {!isCompletedView && (
            <Btn variant="primary" onClick={onAdd}>
              + Add anime
            </Btn>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: 24 }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>
              {isCompletedView ? <IconSparkle size={32} /> : <IconTV size={32} />}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {search
                ? 'No anime match your search'
                : isCompletedView
                  ? 'No completed anime yet'
                  : 'Nothing here yet — add your first anime'}
            </p>
            {!search && !isCompletedView && (
              <Btn variant="primary" onClick={onAdd} style={{ marginTop: 14 }}>+ Add anime</Btn>
            )}
          </div>
        ) : isCompletedView ? (
          // Completed view as list
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {list.map(anime => (
              <CompletedRow
                key={anime.id}
                anime={anime}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          // Active view as card grid
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))',
            gap: 20,
            justifyContent: 'center',
          }}>
            {list.map(anime => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

// Completed view row component
function CompletedRow({ anime, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const label = getEpLabel(anime)
  const isMovie = anime.type === 'movie'

  const progress = computeProgress(anime)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-light)',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 40, height: 56, background: 'var(--bg-hover)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
        {anime.image ? (
          <img src={`/uploads/${anime.image}`} alt={anime.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><IconMovie size={20} /></div>
        )}
      </div>
      <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
        {anime.name}
      </span>
      {progress !== null && (
        <div style={{ width: 120, height: 4, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--green), var(--green))',
            borderRadius: 99,
          }} />
        </div>
      )}
      {isMovie && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>Movie</span>}
      <StatusBadge status={anime.status} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80, textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="ghost" onClick={() => onEdit(anime)} style={{ padding: '4px 10px', fontSize: 12 }}>
          Edit
        </Btn>
        {confirming ? (
          <>
            <Btn variant="danger" onClick={() => onDelete(anime.id)} style={{ padding: '4px 10px', fontSize: 12 }}>
              Confirm
            </Btn>
            <Btn variant="ghost" onClick={() => setConfirming(false)} style={{ padding: '4px 10px', fontSize: 12 }}>
              Cancel
            </Btn>
          </>
        ) : (
          <Btn variant="ghost" onClick={() => setConfirming(true)} style={{ padding: '4px 10px', fontSize: 12, color: 'var(--red)' }}>
            Remove
          </Btn>
        )}
      </div>
    </div>
  )
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [animes, setAnimes] = useState([])
  const [activeNav, setActiveNav] = useState('all')
  const [viewState, setViewState] = useState('cards') // 'cards' | 'cards-leaving' | 'form-entering' | 'form' | 'form-leaving' | 'cards-entering'
  const [editingAnime, setEditingAnime] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('av-theme') || 'light')

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('av-theme', theme)
  }, [theme])

  // View transition animation sequencing
  useEffect(() => {
    if (viewState === 'cards-leaving') {
      const t = setTimeout(() => setViewState('form-entering'), 350)
      return () => clearTimeout(t)
    }
    if (viewState === 'form-entering') {
      const t = setTimeout(() => setViewState('form'), 350)
      return () => clearTimeout(t)
    }
    if (viewState === 'form-leaving') {
      const t = setTimeout(() => setViewState('cards-entering'), 350)
      return () => clearTimeout(t)
    }
    if (viewState === 'cards-entering') {
      const t = setTimeout(() => setViewState('cards'), 350)
      return () => clearTimeout(t)
    }
  }, [viewState])

  // Clear editing state when cards view is fully shown
  useEffect(() => {
    if (viewState === 'cards') setEditingAnime(null)
  }, [viewState])

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

  const [modalAnimeId, setModalAnimeId] = useState(null)
  const modalAnime = animes.find(a => a.id === modalAnimeId) || null

  const handleCardClick = (anime) => setModalAnimeId(anime.id)
  const handleModalClose = () => setModalAnimeId(null)

  const handleAdd = () => {
    if (viewState !== 'cards') return
    setEditingAnime(null)
    setViewState('cards-leaving')
  }

  const handleEdit = (anime) => {
    if (viewState !== 'cards') return
    const isMovie = anime.type === 'movie'
    setEditingAnime({
      id: anime.id,
      name: anime.name,
      link: anime.link || '',
      type: isMovie ? 'movie' : (anime.type || 'tv'),
      episode: isMovie ? '0' : String(anime.episode),
      total_episodes: isMovie ? '' : (anime.total_episodes != null ? String(anime.total_episodes) : ''),
      current_season: isMovie ? 1 : (anime.current_season || 1),
      status: anime.status,
      notes: anime.notes || '',
      image: anime.image || null,
      imageFile: null,
      seasons: isMovie
        ? []
        : (anime.seasons || []).length > 0
          ? (anime.seasons || []).map(s => ({
              season_number: s.season_number,
              episode_count: s.episode_count != null ? String(s.episode_count) : '',
              link: s.link || '',
              season_status: s.season_status || 'watching',
              current_episode: String(s.current_episode || 1),
            }))
          : [{ season_number: 1, episode_count: anime.total_episodes != null ? String(anime.total_episodes) : '', link: anime.link || '', season_status: 'watching', current_episode: '1' }],
    })
    setViewState('cards-leaving')
  }

  const handleFormCancel = () => {
    setViewState('form-leaving')
  }

  const handleFormSave = async (data, imageFile) => {
    setSaving(true)
    try {
      const payload = { ...data }
      if (data.seasons && data.seasons.length) {
        payload.seasons = data.seasons
        payload.status = deriveAnimeStatus(data.seasons)
      }
      if (editingAnime?.id) {
        const updated = await api.update(editingAnime.id, payload, imageFile, data.keepImage)
        setAnimes(prev => prev.map(a => a.id === updated.id ? updated : a))
        showToast('Saved!')
      } else {
        const created = await api.create(payload, imageFile)
        setAnimes(prev => [created, ...prev])
        showToast('Added to vault!')
      }
      setViewState('cards')
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

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/backup/export`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Export failed')
      const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `animevault_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Backup downloaded!')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('backup', file)
      const res = await fetch(`${API_URL}/api/backup/import`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setAnimes(data)
      showToast(`Imported ${data.length} anime!`)
    } catch (err) {
      showToast(err.message, 'error')
    }
    e.target.value = ''
  }

  const handleSeasonStatus = useCallback(async (id, seasonNumber, status) => {
    const prev = animes.find(a => a.id === id)
    if (!prev) return
    const updatedSeasons = (prev.seasons || []).map(s =>
      s.season_number === seasonNumber ? { ...s, season_status: status } : s
    )
    const newStatus = deriveAnimeStatus(updatedSeasons)
    setAnimes(list => list.map(a => a.id === id ? {
      ...a, status: newStatus, seasons: updatedSeasons,
    } : a))
    try {
      const updated = await api.patchSeasonStatus(id, seasonNumber, status)
      setAnimes(list => list.map(a => a.id === updated.id ? updated : a))
    } catch {
      setAnimes(list => list.map(a => a.id === id ? prev : a))
      showToast('Could not update season status', 'error')
    }
  }, [animes, showToast])

  const handleAnimeStatus = useCallback(async (id, status) => {
    const prev = animes.find(a => a.id === id)
    if (!prev) return
    setAnimes(list => list.map(a => a.id === id ? { ...a, status } : a))
    try {
      const updated = await api.patchStatus(id, status)
      setAnimes(list => list.map(a => a.id === updated.id ? updated : a))
    } catch {
      setAnimes(list => list.map(a => a.id === id ? prev : a))
      showToast('Could not update anime status', 'error')
    }
  }, [animes, showToast])

  const handleEpisode = async (id, newEp, newSeason) => {
    const prev = animes.find(a => a.id === id)
    if (!prev) return
    const seasons = prev.seasons || []
    let ep = newEp
    let season = newSeason !== undefined ? newSeason : (prev.current_season || 1)

    const curSeason = seasons.find(s => s.season_number === season)
    const maxEp = curSeason?.episode_count
    if (maxEp != null) {
      if (ep < 1) { ep = 1 } else if (ep > maxEp) { ep = maxEp }
    } else {
      if (ep < 1) ep = 1
    }

    // Auto-complete season when episode reaches max
    const shouldComplete = curSeason && maxEp != null && ep >= maxEp && curSeason.season_status !== 'completed'
    let newAnimeStatus = prev.status
    const updatedSeasons = (prev.seasons || []).map(s => {
      if (s.season_number === season) {
        return { ...s, current_episode: ep, season_status: shouldComplete ? 'completed' : s.season_status }
      }
      return s
    })
    if (shouldComplete) newAnimeStatus = deriveAnimeStatus(updatedSeasons)

    setAnimes(list => list.map(a => a.id === id ? {
      ...a, episode: ep, current_season: season, status: newAnimeStatus, seasons: updatedSeasons,
    } : a))
    try {
      const updated = await api.patchEpisode(id, ep, season, shouldComplete ? 'completed' : undefined)
      setAnimes(list => list.map(a => a.id === updated.id ? updated : a))
    } catch {
      setAnimes(list => list.map(a => a.id === id ? prev : a))
      showToast('Could not update episode', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)' }}>Loading your vault…</p>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        animes={animes}
        activeNav={activeNav}
        onNav={(id) => { setActiveNav(id); setViewState('cards'); setEditingAnime(null) }}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onExport={handleExport}
        onImport={handleImport}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'auto', background: 'var(--bg-page)', position: 'relative' }}>
        {/* Cards view */}
        {(viewState === 'cards' || viewState === 'cards-leaving' || viewState === 'cards-entering') && (
          <div style={{
            position: 'absolute', inset: 0,
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            opacity: viewState === 'cards-leaving' ? 0 : 1,
            transform: viewState === 'cards-leaving' ? 'translateY(-6px)' : 'translateY(0)',
            pointerEvents: viewState === 'cards' || viewState === 'cards-entering' ? 'auto' : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            <MainContent
              animes={animes}
              activeNav={activeNav}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onEpisode={handleEpisode}
              onAdd={handleAdd}
              onCardClick={handleCardClick}
            />
          </div>
        )}

        {/* Form view */}
        {(viewState === 'form' || viewState === 'form-entering' || viewState === 'form-leaving') && (
          <div style={{
            position: 'absolute', inset: 0, overflow: 'auto',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            opacity: viewState === 'form-leaving' ? 0 : 1,
            transform: viewState === 'form-leaving' ? 'translateY(-6px)' : 'translateY(0)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: 24,
          }}>
            <AnimeForm
              initial={editingAnime}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
              loading={saving}
            />
          </div>
        )}
      </main>
      {modalAnime && (
        <AnimeModal
          anime={modalAnime}
          onClose={handleModalClose}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onEpisode={handleEpisode}
          onSeasonStatus={handleSeasonStatus}
          onAnimeStatus={handleAnimeStatus}
        />
      )}
      <Toast toast={toast} />
    </div>
  )
}

function anime_clamp(ep, total) {
  if (total != null && ep > total) return total
  if (ep < 1) return 1
  return ep
}