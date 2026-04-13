const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@autotrader.bot" },
    update: {},
    create: {
      email: "demo@autotrader.bot",
      displayName: "Demo Trader",
      passwordHash,
      role: "trader",
    },
  });

  await prisma.botPersonalityPrompt.upsert({
    where: {
      userId_botId: {
        userId: demoUser.id,
        botId: "quant-pulse",
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      botId: "quant-pulse",
      prompt: "Be disciplined, avoid overtrading, and explain every trade before execution.",
      tone: "professional",
      riskMode: "balanced",
    },
  });

  console.log("[seed] Demo user and prompt inserted");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
