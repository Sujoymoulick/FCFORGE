# FCFORGE — Global Football Esports Arena

> Official competitive esports gaming platform for **eFootball™ Mobile** & **EA SPORTS FC™ Mobile**. Featuring hardware-accelerated 3D WebGL athlete experience, interactive 3D championship trophy, global ladders, and tournament brackets.

---

## ⚡ Tech Stack

* **Framework**: [Astro 7](https://astro.build) (Static Site Generation / SSG)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Vite plugin)
* **3D Graphics & Physics**: [Three.js](https://threejs.org) with custom WebGL shaders & PBR materials
* **Icons**: Lucide Icons (`lucide-astro`)
* **Deployment Target**: [Cloudflare Pages](https://pages.cloudflare.com) via GitHub integration

---

## ☁️ Cloudflare Workers Deployment Guide

FCForge is configured to deploy directly to **Cloudflare Workers** using **Workers with Static Assets**, running on Cloudflare's global edge network with sub-millisecond asset delivery and zero serverless execution cold-starts.

### Method 1: Cloudflare Dashboard Git Connection (Workers Builds)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Compute (Workers & Pages)** > **Create application**.
3. Under the **Workers** section, click **Import a repository** (Workers Builds).
4. Connect your GitHub account and select:
   * **Repository**: `Sujoymoulick/FCFORGE`
5. Configure the Build Settings:
   * **Build command**: `npm run build`
   * **Deploy command**: `npx wrangler deploy`
   * **Production branch**: `main`
6. (Optional) In **Environment variables**:
   * `NODE_VERSION` = `22` (automatically detected from `.nvmrc` / `.node-version`)
7. Click **Save and Deploy**.

Cloudflare will automatically build the project and deploy it to a live `*.workers.dev` subdomain (with optional custom domain). Every subsequent `git push` to `main` triggers an automatic edge deployment.

---

### Method 2: Local Preview & Deployment via Wrangler

You can also test and deploy directly from your terminal using Wrangler:

```sh
# 1. Build and preview locally in the official Cloudflare workerd runtime
npm run preview:workers

# 2. Build and deploy to Cloudflare Workers
npm run deploy
```

---

## 📁 Cloudflare Configuration Files

* **[`wrangler.jsonc`](./wrangler.jsonc)**: Official Cloudflare Workers configuration with `"assets": { "directory": "./dist" }` and `nodejs_compat`.
* **[`.nvmrc`](./.nvmrc)** & **[`.node-version`](./.node-version)**: Pins Node.js version to 22.x for Cloudflare's build environment.
* **[`public/_headers`](./public/_headers)**: Edge caching rules (immutable 1-year cache for 3D model `/messimodel.glb`, fonts, and hashed Vite assets) + security headers.
* **[`public/_redirects`](./public/_redirects)**: URL normalization and redirect rules.
* **[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)**: Automated CI/CD pipeline for GitHub Actions deploying to Cloudflare Workers.

---

## 🏃 Local Development

```sh
# Install dependencies
npm install

# Start development server in background mode
astro dev --background

# Server management commands
astro dev status   # Check server health
astro dev logs     # View live server output
astro dev stop     # Stop server
```

---

## 🏆 Project Highlights

* **Hero Athlete**: Interactive 3D Lionel Messi model (`/messimodel.glb`) with 360° mouse & touch drag-to-rotate inertia, and dynamic camera choreography across 7 narrative chapters.
* **Championship Trophy Stage**: Dedicated 3D WebGL trophy podium with 24K gold PBR materials, floating crown star, obsidian base, spin boost, celebration flare, and specs drawer.
* **Competitive Architecture**: 14 pre-rendered static routes (tournaments, player profiles, leaderboards, passport dashboard) built in sub-10 seconds.
