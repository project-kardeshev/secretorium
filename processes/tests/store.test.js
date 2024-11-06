import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import {
  AO_LOADER_HANDLER_ENV,
  DEFAULT_HANDLE_OPTIONS,
} from '../tools/constants.js';
import { createKVStoreAosLoader, getHandlers } from '../tools/utils.js';

describe('KVStore', async () => {
  let handle;
  let startMemory;

  before(async () => {
    const loader = await createKVStoreAosLoader();
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

  async function setData({ path, data, options, memory }) {
    return sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Store.Set' },
          { name: 'Path', value: path },
        ],
        Data: data,
        ...(options ?? {}),
      },
      memory,
    );
  }

  async function getData({ path, options, memory }) {
    return sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Store.Get' },
          { name: 'Path', value: path },
        ],
        ...(options ?? {}),
      },
      memory,
    );
  }

  async function getAuthorizedUsers(mem) {
    const res = await sendMessage(
      {
        Tags: [{ name: 'Action', value: 'KV-Store.Access-Control-List' }],
      },
      mem,
    );
    return JSON.parse(res.Messages[0].Data);
  }

  async function getAuthorizationRequests(mem) {
    const res = await sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Store.Get-Authorization-Requests' },
        ],
      },
      mem,
    );
    return JSON.parse(res.Messages[0].Data);
  }

  it('should get store info', async () => {
    const info = await sendMessage({
      Tags: [{ name: 'Action', value: 'Info' }],
    });
    assert(info.Messages[0]);
  });

  // doubles as a test for _eval
  it('should have the correct handlers', async () => {
    const handlersRes = await getHandlers(sendMessage, startMemory);
    const handlers = [
      '_eval',
      '_default',
      'info',
      'kVStore.Get',
      'kVStore.Set',
      'kVStore.SetControllers',
      'kVStore.SetSubscribers',
      'kVStore.RequestAuthorization',
      'kVStore.GetAuthorizationRequests',
      'kVStore.Authorize',
      'kVStore.AccessControlList',
    ];
    assert(handlers.every((handler) => handlersRes.includes(handler)));
  });

  it('should set a value as owner', async () => {
    const res = await setData({ path: 'foo', data: 'bar' });
    const getValueRes = await getData({ path: 'foo', memory: res.Memory });
    assert(JSON.parse(getValueRes.Messages[0].Data) === 'bar');
  });

  it('should set a value as authorized user', async () => {
    const role = 'collaborator-' + ''.padEnd(43, '2');
    const func = 'KV-Store.Set';
    const path = `^(.-)%.collaborators%.(${''.padEnd(43, '2')})$`;
    const requestAuthRes = await sendMessage({
      From: ''.padEnd(43, '2'),
      Owner: ''.padEnd(43, '2'),
      Tags: [
        { name: 'Action', value: 'KV-Store.Request-Authorization' },
        { name: 'Role', value: role },
        {
          name: 'Permissions',
          value: JSON.stringify({
            [func]: [path],
          }),
        },
      ],
    });
    const authRequests = await getAuthorizationRequests(requestAuthRes.Memory);
    assert(authRequests[''.padEnd(43, '2')].role === role);
    assert(authRequests[''.padEnd(43, '2')].permissions[func].includes(path));

    const authRes = await sendMessage(
      {
        Tags: [
          { name: 'Action', value: 'KV-Store.Authorize' },
          { name: 'Role', value: role },
          { name: 'Permissions', value: JSON.stringify({ [func]: [path] }) },
          { name: 'Address', value: ''.padEnd(43, '2') },
        ],
      },
      requestAuthRes.Memory,
    );

    const authorizedUsers = await getAuthorizedUsers(authRes.Memory);
    const newUser = authorizedUsers.users[''.padEnd(43, '2')];
    assert(
      authorizedUsers.authorizationRequests.length === 0,
      'Auth request was not removed',
    );
    assert(newUser, 'failed to authorize user');
    assert(newUser[role], 'Role was not set properly for authorized user');
    assert(
      authorizedUsers.roles[role][func].includes(path),
      'Path in role was not set properly for authorized user',
    );

    const config = {
      encryptionPublicKey: 'foo',
    };

    const setDataRes = await setData({
      path: `github.collaborators.${''.padEnd(43, '2')}`,
      data: JSON.stringify(config),
      memory: authRes.Memory,
      options: { From: ''.padEnd(43, '2'), Owner: ''.padEnd(43, '2') },
    });
    //console.dir(setDataRes, { depth: null });
    const getValueRes = await getData({
      path: `github.collaborators.${''.padEnd(43, '2')}`,
      memory: setDataRes.Memory,
    });
    const configRes = JSON.parse(getValueRes.Messages[0].Data);
    assert(
      config.encryptionPublicKey === configRes.encryptionPublicKey,
      'Data was not set properly by authorized user',
    );

    await it('should not set a value as an authorized user but on an unauthorized path', async () => {
      const unauthorizedSetDataRes = await setData({
        options: { From: ''.padEnd(43, '2'), Owner: ''.padEnd(43, '2') },
        path: 'foo',
        data: 'bar',
        memory: authRes.Memory,
      });
      const unauthorizedGetDataRes = await getData({
        path: 'foo',
        memory: unauthorizedSetDataRes.Memory,
      });
      const errorTag = unauthorizedGetDataRes.Messages[0].Tags.find(
        (tag) => tag.value === 'Invalid-KV-Store.Get-Notice',
      );
      console.dir(unauthorizedGetDataRes, { depth: null });
      assert(errorTag, 'No error tag was found, should have been an error');
      assert(
        unauthorizedGetDataRes.Messages[0].Data !== 'bar',
        "Authorized user shouldn't be able to set data on a path they do not have authorization for",
      );
    });
  });
});
