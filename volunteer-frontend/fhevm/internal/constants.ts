export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

export function getFallbackRpcUrl(): string {
  // Prefer chain-specific, then generic
  const url =
    (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL as string | undefined) ||
    (process.env.NEXT_PUBLIC_RPC_URL as string | undefined) ||
    "";
  return url;
}


