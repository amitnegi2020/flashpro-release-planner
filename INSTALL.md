# FlashPro Release Planner — Installation Guide

## Requirements
- Node.js 18 or later (https://nodejs.org)
- Python 3 with openpyxl: `pip3 install openpyxl`
- npm (bundled with Node.js)

## Quick Start

```bash
# 1. Unzip the package
unzip FlashPro-Release-Planner.zip
cd release-planner

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Start the server
npm start
```

Open http://localhost:3003 in your browser.

## Configuration (optional)

Copy `.env.local.example` to `.env.local` and edit as needed:
```bash
cp .env.local.example .env.local
```

Key settings:
- `PORT` — change the port (default: 3003)
- `NEXTAUTH_SECRET` — required for password/SSO auth modes
- `OKTA_CLIENT_ID` / `OKTA_ISSUER` — for ThoughtWorks SSO

## First Use

1. Click **Import → Story Map** and upload your `.xlsx` story map
2. Drag stories from the backlog onto the sprint/stream grid
3. Click **Export → Release Plan (.xlsx)** to download your plan

## Default Auth Mode

The app starts in **Open mode** — no login required.
To enable password protection, go to Settings → Access Control.

## Stopping the Server

```bash
# Find and kill the process
lsof -ti:3003 | xargs kill
```

## Support

Test data and acceptance criteria are in the
`FlashPro Release Planner Test Strategy/` folder.
