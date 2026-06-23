import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Plugin = {
  name: string;
  displayName?: string;
  description: string;
  version?: string;
  category?: string;
  keywords?: string[];
  homepage?: string;
};

export type Marketplace = {
  name: string;
  description: string;
  owner: { name: string; url?: string };
  plugins: Plugin[];
};

// The marketplace catalog is the single source of truth. The landing page
// reads it so the list of skills stays in sync with what users can install.
export async function getMarketplace(): Promise<Marketplace> {
  const path = join(process.cwd(), ".claude-plugin", "marketplace.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Marketplace;
}

// GitHub owner/repo this marketplace is installed from.
export const REPO = "imfaisii/skills";
