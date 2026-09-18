# 🚀 Ludo Deployment Guide

This guide explains how to deploy the **Backend on Fly.io** and the **Frontend on Vercel**.

---

## 1. Deploying the Backend on Fly.io

The backend is a Node.js Socket.io server packaged with Docker.

### Step 1: Install Fly CLI (`flyctl`)
- **Windows (PowerShell):**
  ```powershell
  iwr https://fly.io/install.ps1 -useb | iex
  ```
- **macOS / Linux:**
  ```bash
  curl -L https://fly.io/install.sh | sh
  ```

### Step 2: Sign in to Fly.io
```bash
fly auth login
```

### Step 3: Launch and Deploy the Backend
Open a terminal in the `Backend` directory:
```bash
cd Backend
fly launch
```
1. Choose an app name (e.g., `my-ludo-backend`).
2. Select your preferred region.
3. When prompted to tweak settings or deploy now, confirm to deploy.

If you already have a `fly.toml` generated, you can deploy anytime by running:
```bash
fly deploy
```

### Step 4: Verify Backend Health
Once deployed, check that the health check responds with `200 OK`:
```bash
curl https://<your-fly-app-name>.fly.dev/health
# Response: {"status":"ok","uptime":...}
```

---

## 2. Connecting the Frontend to Your Fly.io Backend

Before deploying the frontend to Vercel, set your Fly.io backend URL in `Frontend/index.html` and `Frontend/ludo.html`:

In the `<script>` tag of `Frontend/index.html` (and `Frontend/ludo.html`), update:
```javascript
window.LUDO_FLY_URL = "https://<your-fly-app-name>.fly.dev";
```
*(Alternatively, players can change the server URL at runtime in the browser console using `setLudoServerUrl('https://<your-fly-app-name>.fly.dev')`).*

---

## 3. Deploying the Frontend on Vercel

### Option A: Using Vercel CLI (Fastest)
1. In your project root or `Frontend` directory, run:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts:
   - Set up and deploy? **Yes** (`Y`)
   - Which scope? Select your personal or team account.
   - Link to existing project? **No**
   - Project name? e.g. `ludo-game`
   - In which directory is your code located? `./Frontend` (or `./`)
3. For production deployment:
   ```bash
   npx vercel --prod
   ```

### Option B: Using GitHub & Vercel Dashboard
1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
3. Under **Root Directory**, click edit and select `Frontend` (or leave as root with the included `vercel.json`).
4. Click **Deploy**.

---

## 4. Local Development

To run the game locally:

1. **Start Backend:**
   ```bash
   cd Backend
   npm start
   # Runs on http://localhost:3001
   ```

2. **Open Frontend:**
   - Double-click `Frontend/index.html` or open it with Live Server / `npx serve Frontend`.
   - The frontend automatically detects `localhost` and connects to `http://localhost:3001`.

---

## 5. Summary of Files Added
- `Backend/Dockerfile` - Production container image.
- `Backend/.dockerignore` - Excludes unneeded files from Docker builds.
- `Backend/fly.toml` - Fly.io configuration with health checks on `/health`.
- `Frontend/vercel.json` & root `vercel.json` - Routing & security headers for Vercel.
- `Frontend/index.html` - Standard static root entrypoint for Vercel.
