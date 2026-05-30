import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rollmanager.com" },
    update: {},
    create: {
      email: "admin@rollmanager.com",
      passwordHash,
      rol: "admin",
    },
  });

  console.log("✅ Usuario admin creado:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
