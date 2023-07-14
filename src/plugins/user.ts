import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const usersPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  const { prisma } = server;

  server.get("/allUsers", async (request, reply) => {
    const { tracer } = request.openTelemetry();
    const childSpan = tracer.startSpan("prisma").setAttributes({
      "prisma.model": "user",
      "prisma.action": "findMany",
    });
    const users = await prisma.user.findMany();
    childSpan.end();
    return reply.send(users).code(200);
  });

  server.get(
    "/me",
    {
      preValidation: server.verifySession,
    },
    async (request, reply) => {
      const session = request.session.get("data");
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: session.userId,
          },
        });

        /**
         * If user does not exist, then we should delete their
         * session and return a 401.
         */
        if (!user) {
          request.session.delete();
          return reply.send().code(401);
        }

        return reply.send(user).code(200);
      } catch (err) {
        request.log.info("Could not fetch user", { err });
        return reply.code(500).send();
      }
    }
  );

  server.get(
    "/users",
    {
      preValidation: server.verifyIsAdmin,
    },
    async (request, reply) => {
      try {
        const users = await server.prisma.user.findMany();
        reply.send(users).code(200);
      } catch (err) {
        request.log.info("Could not fetch users", err);
        reply.code(500).send();
      }
    }
  );
};

export default fp(usersPlugin);
