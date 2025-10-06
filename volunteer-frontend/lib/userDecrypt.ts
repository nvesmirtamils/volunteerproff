import { ethers } from "ethers";

export async function userDecryptSingle(instance: any, handle: string, contractAddress: string, signer: ethers.Signer) {
  if (instance.buildUserDecryptArgs) {
    const args = await instance.buildUserDecryptArgs([contractAddress], signer);
    const res = await instance.userDecrypt([{ handle, contractAddress }], ...args);
    return res[handle];
  }
  throw new Error("SDK missing buildUserDecryptArgs");
}




