import {
  AoSigner,
  KVRegistryAoConnectProcessReadable,
  KVRegistryAoConnectProcessWritable,
} from '@project-kardeshev/ao-sdk/web';
import { SECRETORIUM_REGISTRY_ID } from '@src/constants';

export interface SecretoriumRegistryReadable {
  getVaults({
    address,
  }: {
    address: string;
  }): Promise<{ Owned: string[]; Controlled: string[] }>;
}

export interface SecretoriumRegistryWritable {
  createVault({ name }: { name: string }): Promise<string>;
}

export class SecretoriumRegistryProcessReadable
  implements SecretoriumRegistryReadable
{
  readonly kvRegistry: KVRegistryAoConnectProcessReadable;

  constructor({
    kvRegistry = new KVRegistryAoConnectProcessReadable({
      processId: SECRETORIUM_REGISTRY_ID,
    }),
  }: {
    kvRegistry?: KVRegistryAoConnectProcessReadable;
  } = {}) {
    this.kvRegistry = kvRegistry;
  }

  async getVaults({
    address,
  }: {
    address: string;
  }): Promise<{ Owned: string[]; Controlled: string[] }> {
    const res = await this.kvRegistry.getKVStores({
      user: address,
    });
    return res;
  }
}

export class SecretoriumRegistryProcessWritable
  extends SecretoriumRegistryProcessReadable
  implements SecretoriumRegistryWritable
{
  readonly kvRegistry: KVRegistryAoConnectProcessWritable;

  constructor({
    signer,
    kvRegistry = new KVRegistryAoConnectProcessWritable({
      processId: SECRETORIUM_REGISTRY_ID,
      signer,
    }),
  }: {
    signer: AoSigner;
    kvRegistry?: KVRegistryAoConnectProcessWritable;
  }) {
    super({ kvRegistry });
    this.kvRegistry = kvRegistry;
  }

  async createVault({ name }: { name?: string } = {}): Promise<string> {
    return this.kvRegistry.spawnKVStore(
      {
        name,
      },
      { data: 'blah' },
    );
  }
}
