/* eslint-env node */
/* global __dirname */

const fs = require('fs');
const path = require('path');

const artifactPath = path.resolve(__dirname, '../../../smart-contracts/artifacts/AutoTrader.json');

function loadArtifact() {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`AutoTrader artifact not found at ${artifactPath}`);
  }

  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

function loadContractAbi() {
  if (process.env.CONTRACT_ABI) {
    return JSON.parse(process.env.CONTRACT_ABI);
  }

  const artifact = loadArtifact();
  if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
    throw new Error('AutoTrader artifact ABI is empty');
  }

  return artifact.abi;
}

module.exports = {
  loadArtifact,
  loadContractAbi,
};