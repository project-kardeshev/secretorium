import { SIG_CONFIG, SignatureConfig } from '@dha-team/arbundles';
import {
  WagmiStrategy,
  getEthersSigner,
  useActiveStrategy,
  useAddress,
} from '@project-kardeshev/ao-wallet-kit';
import { SecretoriumVaultProcessWritable } from '@src/services/processes/secretorium_vault';
import { errorEmitter, notificationEmitter } from '@src/utils/events';
import { Hourglass } from 'lucide-react';
import { useState } from 'react';

import Modal from './Modal';

export function CreateSecretModal({
  processId,
  open,
  setOpen,
}: {
  processId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const strategy = useActiveStrategy();
  const address = useAddress();
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [signing, setSigning] = useState(false);

  async function handleCreateSecret() {
    try {
      setSigning(true);
      const aoSigner = await strategy?.createDataItemSigner();
      let encryptionPublicKey = await strategy!.getActivePublicKey!();
      if (strategy instanceof WagmiStrategy) {
        const signer = await getEthersSigner(strategy.config);
        encryptionPublicKey = await signer.provider.send(
          'eth_getEncryptionPublicKey',
          [address],
        );
      }
      if (!aoSigner || !address || !encryptionPublicKey) {
        console.log({
          aoSigner,
          address,
          encryptionPublicKey,
        });
        throw new Error('No signer found, connect a wallet first');
      }
      const vault = new SecretoriumVaultProcessWritable({
        processId,
        signer: await aoSigner,
      });

      console.log({
        address,
        encryptionPublicKey,
      });

      const res = await vault.setSecret({
        name,
        secret,
        collaborators: {
          [address]: {
            config:
              SIG_CONFIG[
                strategy instanceof WagmiStrategy
                  ? SignatureConfig.ETHEREUM
                  : SignatureConfig.ARWEAVE
              ],
            encryptionPublicKey: encryptionPublicKey,
          },
        },
      });
      notificationEmitter.emit(
        'notification',
        `Secret created with id: ${res}`,
      );
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
              Creating Secret
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
            <h1 className="flex gap-2 justify-center w-full animate-pulse items-center pb-2 sm:text-md lg:text-xl tracking-[1rem] font-bold text-primary border-b border-secondary whitespace-nowrap">
              Create Secret
            </h1>
            <div className="flex flex-col gap-2 w-full">
              <input
                className="rounded border border-secondary w-full py-2 text-primary bg-background outline-none bg-secondaryThin placeholder:text-xs  p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Secret Name"
              />
              <input
                className="rounded border border-secondary w-full py-2 text-primary bg-background outline-none bg-secondaryThin placeholder:text-xs  p-2"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter Secret"
              />
            </div>

            <button
              className="action-button"
              onClick={() => handleCreateSecret()}
            >
              Confirm
            </button>
          </div>
        )}
      </>
    </Modal>
  );
}
