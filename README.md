# AnimeVault

A personal anime tracking app with season-level episode tracking, TV/movie support, dark mode, and JSON backup/restore.

## Features

- Track animes with multiple seasons — each season has its own episode progress, status, and streaming link
- TV and movie types with tailored forms (movies skip seasons)
- Modal-based card interaction — click any card to view details, update episodes, mark seasons complete
- Auto-complete: season marks itself done when episode count is reached; anime status derives from its seasons
- Dark/light theme toggle
- Full-text anime search right inside the add/edit form (powered by AniList)
- JSON export/import for backup and data migration (no raw SQL needed)

## Tech Stack

- **Frontend:** React 18, Vite, vanilla CSS with CSS custom properties
- **Backend:** Node.js, Express, mysql2/promise, multer (image uploads)
- **Database:** MySQL 8.0
- **Docker:** Multi-stage frontend (Vite → nginx:alpine), Node 20 Alpine backend, MySQL 8.0

## Quick Start

For full setup instructions (Node.js, MySQL, configuration), see [INSTRUCTIONS.md](INSTRUCTIONS.md).

### Docker (easiest)

```bash
docker compose up --build
```

Then open http://localhost:8080.

### Manual (development)

Two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm install
node server.js

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Frontend at http://localhost:5173, backend at http://localhost:3001.

## Data Migration (Backup & Restore)

AnimeVault has a built-in JSON export/import system. No `mysqldump` required.

### Export

1. Open the app
2. Click **Export** in the sidebar footer
3. A `.json` file downloads automatically — contains all animes, seasons, metadata

### Import

1. Open the app on the target machine (after setup)
2. Click **Import** in the sidebar footer
3. Select the `.json` file from export
4. All data is replaced with the imported data in a single transaction

> **Note:** Images are referenced by filename in the export. To transfer images as well, copy the `backend/uploads/` folder to the new machine manually.

## Project Structure

```
animevault-v2/
├── README.md
├── INSTRUCTIONS.md          ← detailed setup guide
├── docker-compose.yml       ← 3 services (frontend, backend, mysql)
├── backend/
│   ├── server.js            ← Express API + MySQL logic + backup routes
│   ├── Dockerfile
│   └── uploads/             ← uploaded anime images (gitignored)
└── frontend/
    ├── src/
    │   ├── App.jsx          ← all React components + helpers
    │   └── index.css        ← theme variables, layout, keyframes
    ├── Dockerfile           ← multi-stage (Vite build → nginx:alpine)
    ├── nginx.conf           ← reverse proxy for production
    └── vite.config.js       ← dev proxy for /api and /uploads
```
