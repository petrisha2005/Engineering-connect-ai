# Hackathon Team Builder

The hackathon team builder is implemented as an authenticated MongoDB-backed team formation feature.

## Backend Routes

- `POST /api/v1/hackathon-teams`: create a team and add the creator as captain.
- `GET /api/v1/hackathon-teams`: list/search teams by text, skill, status, or current user's teams.
- `GET /api/v1/hackathon-teams/:id`: return team detail plus applications.
- `POST /api/v1/hackathon-teams/:id/apply`: create or update a pending team application.
- `POST /api/v1/hackathon-teams/:id/applications/:applicationId/decision`: captain-only accept/reject endpoint.
- `POST /api/v1/hackathon-teams/:id/suggestions`: generate role suggestions from real student profiles.

## Data Flow

- Teams are stored in the `HackathonTeam` collection.
- Join requests are stored in the `Application` collection.
- Application decisions update team membership and fill matching roles.
- A full team automatically moves from `forming` to `ready`.
- Suggestions compare required role skills and team-wide skills with persisted `Profile` records.

## Frontend

- `/hackathons`: searchable team builder.
- `/hackathons/new`: create team form.
- `/hackathons/:id`: detail page, application flow, member list, owner decisions, and role suggestions.

