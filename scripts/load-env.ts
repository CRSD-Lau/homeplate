import { config } from "dotenv";

config({ path: ".env.local" });
config();

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to .env.local before running this script.`);
  }

  return value;
}
