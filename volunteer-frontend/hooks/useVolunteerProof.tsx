"use client";
import { useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { VolunteerProofABI } from "../abi/VolunteerProofABI";
import { VolunteerProofAddresses } from "../abi/VolunteerProofAddresses";
import { buildUserDecryptArgs } from "../lib/buildUserDecryptArgs";
import { createFhevmInstance } from "../fhevm/internal/fhevm";

export function useVolunteerProof(params: {
  instance: any | undefined;
  provider: any | undefined;
  chainId: number | undefined;
  signer: ethers.Signer | undefined;
}) {
  const { instance, provider, chainId, signer } = params;

  const contract = useMemo(() => {
    if (!signer || !chainId) return undefined;
    const entry = VolunteerProofAddresses[String(chainId)] as any;
    if (!entry || !entry.address || entry.address === ethers.ZeroAddress) return undefined;
    return new ethers.Contract(entry.address, VolunteerProofABI.abi, signer);
  }, [signer, chainId]);

  const submitRecord = useCallback(async (p: {
    activity: string;
    ipfsCid: string;
    hours: number;
    date: number;
    isPublic: boolean;
  }) => {
    if (!contract || !signer) throw new Error("Connect wallet or contract not set");
    // lazily build FHEVM instance if not ready yet
    const maybeProvider: any = (provider as any)?.provider ?? (globalThis as any).window?.ethereum;
    if (!instance && !(typeof maybeProvider === "string" || (maybeProvider && typeof maybeProvider.request === "function"))) {
      throw new Error("No valid wallet provider detected. Please connect a wallet.");
    }
    const fhevmInst = instance ?? (await createFhevmInstance(maybeProvider));
    if (!fhevmInst) throw new Error("FHEVM not initialized");
    const user = await signer.getAddress();
    const input = fhevmInst.createEncryptedInput(contract.target.toString(), user);
    input.add32(BigInt(p.hours));
    input.add64(BigInt(p.date));
    const enc = await input.encrypt();
    const activityHash = ethers.keccak256(ethers.toUtf8Bytes(p.activity));
    const tx = await contract.submitRecord(
      activityHash,
      p.ipfsCid,
      enc.handles[0],
      enc.handles[1],
      enc.inputProof,
      p.isPublic
    );
    return await tx.wait();
  }, [instance, provider, contract, signer]);

  const getMyRecordIds = useCallback(async () => {
    if (!contract || !signer) return [] as number[];
    const me = await signer.getAddress();
    const ids: bigint[] = await contract.getUserRecordIds(me);
    return ids.map(n => Number(n));
  }, [contract, signer]);

  const getRecord = useCallback(async (id: number) => {
    if (!contract) return undefined as any;
    return await contract.getRecord(id);
  }, [contract]);

  const userDecryptHours = useCallback(async (handle: string, contractAddress: string) => {
    if (!instance || !signer) throw new Error("Not ready");
    const args = instance.buildUserDecryptArgs
      ? await instance.buildUserDecryptArgs([contractAddress], signer)
      : await buildUserDecryptArgs(instance, [contractAddress], signer);
    const res = await instance.userDecrypt(
      [{ handle, contractAddress }],
      ...args
    );
    return res[handle];
  }, [instance, signer]);

  return { contract, submitRecord, getMyRecordIds, getRecord, userDecryptHours };
}


