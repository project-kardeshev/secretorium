import {
  AoSigner,
  KVStoreAoConnectProcessReadable,
  KVStoreAoConnectProcessWritable,
} from '@project-kardeshev/ao-sdk/web';
import { SECRETORIUM_REGISTRY_ID } from '@src/constants';
import { CollaboratorConfig, VaultConfig, Vaults } from '@src/types/vault';
import { fromB64Url } from '@src/utils/encoding';
import { createEncryptedSharesForCollaborators } from '@src/utils/vault';
import { combine } from 'shamir-secret-sharing';

export interface SecretoriumVaultReadable {
  getInfo(): Promise<{
    State: Record<string, any>;
    Name: string;
    Owner: string;
    Controllers: string[];
    Subscribers: string[];
  }>;
  getSecrets(): Promise<Vaults>;
}

export interface SecretoriumVaultWritable {
  setSecret(p: {
    name: string;
    secret: string;
    collaborators: Record<string, CollaboratorConfig>;
  }): Promise<string>;
}

export class SecretoriumVaultProcessReadable
  implements SecretoriumVaultReadable
{
  kvStore: KVStoreAoConnectProcessReadable;

  constructor({
    processId,
    kvStore = new KVStoreAoConnectProcessReadable({ processId }),
  }: {
    processId?: string;
    kvStore?: KVStoreAoConnectProcessReadable;
  } = {}) {
    this.kvStore = kvStore;
  }

  async getInfo(): Promise<{
    State: Record<string, any>;
    Name: string;
    Owner: string;
    Controllers: string[];
    Subscribers: string[];
  }> {
    return this.kvStore.getInfo();
  }
  async getSecrets(): Promise<Vaults> {
    const res = await this.getInfo();

    return res.State.State?.Vaults ?? {};
  }
  async getSecret({
    name,
    address,
    decrypt,
  }: {
    name: string;
    address: string;
    decrypt: (encryptedString: string) => Promise<Uint8Array>;
  }): Promise<string> {
    const vault = await this.kvStore.getValue<VaultConfig>({
      path: `Vaults.${name}`,
    });
    const decoder = new TextDecoder();

    const decryptedShare = await decrypt(vault.collaborators[address].share);
    const decryptedShareUint8Array = decryptedShare;
    const publicShareUint8Array = new Uint8Array(fromB64Url(vault.publicShare));

    const combinedSecret = await combine([
      publicShareUint8Array,
      decryptedShareUint8Array,
    ]);
    return decoder.decode(combinedSecret);
  }
}

export class SecretoriumVaultProcessWritable
  extends SecretoriumVaultProcessReadable
  implements SecretoriumVaultWritable
{
  kvStore: KVStoreAoConnectProcessWritable;

  constructor({
    signer,
    processId = SECRETORIUM_REGISTRY_ID,
    kvStore = new KVStoreAoConnectProcessWritable({
      processId,
      signer,
    }),
  }: {
    signer: AoSigner;
    processId?: string;
    kvStore?: KVStoreAoConnectProcessWritable;
  }) {
    super({ kvStore });
    this.kvStore = kvStore;
  }

  async setSecret({
    name,
    secret,
    collaborators,
  }: {
    name: string;
    secret: string;
    collaborators: Record<string, CollaboratorConfig>;
  }): Promise<string> {
    const shares = await createEncryptedSharesForCollaborators({
      secret,
      collaborators,
    });
    const existingValue = await this.kvStore
      .getValue<VaultConfig>({
        path: `Vaults.${name}`,
      })
      .catch(() => ({}));

    return this.kvStore.setValue({
      path: `Vaults.${name}`,
      value: {
        ...existingValue,
        ...shares,
      },
    });
  }
}
