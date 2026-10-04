import { createServer } from "node:http";
import { createApi } from "../../app/create-app.js";

export const startHttpServer = (port = Number(process.env.PORT ?? 8787)) => {
  const api = createApi();
  const server = createServer(async (request, response) => {
    await api(request, response);
  });
  server.listen(port);
  return server;
};
