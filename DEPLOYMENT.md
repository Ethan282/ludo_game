# 🚀 Ludo Deployment Guide (Render Backend + Vercel Frontend)

This guide shows you how to deploy the **Backend on Render** and the **Frontend on Vercel**.

---

## Part 1: Deploy Backend to Render (https://dashboard.render.com/)

### Step 1: Create Web Service
1. Log in to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **+ New** (top right) → select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repo: **`Ethan282/ludo_game`**.

### Step 2: Configure Service Settings
Set the following fields in Render:
- **Name:** `ludo-backend` (or any unique name you like)
- **Language / Runtime:** `Node`
- **Root Directory:** `Backend` *(Important: set this to `Backend`)*
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type / Plan:** `Free`

### Step 3: (Optional) Advanced Settings
- **Health Check Path:** `/health`
- **Environment Variables:**
  - `NODE_ENV` = `production`

### Step 4: Click Deploy
Click **Create Web Service**.

Once deployed (1-2 minutes), Render will display your live backend URL at the top, for example:
👉 `https://ludo-backend-xxxx.onrender.com`

---

## Part 2: Connect Frontend to Render Backend

In `Frontend/index.html` (and `Frontend/ludo.html`), update the line in the `<script>`:
```javascript
window.LUDO_RENDER_URL = "https://your-backend-name.onrender.com";
```
*(Replace `your-backend-name` with your actual Render service URL).*

Commit and push this change to GitHub:
```bash
git add Frontend/index.html Frontend/ludo.html
git commit -m "Set production Render backend URL"
git push origin main
```

---

## Part 3: Deploy Frontend to Vercel (https://vercel.com/)

### Method A: Vercel Dashboard (Recommended)
1. Log in to **[vercel.com](https://vercel.com/)**.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: **`Ethan282/ludo_game`**.
4. In the configuration screen:
   - **Root Directory:** Click *Edit* and select **`Frontend`**
   - **Framework Preset:** `Other`
   - **Build & Output Settings:** Leave defaults
5. Click **Deploy**.

### Method B: Vercel CLI
```bash
cd Frontend
npx vercel --prod
```

---

## Part 4: How It Works Together
- **Vercel** serves the ultra-fast HTML/CSS/Canvas frontend to users with global CDN.
- **Render** runs the Node.js Socket.io WebSocket server handling real-time rooms, player turns, and dice rolls.
- When players open your Vercel URL, the game automatically connects to your Render WebSocket backend.
