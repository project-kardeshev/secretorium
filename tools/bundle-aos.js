import * as fs from "fs";
import * as path from "path";
import { bundle } from "./lua-bundler.js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
  const args = process.argv.slice(2); // Get CLI arguments
  const pathArg = args.find((arg) => arg.startsWith("--path="));
  const outputArg = args.find((arg) => arg.startsWith("--output="));

  if (!pathArg || !outputArg) {
    console.error(
      "Please provide both a --path and --output as CLI arguments.",
    );
    return;
  }

  const pathToLua = pathArg.split("=")[1];
  const outputPath = outputArg.split("=")[1];

  console.log("Path to Lua:", pathToLua);
  console.log("Output Path:", outputPath);

  const bundledLua = bundle(pathToLua);

  const distDir = path.dirname(outputPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, bundledLua);
  console.log("Lua has been bundled and saved to", outputPath);
}

main();
