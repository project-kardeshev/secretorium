import { useAddress } from '@project-kardeshev/ao-wallet-kit';
import { useGlobalState } from '@src/services/useGlobalState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useSecretoriumVaults(userAddress?: string) {
  const client = useQueryClient();
  const address = useAddress();
  const { secretoriumRegistry } = useGlobalState();
  const res = useQuery({
    queryKey: ['getVaults', userAddress ?? address],
    queryFn: async () => {
      return await secretoriumRegistry.getVaults({
        address: (userAddress ?? address) as string,
      });
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      client.invalidateQueries({
        queryKey: ['getVaults', userAddress ?? address],
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [address, secretoriumRegistry, client]);

  return res;
}
