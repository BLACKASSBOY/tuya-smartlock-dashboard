import { unlockDoor } from "../server/tuya";

async function main() {
  try {
    await unlockDoor();
    console.log("Door unlocked successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to unlock door: ${message}`);
    process.exit(1);
  }
}

void main();
