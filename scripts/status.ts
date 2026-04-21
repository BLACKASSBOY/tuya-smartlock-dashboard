import { getLockStatus } from "../server/tuya";

async function main() {
  try {
    const status = await getLockStatus();
    console.log(JSON.stringify(status, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch lock status: ${message}`);
    process.exit(1);
  }
}

void main();
