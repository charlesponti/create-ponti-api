import sendgrid, { MailDataRequired } from "@sendgrid/mail";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import logger from "../utils/logger";

const emailPlugin: FastifyPluginAsync = async (server) => {
  if (!process.env.SENDGRID_API_KEY) {
    logger.error(
      "warn",
      "The SENDGRID_API_KEY env var must be set, otherwise the API won't be able to send emails. Using debug mode which logs the email tokens instead."
    );
  } else {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  server.decorate("sendEmailToken", async (email: string, token: string) => {
    const msg: MailDataRequired = {
      to: email,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL || "",
        name: process.env.SENDGRID_SENDER_NAME,
      },
      subject: "Login token for the modern backend API",
      text: `The login token for the API is: ${token}`,
    };

    if (process.env.NODE_ENV === "development") {
      server.log.info(`email token for ${email}: ${token} `);
    } else {
      await sendgrid.send(msg);
    }
  });
};

export default fp(emailPlugin);
