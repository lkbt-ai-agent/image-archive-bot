# ChatGPT-style chat session behavior

## Changes

- Opening `/chat` now starts a draft chat without creating or assigning a backend `sessionId`.
- Draft chats render without an initial assistant greeting.
- The New Chat sidebar action navigates to `/chat` instead of creating a session immediately.
- The first submitted message creates a null-titled chat session, assigns the new `sessionId`, and updates the URL to `/chat/{sessionId}`.
- Chat titles are updated by the backend only after the assistant message has been created.
- The sidebar recents list refreshes after the first assistant response, so the generated title appears automatically.
- Recents does not refetch on the intermediate first-message URL transition, which prevents a new null-title chat from temporarily appearing below older chats.

## Verification

- `npm run lint` from `apps/frontend` passed.
- `apps/backend/.venv/bin/python -m pytest apps/backend/tests/test_api_integration.py -q` passed with `1 passed, 4 skipped`.
- Playwright verified that sending the first message from `/chat` updates the browser URL to `/chat/11111111-1111-4111-8111-111111111111`.
- Playwright verified that after the first assistant response returns, the sidebar recents list displays the updated title `Explain archived image patterns`.
- Playwright verified that navigating from `/chat/{sessionId}` to `/chat` clears the previous conversation and renders a new draft chat with no greeting.
- Playwright verified that a newly created chat is not inserted into Recents before the first assistant response, then appears as the first item after the title update.
