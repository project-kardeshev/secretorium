import arweaveGraphql from 'arweave-graphql';
import rsa from 'js-crypto-rsa';

import { toB64Url } from './encoding';

export const arGql = arweaveGraphql('https://arweave.net/graphql');

/**
 * @param data Uint8Array of the data to be encrypted
 * @param publicKey public key of the Arweave address
 * @returns base64url encoded string of the encrypted data
 */
export async function encryptWithArweavePublicKey(
  data: Uint8Array,
  publicKey: string,
): Promise<string> {
  const encryptedData = await rsa.encrypt(data, {
    kty: 'RSA',
    n: publicKey,
    e: 'AQAB',
  });

  return toB64Url(Buffer.from(encryptedData));
}
