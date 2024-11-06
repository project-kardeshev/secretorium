import { SecretoriumVaultProcessReadable } from '@src/services/processes/secretorium_vault';
import { useQuery } from '@tanstack/react-query';

export function useSecretoriumVault(processId: string) {
  return useQuery({
    queryKey: ['getVault', processId],
    queryFn: async () => {
      const vaultProcess = new SecretoriumVaultProcessReadable({ processId });
      console.log(vaultProcess);
      return await vaultProcess.getInfo();
    },
  });
}
