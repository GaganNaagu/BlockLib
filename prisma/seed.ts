import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@blocklib.edu' },
    update: {},
    create: {
      name: 'Library Administrator',
      email: 'admin@blocklib.edu',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      // Hardhat local account #0 (local development only)
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student1@blocklib.edu' },
    update: {},
    create: {
      name: 'Gagan S G',
      usn: '02JST23UCS030',
      email: 'student1@blocklib.edu',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      // Hardhat local account #1 (local development only)
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student2@blocklib.edu' },
    update: {},
    create: {
      name: 'Ekanth LS',
      usn: '01JST23UCS042',
      email: 'student2@blocklib.edu',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      // Hardhat local account #2 (local development only)
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    },
  });

  console.log('Seeded 1 admin and 2 student accounts.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
