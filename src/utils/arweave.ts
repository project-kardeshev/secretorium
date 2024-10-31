import arweaveGraphql from 'arweave-graphql';

export const arGql = arweaveGraphql('https://arweave.net/graphql');

export function getPublicKeysFromAddresses(addresses: string[]) {
  // fetch the public keys from the gateway
  const res = arGql.getTransactions({
    owners: addresses,
  });
  return 'public key';
}
