import { Process, ProcessReadable, AO } from '@project-kardeshev/ao-sdk';
import { SECRETORIUM_REGISTRY_ID } from '@src/constants';

interface SecretoriumRegistryReadable {
  getVaults({ address }: { address: string }): Promise<string>;
}

interface SecretoriumRegistryWritable {
  createVault({ name }: { name: string }): Promise<string>;
}

export class SecretoriumRegistryProcessReadable {
  process: ProcessReadable;

  constructor({ processId = SECRETORIUM_REGISTRY_ID }: { processId: string }) {
    this.process = Process.init({
      processId,
      ao: new AO({})
    }) as ProcessReadable;
  }
}
