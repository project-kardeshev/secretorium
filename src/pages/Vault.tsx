import { SecretCard } from '@src/components/cards/SecretCard';
import { CreateSecretModal } from '@src/components/modals/CreateSecretModal';
import { useSecretoriumVault } from '@src/hooks/useSecretoriumVault';
import { VaultConfig } from '@src/types/vault';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export function Vault() {
  const { id } = useParams<{ id: string }>();
  const { data: vaultInfo } = useSecretoriumVault(id!);
  const [showCreateSecretModal, setShowCreateSecretModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/vaults');
    }
  }, []);
  return (
    <div className="flex flex-col h-full w-full text-white box-border items-center max-w-[700px] m-auto">
      <div className="flex flex-col w-[90%] h-full border border-secondary rounded-md bg-[rgb(0,0,0,0.5)] gap-6 m-2 p-4">
        <div className="flex w-full h-fit max-h-full p-2 justify-center relative">
          <Link
            className="action-button absolute left-[5px] top-[0px] flex flex-row gap-1 justify-center items-center text-[10px] px-3 py-1 pl-0"
            to={'/vaults'}
          >
            {' '}
            <ChevronLeft className="text-sm h-[18px]" />
            Vaults
          </Link>
          <h1 className="flex gap-6 items-center pb-2 sm:text-md lg:text-xl w-full justify-center font-bold text-primary border-b border-secondary">
            {vaultInfo?.Name ?? id?.slice(0, 8) ?? 'Vault'}
            <img
              alt="lock icon"
              className="rounded w-[25px] lg:w-[40px]"
              src={'/images/lock-icon.webp'}
            />
          </h1>
        </div>
        <div className="w-full h-full flex flex-col justify-between items-end ">
          <div className="scrollbar overflow-y-scroll w-full h-full max-h-[470px] md:max-h-[600px]">
            <div className="flex w-full h-full flex-col gap-2 p-4">
              {vaultInfo?.State?.State?.Vaults &&
                Object.entries(vaultInfo?.State.State.Vaults).map(
                  ([name, config]) => (
                    <SecretCard
                      key={name}
                      name={name}
                      config={config as VaultConfig}
                      processId={id!}
                    />
                  ),
                )}
            </div>
          </div>
          <button
            className="action-button w-full"
            onClick={() => setShowCreateSecretModal(true)}
          >
            New Secret
          </button>
        </div>
      </div>
      <CreateSecretModal
        processId={id!}
        open={showCreateSecretModal}
        setOpen={(b: boolean) => setShowCreateSecretModal(b)}
      />
    </div>
  );
}
