import { useActiveStrategy } from '@project-kardeshev/ao-wallet-kit';
import { SecretoriumRegistryProcessWritable } from '@src/services/processes/secretorium_registry';
import { errorEmitter, notificationEmitter } from '@src/utils/events';
import { Hourglass } from 'lucide-react';
import { useState } from 'react';

import Modal from './Modal';

export function CreateVaultModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const strategy = useActiveStrategy();
  const [name, setName] = useState('');
  const [signing, setSigning] = useState(false);

  async function handleCreateVault() {
    try {
      setSigning(true);
      const aoSigner = await strategy?.createDataItemSigner();
      if (!aoSigner) throw new Error('No signer found, connect a wallet first');
      const registry = new SecretoriumRegistryProcessWritable({
        signer: await aoSigner,
      });
      const res = await registry.createVault({ name });
      notificationEmitter.emit('notification', `Vault created with id: ${res}`);
      setOpen(false);
    } catch (error) {
      errorEmitter.emit('error', error);
    } finally {
      setSigning(false);
    }
  }

  return (
    <Modal
      visible={open}
      modalClasses="bg-black p-4 border-secondary border rounded h-[200px] w-[400px]"
      onClickOutside={() => setOpen(false)}
    >
      <>
        {signing ? (
          <div className="flex flex-col justify-between h-full">
            <h1 className="flex gap-2 justify-center w-full items-center pb-2 sm:text-md lg:text-xl tracking-[1rem] font-bold text-primary border-b border-secondary whitespace-nowrap">
              Creating Vault
            </h1>
            <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
              <span className="text-primary flex flex-row gap-6">
                signing, Please wait...{' '}
                <Hourglass className="animate-spin text-primary" />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full">
            <h1 className="flex gap-2 justify-center w-full items-center pb-2 sm:text-md lg:text-xl tracking-[1rem] font-bold text-primary border-b border-secondary whitespace-nowrap">
              Create Vault
            </h1>

            <input
              className="rounded border border-secondary w-full py-2 text-primary bg-background outline-none bg-secondaryThin placeholder:text-xs  p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Vault Name"
            />

            <button
              className="action-button"
              onClick={() => handleCreateVault()}
            >
              Confirm
            </button>
          </div>
        )}
      </>
    </Modal>
  );
}
