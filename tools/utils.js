import AoLoader from "@permaweb/ao-loader";
import {
  AOS_WASM,
  AO_LOADER_HANDLER_ENV,
  AO_LOADER_OPTIONS,
  BUNDLED_CHESS_GAME_AOS_LUA,
  BUNDLED_CHESS_REGISTRY_AOS_LUA,
  DEFAULT_HANDLE_OPTIONS,
} from "./constants.js";

/**
 * Loads the aos wasm binary and returns the handle function with program memory
 * @returns {Promise<{handle: Function, memory: WebAssembly.Memory}>}
 */

export async function createAosLoader(lua) {
  const handle = await AoLoader(AOS_WASM, AO_LOADER_OPTIONS);

  const evalRes = await handle(
    null,
    {
      ...DEFAULT_HANDLE_OPTIONS,
      Tags: [{ name: "Action", value: "Eval" }],
      Data: lua,
    },
    AO_LOADER_HANDLER_ENV,
  );
  return {
    handle,
    memory: evalRes.Memory,
  };
}

export async function createChessRegistryAosLoader() {
  return createAosLoader(BUNDLED_CHESS_REGISTRY_AOS_LUA);
}

export async function createChessGameAosLoader() {
  return createAosLoader(BUNDLED_CHESS_GAME_AOS_LUA);
}

export async function getHandlers(sendMessage, memory){

  return sendMessage({Tags: [{name: "Action", value: "Eval"}], Data: "Handlers.list"}, memory)
}
