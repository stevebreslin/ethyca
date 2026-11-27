# Submission notes

## What I built

A responsive internal dashboard for reviewing privacy requests, with persistent light and dark themes. Reviewers can search and filter the request queue, browse it in 10-request pages, inspect request and policy details, see missing policy/assignment data, and approve or deny active requests. On narrow screens, the selected request details appear above the queue. The dashboard also supports creating a request on a person's behalf. It uses the supplied JSON Server API and seed data.

An active deletion request (`pending` or `in_progress`) for the same normalized email address blocks approval of an access request. The conflict is shown in the queue and detail view, and the approval action is disabled. Denial remains available.

## Trade-offs

- Used Vite rather than Create React App for a current, lightweight React + TypeScript setup.
- Used JSON Server as the persistence layer to keep the project focused on the UI. The hosted demo API is public and unauthenticated, with read/write access; use synthetic data only. The Render free service can sleep and has ephemeral storage, so changes reset when the service restarts.
- Pagination is client-side because the mock API loads the full request collection; server-side pagination would scale better for a larger dataset.
- GitHub Pages hosts the static frontend while Render hosts the API. The Pages workflow requires the `VITE_API_BASE_URL` repository Actions variable.
- Used a compact single-page queue/detail layout and custom dark styling over Bootstrap primitives rather than introducing a larger component framework.
- New requests use the matching policy if one exists; the dashboard still accepts missing or unknown policy references in existing data and presents unavailable policy details explicitly.
- Error notifications remain until dismissed; success and warning notifications auto-dismiss.

## AI tool usage

I used GitHub Copilot in VS Code to inspect the requirements and seed-data edge cases, implement a responsive React/TypeScript dashboard, enforce the deletion/access approval rule, and add tests and documentation. The prompts focused on those requirements, including graceful handling of missing data and API errors.

It worked well for scaffolding the app, implementing the main review workflow, and creating focused tests. The initial implementation needed corrections: the first test run exposed missing test cleanup between renders, and the first build exposed missing Vite client types for `import.meta.env`. I fixed both, then continued iterating on the UI based on manual browser checks and user feedback. The implementation is verified with 13 passing unit/UI tests, a successful production build, and browser checks of the responsive layout, filters, and pagination.

## What I would do next

Add server-side enforcement of the approval conflict, an audit trail and reviewer identity, server-side pagination, and end-to-end coverage against the running API. I would also add a manual accessibility and narrow-screen browser pass.
