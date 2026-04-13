const express = require("express");
const prisma = require("../lib/prisma");
const { verifyToken } = require("../lib/auth");

const router = express.Router();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing bearer token" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      walletAddress: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  return res.json({ status: "success", data: user });
});

router.patch("/wallet", requireAuth, async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: { walletAddress },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      walletAddress: true,
    },
  });

  return res.json({ status: "success", data: user });
});

router.post("/prompts/:botId", requireAuth, async (req, res) => {
  const { botId } = req.params;
  const { prompt, tone = "balanced", riskMode = "balanced" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const saved = await prisma.botPersonalityPrompt.upsert({
    where: {
      userId_botId: {
        userId: req.user.sub,
        botId,
      },
    },
    update: {
      prompt,
      tone,
      riskMode,
    },
    create: {
      userId: req.user.sub,
      botId,
      prompt,
      tone,
      riskMode,
    },
  });

  return res.json({ status: "success", data: saved });
});

router.get("/prompts/:botId", requireAuth, async (req, res) => {
  const { botId } = req.params;

  const prompt = await prisma.botPersonalityPrompt.findUnique({
    where: {
      userId_botId: {
        userId: req.user.sub,
        botId,
      },
    },
  });

  return res.json({
    status: "success",
    data: prompt,
  });
});

module.exports = router;
