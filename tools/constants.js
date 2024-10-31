import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const kibibyte = 1024;
export const mebibyte = kibibyte * 1024;
export const gibibyte = mebibyte * 1024;
export const STUB_ADDRESS = "".padEnd(43, "1");
export const ALTERNATE_STUB_ADDRESS = "".padEnd(43, "2");
/* ao READ-ONLY Env Variables */
export const AO_LOADER_HANDLER_ENV = {
  Process: {
    Id: "".padEnd(43, "1"),
    Owner: STUB_ADDRESS,
    Tags: [{ name: "Authority", value: "XXXXXX" }],
  },
  Module: {
    Id: "".padEnd(43, "1"),
    Tags: [{ name: "Authority", value: "YYYYYY" }],
  },
};

export const AO_LOADER_OPTIONS = {
  format: "wasm64-unknown-emscripten-draft_2024_02_15",
  inputEncoding: "JSON-1",
  outputEncoding: "JSON-1",
  memoryLimit: gibibyte,
  computeLimit: (9e12).toString(),
  extensions: [],
};

export const AOS_WASM = fs.readFileSync(
  path.join(
    __dirname,
    "fixtures/aos-C61NgrJDuhwGUsFca1rgfE7ehAKSdgOqPj6aYYy5u4s.wasm",
  ),
);

export const BUNDLED_CHESS_REGISTRY_AOS_LUA = fs.readFileSync(
  path.join(__dirname, "../dist/chess/registry/aos-bundled.lua"),
  "utf-8",
);

export const BUNDLED_CHESS_GAME_AOS_LUA = fs.readFileSync(
  path.join(__dirname, "../dist/chess/game/aos-bundled.lua"),
  "utf-8",
);

export const DEFAULT_HANDLE_OPTIONS = {
  Id: "".padEnd(43, "1"),
  ["Block-Height"]: "1",
  // important to set the address so that that `Authority` check passes. Else the `isTrusted` with throw an error.
  Owner: STUB_ADDRESS,
  Module: "ANT",
  Target: "".padEnd(43, "1"),
  From: STUB_ADDRESS,
  Timestamp: Date.now(),
};

export const ALTERNATE_HANDLE_OPTIONS = {
  Id: "".padEnd(43, "2"),
  ["Block-Height"]: "1",
  // important to set the address so that that `Authority` check passes. Else the `isTrusted` with throw an error.
  Owner: ALTERNATE_STUB_ADDRESS,
  Module: "ANT",
  Target: "".padEnd(43, "1"),
  From: ALTERNATE_STUB_ADDRESS,
  Timestamp: Date.now(),
};
