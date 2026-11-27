import fs from 'node:fs';
import path from 'node:path';
import { artifacts, ethers, network } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying Library.sol to "${network.name}" with admin: ${deployer.address}`);

  const factory = await ethers.getContractFactory('Library');
  const library = await factory.deploy();
  await library.waitForDeployment();

  const contractAddress = await library.getAddress();
  const deployTx = library.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  console.log(`Library deployed at: ${contractAddress}`);
  if (receipt) {
    console.log(`Deployment tx: ${receipt.hash} (block #${receipt.blockNumber})`);
  }

  const artifact = await artifacts.readArtifact('Library');
  const deploymentsDir = path.resolve(__dirname, '../deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const exportPath = path.join(deploymentsDir, 'Library.json');
  fs.writeFileSync(
    exportPath,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.config.chainId ?? 31337,
        admin: deployer.address,
        address: contractAddress,
        abi: artifact.abi,
      },
      null,
      2,
    ),
  );

  console.log(`Exported Library ABI & address to: ${exportPath}`);

  // Auto-create .env from .env.example if missing, and update contract addresses
  const rootDir = path.resolve(__dirname, '../../..');
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('Created .env from .env.example');
  }

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const upsertVar = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      }
      return `${content.trimEnd()}\n${key}=${value}\n`;
    };
    envContent = upsertVar(envContent, 'LIBRARY_CONTRACT_ADDRESS', contractAddress);
    envContent = upsertVar(envContent, 'VITE_LIBRARY_CONTRACT_ADDRESS', contractAddress);
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Updated LIBRARY_CONTRACT_ADDRESS and VITE_LIBRARY_CONTRACT_ADDRESS in .env');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
