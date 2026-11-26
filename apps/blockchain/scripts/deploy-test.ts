import fs from 'node:fs';
import path from 'node:path';
import { artifacts, ethers, network } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying TestConnection to network "${network.name}" with account: ${deployer.address}`);

  const factory = await ethers.getContractFactory('TestConnection');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`TestConnection deployed at: ${contractAddress}`);

  // Submit one test transaction and verify receipt + block number
  const tx = await contract.ping('BlockLib Phase 2 verification');
  console.log(`Submitted ping tx: ${tx.hash}`);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error('Test transaction failed or returned no receipt');
  }

  console.log(`Transaction confirmed in block #${receipt.blockNumber} (status: ${receipt.status})`);

  // Export address and ABI to shared deployment artifact for frontend/backend consumption
  const artifact = await artifacts.readArtifact('TestConnection');
  const deploymentsDir = path.resolve(__dirname, '../deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const exportPath = path.join(deploymentsDir, 'TestConnection.json');
  fs.writeFileSync(
    exportPath,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.config.chainId ?? 31337,
        address: contractAddress,
        abi: artifact.abi,
      },
      null,
      2,
    ),
  );
  console.log(`Exported deployment artifact to ${exportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
