# FlashPro Release Planner

A visual sprint planning tool. Import your story map, drag stories onto a sprint grid, and export your release plan as Excel.

---

## What you need before starting

| Requirement | How to get it |
|---|---|
| **Node.js 18+** | https://nodejs.org → Download LTS |
| **Python 3** | https://python.org → Download |
| **openpyxl** (Python library) | Run: `pip3 install openpyxl` |

To check you have everything:
```
node --version    # should show v18 or higher
python3 --version # should show 3.x
pip3 show openpyxl # should show the package info
```

---

## Installation

**Step 1 — Unzip the package**
```
unzip FlashPro-Release-Planner.zip
cd release-planner
```

**Step 2 — Install Node dependencies**
```
npm install
```

**Step 3 — Build the app**
```
npm run build
```

**Step 4 — Start the server**
```
npm start
```

**Step 5 — Open in your browser**
```
http://localhost:3003
```

That's it. The app runs entirely on your machine — no internet connection required.

---

## How to use it

### First time setup
1. Click **Import** in the top bar
2. Choose **Story Map** and upload your `.xlsx` file
3. Your stories will appear in the backlog on the left

### Planning your release
- **Drag** a story from the backlog onto a sprint column and stream row
- Use the **View tabs** (Story / Action / Goal) to see different groupings
- Use the **Filter buttons** to focus on specific personas or workflow areas

### Exporting your plan
1. Click **Export** in the top bar
2. Choose **Release Plan (.xlsx)** to get a 5-sheet Excel workbook
3. Choose **Save Project File (.rp)** to back up everything for later

### Coming back to your work
Your board is saved automatically every time you make a change.
To move to a different machine: Export → Save Project File (.rp), then on the new machine: Import → Open Saved Project → choose the .rp file.

---

## Settings

| Setting | Where to find it |
|---|---|
| Number of sprints (1–12) | Settings → Board Setup |
| Number of streams (2–8) | Settings → Board Setup |
| Sprint capacity (points) | Settings → Sprint Capacity |
| View tabs (Goal, Action, Workflow…) | Settings → Views & Aggregates |
| Access control / login | User menu → Access Control |

---

## Import files explained

| File | What it does |
|---|---|
| **Story Map (.xlsx)** | Loads all your stories into the backlog |
| **Dependency Map (.xlsx)** | Loads dependency rules between stories |
| **Critical Path (.xlsx)** | Marks critical path stories with a red badge |
| **Release Plan (.xlsx)** | Restores a previously exported sprint plan |
| **Project File (.rp)** | Restores the entire project (stories + plan + deps) |

Template files for each format are at **http://localhost:3003/intro** after the app is running.

---

## Stopping the server

Press `Ctrl + C` in the terminal where the server is running.

Or if running in the background:
```
lsof -ti:3003 | xargs kill
```

---

## Changing the port

Edit `package.json` and change `3003` to your preferred port in both the `start` and `dev` scripts.

---

## Enabling login / access control

By default the app runs in **Open mode** — no login required.

To enable password protection:
1. Click the user icon (top right) → Access Control
2. Set auth mode to **Password Protected** and choose a password

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "openpyxl not found" on import | `pip3 install openpyxl` |
| Port 3003 already in use | `lsof -ti:3003 \| xargs kill` then `npm start` |
| Build fails | `npm install` then `npm run build` |
| Board is blank | Click Import → Story Map and upload your .xlsx file |

---

## Test data and acceptance criteria

The `FlashPro Release Planner Test Strategy/` folder contains:
- **acceptance-criteria.md** — 335 acceptance criteria
- **data for testing/** — 30 test Excel files
- **qa-report-round-2-2026-04-14.md** — QA test results

---

## Project structure

```
release-planner/
├── app/              Pages and API routes
│   ├── page.tsx      Main planning board
│   ├── settings/     Settings page
│   ├── intro/        Setup guide and templates
│   ├── admin/        User management
│   └── api/          All backend endpoints
├── lib/              Shared utilities
├── middleware.ts     Auth routing
└── package.json      Dependencies and scripts
```
