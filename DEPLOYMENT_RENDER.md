# Deploying AI Resume Analyzer on Render 🚀

This repository is pre-configured for **1-Click zero-configuration deployment on Render** (Free Tier supported).

---

## Architecture Overview on Render

The repository can be deployed as a **Unified Single Web Service** where the Express backend serves both:
1. **API Endpoints** under `/api/*`
2. **Production React Single Page App** under `/*` (Vite build)

This eliminates CORS issues, requires only **1 single free Render service**, and works out of the box with embedded database persistence and native resume parsing.

---

## Option 1: 1-Click Blueprint Deployment (Recommended)

1. Push this repository to your **GitHub** account.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** (top right) → Select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect the [`render.yaml`](./render.yaml) file in the root directory.
6. Click **Apply**. Render will automatically provision:
   - **Service Name**: `ai-resume-analyzer`
   - **Runtime**: Node.js
   - **Plan**: Free
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start:render`
   - **Health Check**: `/api/health`
7. Once deployed, Render will provide a live URL (e.g. `https://ai-resume-analyzer-xxxx.onrender.com`).

---

## Option 2: Manual Web Service Setup (Step-by-Step)

If you prefer to configure the service manually on Render:

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com) → Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your repository.
4. Fill in the deployment form with the following settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `ai-resume-analyzer` (or your choice) |
| **Region** | Oregon (US West) or Frankfurt (EU) |
| **Branch** | `main` |
| **Root Directory** | *(Leave empty)* |
| **Runtime** | **Node** |
| **Build Command** | `npm run build:render` |
| **Start Command** | `npm run start:render` |
| **Instance Type** | **Free** |

### Environment Variables
Under the **Environment Variables** section, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render's default web service port |

*(Optional)* If you have an external MongoDB Atlas cluster:
| Key | Value |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/ai-resume-analyzer` |
*(If omitted, the app automatically uses the built-in embedded local JSON database with zero setup).*

5. Under **Advanced** settings:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes (triggers on every git push)
6. Click **Create Web Service**.

---

## Option 3: Docker Deployment on Render

If you prefer containerized deployment:

1. On Render, click **New +** → **Web Service**.
2. Select your repository.
3. Set **Runtime** to **Docker**.
4. Render will automatically detect the root [`Dockerfile`](./Dockerfile).
5. Set environment variable: `PORT=10000`.
6. Click **Create Web Service**.

---

## Verification Checklist

Once the deployment completes and your service shows **Live**:

1. **Health Check**: Visit `https://your-service.onrender.com/api/health` (should return HTTP 200 `{ "status": "ok" }`).
2. **Landing Page**: Visit `https://your-service.onrender.com/` (loads the modern Obsidian monochrome UI).
3. **Command Palette**: Press `Cmd+K` or `Ctrl+K` to search tools and sample resumes.
4. **Developer Terminal**: Visit `https://your-service.onrender.com/terminal` and run `status`, `scan`, or `theme matrix`.
5. **Resume Builder**: Visit `https://your-service.onrender.com/builder` to edit and export PDFs.
6. **Upload & Parse**: Test uploading a sample PDF resume or clicking **Demo 1 (Cheralathan B.N)** to run instant ATS scoring.

---

## Troubleshooting Common Issues

### 1. Cold Start Delay on Free Tier
Render free instances spin down after 15 minutes of inactivity. When a new visitor arrives, Render takes 30–50 seconds to spin up the container. The backend has built-in warmup polling to hold connections gracefully.

### 2. Large File Upload Limits
Default upload ceiling is set to 5 MB. If you need larger uploads, set the environment variable:
`MAX_UPLOAD_SIZE=10485760` (10 MB).
