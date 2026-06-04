# API Design

Base URL: `/api/v1`

All protected routes require:

```http
Authorization: Bearer <firebase_id_token>
```

## Auth

- `POST /auth/session`: verify Firebase token, upsert user, return Mongo-backed user.
- `GET /auth/me`: return current authenticated user with profile.

## Profiles

- `GET /profiles/me`: get current student profile.
- `PUT /profiles/me`: create or update current student profile.
- `GET /profiles`: search/filter discoverable profiles.
- `GET /profiles/:id`: get a public profile.

## Matching

- `POST /matches/generate`: generate and persist matches for current user.
- `GET /matches/recommended`: list persisted recommended students.

Matching uses persisted `Profile` documents and stores generated results in the `Match` collection.

## Projects

- `POST /projects`: create a project.
- `GET /projects`: list/search projects.
- `GET /projects/:id`: get a project.
- `POST /projects/:id/apply`: apply to join.
- `POST /projects/:id/invite`: invite a member.
- `POST /projects/:id/applications/:applicationId/decision`: accept or reject an application.

Project applications are persisted in the `Application` collection and accepted applicants are added to project membership.

## Hackathon Teams

- `POST /hackathon-teams`: create a team.
- `GET /hackathon-teams`: list/search teams.
- `GET /hackathon-teams/:id`: get team details.
- `POST /hackathon-teams/:id/apply`: apply to join.
- `POST /hackathon-teams/:id/suggestions`: generate AI-assisted team role suggestions.
- `POST /hackathon-teams/:id/applications/:applicationId/decision`: accept or reject a team application.

Hackathon team suggestions are generated from persisted student profiles and team role requirements.

## Roadmaps

- `POST /roadmaps`: generate and persist an AI roadmap.
- `GET /roadmaps`: list current user's roadmaps.
- `GET /roadmaps/:id`: get one roadmap owned by current user.

Roadmaps are generated with Gemini, validated as structured JSON, and persisted in MongoDB.

## Dashboard

- `GET /dashboard`: aggregate recommended students, open projects, skills, and career progress.

## Notifications

- `GET /notifications`: list current user's notifications.
- `PATCH /notifications/:id/read`: mark one notification as read.

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```
