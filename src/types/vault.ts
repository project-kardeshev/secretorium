import { SIG_CONFIG, SignatureConfig } from '@dha-team/arbundles';

export type CollaboratorConfig = {
  config: (typeof SIG_CONFIG)[SignatureConfig];
  encryptionPublicKey: string;
  share?: string;
};

export const isSignatureConfig = (config: any): config is SignatureConfig => {
  const sigConfig = Object.values(SIG_CONFIG).find(
    (sigConfig) => sigConfig.sigName === config.sigName,
  );
  return (
    config &&
    sigConfig &&
    typeof config === 'object' &&
    typeof config.sigName === 'string' &&
    typeof config.sigConfig === 'object'
  );
};

export function isCollaboratorConfig(
  config: any,
): config is CollaboratorConfig {
  return (
    config &&
    typeof config.encryptionPublicKey === 'string' &&
    (typeof config.share === 'string' || config.share === undefined) &&
    isSignatureConfig(config.config)
  );
}

export type VaultConfig = {
  publicShare: string; // b64url encoded public share
  collaborators: Record<string, CollaboratorConfig & { share: string }>;
  accessRequests: Record<string, CollaboratorConfig & { share: undefined }>;
};

export type Vaults = Record<
  string, // the name of the secret
  VaultConfig
>;

export type SecretoriumVaultState = {
  Owner: string;
  Vaults: Vaults;
};
