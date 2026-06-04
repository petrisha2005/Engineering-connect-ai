# Profile System

The profile system is implemented as an authenticated MongoDB-backed feature.

## Backend

Routes:

- `GET /api/v1/profiles/me`: returns the current user's profile.
- `PUT /api/v1/profiles/me`: creates or updates the current user's profile.
- `GET /api/v1/profiles`: searches discoverable student profiles.
- `GET /api/v1/profiles/:id`: returns a public profile detail.

The backend validates profile input with Zod, persists profile data with Mongoose, normalizes searchable arrays, and links each created profile back to the authenticated `User` document.

## Frontend

Pages:

- `/profile`: create or edit the signed-in user's student profile.
- `/profiles`: search and browse other student profiles.
- `/profiles/:id`: view public profile details.

The dashboard also shows profile status and links the student into the profile flow.

