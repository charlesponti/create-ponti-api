import { PrismaClient } from "@prisma/client";

// Instantiate Prisma Client
const prisma = new PrismaClient();

// A `main` function so that we can use async/await
async function main() {
  await prisma.token.deleteMany({});
  await prisma.user.deleteMany({});

  const [grace, jeff] = await Promise.all([
    prisma.user.create({
      data: {
        email: "grace@ponti.io",
        name: "Grace Bell",
      },
    }),
    prisma.user.create({
      data: {
        email: "jeff@ponti.io",
        name: "Jeff Homie",
      },
    }),
  ]);

  console.log("Users", { grace, jeff });
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1); // eslint-disable-line
  })
  .finally(async () => {
    // Disconnect Prisma Client
    await prisma.$disconnect();
  });
