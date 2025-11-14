import { SQLDatabase } from "encore.dev/storage/sqldb";

export const BotDB = new SQLDatabase("crypto-bot", {
  migrations: "./db/migrations",
});

export type BotDatabase = typeof BotDB;
