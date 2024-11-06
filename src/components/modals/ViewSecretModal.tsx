import {
  useActiveStrategy,
  useAddress,
} from '@project-kardeshev/ao-wallet-kit';
import { SecretoriumVaultProcessReadable } from '@src/services/processes/secretorium_vault';
import { fromB64Url } from '@src/utils/encoding';
import { errorEmitter } from '@src/utils/events';
import { Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';

import Modal from './Modal';

export function ViewSecretModal({
  name,
  processId,
  open,
  setOpen,
}: {
  name: string;
  processId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const strategy = useActiveStrategy();
  const address = useAddress();
  const [secret, setSecret] = useState('');
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    if (open) {
      handleDecryptSecret();
    }
  }, [open, strategy, address]);

  async function handleDecryptSecret() {
    try {
      setDecrypting(true);
      if (!strategy || !address || strategy?.decrypt == undefined) {
        throw new Error('No address or decrypt strategy');
      }
      const vault = new SecretoriumVaultProcessReadable({ processId });
      const decrypted = await vault.getSecret({
        name,
        address,
        decrypt: (s) => {
          return strategy.decrypt!(fromB64Url(s));
        },
      });
      setSecret(decrypted);
    } catch (error) {
      errorEmitter.emit('error', error);
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <Modal
      visible={open}
      modalClasses="bg-black p-4 border-secondary border rounded h-[200px] w-[400px]"
      onClickOutside={() => setOpen(false)}
    >
      <>
        {decrypting ? (
          <div className="flex flex-col justify-between h-full">
            <h1 className="flex gap-2 justify-center w-full items-center pb-2 sm:text-md lg:text-xl tracking-[1rem] font-bold text-primary border-b border-secondary whitespace-nowrap">
              Decrypting Secret
            </h1>
            <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
              <span className="text-primary flex flex-row gap-6">
                decrypting, Please wait...{' '}
                <Hourglass className="animate-spin text-primary" />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full">
            <h1 className="flex gap-2 justify-center w-full animate-pulse items-center pb-2 sm:text-md lg:text-xl tracking-[1rem] font-bold text-primary border-b border-secondary whitespace-nowrap">
              Secret: {name}
            </h1>
            <div className="flex flex-col gap-2 w-full">
              {secret ?? 'No secret'}
            </div>
          </div>
        )}
      </>
    </Modal>
  );
}
