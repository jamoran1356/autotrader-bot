const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { compileContract } = require("../scripts/compile");
const {
  buildDeployTransaction,
  loadArtifact,
  resolveDeploymentConfig,
} = require("../scripts/deploy");

const artifactPath = path.resolve(__dirname, "../artifacts/AutoTrader.json");
const samplePrivateKey = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("compileContract returns a valid artifact and writes it to disk", () => {
  const artifact = compileContract({ writeArtifact: true });

  assert.equal(artifact.contractName, "AutoTrader");
  assert.ok(Array.isArray(artifact.abi));
  assert.ok(artifact.abi.length > 0);
  assert.match(artifact.bytecode, /^[0-9a-fA-F]+$/);
  assert.ok(artifact.bytecode.length > 0);
  assert.ok(fs.existsSync(artifactPath));
});

test("resolveDeploymentConfig rejects unsupported networks", () => {
  assert.throws(
    () => resolveDeploymentConfig({ env: { PRIVATE_KEY: samplePrivateKey }, networkName: "unknown_network" }),
    /Unsupported network/
  );
});

test("resolveDeploymentConfig rejects invalid private keys", () => {
  assert.throws(
    () => resolveDeploymentConfig({ env: { PRIVATE_KEY: "0x1234" }, networkName: "hashkey_testnet" }),
    /PRIVATE_KEY is required/
  );
});

test("buildDeployTransaction creates deploy data from the compiled artifact", async () => {
  if (!fs.existsSync(artifactPath)) {
    compileContract({ writeArtifact: true });
  }

  const artifact = loadArtifact();
  const plan = await buildDeployTransaction({
    artifact,
    privateKey: samplePrivateKey,
  });

  assert.match(plan.signerAddress, /^0x[a-fA-F0-9]{40}$/);
  assert.equal(plan.priceFeedAddress, plan.signerAddress);
  assert.equal(plan.feeCollectorAddress, plan.signerAddress);
  assert.ok(plan.deployTx.data);
  assert.match(plan.deployTx.data, /^0x[a-fA-F0-9]+$/);
});