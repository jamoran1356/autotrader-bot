const fs = require("fs");
const path = require("path");
const solc = require("solc");

const rootDir = path.resolve(__dirname, "..");
const contractsDir = path.join(rootDir, "contracts");
const artifactsDir = path.join(rootDir, "artifacts");
const contractFile = path.join(contractsDir, "AutoTrader.sol");

function resolveImport(importPath) {
  const candidatePaths = [
    path.join(rootDir, importPath),
    path.join(rootDir, "node_modules", importPath),
    path.join(contractsDir, importPath),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

function compileContract({ writeArtifact = true } = {}) {
  const source = fs.readFileSync(contractFile, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "contracts/AutoTrader.sol": { content: source },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));

  if (output.errors) {
    const errors = output.errors.filter((entry) => entry.severity === "error");
    for (const entry of output.errors) {
      console.log(entry.formattedMessage);
    }

    if (errors.length > 0) {
      process.exit(1);
    }
  }

  const contract = output.contracts["contracts/AutoTrader.sol"]?.AutoTrader;
  if (!contract) {
    throw new Error("AutoTrader contract was not produced by the compiler");
  }

  const artifact = {
    contractName: "AutoTrader",
    sourceName: "contracts/AutoTrader.sol",
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
    deployedBytecode: contract.evm.deployedBytecode.object,
  };

  if (writeArtifact) {
    fs.mkdirSync(artifactsDir, { recursive: true });
    fs.writeFileSync(
      path.join(artifactsDir, "AutoTrader.json"),
      JSON.stringify(artifact, null, 2)
    );
  }

  return artifact;
}

function main() {
  compileContract({ writeArtifact: true });

  console.log("Compiled AutoTrader.sol successfully");
}

if (require.main === module) {
  main();
}

module.exports = {
  compileContract,
  resolveImport,
};