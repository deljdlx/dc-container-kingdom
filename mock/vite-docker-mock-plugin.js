import { handleDockerRequest } from './docker-mock.js';

/**
 * Vite dev-server plugin that answers `/api/docker/*` requests from the mock,
 * mirroring the nginx proxy that forwards to the Docker socket in production.
 * Lets the whole app run with `npm run dev` and no Docker daemon.
 *
 * @returns {import('vite').Plugin}
 */
export default function dockerMockPlugin() {
  const PREFIX = '/api/docker';

  return {
    name: 'docker-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith(PREFIX)) {
          return next();
        }

        const path = req.url.slice(PREFIX.length) || '/';
        const result = handleDockerRequest(req.method, path);

        if (!result) {
          res.statusCode = 404;
          res.end(`docker-mock: no handler for ${req.method} ${path}`);
          return;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = result.status;

        if (result.status === 204 || result.body === '') {
          res.end();
          return;
        }

        if (typeof result.body === 'string') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(result.body);
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    },
  };
}
