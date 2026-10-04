import { createServer } from "node:http";
import { createApi } from "../../app/create-app.js";
import { createApplication } from "../../app/container.js";

export const startHttpServer = (port?: number) => {
  const application = createApplication();
  const api = createApi({ application });
  const server = createServer(async (request, response) => {
    await api(request, response);
  });
  server.listen(port ?? application.config.httpPort);
  return server;
};
