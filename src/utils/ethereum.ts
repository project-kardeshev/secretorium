import { encrypt } from '@metamask/eth-sig-util';

import { toB64Url } from './encoding';

/**
 * @param data - Uint8Array of the data to be encrypted
 * @param publicKey - public key of the Ethereum address retrieved via eth_getEncryptionPublicKey
 * @returns - base64url encoded string of the encrypted data
 */
export async function encryptWithEthereumPublicKey(
  data: Uint8Array,
  publicKey: string,
): Promise<string> {
  const stringData = new TextDecoder().decode(data);
  const encryptedData = encrypt({
    data: stringData,
    publicKey: publicKey,
    version: 'x25519-xsalsa20-poly1305',
  });
  return toB64Url(
    Buffer.from(new TextEncoder().encode(JSON.stringify(encryptedData))),
  );
}
