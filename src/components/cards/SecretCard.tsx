import { VaultConfig } from '@src/types/vault';
import { Eye } from 'lucide-react';
import { useState } from 'react';

import { ViewSecretModal } from '../modals/ViewSecretModal';

export function SecretCard({
  name,
  processId,
  config,
}: {
  name: string;
  processId: string;
  config: VaultConfig;
}) {
  const [showSecretModal, setShowSecreteModal] = useState(false);
  return (
    <div
      className={`rounded border border-secondary px-3 py-2 text-xs md:text-sm text-primary  bg-background flex flex-row justify-between items-center`}
    >
      {' '}
      <span>{name}</span>
      <span>Collaborators: {Object.keys(config.collaborators).length}</span>
      <button onClick={() => setShowSecreteModal(true)}>
        <Eye className=" w-8 h-8" />
      </button>{' '}
      <ViewSecretModal
        name={name}
        processId={processId}
        open={showSecretModal}
        setOpen={(b: boolean) => setShowSecreteModal(b)}
      />
    </div>
  );
}
