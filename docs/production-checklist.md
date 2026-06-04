# Production Checklist

## Required Secrets

- MongoDB Atlas connection string
- Firebase web app config
- Firebase Admin service account
- Gemini API key
- JWT secret

## Required Platform Settings

- Vercel frontend env points to Render backend.
- Render `CLIENT_ORIGIN` points to Vercel frontend.
- Firebase authorized domains include the Vercel domain.
- MongoDB Atlas network access allows Render.

## Commands

```bash
npm run typecheck
npm run build
```

## Current Build Note

The frontend currently builds successfully with a Vite warning that the main JS chunk is over 500 kB. This can be improved later with route-level lazy loading.

