import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import {
  AO_LOADER_HANDLER_ENV,
  DEFAULT_HANDLE_OPTIONS,
  STUB_ADDRESS,
} from '../tools/constants.js';
import { createKVRegistryAosLoader, getHandlers } from '../tools/utils.js';

describe('KV_Registry', async () => {
  let handle;
  let startMemory;

  before(async () => {
    const loader = await createKVRegistryAosLoader();
    handle = loader.handle;
    startMemory = loader.memory;
  });

  async function sendMessage(options = {}, mem = startMemory) {
    return handle(
      mem,
      {
        ...DEFAULT_HANDLE_OPTIONS,
        ...options,
      },
      AO_LOADER_HANDLER_ENV,
    );
  }

  it('should have correct handlers', async () => {
    const handlersRes = await getHandlers(sendMessage, startMemory);
    const handlers = [
      '_eval',
      '_default',
      'kVRegistry.SpawnKVStore',
      'kVRegistry.GetKVStores',
      'kVStore.SubscriberNotice',
    ];

    assert(handlers.every((handler) => handlersRes.includes(handler)));
  });

  it('should spawn a kv store', async () => {
    const res = await sendMessage({
      Tags: [{ name: 'Action', value: 'KV-Registry.Spawn-KV-Store' }],
    });

    assert(res.Spawns.length === 1);
  });

  it('should retrieve KV stores for user', async () => {
    const spawnRes = await sendMessage({
      Tags: [{ name: 'Action', value: 'KV-Registry.Spawn-KV-Store' }],
    });

    const spawnCbRes = await sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'Spawned' },
          { name: 'X-Original-Msg-Id', value: STUB_ADDRESS },
          { name: 'Process', value: STUB_ADDRESS },
          { name: 'X-Creator', value: STUB_ADDRESS },
        ],
      },
      spawnRes.Memory,
    );

    const kvStoresRes = await sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Registry.Get-KV-Stores' },
          { name: 'Address', value: STUB_ADDRESS },
        ],
      },
      spawnCbRes.Memory,
    );

    const kvStores = JSON.parse(kvStoresRes.Messages[0].Data);
    assert(kvStores.Owned.length === 1);

    // adding notice test
    const noticeRes = await sendMessage(
      {
        From: STUB_ADDRESS,
        Tags: [{ name: 'Action', value: 'KV-Store.Subscriber-Notice' }],
        Data: JSON.stringify({
          Owner: STUB_ADDRESS,
          Controllers: { [''.padEnd(43, '2')]: true },
        }),
      },
      kvStoresRes.Memory,
    );

    const controllerKvStoresRes = await sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Registry.Get-KV-Stores' },
          { name: 'Address', value: ''.padEnd(43, '2') },
        ],
      },
      noticeRes.Memory,
    );
    assert(
      JSON.parse(controllerKvStoresRes.Messages[0].Data).Controlled.length ===
        1,
    );
  });
});
