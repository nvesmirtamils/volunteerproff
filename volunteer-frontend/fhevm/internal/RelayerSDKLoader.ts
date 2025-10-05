import { SDK_CDN_URL } from "./constants";

declare global {
  interface Window {
    relayerSDK?: any & { __initialized__?: boolean };
  }
}

export class RelayerSDKLoader {
  public async load(): Promise<void> {
    if (typeof window === "undefined") throw new Error("No window");
    if (window.relayerSDK) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Relayer SDK load failed"));
      document.head.appendChild(script);
    });
  }
}



