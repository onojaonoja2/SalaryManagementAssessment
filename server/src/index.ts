import { createApp } from "./app";
import { prisma } from "./lib/prisma";

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Salary management API listening on http://localhost:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
