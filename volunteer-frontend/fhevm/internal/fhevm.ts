import { RelayerSDKLoader } from "./RelayerSDKLoader";
import { getFallbackRpcUrl } from "./constants";
import { ethers } from "ethers";

export type FhevmInstance = any;

export async function createFhevmInstance(providerOrUrl: any): Promise<FhevmInstance> {
  const loader = new RelayerSDKLoader();
  await loader.load();

  if (!window.relayerSDK?.__initialized__) {
    await window.relayerSDK.initSDK();
    window.relayerSDK.__initialized__ = true;
  }

  // Normalize provider: accept BrowserProvider, window.ethereum, or RPC URL
  let networkParam: any = providerOrUrl;
  // If ethers BrowserProvider instance was passed, use its underlying EIP-1193 provider
  if (networkParam && typeof networkParam.request !== "function" && networkParam.provider?.request) {
    networkParam = networkParam.provider;
  }
  // If nothing passed, try window.ethereum on client side
  if (!networkParam && typeof window !== "undefined") {
    networkParam = (window as any).ethereum;
  }
  // If still nothing or invalid, try fallback RPC URL from env
  const fallbackUrl = getFallbackRpcUrl();
  if (
    (!networkParam || (networkParam && typeof networkParam.request !== "function")) &&
    typeof fallbackUrl === "string" && fallbackUrl.length > 0
  ) {
    // Build a minimal EIP-1193 provider from a JsonRpcProvider for read-only operations
    const jsonRpc = new ethers.JsonRpcProvider(fallbackUrl);
    const eip1193Shim = {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        return await jsonRpc.send(method, Array.isArray(params) ? params : []);
      },
      on: (_event: string, _listener: (...args: any[]) => void) => {
        // no-op for readonly shim
      },
      removeListener: (_event: string, _listener: (...args: any[]) => void) => {
        // no-op for readonly shim
      }
    } as any;
    networkParam = eip1193Shim;
  }

  // Validate network parameter: must be string (RPC URL) or EIP-1193 (has request function)
  const isValidEip1193 = !!(networkParam && typeof networkParam.request === "function");
  if (!isValidEip1193) {
    throw new Error("No valid EIP-1193 provider found. Please install/enable a wallet or provide an RPC URL.");
  }

  const instance = await window.relayerSDK.createInstance({
    ...window.relayerSDK.SepoliaConfig,
    network: networkParam
  });
  return instance;
}


