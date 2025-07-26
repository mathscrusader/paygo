// prisma/seed-admin.ts
// Run: npx ts-node prisma/seed-admin.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function main() {
  const prisma = new PrismaClient();

  // ◼︎ Customize these:
  const id = randomUUID();                // <-- replace with a fixed UUID if you prefer
  const email = "newadmin@example.com";   // <-- your admin email
  const name = "Backup Admin";            // <-- admin display name
  const role = "ADMIN";                   // <-- role column value
  const createdAt = new Date();           // <-- use a Date or a fixed ISO string

  // ◼︎ Password (if your table has a password column)
  const plainPassword = "SecureP@ssw0rd"; // <-- your desired password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Upsert the user (by unique id)
  const user = await prisma.user.upsert({
    where: { id },
    update: {
      email,
      name,
      role,
      createdAt,
      password: hashedPassword,  // include only if your schema has this field
    },
    create: {
      id,
      email,
      name,
      role,
      createdAt,
      password: hashedPassword,  // include only if your schema has this field
    },
  });

  console.log(`🛡️  Admin user ready: ${user.email} (id: ${user.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
