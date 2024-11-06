import { Skeleton } from '@radix-ui/themes';
import { useSecretoriumVault } from '@src/hooks/useSecretoriumVault';
import { Hourglass, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VaultCard({ processId }: { processId: string }) {
  const { data: vaultInfo, isLoading } = useSecretoriumVault(processId);

  return (
    <>
      {isLoading ? (
        <div className="rounded border border-secondary px-3 py-2 text-xs md:text-sm text-primary hover:text-white hover:scale-105 transition-all ease-in-out bg-background hover:bg-foreground">
          <Skeleton className="flex flex-row justify-between items-center w-full animate-pulse">
            Loading <Hourglass className="animate-spin" />
          </Skeleton>
        </div>
      ) : (
        vaultInfo && (
          <Link
            to={'/vault/' + processId}
            className="rounded border border-secondary px-3 py-2 text-xs md:text-sm text-primary hover:text-white hover:scale-105 transition-all ease-in-out bg-background hover:bg-foreground flex flex-row justify-between items-center"
          >
            <div className="flex flex-col gap-2 items-start">
              <span>Name: {vaultInfo?.Name}</span>
              <span>
                Secrets:{' '}
                {Object.keys(vaultInfo?.State.State?.Vaults ?? {}).length}
              </span>
            </div>
            <User className="bg-black w-8 h-8 rounded-full border border-secondary" />
          </Link>
        )
      )}
    </>
  );
}
