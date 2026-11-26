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
  console.log('\nAdd these to your root .env:');
  console.log(`LIBRARY_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_LIBRARY_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
