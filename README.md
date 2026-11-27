# Ethyca Frontend Take-Home Challenge: Privacy Request Dashboard

## Overview

Build a simple dashboard for managing **privacy requests** — the kind of request a user submits to ask a company to access, delete, or export their personal data.

You have **2 hours**, no more. Prioritize working software over polish. Document trade-offs you made.

We are not evaluating your choice of framework, component library, or tooling setup, feel free to use whatever tech stack you're most comfortable with.

---

## Mock API

A mock REST API is provided using [json-server](https://github.com/typicode/json-server). To start it:

```bash
npm install
npm start   # starts API at http://localhost:3001
```

Available endpoints:

- `GET    /privacy_requests` — list all requests
- `GET    /privacy_requests/:id` — get a single request
- `POST   /privacy_requests` — create a new request
- `PATCH  /privacy_requests/:id` — update a request (e.g., change status)
- `GET    /policies` — list all policies
- `GET    /policies/:id` — get a single policy

You may use this mock server, import `db.json` directly as static data, use MSW, or handle the data however fits your approach. The mock server is provided as a convenience, not a requirement.

---

## Requirements

A privacy request represents a person asking a company to do something with their personal data — access it, delete it, or export it. An internal team reviews and acts on these requests.

**Required:**

- Build a UI that allows an internal user to browse existing requests and review the details of a request
- Implement the following business rule: **a pending or in-progress deletion request for a given email address blocks approval of any access request for the same email.** Your UI should surface this conflict in a way that makes sense to an internal reviewer.

**Additionally, implement as many of the following as you can:**

1. Allow the internal user to take action on a request (approve or deny)
2. Allow the internal user to submit a new request on behalf of an external user

How you present this — what information you surface, how you organize the interactions, what the workflow looks like — is up to you. We're interested in seeing the choices you make.

> **Note:** The data contains edge cases and real-world quirks that a good UI should handle gracefully. Part of the challenge is noticing them.

---

## Data Notes

- Each privacy request references a `policy_id`. Policy information is available at `/policies`.
- Request statuses follow this progression: `pending` (submitted, not yet acted on) → `in_progress` (being actively reviewed) → `approved` or `denied`.
- Some records have missing or null fields — your UI should handle these gracefully.
- The data shape is a starting point. You may extend it if your design calls for it.
- You don't need to handle authentication or user roles.

---

## Submission

Fork or clone this repo, build your solution, and send us a link along with a short write-up (a `SUBMISSION.md` or the PR description works fine) covering:

1. **What you built** — a brief description of your implementation
2. **Trade-offs** — what you skipped or simplified and why
3. **AI tool usage** — did you use Claude, Codex, or similar? What did you prompt it to do, what worked, what didn't, and how did you verify the output?
4. **What you'd do next** — if you had another hour, what would you add or change?

---

## Evaluation Criteria

We're looking at:

- **Correctness** — does it work as described?
- **Code quality** — is it readable, reasonably structured, easy to follow?
- **TypeScript usage** — are types meaningful, or just `any` everywhere?
- **Handling of edge cases** — what happens with missing data or failed requests?
- **Judgment** — did you make sensible trade-offs given the time constraint?

## Running the dashboard

Install dependencies once:

```bash
npm install
```

In one terminal, start the mock API at `http://localhost:3001`:

```bash
npm start
```

In another terminal, start the React app at `http://localhost:5173`:

```bash
npm run dev
```

Run the unit and UI tests with `npm test`, or create a production build with `npm run build`.
The app expects the mock API on port 3001 by default; set `VITE_API_BASE_URL` to use another API URL.

See [SUBMISSION.md](./SUBMISSION.md) for implementation choices, trade-offs, AI tool usage, and next steps.

## Publishing a demo

The GitHub Pages workflow builds the frontend when changes are pushed to `main`. GitHub Pages serves static files only, so the JSON Server API must be hosted separately. The included [`render.yaml`](./render.yaml) configures a Render web service for that API.

1. Push the deployment files to GitHub. Create the Render service from the repository's `render.yaml` Blueprint and copy its `onrender.com` service URL.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add `VITE_API_BASE_URL` with the Render service URL (for example, `https://ethyca-privacy-api.onrender.com`).
3. Open **Settings → Pages** and set the source to **GitHub Actions**.
4. Merge or push the deployment changes to `main`. The **Deploy to GitHub Pages** workflow builds and publishes the app.

For this repository, the Pages URL is `https://stevebreslin.github.io/ethyca/`.

The hosted JSON Server is a public, unauthenticated demo API with read/write access. Use only synthetic data. The Render free service can sleep while idle, and its filesystem is ephemeral; the seed data is regenerated when the service restarts, so API changes are not durable across restarts. Do not use this setup for real personal data or production.
