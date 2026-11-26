import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: getEnv('DATABASE_URL', 'postgresql://USER:PASSWORD@localhost:5432/blocklib'),
  jwtSecret: getEnv('JWT_SECRET', 'dev_only_replace_with_local_secret'),
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? 'http://127.0.0.1:8545',
  blockchainChainId: Number(process.env.BLOCKCHAIN_CHAIN_ID ?? 31337),
  libraryContractAddress: process.env.LIBRARY_CONTRACT_ADDRESS ?? '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
