import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

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
  },
});

const backupUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});
// ─────────────────────────────────────────────────────────────────────────────

let pool;

async function initDB(retries = 30, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      pool = mysql.createPool(DB_CONFIG);
      await pool.getConnection();
      break;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`⏳ Waiting for MySQL (${i + 1}/${retries})…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  console.log("✅ Connected to MySQL");

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

  // Add current_episode column if it doesn't exist
  try {
    await pool.execute(
      `ALTER TABLE seasons ADD COLUMN current_episode INT NOT NULL DEFAULT 1`,
    );
    console.log("✅ Added current_episode column");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ current_episode column already exists or error:", err.message);
    }
  }

  // Add season_status column if it doesn't exist
  try {
    await pool.execute(
      `ALTER TABLE seasons ADD COLUMN season_status VARCHAR(50) NOT NULL DEFAULT 'watching'`,
    );
    console.log("✅ Added season_status column");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ season_status column already exists or error:", err.message);
    }
  }

  // Add deleted_at column if it doesn't exist
  try {
    await pool.execute(
      `ALTER TABLE animes ADD COLUMN deleted_at BIGINT DEFAULT NULL`,
    );
    console.log("✅ Added deleted_at to animes");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ deleted_at column already exists or error:", err.message);
    }
  }
  try {
    await pool.execute(
      `ALTER TABLE seasons ADD COLUMN deleted_at BIGINT DEFAULT NULL`,
    );
    console.log("✅ Added deleted_at to seasons");
  } catch (err) {
    if (!err.message.includes("Duplicate column")) {
      console.log("ℹ️ deleted_at column already exists or error:", err.message);
    }
  }

  console.log("✅ Tables ready");
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return cb(null, true)
    cb(null, true)
  },
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ── Validation ────────────────────────────────────────────────────────────────
const VALID_SEASON_STATUSES = [
  "watching",
  "plan-to-watch",
  "on-hold",
  "dropped",
  "completed",
];

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
  if (Number(body.episode) < 1) errors.push("Minimum episode is 1");
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
        const seasonStatus = s.season_status && VALID_SEASON_STATUSES.includes(s.season_status) ? s.season_status : 'watching';
        const currentEp = s.current_episode != null && s.current_episode !== '' ? Number(s.current_episode) : 1;
        await pool.execute(
          `INSERT INTO seasons (anime_id, season_number, episode_count, link, season_status, current_episode, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [animeId, s.season_number, toNull(s.episode_count), s.link?.trim() || "", seasonStatus, currentEp, now, now],
        );
      }
      const sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);
      const firstUncompleted = sortedSeasons.find(s => s.season_status !== "completed");
      const derivedStatus = firstUncompleted ? firstUncompleted.season_status || "watching" : "completed";
      await pool.execute("UPDATE animes SET status=? WHERE id=?", [derivedStatus, animeId]);
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
        const seasonStatus = s.season_status && VALID_SEASON_STATUSES.includes(s.season_status) ? s.season_status : 'watching';
        const currentEp = s.current_episode != null && s.current_episode !== '' ? Number(s.current_episode) : 1;
        await pool.execute(
          `INSERT INTO seasons (anime_id, season_number, episode_count, link, season_status, current_episode, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.params.id, s.season_number, toNull(s.episode_count), s.link?.trim() || "", seasonStatus, currentEp, now, now],
        );
      }
      // Derive anime status from seasons
      const sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);
      const firstUncompleted = sortedSeasons.find(s => s.season_status !== "completed");
      const derivedStatus = firstUncompleted ? firstUncompleted.season_status || "watching" : "completed";
      await pool.execute(
        "UPDATE animes SET status=?, updated_at=? WHERE id=?",
        [derivedStatus, now, req.params.id],
      );
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
    if (newEp < 1) newEp = 1;

    const newSeason =
      req.body.current_season !== undefined
        ? Number(req.body.current_season)
        : anime.current_season;

    const [seasons] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );

    // Save old season's current_episode before switching
    if (newSeason !== anime.current_season) {
      await pool.execute(
        "UPDATE seasons SET current_episode=? WHERE anime_id=? AND season_number=?",
        [Math.max(anime.episode, 1), req.params.id, anime.current_season],
      );
      // Load the new season's saved episode
      const newSeasonRow = seasons.find((s) => s.season_number === newSeason);
      if (newSeasonRow && newSeasonRow.current_episode != null) {
        newEp = Math.max(Number(newSeasonRow.current_episode), 1);
      } else {
        newEp = 1;
      }
    }

    // Clamp episode within season's episode_count if seasons exist
    if (seasons.length) {
      const curSeason = seasons.find((s) => s.season_number === newSeason);
      if (curSeason?.episode_count !== null && newEp > curSeason.episode_count)
        newEp = curSeason.episode_count;
    } else if (anime.total_episodes !== null && newEp > anime.total_episodes) {
      newEp = anime.total_episodes;
    }

    // Save to season's current_episode
    await pool.execute(
      "UPDATE seasons SET current_episode=? WHERE anime_id=? AND season_number=?",
      [newEp, req.params.id, newSeason],
    );

    // Auto-complete season when episode reaches max
    if (req.body.season_status) {
      await pool.execute(
        "UPDATE seasons SET season_status=? WHERE anime_id=? AND season_number=?",
        [req.body.season_status, req.params.id, newSeason],
      );
      const [seasonRows] = await pool.execute(
        "SELECT season_status, season_number FROM seasons WHERE anime_id = ? AND deleted_at IS NULL ORDER BY season_number ASC",
        [req.params.id],
      );
      const firstUncompleted = seasonRows.find(s => s.season_status !== "completed");
      const derivedStatus = firstUncompleted ? firstUncompleted.season_status || "watching" : "completed";
      await pool.execute(
        "UPDATE animes SET episode=?, current_season=?, status=?, updated_at=? WHERE id=?",
        [newEp, newSeason, derivedStatus, Date.now(), req.params.id],
      );
    } else {
      await pool.execute(
        "UPDATE animes SET episode=?, current_season=?, updated_at=? WHERE id=?",
        [newEp, newSeason, Date.now(), req.params.id],
      );
    }

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

// PATCH season status
app.patch("/api/animes/:id/season-status", async (req, res) => {
  try {
    const { season_number, status } = req.body;
    if (!season_number) return res.status(400).json({ error: "season_number is required" });
    if (!VALID_SEASON_STATUSES.includes(status)) return res.status(400).json({
      error: `Season status must be one of: ${VALID_SEASON_STATUSES.join(", ")}`,
    });

    const [result] = await pool.execute(
      "UPDATE seasons SET season_status=?, updated_at=? WHERE anime_id=? AND season_number=?",
      [status, Date.now(), req.params.id, season_number],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Season not found" });

    // Derive anime status from season statuses (first uncompleted season wins)
    const [seasonRows] = await pool.execute(
      "SELECT season_status, season_number FROM seasons WHERE anime_id = ? AND deleted_at IS NULL ORDER BY season_number ASC",
      [req.params.id],
    );
    const firstUncompleted = seasonRows.find(s => s.season_status !== "completed");
    const derivedStatus = firstUncompleted ? firstUncompleted.season_status || "watching" : "completed";
    await pool.execute(
      "UPDATE animes SET status=?, updated_at=? WHERE id=?",
      [derivedStatus, Date.now(), req.params.id],
    );

    const [updated] = await pool.execute("SELECT * FROM animes WHERE id = ?", [req.params.id]);
    const [seasonsRows] = await pool.execute(
      "SELECT * FROM seasons WHERE anime_id = ? ORDER BY season_number ASC",
      [req.params.id],
    );
    res.json({ ...updated[0], seasons: seasonsRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH anime status (e.g., mark complete)
app.patch("/api/animes/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({
      error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });

    await pool.execute(
      "UPDATE animes SET status=?, updated_at=? WHERE id=?",
      [status, Date.now(), req.params.id],
    );

    const [updated] = await pool.execute("SELECT * FROM animes WHERE id = ?", [req.params.id]);
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

// ── Backup ─────────────────────────────────────────────────────────────────────

app.get("/api/backup/export", async (req, res) => {
  let tmpDir;
  try {
    const [animes] = await pool.execute("SELECT * FROM animes ORDER BY id");
    const [seasons] = await pool.execute("SELECT * FROM seasons ORDER BY anime_id, season_number");
    const seasonsByAnime = {};
    for (const s of seasons) {
      if (!seasonsByAnime[s.anime_id]) seasonsByAnime[s.anime_id] = [];
      seasonsByAnime[s.anime_id].push(s);
    }
    const data = animes.map((a) => ({ ...a, seasons: seasonsByAnime[a.id] || [] }));

    tmpDir = fs.mkdtempSync("/tmp/animevault-");
    const jsonPath = path.join(tmpDir, "data.json");
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    const archive = new ZipArchive({ zlib: { level: 9 } });

    const done = new Promise((resolve, reject) => {
      archive.on("error", reject);
      archive.on("finish", resolve);
    });

    archive.append(fs.createReadStream(jsonPath), { name: "data.json" });

    for (const a of animes) {
      if (a.image) {
        const imgPath = path.join(UPLOAD_DIR, a.image);
        if (fs.existsSync(imgPath)) {
          archive.file(imgPath, { name: `images/${a.image}` });
        }
      }
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="animevault_${Date.now()}.zip"`);
    archive.pipe(res);
    archive.finalize();
    await done;
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

app.post("/api/backup/import", backupUpload.single("backup"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Backup file is required" });

    let data;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === ".zip") {
      const tmpDir = fs.mkdtempSync("/tmp/animevault-import-");
      const { default: decompress } = await import("decompress");
      await decompress(req.file.path, tmpDir);
      const jsonPath = path.join(tmpDir, "data.json");
      if (!fs.existsSync(jsonPath))
        return res.status(400).json({ error: "ZIP must contain a data.json file" });
      data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      const imagesDir = path.join(tmpDir, "images");
      if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        for (const f of files) {
          const src = path.join(imagesDir, f);
          const dst = path.join(UPLOAD_DIR, f);
          fs.copyFileSync(src, dst);
        }
      }
      fs.rmSync(tmpDir, { recursive: true });
    } else {
      data = JSON.parse(fs.readFileSync(req.file.path, "utf-8"));
    }
    fs.unlinkSync(req.file.path);

    if (!Array.isArray(data) || !data.length)
      return res.status(400).json({ error: "Invalid backup format" });

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.execute("DELETE FROM seasons");
      await connection.execute("DELETE FROM animes");
      const now = Date.now();
      for (const anime of data) {
        const { seasons, id, deleted_at, created_at, updated_at, ...rest } = anime;
        const [result] = await connection.execute(
          `INSERT INTO animes (name, link, episode, total_episodes, status, notes, image, original_filename, current_season, type, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rest.name, rest.link || "", Number(rest.episode) || 1,
            toNull(rest.total_episodes), rest.status || "watching",
            rest.notes || "", rest.image || null, rest.original_filename || "",
            rest.current_season || 1, rest.type || "tv", now, now,
          ],
        );
        if (Array.isArray(seasons)) {
          for (const s of seasons) {
            const { id: sid, anime_id, deleted_at: sd, created_at: sc, updated_at: su, ...sData } = s;
            await connection.execute(
              `INSERT INTO seasons (anime_id, season_number, episode_count, link, season_status, current_episode, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                result.insertId, sData.season_number || 1,
                toNull(sData.episode_count), sData.link || "",
                sData.season_status || "watching", Number(sData.current_episode) || 1,
                now, now,
              ],
            );
          }
        }
      }
      await connection.commit();
      connection.release();

      const [rows] = await pool.execute(`
        SELECT a.*,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', s.id, 'season_number', s.season_number,
              'episode_count', s.episode_count, 'link', s.link,
              'season_status', s.season_status, 'current_episode', s.current_episode
            )
          ) as seasons
        FROM animes a
        LEFT JOIN seasons s ON s.anime_id = a.id AND s.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
        GROUP BY a.id
        ORDER BY a.updated_at DESC
      `);
      res.json(rows);
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
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
