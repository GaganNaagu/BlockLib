import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('TestConnection (Phase 2)', () => {
  it('deploys, executes a ping transaction, and emits Pinged', async () => {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('TestConnection');
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const tx = await contract.ping('hello blocklib');
    const receipt = await tx.wait();

    expect(receipt).to.not.be.null;
    expect(receipt!.status).to.equal(1);
    expect(receipt!.blockNumber).to.be.greaterThan(0);
    expect(await contract.pingCount()).to.equal(1n);
    expect(await contract.lastMessage()).to.equal('hello blocklib');
    await expect(tx)
      .to.emit(contract, 'Pinged')
      .withArgs(deployer.address, 'hello blocklib', 1n, (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp);
  });
});
