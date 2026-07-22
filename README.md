# 🎮 Container kingdom

<!--<SHORT-PRESENTATION>-->
Container Kingdom is an interactive visualization tool for Docker containers, using an RPG engine to graphically represent networks and services.
<!--</SHORT-PRESENTATION>-->

---

## 🚀 Try the Demo  

🕹️ Demo: [https://container-kingdom.jlb.ninja/](https://container-kingdom.jlb.ninja/)  

---

## 🛠️ Development

The app can run **without a Docker daemon**: a Vite dev-server plugin mocks the
`/api/docker/*` endpoints (the same routes nginx proxies to the Docker socket in
production) from a captured fixture of 35 containers.

```bash
npm install
npm run dev      # serves the app at http://localhost:5173 with the mocked Docker API
npm run build    # bundles the ES modules to dist/ for production
npm test         # run the Vitest suite
npm run test:watch
npm run lint
```

The front-end is written as **ES modules**: `index.html` loads a single entry
module (`container-kingdom/assets/js/bootstrap.js`) and every class declares its
own `import`s, so dependencies are explicit and the bundler can build `dist/`.

- `mock/fixtures/containers.json` — captured `GET /containers/json` payload.
- `mock/docker-mock.js` — framework-agnostic mock, shared by the dev server and the tests.
- `mock/vite-docker-mock-plugin.js` — wires the mock into the Vite dev server.

