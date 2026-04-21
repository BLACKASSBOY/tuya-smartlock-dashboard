import { lockDoor } from "../server/tuya";

async function main() {
  try {
    await lockDoor();
    console.log("Door locked successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to lock door: ${message}`);
    process.exit(1);
  }
}

void main();
