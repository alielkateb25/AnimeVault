import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const app  = express()
const PORT = 3001

// ── ⚙️  MySQL config — edit these to match your setup ─────────────────────────
const DB_CONFIG = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
}
// ─────────────────────────────────────────────────────────────────────────────

let pool

async function initDB() {
  pool = mysql.createPool(DB_CONFIG)

  // Test connection
  const conn = await pool.getConnection()
  console.log('✅ Connected to MySQL')
  conn.release()

  // Create table if it does not exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS animes (
      id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      link           VARCHAR(2048)         NOT NULL DEFAULT '',
      episode        INT          NOT NULL DEFAULT 0,
      total_episodes INT          DEFAULT NULL,
      status         VARCHAR(50)  NOT NULL DEFAULT 'watching',
      notes          VARCHAR(1000)         NOT NULL DEFAULT '',
      created_at     BIGINT       NOT NULL,
      updated_at     BIGINT       NOT NULL
    )
  `)
  console.log('✅ Table ready')
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Validation ────────────────────────────────────────────────────────────────
const VALID_STATUSES = ['watching', 'plan-to-watch', 'on-hold', 'dropped', 'completed']

function validate(body) {
  const errors = []
  if (!body.name || !body.name.trim())
    errors.push('Name is required')
  if (body.episode === undefined || body.episode === null || isNaN(body.episode))
    errors.push('Episode must be a number')
  if (Number(body.episode) < 0)
    errors.push('Episode cannot be negative')
  if (body.total_episodes !== null && body.total_episodes !== undefined && body.total_episodes !== '') {
    if (isNaN(body.total_episodes) || Number(body.total_episodes) < 1)
      errors.push('Total episodes must be a positive number')
    else if (Number(body.episode) > Number(body.total_episodes))
      errors.push('Current episode cannot exceed total episodes')
  }
  if (body.status && !VALID_STATUSES.includes(body.status))
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`)
  return errors
}

function toNull(val) {
  return (val === undefined || val === '' || val === null) ? null : Number(val)
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all
app.get('/api/animes', async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM animes ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET one
app.get('/api/animes/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Anime not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create
app.post('/api/animes', async (req, res) => {
  try {
    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ errors })

    const { name, link, episode, total_episodes, status, notes } = req.body
    const now = Date.now()

    const [result] = await pool.execute(
      `INSERT INTO animes (name, link, episode, total_episodes, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        link?.trim() || '',
        Number(episode),
        toNull(total_episodes),
        status || 'watching',
        notes?.trim() || '',
        now,
        now,
      ]
    )

    const [rows] = await pool.execute('SELECT * FROM animes WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update
app.put('/api/animes/:id', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    if (!existing.length) return res.status(404).json({ error: 'Anime not found' })

    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ errors })

    const { name, link, episode, total_episodes, status, notes } = req.body

    await pool.execute(
      `UPDATE animes
       SET name=?, link=?, episode=?, total_episodes=?, status=?, notes=?, updated_at=?
       WHERE id=?`,
      [
        name.trim(),
        link?.trim() || '',
        Number(episode),
        toNull(total_episodes),
        status || existing[0].status,
        notes?.trim() || '',
        Date.now(),
        req.params.id,
      ]
    )

    const [rows] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH episode (quick +/- buttons)
app.patch('/api/animes/:id/episode', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Anime not found' })

    const anime = rows[0]
    let newEp = Number(req.body.episode)
    if (isNaN(newEp)) return res.status(400).json({ error: 'Invalid episode number' })
    if (newEp < 0) newEp = 0
    if (anime.total_episodes !== null && newEp > anime.total_episodes) newEp = anime.total_episodes

    await pool.execute('UPDATE animes SET episode=?, updated_at=? WHERE id=?', [newEp, Date.now(), req.params.id])

    const [updated] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    res.json(updated[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE
app.delete('/api/animes/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM animes WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Anime not found' })
    await pool.execute('DELETE FROM animes WHERE id = ?', [req.params.id])
    res.json({ success: true, id: Number(req.params.id) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 AnimeVault backend → http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL:', err.message)
    console.error('   → Make sure MySQL is running and your password in server.js is correct')
    process.exit(1)
  })
