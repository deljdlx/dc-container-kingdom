# Mock Docker

This folder contains the lightweight Docker API mock used to run the app and its tests without a real Docker daemon.

- `docker-mock.js` — core request handler; returns deterministic responses for the Docker endpoints used by the app.
- `vite-docker-mock-plugin.js` — Vite middleware that exposes the mock under `/api/docker/*` during local development.
- `fixtures/containers.json` — captured container list served as the mock's starting dataset.

## What is static, and what moves with time

A mock that is too stable hides a whole family of bugs: a container fingerprint
built on the human-readable `Status` looked perfectly stable here while it
drifted every second against a real daemon. So the mock reproduces the
**variability** of the real API, not only its shape.

| Field | Behaviour |
|---|---|
| `Id`, `Names`, `Image`, `Labels`, `NetworkSettings`, `State` | **static** — read from the fixtures |
| `Created` | **static** — a birth date does not drift |
| `Status` | **computed** from `Created` and the clock (`Up 4 seconds` → `Up About a minute` → `Up 8 days`) |
| CPU stats | **computed** — grows with the clock so two samples yield a real percentage |
| Memory stats | **computed** — breathes ±3% around a per-container base, too little to flip a `memory--*` threshold |

The clock is **injectable** everywhere (`getContainers(now)`, `makeStats(id, now)`,
`handleDockerRequest(method, path, now)`), so tests stay deterministic: same
clock, same answer. The fixtures keep their own `Status`, but it is a fallback —
never served as-is.
