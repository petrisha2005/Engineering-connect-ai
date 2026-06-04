# Authentication Setup

EngineerConnect AI uses Firebase Authentication for Google login and MongoDB for application users.

## Firebase Console

1. Create a Firebase project.
2. Enable Authentication.
3. Enable Google as a sign-in provider.
4. Add `localhost` and the deployed frontend domain to authorized domains.
5. Create a web app and copy its Firebase config into `frontend/.env`.
6. Create a Firebase Admin service account and copy its credentials into `backend/.env`.

## Frontend Environment

Copy `frontend/.env.example` to `frontend/.env` and fill in:

- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Backend Environment

Copy `backend/.env.example` to `backend/.env` and fill in:

- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`

The backend expects frontend requests to include:

```http
Authorization: Bearer <firebase_id_token>
```

## Implemented Auth Routes

- `POST /api/v1/auth/session`: verifies Firebase token, upserts MongoDB user, returns the app user.
- `GET /api/v1/auth/me`: verifies Firebase token, returns the current app user.

## Implemented Frontend Auth Flow

- `/login`: Google login with Firebase popup.
- `/dashboard`: protected route requiring Firebase and backend session.
- Auth state is managed by Zustand and restored with `onAuthStateChanged`.

