# AnimeVault — Setup Instructions

## What you need to install (one time only)

### 1. Node.js
- Go to https://nodejs.org
- Download the **LTS** version and install it
- Verify: open a terminal and run `node -v` — you should see a version number

### 2. MySQL
- Go to https://dev.mysql.com/downloads/mysql/
- Download **MySQL Community Server**
- Install it — during setup, set a **root password** (remember it, you'll need it)
- Verify: open a terminal and run `mysql -u root -p` — it should ask for your password

---

## One-time database setup

After installing MySQL, open a terminal and run:

```
mysql -u root -p
```

Enter your password, then run these two commands inside MySQL:

```sql
CREATE DATABASE animevault;
EXIT;
```

---

## Configure your password

Open `backend/server.js` in VS Code.

Find this line near the top:

```js
password: 'your_mysql_password',   // <-- change this
```

Replace `your_mysql_password` with the actual password you set during MySQL install.

---

## Running the app

You need **two terminals open at the same time** in VS Code.
Press `Ctrl + Shift + 5` to split the terminal, or click the `+` button twice.

### Terminal 1 — Backend (the server + database)

```
cd backend
npm install
node server.js
```

You should see:
```
✅ Connected to MySQL
✅ Table ready
🚀 AnimeVault backend → http://localhost:3001
```

### Terminal 2 — Frontend (the website)

```
cd frontend
npm install
npm run dev
```

You should see:
```
VITE ready in ...ms
➜  Local:   http://localhost:5173/
```

### Open the app

Go to http://localhost:5173 in your browser.

---

## Every time you want to use the app

1. Open VS Code and the `animevault-v2` folder
2. Open two terminals
3. Terminal 1: `cd backend` then `node server.js`
4. Terminal 2: `cd frontend` then `npm run dev`
5. Open http://localhost:5173

---

## Project structure

```
animevault-v2/
├── INSTRUCTIONS.md          ← this file
├── backend/
│   ├── package.json         ← backend dependencies
│   └── server.js            ← Express API + MySQL logic
└── frontend/
    ├── package.json         ← frontend dependencies
    ├── vite.config.js       ← dev server config
    ├── index.html
    └── src/
        ├── main.jsx         ← React entry point
        ├── App.jsx          ← all UI components and logic
        └── index.css        ← theme variables (light/dark)
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node -v` not found | Node.js not installed — go to nodejs.org |
| `mysql -u root -p` not found | MySQL not installed, or not in PATH |
| `❌ Failed to connect to MySQL` | Wrong password in server.js, or MySQL isn't running |
| `npm install` fails | Make sure you're in the right folder (backend or frontend) |
| Blank page in browser | Make sure BOTH terminals are running |
| Port already in use | Restart your computer or kill the process using the port |

---

## Moving your data to another computer

### Export (on the old computer)
```bash
# Dump the database
mysqldump -u animevault -panimevault animevault > animevault_backup.sql

# If your MySQL uses port 3307 (like the Docker setup), add -P 3307
mysqldump -u animevault -panimevault -P 3307 animevault > animevault_backup.sql

# Copy the anime images too
tar czf uploads_backup.tar.gz backend/uploads/
```

Transfer the files (`animevault_backup.sql` + `uploads_backup.tar.gz`) via USB, SCP, cloud storage, etc.

### Import (on the new computer)
```bash
# Make sure MySQL is running and the animevault database exists first
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS animevault;"

# Import the data
mysql -u animevault -panimevault animevault < animevault_backup.sql

# Restore images
tar xzf uploads_backup.tar.gz
```

Make sure the MySQL user `animevault` exists on the new computer and has the correct password (set it in `backend/server.js`).
