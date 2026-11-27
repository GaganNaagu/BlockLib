import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const deploymentPath = path.resolve(__dirname, '../deployments/Library.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('deployments/Library.json not found. Run deploy.ts first.');
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as { address: string };
  const [admin, student1, student2] = await ethers.getSigners();
  const library = await ethers.getContractAt('Library', deployment.address, admin);

  console.log(`Seeding demo state on Library (${deployment.address})...`);

  // Register Student 1 and Student 2 on-chain
  for (const student of [student1, student2]) {
    const member = await library.getMember(student.address);
    if (!member.registered) {
      const tx = await library.registerMember(student.address);
      await tx.wait();
      console.log(`Registered student on-chain: ${student.address}`);
    }
  }

  // Register 2 initial sample books if none exist yet
  const nextBookId = Number(await library.nextBookId());
  if (nextBookId === 1) {
    const books = [
      {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz',
        isbn: '978-0078022159',
        copies: [1001, 1002],
      },
      {
        title: 'Mastering Ethereum',
        author: 'Andreas Antonopoulos',
        isbn: '978-1491971949',
        copies: [2001],
      },
    ];

    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      const txBook = await library.registerBook(b.title, b.author, b.isbn);
      await txBook.wait();
      const bookId = i + 1;
      for (const copyId of b.copies) {
        const txCopy = await library.registerBookCopy(bookId, copyId);
        await txCopy.wait();
      }
      console.log(`Seeded Book #${bookId}: "${b.title}" with copies ${b.copies.join(', ')}`);
    }
  }

  // Generate local-only Accounts.md (gitignored) with MetaMask test keys for demo convenience
  const mnemonic = ethers.Mnemonic.fromPhrase(
    'test test test test test test test test test test test junk',
  );
  const w0 = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
  const w1 = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/1");
  const w2 = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/2");

  const accountsDoc = `# BlockLib Local Demo Accounts (Generated — Do Not Commit)

## Application Login & MetaMask Mapping

| Role | Name | Email | Password | MetaMask Address | Hardhat Local Private Key |
|---|---|---|---|---|---|
| **Admin** | Library Administrator | \`admin@blocklib.edu\` | \`Admin@123\` | \`${w0.address}\` | \`${w0.privateKey}\` |
| **Student 1** | Gagan S G | \`student1@blocklib.edu\` | \`Student@123\` | \`${w1.address}\` | \`${w1.privateKey}\` |
| **Student 2** | Ekanth LS | \`student2@blocklib.edu\` | \`Student@123\` | \`${w2.address}\` | \`${w2.privateKey}\` |

> **Local Development Only:** These keys belong to Hardhat's deterministic local test network (\`Chain ID: 31337\`). Never use them on mainnet.
`;

  const accountsPath = path.resolve(__dirname, '../../../Accounts.md');
  fs.writeFileSync(accountsPath, accountsDoc, 'utf8');
  console.log(`Generated local demo accounts guide at: ${accountsPath}`);

  console.log('Demo blockchain seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
