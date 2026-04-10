import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma migrations');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
