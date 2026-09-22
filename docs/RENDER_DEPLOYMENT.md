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
