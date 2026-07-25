# Mock Docker

This folder contains the lightweight Docker API mock used to run the app and its tests without a real Docker daemon.

- `docker-mock.js` — core request handler; returns deterministic responses for the Docker endpoints used by the app.
- `vite-docker-mock-plugin.js` — Vite middleware that exposes the mock under `/api/docker/*` during local development.
- `fixtures/containers.json` — captured container list served as the mock's starting dataset.