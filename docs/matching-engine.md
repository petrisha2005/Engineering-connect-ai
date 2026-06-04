# Matching Engine

The matching engine generates MongoDB-backed student recommendations from persisted profile data.

## Backend Routes

- `POST /api/v1/matches/generate`: scores eligible student profiles, upserts `Match` documents, and returns generated matches.
- `GET /api/v1/matches/recommended`: returns stored recommendations sorted by match score and compatibility score.

Both routes require Firebase-authenticated backend sessions.

## Scoring Inputs

The deterministic MVP scoring service compares:

- Shared skills
- Shared interests
- Shared career goals
- Same branch
- Same college
- Nearby academic year
- Target student's availability

The service generates:

- `matchScore`
- `compatibilityScore`
- `sharedSkills`
- `sharedInterests`
- `sharedGoals`
- `reasons[]`

## Frontend

- `/matches`: loads stored recommendations and can generate fresh matches from current profiles.
- Dashboard links into the matching flow.
- Match cards show scores, reasons, shared tags, and a link to the matched student's profile.

