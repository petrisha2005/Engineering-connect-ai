# Gemini Roadmap Generator

The roadmap generator is implemented as an authenticated Gemini-powered career planning feature.

## Backend Routes

- `POST /api/v1/roadmaps`: generate a roadmap with Gemini and persist it.
- `GET /api/v1/roadmaps`: list the current user's saved roadmaps.
- `GET /api/v1/roadmaps/:id`: get one saved roadmap owned by the current user.

## Data Flow

- The frontend sends a desired career.
- The backend prompts Gemini for strict JSON.
- The backend parses and validates the JSON response.
- The roadmap is stored in the `Roadmap` collection.
- A `roadmap_generated` notification is created.

If Gemini fails or returns malformed JSON, the API returns an error instead of generating fake roadmap content.

## Frontend

- `/roadmaps`: generate a roadmap and browse saved roadmaps.
- `/roadmaps/:id`: view skills, projects, certifications, learning path, resources, and interview preparation.

