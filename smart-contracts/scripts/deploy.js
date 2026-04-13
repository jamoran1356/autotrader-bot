/**
 * Deploy script for AutoTrader contracts
 * Usage: node scripts/deploy.js hashkey_testnet
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const NETWORKS = {
  hashkey_mainnet: {
    url: process.env.HASHKEY_RPC_URL || "https://mainnet-rpc.hashkey.com",
    chainId: 412413,
  },
  hashkey_testnet: {
    url: process.env.HASHKEY_TESTNET_RPC || "https://testnet.hsk.xyz",
    chainId: 133,
  },
};

function loadArtifact() {
  const artifactPath = path.resolve(__dirname, "../artifacts/AutoTrader.json");
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

function resolveDeploymentConfig({ env = process.env, networkName } = {}) {
  const selectedNetwork = networkName || env.NETWORK || "hashkey_testnet";
  const network = NETWORKS[selectedNetwork];

  if (!network) {
    throw new Error(`Unsupported network: ${selectedNetwork}`);
  }

  if (!env.PRIVATE_KEY || env.PRIVATE_KEY.length !== 66) {
    throw new Error("PRIVATE_KEY is required and must be a 32-byte hex string with 0x prefix");
  }

  return {
    networkName: selectedNetwork,
    network,
    privateKey: env.PRIVATE_KEY,
    priceFeedAddress: env.PRICE_FEED_ADDRESS,
    feeCollectorAddress: env.FEE_COLLECTOR_ADDRESS,
  };
}

function createDeploymentFactory({ artifact, privateKey }) {
  const wallet = new ethers.Wallet(privateKey);
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
}

async function buildDeployTransaction({ artifact, privateKey, priceFeedAddress, feeCollectorAddress }) {
  const factory = createDeploymentFactory({ artifact, privateKey });
  const signerAddress = factory.runner.address;

  const resolvedPriceFeed = priceFeedAddress || signerAddress;
  const resolvedFeeCollector = feeCollectorAddress || signerAddress;

  const deployTx = await factory.getDeployTransaction(
    resolvedPriceFeed,
    resolvedFeeCollector
  );

  return {
    signerAddress,
    priceFeedAddress: resolvedPriceFeed,
    feeCollectorAddress: resolvedFeeCollector,
    deployTx,
  };
}

async function main() {
  const { networkName, network, privateKey, priceFeedAddress, feeCollectorAddress } =
    resolveDeploymentConfig({ networkName: process.argv[2] });

  console.log("🚀 Starting AutoTrader deployment...");
  console.log("🌐 Network:", networkName);

  const artifact = loadArtifact();
  const provider = new ethers.JsonRpcProvider(network.url, network.chainId);
  const deployer = new ethers.Wallet(privateKey, provider);

  // Get signer
  console.log("📝 Deploying from:", deployer.address);

  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy parameters
  const resolvedPriceFeed = priceFeedAddress || deployer.address;
  const resolvedFeeCollector = feeCollectorAddress || deployer.address;

  console.log("\n📋 Deployment Parameters:");
  console.log("- Price Feed:", resolvedPriceFeed);
  console.log("- Fee Collector:", resolvedFeeCollector);

  // Deploy AutoTrader
  console.log("\n📦 Deploying AutoTrader...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const deployTx = await factory.getDeployTransaction(
    resolvedPriceFeed,
    resolvedFeeCollector
  );
  const gasEstimate = await provider.estimateGas({
    ...deployTx,
    from: deployer.address,
  });
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("1", "gwei");
  const estimatedCost = (gasEstimate * gasPrice * 12n) / 10n;

  console.log("⛽ Estimated gas:", gasEstimate.toString());
  console.log("⛽ Estimated deployment cost:", ethers.formatEther(estimatedCost), "ETH");

  if (balance < estimatedCost) {
    throw new Error(
      `Insufficient balance for deployment. Need about ${ethers.formatEther(estimatedCost)} ETH including buffer.`
    );
  }

  const autoTrader = await factory.deploy(
    resolvedPriceFeed,
    resolvedFeeCollector
  );
  await autoTrader.waitForDeployment();
  const deployedAddress = await autoTrader.getAddress();

  console.log("✅ AutoTrader deployed to:", deployedAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const tradeCount = await autoTrader.getTradeCount();
  const totalVolume = await autoTrader.getTotalVolume();
  console.log("- Trade count:", tradeCount.toString());
  console.log("- Total volume:", totalVolume.toString());

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    deployer: deployer.address,
    AutoTrader: deployedAddress,
    priceFeed: resolvedPriceFeed,
    feeCollector: resolvedFeeCollector,
    timestamp: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber(),
  };

  fs.writeFileSync(
    path.resolve(__dirname, "../deployments.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to deployments.json");
  console.log("\n✨ Deployment complete!");
  console.log("\n📌 Next steps:");
  console.log("1. Update backend .env with CONTRACT_ADDRESS:", deployedAddress);
  console.log("2. Update frontend with contract address");
  console.log("3. Run backend: npm run dev");
  console.log("4. Visit http://localhost:3001/opportunities");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  NETWORKS,
  buildDeployTransaction,
  createDeploymentFactory,
  loadArtifact,
  main,
  resolveDeploymentConfig,
};
