# 🚀 Deployment Guide: Render (Server) & Vercel (Client)

This guide walks you through deploying the **Scan & Bill** application:
- **Backend API (`server/`)** ➔ **Render** (Node.js Web Service)
- **Frontend POS Web App (`client/`)** ➔ **Vercel** (Next.js Application)
- **Database** ➔ **MongoDB Atlas** (Cloud Managed)

---

## 📋 Prerequisites

1. Your project is pushed to a **GitHub Repository**.
2. A free account on [Render.com](https://render.com).
3. A free account on [Vercel.com](https://vercel.com).
4. Access to your [MongoDB Atlas](https://cloud.mongodb.com) database cluster.

---

## Step 1: Prepare MongoDB Atlas for Cloud Hosting

Render runs on dynamic cloud IP addresses. You must ensure MongoDB Atlas allows connections from Render:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Network Access** (under the *Security* section in the left sidebar).
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`) and click **Confirm**.
5. Go to **Database Access** and ensure your database user credentials are known.

---

## Step 2: Deploy Backend Server to Render

### Option A: 1-Click Blueprint (Recommended)
Because we added [`render.yaml`](render.yaml) to your repository, Render can configure everything automatically:
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Blueprint**.
3. Select your GitHub repository.
4. Render will read `render.yaml` and configure `scan-bill-server`.
5. Under environment variables, provide your `MONGODB_URI`:
   ```properties
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.fnbppmc.mongodb.net/scan-bill?retryWrites=true&w=majority
   ```
6. Click **Apply**.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `scan-bill-server`
   - **Region**: Choose closest to you (e.g., Singapore / Oregon / Frankfurt)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced** and set:
   - **Health Check Path**: `/api/health`
5. Add the following **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Port listened to |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `CORS_ORIGIN` | `*` | Or your Vercel URL once deployed |
6. Click **Create Web Service**.
7. Once deployed, note down your Render URL (e.g. `https://scan-bill-server.onrender.com`).

---

## Step 3: Deploy Frontend POS to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Select and import your GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: Click **Edit** and select the **`client`** folder! *(Crucial)*
5. Expand the **Environment Variables** section:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://<your-render-service-name>.onrender.com/api`
     *(Make sure to include the `/api` path at the end and `https://`)*
6. Click **Deploy**.

---

## Step 4: Verification & Live Testing

1. **Verify Backend on Render**:
   - Open `https://<your-render-url>.onrender.com/` in your browser.
     ➔ Should return: `{"success": true, "message": "Scan & Bill POS API Server is operational"}`.
   - Open `https://<your-render-url>.onrender.com/api/health` in your browser.
     ➔ Should return: `{"status": "UP"}`.

2. **Verify Frontend on Vercel**:
   - Open your Vercel URL (e.g. `https://scan-bill-pos.vercel.app`).
   - The server status badge in the navbar should illuminate green: **Server Online**.
   - Test scanning or clicking any test barcode presets (e.g., *Maggi Noodles* or *Good Day Cookies*).
   - Add to cart and click **Generate Bill & Checkout** to verify receipt generation and print support.

---

## 🛠️ Summary of Configuration Files Added

| File | Purpose |
| :--- | :--- |
| [`.gitignore`](.gitignore) | Ignores `node_modules`, `.next`, build artifacts, and secret `.env` files across root, client, server, and mobile. |
| [`render.yaml`](render.yaml) | Render Blueprint for zero-friction server deployment with health check path `/api/health`. |
| [`client/vercel.json`](client/vercel.json) | Vercel configuration explicitly targeting Next.js. |
| [`client/.env.example`](client/.env.example) | Template for `NEXT_PUBLIC_API_URL` environment variable on Vercel. |
| [`server/.env.example`](server/.env.example) | Template for `PORT`, `MONGODB_URI`, `NODE_ENV`, and `CORS_ORIGIN` on Render. |
| [`server/src/app.js`](server/src/app.js) | Enhanced with root endpoint `/` and dynamic `CORS_ORIGIN` handling. |
| [`server/package.json`](server/package.json) | Added `engines: { "node": ">=18.0.0" }` for Render Node runtime. |
