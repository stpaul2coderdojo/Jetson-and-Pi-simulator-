# Deploying EdgeDocker Sim on Render

This guide walks you through deploying **EdgeDocker Sim** onto [Render](https://render.com) as a globally distributed, high-performance static web application with automated continuous deployment and free SSL.

---

## Option 1: 1-Click Blueprint Deployment (Recommended)

This repository includes a pre-configured `render.yaml` infrastructure-as-code Blueprint file.

1. Push this repository to your GitHub or GitLab account.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your Git repository containing EdgeDocker Sim.
5. Render will automatically detect `render.yaml` and configure:
   - **Service Name:** `edgedocker-sim`
   - **Environment:** `Static Site`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `./dist`
   - **SPA Route Rewrite:** `/*` &rarr; `/index.html` (HTTP 200)
   - **Security Headers:** `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`
6. Click **Apply**. Render will automatically build the app and provide a live public URL (e.g., `https://edgedocker-sim.onrender.com`).

---

## Option 2: Manual Static Site Setup

If you prefer to configure the deployment manually in the Render Web Console:

1. In the Render Dashboard, click **New +** &rarr; **Static Site**.
2. Connect your GitHub repository.
3. Fill in the following deployment parameters:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `edgedocker-sim` | Or any custom name |
| **Branch** | `main` | Production branch to auto-deploy |
| **Root Directory** | *(leave blank)* | Project root |
| **Build Command** | `npm install && npm run build` | Builds minified assets to `./dist` |
| **Publish Directory** | `dist` | Directory served by Render CDN |

4. Scroll down to the **Redirects/Rewrites** section:
   - Click **Add Rule**
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - *This ensures client-side routing works smoothly when users refresh pages.*

5. Click **Create Static Site**.

---

## 🔄 How to Redeploy on Render (3 Fast Methods)

When you update your code (such as adding Jupyter Notebook, Docker configurations, or Gemini AI features), use one of the following methods to redeploy:

### Method 1: Automatic Continuous Redeployment (Recommended)
Render is directly connected to your GitHub repository:
1. Commit and push your latest code to your connected GitHub branch:
   ```bash
   git add .
   git commit -m "Update Docker, Jupyter IDE, and Gemini AI"
   git push origin main
   ```
2. Render detects the push and immediately starts an automated build and atomic redeployment.

### Method 2: Manual Redeploy from the Render Dashboard
If you want to trigger a redeploy immediately or refresh after changing build settings:
1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Select your service: **`edgedocker-sim`**.
3. In the top-right corner, click **Manual Deploy** &rarr; **Clear build cache & deploy**.
   *(Clearing the build cache ensures new dependencies and Vite plugins are compiled cleanly).*
4. Monitor the live build log. Once complete, your site will be live immediately.

### Method 3: Trigger Instant Redeployment via Deploy Hook (API / Webhook)
You can trigger redeployments programmatically from terminal, CI/CD, or GitHub Actions:
1. In Render Dashboard, go to **Settings** &rarr; scroll to **Deploy Hook**.
2. Copy your unique URL (format: `https://api.render.com/deploy/srv-xxxxxx?key=yyyyyy`).
3. Trigger an instant redeployment with a simple `curl` POST:
   ```bash
   curl -X POST "https://api.render.com/deploy/srv-xxxxxx?key=yyyyyy"
   ```

---

## Option 3: Full-Stack Docker or Node Web Service on Render

If you prefer to run EdgeDocker Sim as a full-stack containerized service with active server-side `/api/health` and `/api/gemini/chat` proxying:

1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your repository and select **Docker** as the environment (or **Node**).
3. If using Docker: Render automatically detects the root `Dockerfile` and builds the multi-stage image.
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `GEMINI_API_KEY`: *(your Google AI Studio API key)*
5. Set **Health Check Path**: `/api/health`.
6. Click **Create Web Service**.

---

## Features on Render

- **Zero Cost:** Runs permanently on Render's generous Free Tier for static sites.
- **Global CDN:** Instant edge-caching across Render's global Content Delivery Network.
- **Automated Continuous Deployment:** Every push to `main` triggers a fresh build and atomic deploy.
- **Pull Request Previews:** Render can automatically deploy ephemeral preview instances for pull requests.
- **Custom Domains:** Supports free automatic Let's Encrypt SSL certificates for custom domains (e.g. `sim.yourdomain.com`).

---

## Verifying the Build Locally

Before pushing to Render, you can test the production build locally:

```bash
# Clean install
npm ci

# Run test suite
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
Visit `http://localhost:4173` to test the exact bundle that Render will serve.
