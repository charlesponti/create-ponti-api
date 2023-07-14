import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const { COOKIE_SECRET, COOKIE_SALT, NODE_ENV } = process.env;

const sessionPlugin: FastifyPluginAsync = async (server) => {
  server.register(require("fastify-secure-session"), {
    secret: COOKIE_SECRET,
    salt: COOKIE_SALT,
    // the name of the session cookie, defaults to 'session'
    cookieName: process.env.COOKIE_NAME,
    // options for setCookie, see https://github.com/fastify/fastify-cookie
    cookie: {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: NODE_ENV !== "development",
    },
  });
};

export default fp(sessionPlugin);
