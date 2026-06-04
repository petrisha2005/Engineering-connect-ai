# Deployment Guide

EngineerConnect AI deploys as:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Authentication: Firebase Authentication
- AI: Gemini API

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow Render access in Network Access.
4. Copy the connection string into `MONGODB_URI`.

Recommended database name:

```text
engineerconnect
```

## 2. Firebase

1. Create a Firebase project.
2. Enable Google sign-in under Authentication.
3. Add authorized domains:
   - local development domain
   - Vercel frontend domain
4. Create a web app and copy the frontend config values.
5. Create a service account and copy:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## 3. Render Backend

Render can use the root `render.yaml` blueprint.

Build command:

```bash
npm install && npm run build --workspace backend
```

Start command:

```bash
npm run start --workspace backend
```

Health check:

```text
/api/v1/health
```

Backend environment variables:

- `NODE_ENV=production`
- `PORT=10000`
- `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`

After deployment, verify:

```text
https://your-render-service.onrender.com/api/v1/health
```

## 4. Vercel Frontend

Vercel uses root `vercel.json`.

Build command:

```bash
npm run build --workspace frontend
```

Output directory:

```text
frontend/dist
```

Frontend environment variables:

- `VITE_API_URL=https://your-render-service.onrender.com/api/v1`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 5. Deployment Order

1. Create MongoDB Atlas cluster.
2. Configure Firebase Auth and service account.
3. Deploy backend on Render.
4. Copy Render URL into Vercel `VITE_API_URL`.
5. Deploy frontend on Vercel.
6. Copy Vercel URL into Render `CLIENT_ORIGIN`.
7. Redeploy backend.
8. Add the Vercel domain to Firebase authorized domains.

## 6. Production Smoke Test

Run these checks after deployment:

- Backend health endpoint returns `{ "status": "ok" }`.
- Google login opens and completes.
- `/api/v1/auth/me` returns the signed-in MongoDB user.
- Profile creation persists to MongoDB.
- Project creation persists to MongoDB.
- Hackathon team creation persists to MongoDB.
- Match generation uses saved profiles.
- Gemini roadmap generation creates a saved roadmap.

## 7. Notes

- The frontend is an SPA, so `vercel.json` rewrites all routes to `index.html`.
- Render injects `PORT`; the backend reads `PORT` from env.
- Gemini roadmap generation requires a valid `GEMINI_API_KEY`.
- Do not commit real `.env` files.

