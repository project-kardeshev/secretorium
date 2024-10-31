// initialize git submodules and install the ao dev cli
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function installDeps() {
  try {
    // Initialize git submodules
    await execPromise("git submodule update --init --recursive");
    console.log("Successfully initialized git submodules");

    // Install the AO Dev CLI
    await execPromise("curl -L https://install_ao.g8way.io | bash");
    console.log("Successfully installed the AO Dev CLI");
  } catch (err) {
    console.error("Error installing dependencies:", err);
    process.exit(1);
  }
}

installDeps();
