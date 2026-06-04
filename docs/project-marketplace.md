# Project Marketplace

The project marketplace is implemented as an authenticated MongoDB-backed collaboration feature.

## Backend Routes

- `POST /api/v1/projects`: create a project and add the owner as the first member.
- `GET /api/v1/projects`: list/search projects by text, skill, interest, status, or current user's projects.
- `GET /api/v1/projects/:id`: return project detail plus applications.
- `POST /api/v1/projects/:id/apply`: create or update a pending join application.
- `POST /api/v1/projects/:id/invite`: owner-only invite endpoint.
- `POST /api/v1/projects/:id/applications/:applicationId/decision`: owner-only accept/reject endpoint.

## Data Flow

- Projects are stored in the `Project` collection.
- Join requests are stored in the `Application` collection.
- Project application and invite events create `Notification` records.
- Accepting an application adds the applicant to the project `members` array.
- A full project automatically moves to `in_progress` when accepted members reach `maxMembers`.

## Frontend

- `/projects`: searchable project marketplace.
- `/projects/new`: create project form.
- `/projects/:id`: detail page, application flow, member list, and owner application decisions.

