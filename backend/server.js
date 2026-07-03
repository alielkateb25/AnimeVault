import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3001;

// ── ⚙️  MySQL config — edit these to match your setup ─────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};
// ─────────────────────────────────────────────────────────────────────────────

// ── ⚙️  Image upload config ─────────────────────────────────────────────────
const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Store the original name in the request for later
    req.originalFilename = file.originalname;
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const isValid =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    cb(null, isValid);
    if (!isValid) cb(new Error("Only image files are allowed"));
  },
});
// ─────────────────────────────────────────────────────────────────────────────

let pool;

async function initDB() {
  pool = mysql.createPool(DB_CONFIG);

  const conn = await pool.getConnection();
  console.log("✅ Connected to MySQL");
  conn.release();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS animes (
      id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      link           VARCHAR(2048)         NOT NULL DEFAULT '',
      episode        INT          NOT NULL DEFAULT 0,
      total_episodes INT          DEFAULT NULL,
      status         VARCHAR(50)  NOT NULL DEFAULT 'watching',
      notes          VARCHAR(1000)         NOT NULL DEFAULT '',
      image          VARCHAR(255)          DEFAULT NULL,
      original_filename VARCHAR(255) DEFAULT NULL,
      type           VARCHAR(10)  NOT NULL DEFAULT 'tv',
      created_at     BIGINT       NOT NULL,
      updated_at     BIGINT       NOT NULL
    )
  `);

  // Add image column if it doesn't exist (for existing DBs)
  try {
    await pool.execute(
      `ALTER TABLE animes ADD COLUMN image VARCHAR(255) DEFAULT NULL`,
    );
    console.log("✅ Added image column");
  } catch (err) {
    // Column already exists, ignore
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ Image column already exists or error:", err.message);
    }
  }

  // Add current_season column if it doesn't exist
  try {
    await pool.execute(
      `ALTER TABLE animes ADD COLUMN current_season INT NOT NULL DEFAULT 1`,
    );
    console.log("✅ Added current_season column");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ current_season column already exists or error:", err.message);
    }
  }

  // Add type column if it doesn't exist
  try {
    await pool.execute(
      `ALTER TABLE animes ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'tv'`,
    );
    console.log("✅ Added type column");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ type column already exists or error:", err.message);
    }
  }

  // Seasons table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS seasons (
      id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      anime_id       INT          NOT NULL,
      season_number  INT          NOT NULL DEFAULT 1,
      episode_count  INT          DEFAULT NULL,
      link           VARCHAR(2048) NOT NULL DEFAULT '',
      created_at     BIGINT       NOT NULL,
      updated_at     BIGINT       NOT NULL,
      FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE,
      UNIQUE KEY unique_anime_season (anime_id, season_number)
    )
  `);

  console.log("✅ Tables ready");
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ── Validation ────────────────────────────────────────────────────────────────
const VALID_STATUSES = [
  "watching",
  "plan-to-watch",
  "on-hold",
  "dropped",
  "completed",
];

function validate(body) {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push("Name is required");
  if (
    body.episode === undefined ||
    body.episode === null ||
    isNaN(body.episode)
  )
    errors.push("Episode must be a number");
  if (Number(body.episode) < 0) errors.push("Episode cannot be negative");
  if (
    body.total_episodes !== null &&
    body.total_episodes !== undefined &&
    body.total_episodes !== ""
  ) {
    if (isNaN(body.total_episodes) || Number(body.total_episodes) < 1)
      errors.push("Total episodes must be a positive number");
    else if (Number(body.episode) > Number(body.total_episodes))
      errors.push("Current episode cannot exceed total episodes");
  }
  if (body.status && !VALID_STATUSES.includes(body.status))
    errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  if (body.type && !["tv", "movie"].includes(body.type))
    errors.push('Type must be "tv" or "movie"');
  // Validate seasons array if provided
  if (Array.isArray(body.seasons)) {
    for (const s of body.seasons) {
      if (!s.season_number || s.season_number < 1)
        errors.push("Each season must have a valid season_number");
      if (
        s.episode_count !== null &&
        s.episode_count !== undefined &&
        s.episode_count !== "" &&
        (isNaN(s.episode_count) || Number(s.episode_count) < 1)
      )
        errors.push(`Season ${s.season_number}: episode_count must be a positive number`);
    }
  }
  return errors;
}

function toNull(val) {
  return val === undefined || val === "" || val === null ? null : Number(val);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all (with seasons)
app.get("/api/animes", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM animes ORDER BY created_at DESC",
    );
    // Fetch all seasons for these anime IDs
    const ids = rows.map((r) => r.id);
    let seasonsMap = {};
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const [seasons] = await pool.execute(
        `SELECT * FROM seasons WHERE anime_id IN (${placeholders}) ORDER BY season_number ASC`,
        ids,
      );
      for (const s of seasons) {
        if (!seasonsMap[s.anime_id]) seasonsMap[s.anime_id] = [];
        seasonsMap[s.anime_id].push(s);
      }
    }
    res.json(rows.map((r) => ({ ...r, seasons: seasonsMap[r.id] || [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one (with seasons)
app.get("/api/animes/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "Anime not found" });
    const [seasons] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );
    res.json({ ...rows[0], seasons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create with optional image
app.post("/api/animes", upload.single("image"), async (req, res) => {
  try {
    const body = JSON.parse(req.body.data || "{}");
    const errors = validate(body);
    if (errors.length) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors });
    }

    const { name, link, episode, total_episodes, status, notes, seasons, current_season, type } = body;
    const now = Date.now();
    const imagePath = req.file ? req.file.filename : null;

    const [result] = await pool.execute(
      `INSERT INTO animes (name, link, episode, total_episodes, status, notes, image, original_filename, current_season, type, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        link?.trim() || "",
        Number(episode),
        toNull(total_episodes),
        status || "watching",
        notes?.trim() || "",
        imagePath,
        req.file ? req.originalFilename : null,
        current_season || 1,
        type || "tv",
        now,
        now,
      ],
    );

    const animeId = result.insertId;

    // Insert seasons if provided
    if (Array.isArray(seasons) && seasons.length) {
      for (const s of seasons) {
        await pool.execute(
          `INSERT INTO seasons (anime_id, season_number, episode_count, link, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [animeId, s.season_number, toNull(s.episode_count), s.link?.trim() || "", now, now],
        );
      }
    }

    const [rows] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      animeId,
    ]);
    const [seasonsRows] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [animeId],
    );
    res.status(201).json({ ...rows[0], seasons: seasonsRows });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// PUT update with optional image
app.put("/api/animes/:id", upload.single("image"), async (req, res) => {
  try {
    const [existing] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing.length)
      return res.status(404).json({ error: "Anime not found" });

    const body = JSON.parse(req.body.data || "{}");
    const errors = validate(body);
    if (errors.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors });
    }

    const { name, link, episode, total_episodes, status, notes, image_keep, seasons, current_season, type } =
      body;
    let imagePath = existing[0].image;

    // Handle image update
    if (req.file) {
      if (existing[0].image) {
        const oldPath = path.join(UPLOAD_DIR, existing[0].image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = req.file.filename;
    } else if (image_keep === false && imagePath) {
      const oldPath = path.join(UPLOAD_DIR, imagePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      imagePath = null;
    }

    const now = Date.now();
    await pool.execute(
      `UPDATE animes SET name=?, link=?, episode=?, total_episodes=?, status=?, notes=?, image=?, original_filename=?, current_season=?, type=?, updated_at=?
      WHERE id=?`,
      [
        name.trim(),
        link?.trim() || "",
        Number(episode),
        toNull(total_episodes),
        status || existing[0].status,
        notes?.trim() || "",
        imagePath,
        req.file ? req.originalFilename : existing[0].original_filename,
        current_season || existing[0].current_season || 1,
        type || existing[0].type || "tv",
        now,
        req.params.id,
      ],
    );

    // Replace seasons: delete old, insert new
    if (Array.isArray(seasons)) {
      await pool.execute("DELETE FROM seasons WHERE anime_id = ?", [req.params.id]);
      for (const s of seasons) {
        await pool.execute(
          `INSERT INTO seasons (anime_id, season_number, episode_count, link, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [req.params.id, s.season_number, toNull(s.episode_count), s.link?.trim() || "", now, now],
        );
      }
    }

    const [rows] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    const [seasonsRows] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );
    res.json({ ...rows[0], seasons: seasonsRows });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// PATCH episode (quick +/- buttons, season-aware)
app.patch("/api/animes/:id/episode", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "Anime not found" });

    const anime = rows[0];
    let newEp = Number(req.body.episode);
    if (isNaN(newEp))
      return res.status(400).json({ error: "Invalid episode number" });
    if (newEp < 0) newEp = 0;

    const newSeason =
      req.body.current_season !== undefined
        ? Number(req.body.current_season)
        : anime.current_season;

    // Clamp episode within season's episode_count if seasons exist
    const [seasons] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );
    if (seasons.length) {
      const curSeason = seasons.find((s) => s.season_number === newSeason);
      if (curSeason?.episode_count !== null && newEp > curSeason.episode_count)
        newEp = curSeason.episode_count;
    } else if (anime.total_episodes !== null && newEp > anime.total_episodes) {
      newEp = anime.total_episodes;
    }

    await pool.execute(
      "UPDATE animes SET episode=?, current_season=?, updated_at=? WHERE id=?",
      [newEp, newSeason, Date.now(), req.params.id],
    );

    const [updated] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    // Re-fetch seasons to include with the response
    const [seasonsRows] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );
    res.json({ ...updated[0], seasons: seasonsRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete("/api/animes/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM animes WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "Anime not found" });

    // Delete associated image
    if (rows[0].image) {
      const imagePath = path.join(UPLOAD_DIR, rows[0].image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await pool.execute("DELETE FROM animes WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 AnimeVault backend → http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MySQL:", err.message);
    console.error(
      "   → Make sure MySQL is running and your password in server.js is correct",
    );
    process.exit(1);
  });
