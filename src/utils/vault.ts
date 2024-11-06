import { SIG_CONFIG, SignatureConfig } from '@dha-team/arbundles';
import { CollaboratorConfig } from '@src/types/vault';
import { split } from 'shamir-secret-sharing';

import { encryptWithArweavePublicKey } from './arweave';
import { toB64Url } from './encoding';
import { encryptWithEthereumPublicKey } from './ethereum';

export const stringToUint8Array = (data: string) =>
  new TextEncoder().encode(data);

export async function createCollaboratorSharesFromSecretString({
  secret,
  threshold,
  amountOfShares,
}: {
  secret: string;
  threshold: number;
  amountOfShares: number;
}) {
  if (amountOfShares > 255)
    throw new Error('Too many shares, shamir sharing has a max of 255');
  if (threshold > amountOfShares)
    throw new Error('Threshold can not be greater than amount of shares');
  return split(stringToUint8Array(secret), amountOfShares, threshold);
}

export async function encryptWithPublicKeyForCollaborator({
  data,
  publicKey,
  config,
}: {
  data: Uint8Array;
  publicKey: string;
  config: (typeof SIG_CONFIG)[SignatureConfig];
}) {
  switch (config.sigName) {
    case 'arweave':
      return encryptWithArweavePublicKey(data, publicKey);
    case 'ethereum':
      return encryptWithEthereumPublicKey(data, publicKey);
    default:
      throw new Error('Unsupported signature config');
  }
}
/**
 * @description Creates encrypted shares for a secret for each collaborator
 * @param secret the secret to create shares for. Could be an api key, a password, etc.
 * @returns {publicShare: string, collaborators: Record<string, CollaboratorConfig & { share: string }>} the public share and the encrypted shares for each collaborator
 */
export async function createEncryptedSharesForCollaborators({
  secret,
  collaborators,
}: {
  secret: string;
  collaborators: Record<string, CollaboratorConfig>; // list of collaborator addresses and configs
}) {
  // create the shares of the secret
  const collaboratorCount = Object.keys(collaborators).length;
  const publicSharesCount = 1;
  const shares = await createCollaboratorSharesFromSecretString({
    secret,
    threshold: 2,
    amountOfShares: collaboratorCount + publicSharesCount,
  });
  // select the public share
  const [publicShare, ...collaboratorShares] = shares;
  if (collaboratorShares.length !== collaboratorCount) {
    throw new Error('Invalid number of shares');
  }
  const collaboratorsWithShares: Record<
    string,
    CollaboratorConfig & { share: string }
  > = await Promise.all(
    Object.entries(collaborators).map(
      async ([collaborator, collaboratorConfig], index) => [
        collaborator,
        {
          encryptionPublicKey: collaboratorConfig.encryptionPublicKey,
          share: await encryptWithPublicKeyForCollaborator({
            data: collaboratorShares[index],
            publicKey: collaboratorConfig.encryptionPublicKey,
            config: collaboratorConfig.config,
          }),
          collaboratorConfig,
        },
      ],
    ),
  ).then((entries) => Object.fromEntries(entries));

  return {
    publicShare: toB64Url(Buffer.from(publicShare)),
    collaborators: collaboratorsWithShares,
  };
}
