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

## ☁️ Cloudflare Pages Git Deployment Guide

FCForge is optimized for instant, zero-cold-start deployment on Cloudflare's edge network via Git repository connection.

### Method 1: Cloudflare Dashboard Git Connection (Recommended)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Compute (Workers & Pages)** > **Create application**.
3. Select the **Pages** tab and click **Connect to Git**.
4. Choose **GitHub** and select your repository:
   * **Repository**: `Sujoymoulick/FCFORGE`
5. Configure the Build & Deployment Settings:
   * **Project name**: `fcforge`
   * **Production branch**: `main`
   * **Framework preset**: `Astro`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Root directory**: `/` (leave blank or `/`)
6. In **Environment variables** (Advanced):
   * Add variable: `NODE_VERSION` = `22` (or relies automatically on `.nvmrc` / `.node-version`)
7. Click **Save and Deploy**.

Cloudflare will automatically build the site and deploy it globally to a free `*.pages.dev` subdomain (with optional custom domain). Every subsequent push to `main` will trigger an automated deployment, and pull requests get instant preview URLs.

---

### Method 2: Local Preview & Deployment via Wrangler

You can also preview and deploy directly from your local terminal using Wrangler:

```sh
# 1. Build production static bundle
npm run build

# 2. Preview locally using Cloudflare's workerd environment
npm run preview:cloudflare

# 3. Direct deploy to Cloudflare Pages (requires Cloudflare login)
npm run deploy:cloudflare
```

---

## 📁 Cloudflare Configuration Files

* **[`wrangler.jsonc`](./wrangler.jsonc)**: Official Cloudflare Pages project configuration (`name`, `dist` output, `nodejs_compat`).
* **[`.nvmrc`](./.nvmrc)** & **[`.node-version`](./.node-version)**: Pins Node.js version to 22.x for Cloudflare's build image.
* **[`public/_headers`](./public/_headers)**: Edge caching rules (immutable 1-year cache for `/messimodel.glb` 3D model, fonts, and hashed Vite assets) + security headers.
* **[`public/_redirects`](./public/_redirects)**: URL normalization and redirect rules.
* **[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)**: Automated CI/CD pipeline for GitHub Actions.

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
