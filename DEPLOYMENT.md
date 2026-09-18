# 🚀 Ludo Deployment Guide

This guide explains how to deploy the **Backend on Render or Fly.io** and the **Frontend on Vercel**.

---

## 1. Deploying the Backend on Render (https://dashboard.render.com/)

Render is the simplest way to deploy your Node.js Socket.io backend with free SSL and automatic redeploys.

### Option A: Using the Render Dashboard (Web UI)
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `Ethan282/ludo_game`.
4. Configure the service settings:
   - **Name:** `ludo-backend` (or any unique name)
   - **Language / Runtime:** `Node`
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. (Optional) Under **Advanced**:
   - **Health Check Path:** `/health`
   - Add Environment Variable: `NODE_ENV` = `production`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public URL:
   `https://<your-service-name>.onrender.com`

### Option B: Using Render Blueprint (`render.yaml`)
1. Go to **[dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)**.
2. Click **New Blueprint Instance**.
3. Connect your repository `Ethan282/ludo_game`.
4. Render will automatically detect the [render.yaml](render.yaml) file and configure the service.
5. Click **Apply**.

---

## 2. Deploying the Backend on Fly.io (Alternative)

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
```bash
cd Backend
fly launch
```
1. Choose an app name (e.g., `my-ludo-backend`).
2. Confirm deployment with the provided `fly.toml` & `Dockerfile`.

---

## 3. Connecting the Frontend to Your Deployed Backend

Before or after deploying the frontend, configure the backend URL in `Frontend/index.html` (and `Frontend/ludo.html`):

```javascript
// For Render:
window.LUDO_RENDER_URL = "https://<your-service-name>.onrender.com";

// OR for Fly.io:
window.LUDO_FLY_URL = "https://<your-fly-app-name>.fly.dev";
```

*(You can also set/change it anytime live from the browser console using `setLudoServerUrl('https://<your-service-name>.onrender.com')`).*

---

## 4. Deploying the Frontend on Vercel

### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new) and import `Ethan282/ludo_game`.
2. Set **Root Directory** to `Frontend` (or keep root).
3. Framework Preset: **Other**.
4. Click **Deploy**.

### Option B: Using Vercel CLI
```bash
npx vercel --prod
```

---

## 5. Local Development

1. **Start Backend:**
   ```bash
   cd Backend
   npm start
   # Running on http://localhost:3001
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm start
   # Running on http://localhost:3000
   ```
