# AnimeForm Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the inline AnimeForm into a modal-style overlay that replaces the content area with fade transitions, cleaner layout, and reordered fields.

**Architecture:** All components live in `App.jsx`. The `App` root manages a view state machine (`cards` ↔ `form`) with animation phases. `MainContent` drops form-rendering responsibility. `AnimeForm` gets restructured JSX with new field order and styling.

**Tech Stack:** React 18, inline styles, CSS transitions, CSS variables for theming.

---

### Task 1: Rewrite AnimeForm with new layout & styles

**Files:**
- Modify: `src/App.jsx:142-473` (the AnimeForm component)

- [ ] **Step 1: Replace the AnimeForm return with new structure**

Replace the entire AnimeForm return statement. The form becomes a card with header, body, and footer sections. Fields in order: Name → Type → Image → Status+Link → Seasons → Season/Episode → Notes.

```jsx
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
                  flex: 1, padding: '7px 10px', borderRadius: 6,
                  border: isMovie ? '1px solid var(--border)' : '1px solid var(--accent)',
                  background: isMovie ? 'var(--bg-input)' : 'var(--accent-light)',
                  color: isMovie ? 'var(--text-secondary)' : 'var(--accent)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                }}
              >
                📺 TV Series
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'movie', episode: '0', seasons: [] }))}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 6,
                  border: isMovie ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isMovie ? 'var(--accent-light)' : 'var(--bg-input)',
                  color: isMovie ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                }}
              >
                🎬 Movie
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
              }}>📷</div>
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

        {/* 4. Status + Link */}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
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
                  <select style={inputStyle} value={form.current_season} onChange={set('current_season')}>
                    {form.seasons.map((s, i) => (
                      <option key={i} value={s.season_number}>Season {s.season_number}</option>
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
              🎬 A movie is tracked as a single entry. Set status to "Completed" when you've watched it.
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
```

- [ ] **Step 2: Add the fadeIn animation to index.css**

Open `src/index.css` and append:

```css
@keyframes formFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Verify build is clean**

Run: `npm run build` (workdir: frontend)
Expected: Clean build, no warnings/errors

---

### Task 2: Add view transition state machine to App

**Files:**
- Modify: `src/App.jsx:1207-1386` (App component, props wiring)

- [ ] **Step 1: Replace showForm with a view state machine**

Replace the `showForm` state declaration and add a view transition state:

```jsx
  const [viewState, setViewState] = useState('cards') // 'cards' | 'cards-leaving' | 'form-entering' | 'form' | 'form-leaving' | 'cards-entering'

  const showForm = viewState === 'form' || viewState === 'form-entering'
  const showCards = viewState === 'cards' || viewState === 'cards-leaving'

  // Advance the animation through its phases
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
```

- [ ] **Step 2: Update handlers to use viewState transitions**

Replace `handleAdd`, `handleEdit`, `handleFormCancel`, and `onNav`:

```jsx
  const handleAdd = () => {
    setEditingAnime(null)
    setViewState('cards-leaving')
  }

  const handleEdit = (anime) => {
    // ... (same editing setup as before)
    setViewState('cards-leaving')
  }

  const handleFormCancel = () => {
    setViewState('form-leaving')
  }

  // In the sidebar onNav:
  onNav={(id) => { setActiveNav(id); setViewState('form-leaving'); setTimeout(() => setEditingAnime(null), 400) }}
```

- [ ] **Step 3: Update sidebar onNav handler**

```jsx
  onNav={(id) => { setActiveNav(id); setEditingAnime(null); setViewState('form-leaving'); setTimeout(() => setEditingAnime(null), 400) }}
```

(Note: `setViewState('form-leaving')` is a no-op if already `'cards'`, safe to call unconditionally.)

- [ ] **Step 4: Update the return JSX to render both views with transitions**

Replace the content area rendering:

```jsx
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        animes={animes}
        activeNav={activeNav}
        onNav={(id) => { setActiveNav(id); setEditingAnime(null); setViewState('form-leaving') }}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
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
            display: 'flex', justifyContent: 'center',
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
        />
      )}
      <Toast toast={toast} />
    </div>
  )
```

---

### Task 3: Clean up MainContent props

**Files:**
- Modify: `src/App.jsx:1047-1153` (MainContent)

- [ ] **Step 1: Remove form-related props from MainContent**

Remove `showForm`, `editingAnime`, `onFormSave`, `onFormCancel`, `saving` from the destructured props and from JSX usage.

```jsx
function MainContent({ animes, activeNav, onEdit, onDelete, onEpisode, onAdd, onCardClick }) {
```

Then remove lines 1090-1098 (the `{showForm && <AnimeForm .../>}` block).

- [ ] **Step 2: Remove the completed-view inline AnimeForm rendering**

Verify the `{showForm &&` block is gone from lines 1090-1098.

---

### Task 4: Verify the build

**Files:**
- Run: build command

- [ ] **Step 1: Build and verify**

```bash
npm run build
```

Expected: Clean build, no warnings, 0 errors.

- [ ] **Step 2: Visual check (manual)**

Start the dev server with `npm run dev` and verify:
1. Click "+ Add anime" → cards fade out, form fades in
2. Form has correct field order: Name → Type → Image → Status+Link → Seasons → Season/Episode → Notes
3. Click "Cancel" → form fades out, cards fade back in
4. Click an anime card → modal opens, click Edit → modal closes, form fades in with data
5. Toggle TV/Movie type shows/hides seasons section
6. Save a new anime works
7. Edit and save an existing anime works
