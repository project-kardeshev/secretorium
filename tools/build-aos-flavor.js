import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import * as fs from "fs-extra"; // Import fs-extra for recursive directory copying
import * as path from "path";
import { bundle } from "./lua-bundler.js";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import Docker from "dockerode";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec); // Promisify exec for async/await usage
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const docker = new Docker(); // Initialize dockerode instance

const args = process.argv.slice(2); // Get CLI arguments
const pathArg = args.find((arg) => arg.startsWith("--path="));
const outputArg = args.find((arg) => arg.startsWith("--output="));

if (!pathArg || !outputArg) {
  console.error("Please provide both a --path and --output as CLI arguments.");
  process.exit(1);
}

const pathToLua = pathArg.split("=")[1];
const outputPath = outputArg.split("=")[1];

// Create working directory and copy AOS files to it. Set random id to avoid conflicts
const id = randomUUID();
const workingDir = path.join(__dirname, "working-" + id);
if (!existsSync(workingDir)) {
  mkdirSync(workingDir, { recursive: true });
}

// Copy the entire aos/process directory to the working directory
const sourceDir = path.join(__dirname, "..", "aos", "process");
if (!existsSync(sourceDir)) {
  await execPromise("git submodule update --init --recursive");
}
if (!existsSync(sourceDir)) {
  console.error(
    "AOS process directory not found. Please ensure the submodule has been initialized.",
  );
  process.exit(1);
}
const destDir = path.join(workingDir, "aos-process");
try {
  await fs.copy(sourceDir, destDir);
  console.log("Successfully copied AOS process directory");
} catch (err) {
  console.error("Error copying AOS process directory:", err);
  process.exit(1);
}

async function checkAndStartDocker() {
  try {
    // Check if Docker is running
    await docker.ping();
    console.log("Docker is running.");
  } catch (err) {
    console.error("Docker is not running. Attempting to start Docker...");

    if (process.platform === "darwin") {
      try {
        // macOS: Start Docker Desktop
        console.log("Attempting to start Docker Desktop on macOS...");
        await execPromise("open -a Docker");

        // Wait for Docker to start
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Recheck if Docker is running
        await docker.ping();
        console.log("Docker has been started and is running.");
      } catch (startErr) {
        console.error(
          "Failed to start Docker on macOS. Please ensure Docker Desktop is installed and running.",
          startErr.message,
        );
        process.exit(1);
      }
    } else {
      try {
        // Linux: Use systemctl to start Docker
        console.log("Attempting to start Docker on Linux...");
        await execPromise("sudo systemctl start docker");
        console.log("Docker has been started.");
      } catch (startErr) {
        console.error(
          "Failed to start Docker on Linux. Please ensure Docker is installed and you have permissions to start it.",
          startErr.message,
        );
        process.exit(1);
      }
    }
  }
}

async function checkAoCLI() {
  try {
    // Check if `ao` CLI is installed by running a simple version check
    await execPromise("ao --version");
    console.log("ao CLI is available.");
  } catch (err) {
    // If the ao CLI is not installed, install it with yarn install-deps
    console.log(
      "ao CLI is not available. Installing dependencies with yarn install-deps...",
    );
    try {
      await execPromise("yarn install-deps");
      console.log("ao CLI has been installed successfully.");
    } catch (installErr) {
      console.error(
        "Failed to install ao CLI dependencies.",
        installErr.message,
      );
      process.exit(1);
    }
  }
}

async function main() {
  // Check if Docker is running and start if needed
  await checkAndStartDocker();

  // Check if ao CLI is installed and install if missing
  await checkAoCLI();

  const bundledLua = bundle(pathToLua);

  // Write bundled Lua to <working-id>/aos-process/process.lua above "return process"
  const processLuaPath = path.join(workingDir, "aos-process", "process.lua");
  const processLua = readFileSync(processLuaPath, "utf8");
  const processLuaParts = processLua.split("return process");
  const newProcessLua =
    processLuaParts[0] +
    "\n" +
    bundledLua +
    "\nreturn process" +
    processLuaParts[1];
  writeFileSync(processLuaPath, newProcessLua);

  // Build AOS wasm binary
  const buildCmd = `cd ${workingDir}/aos-process && ao build`;
  console.log("Building AOS binary with command:", buildCmd);

  try {
    const { stdout, stderr } = await execPromise(buildCmd);
    if (stderr) {
      console.error("Build error:", stderr);
    }
    console.log("Build result:", stdout);
  } catch (buildErr) {
    console.error("Failed to build AOS binary:", buildErr.message);
    process.exit(1);
  }

  // Move built wasm (process.wasm) to output path
  const wasmPath = path.join(workingDir, "aos-process", "process.wasm");
  const wasmOutputPath = path.join(outputPath, "process.wasm");
  await fs.copy(wasmPath, wasmOutputPath);
  console.log("WASM has been built and saved to", wasmOutputPath);

  // Write bundled Lua to output path
  const luaOutputPath = path.join(outputPath, "aos-bundled.lua");
  writeFileSync(luaOutputPath, bundledLua);
  console.log("Lua has been bundled and saved to", luaOutputPath);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    // Cleanup working directory
    await fs.remove(workingDir);
    process.exit(0);
  });
