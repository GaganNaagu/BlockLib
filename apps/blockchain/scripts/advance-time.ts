import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const days = Number(process.env.ADVANCE_DAYS ?? 17);
  const seconds = days * 24 * 60 * 60;

  await ethers.provider.send('evm_increaseTime', [seconds]);
  await ethers.provider.send('evm_mine', []);

  const block = await ethers.provider.getBlock('latest');
  console.log(`Advanced local Hardhat blockchain time by ${days} days (${seconds}s).`);
  console.log(`New block #${block?.number}, timestamp: ${new Date(Number(block?.timestamp) * 1000).toISOString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
