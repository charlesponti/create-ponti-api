import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

// Status/health endpoint
const statusPlugin: FastifyPluginAsync = async (server) => {
  server.get("/", async () => ({ up: true }));
};

export default fp(statusPlugin);
