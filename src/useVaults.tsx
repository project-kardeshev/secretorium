import { useQuery } from '@tanstack/react-query';
import { useActiveAddress } from 'arweave-wallet-kit';

export function useVaults() {
  const activeAddress = useActiveAddress();
  return useQuery({
    queryKey: ['vaults', activeAddress],
    queryFn: async () => {
      const response = await fetch('https://api.secretorium.com/vaults');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });
}
