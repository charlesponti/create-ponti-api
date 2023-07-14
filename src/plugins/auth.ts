import { TokenType } from "@prisma/client";
import { add } from "date-fns";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import logger from "../utils/logger";

interface LoginInput {
  email: string;
}

interface AuthenticateInput {
  email: string;
  emailToken: string;
}

const COOKIE_SECRET = process.env.COOKIE_SECRET || "SUPER_SECRET_TOKEN";
const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12;

if (!COOKIE_SECRET) {
  logger.error(
    "warn",
    "The COOKIE_SECRET env var is not set. This is unsafe! If running in production, set it."
  );
  throw Error;
}

// Generate a random 8 digit number as the email token
function generateEmailToken(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

const authPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post(
    "/authenticate",
    {
      schema: {
        body: {
          email: { type: "string" },
          emailToken: { type: "string" },
        },
      },
    },
    async (request, reply) => {
      // 👇 get prisma from shared application state
      const { prisma } = server;
      // 👇 get the email and emailToken from the request payload
      const { email, emailToken } = request.body as AuthenticateInput;

      // Get short lived email token
      const fetchedEmailToken = await prisma.token.findUnique({
        where: {
          emailToken,
        },
        include: {
          user: true,
        },
      });

      if (!fetchedEmailToken) {
        reply.code(400).send("Invalid token");
      }

      if (!fetchedEmailToken.valid) {
        request.session.delete();
        // If the token doesn't exist or is not valid, return 401 unauthorized
        reply.code(401).send();
      }

      if (fetchedEmailToken.expiration < new Date()) {
        request.session.delete();
        // If the token has expired, return 401 unauthorized
        reply.code(401).send("Token expired");
      }

      if (fetchedEmailToken.user?.email !== email) {
        request.session.delete();
        // If token doesn't match the email passed in the payload, return 401 unauthorized
        reply.code(401).send();
      }

      const tokenExpiration = add(new Date(), {
        hours: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
      });

      const [createdToken] = await prisma.$transaction([
        // Persist token in DB so it's stateful
        prisma.token.create({
          data: {
            type: TokenType.API,
            expiration: tokenExpiration,
            user: {
              connect: {
                email,
              },
            },
          },
          include: {
            user: true,
          },
        }),
        // Invalidate the email token after it's been used
        prisma.token.update({
          where: {
            id: fetchedEmailToken.id,
          },
          data: {
            valid: false,
          },
        }),
      ]);

      const { id: userId, isAdmin } = createdToken.user;

      request.session.set("data", { isAdmin, roles: [], userId });
      return reply.send().code(200);
    }
  );

  server.post("/logout", {}, async (request, reply) => {
    request.session.delete();
    reply.send().code(200);
  });

  /**
   * Login/Registration handler
   *
   * Because there are no passwords, the same endpoint is used for login and regsitration
   * Generates a short lived verification token and sends an email
   */
  server.post(
    "/login",
    {
      schema: {
        body: {
          email: { type: "string" },
        },
      },
    },
    async (request, reply) => {
      // 👇 get prisma and the sendEmailToken from shared application state
      const { prisma, sendEmailToken } = server;
      // 👇 get the email from the request payload
      const { email } = request.body as LoginInput;
      // 👇 generate an alphanumeric token
      const emailToken = generateEmailToken();
      // 👇 create a date object for the email token expiration
      const tokenExpiration = add(new Date(), {
        minutes: EMAIL_TOKEN_EXPIRATION_MINUTES,
      });

      try {
        // 👇 create a short lived token and update user or create if they don't exist
        await prisma.token.create({
          data: {
            emailToken,
            type: TokenType.EMAIL,
            expiration: tokenExpiration,
            user: {
              connectOrCreate: {
                create: {
                  email,
                },
                where: {
                  email,
                },
              },
            },
          },
        });

        // 👇 send the email token
        await sendEmailToken(email, emailToken);
        return reply.send().code(200);
      } catch (error) {
        request.log.error((error as Error)?.message);
        return reply.code(500).send({ message: "Could not create account" });
      }
    }
  );

  server.decorate("verifyPermissions", (permissions: string[]) => {
    return (request: FastifyRequest, reply: FastifyReply, done: Function) => {
      const data = request.session.get("data");

      if (!data) {
        return reply.code(401).send();
      }

      if (!data.roles.includes(permissions[0])) {
        return reply.code(403).send();
      }

      return done();
    };
  });

  server.decorate(
    "verifyIsAdmin",
    (request: FastifyRequest, reply: FastifyReply, done: Function) => {
      const data = request.session.get("data");

      if (!data) {
        reply.code(401).send();
      }

      if (!data.isAdmin) {
        reply.code(403).send();
      }

      done();
    }
  );

  server.decorate(
    "verifySession",
    (request: FastifyRequest, reply: FastifyReply, done: Function) => {
      const data = request.session.get("data");

      if (!data) {
        reply.code(401).send();
      }

      done();
    }
  );
};

export default fp(authPlugin);
