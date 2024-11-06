import { VaultCard } from '@src/components/cards/VaultCard';
import { CreateVaultModal } from '@src/components/modals/CreateVaultModal';
import { useSecretoriumVaults } from '@src/hooks/useSecretoriumVaults';
import { useState } from 'react';

export function Vaults() {
  const { data: vaults } = useSecretoriumVaults();
  const [showCreateVaultModal, setShowCreateVaultModal] = useState(false);

  return (
    <div className="flex flex-col h-full w-full text-white box-border items-center max-w-[700px] m-auto ">
      <div className="flex flex-col w-[90%] h-full border border-secondary rounded-md bg-[rgb(0,0,0,0.5)] gap-6 m-2 p-4">
        <div className="flex w-full h-fit max-h-full p-2 justify-center">
          <h1 className="flex gap-2 items-center pb-2 sm:text-md lg:text-xl tracking-[.8rem] lg:tracking-[1.15rem] font-bold text-primary border-b border-secondary">
            Vaults
            <img
              alt="lock icon"
              className="rounded w-[25px] lg:w-[40px]"
              src={'/images/lock-icon.webp'}
            />
          </h1>
        </div>
        <div className="w-full h-full flex flex-col justify-between items-end ">
          {/* vaults list */}
          <div className="scrollbar overflow-y-scroll w-full h-full max-h-[470px] md:max-h-[600px]">
            <div className="flex w-full h-full flex-col gap-2 p-4">
              {vaults ? (
                [...vaults?.Controlled, ...vaults?.Owned]?.map(
                  (vault, index) => <VaultCard processId={vault} key={index} />,
                )
              ) : (
                <span className="flex w-full justify-center text-xl">
                  No Vaults
                </span>
              )}
            </div>
          </div>

          <button
            className="action-button w-full"
            onClick={() => setShowCreateVaultModal(true)}
          >
            New Vault
          </button>
        </div>
      </div>
      <CreateVaultModal
        open={showCreateVaultModal}
        setOpen={(b: boolean) => setShowCreateVaultModal(b)}
      />
    </div>
  );
}
