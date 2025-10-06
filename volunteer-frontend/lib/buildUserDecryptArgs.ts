import { ethers } from "ethers";

export async function buildUserDecryptArgs(
  instance: any,
  contractAddresses: string[],
  signer: ethers.Signer
): Promise<[string, string, string, string[], string, number, number]> {
  const kp = instance.generateKeypair();
  const start = Math.floor(Date.now() / 1000);
  const durationDays = 365;

  const eip712 = instance.createEIP712(
    kp.publicKey,
    contractAddresses,
    start,
    durationDays
  );

  // ethers v6 signTypedData(domain, types, value)
  const signature = await (signer as any).signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  const userAddress = await signer.getAddress();
  return [kp.privateKey, kp.publicKey, signature, contractAddresses, userAddress, start, durationDays];
}




