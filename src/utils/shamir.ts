import { split } from 'shamir-secret-sharing';

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
  return split(stringToUint8Array(secret), amountOfShares, threshold);
}

export async function createEncryptedShares({
  secret,
  collaborators,
}: {
  secret: string;
  collaborators: string[]; // list of collaborator addresses to be fetched from the gateway
}) {
  // need to fetch the public key of each collaborator
 const publicKeys = []
  // create the shares of the secret
  const shares = await createCollaboratorSharesFromSecretString({
    secret,
    threshold: 2,
    amountOfShares: collaborators.length + 1,
  });
  // select the public share
  const publicShare = shares[0];
  // create a mapping of encrypted share to collaborator address which they can decrypt and combine with the public share to get the secret
  return shares.map((share, index) => ({
    collaborator: collaborators[index],
    share: share.toString('hex'),
  }));
}
