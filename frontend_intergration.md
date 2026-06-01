# Frontend Integration

- Replace `my-app/lib/mock-data.ts` usage with backend API calls.
- Add frontend API client configuration using a public backend base URL, without exposing secrets.
- Wire archive page to `GET /api/archive/images`.
- Wire generated page to `GET /api/archive/images?source_type=generated` or `GET /api/generation`.
- Wire chat page to:
  - create/reuse chat sessions
  - post messages
  - render generated image results
- Wire upload UI to `POST /api/archive/images`.
- Add loading, empty, and error states for backend API calls.
