/* eslint-disable */
import { FastifyValidationResult } from "fastify/types/schema";
import "fastify-secure-session";

import { Token } from "@prisma/client";

interface SessionToken {
  userId: string;
  isAdmin: boolean;
  roles: string[];
}

declare module "fastify-cors";

declare module "fastify" {
  interface FastifyInstance extends FastifyServerFactory {
    getUserId: (FastifyRequest) => string;
    prisma: PrismaClient;
    sendEmailToken: Function;
    verifySession: FastifyValidationResult;
    verifyIsAdmin: FastifyValidationResult;
  }

  interface FastifyRequest
    extends FastifyRequest<RouteGenericInterface, Server, IncomingMessage> {
    auth: {
      userId: string;
      isAdmin: boolean;
    };
    session: {
      delete: Function;
      get: (name: string) => SessionToken;
      set: (name: string, token: SessionToken) => null;
    };
  }
}
