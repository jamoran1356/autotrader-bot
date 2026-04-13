const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "autotrader-dev-secret";
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  issueToken,
  verifyToken,
  hashToken,
};
