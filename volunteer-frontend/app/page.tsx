"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { useFhevm } from "../hooks/useFhevm";

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  // FHEVM status
  const { status: fhevmStatus, error: fhevmError } = useFhevm(provider ?? undefined, chainId);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).ethereum &&
      typeof (window as any).ethereum.request === "function"
    ) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      (async () => {
        try {
          const n = await p.getNetwork();
          setChainId(Number(n.chainId));
          // Detect already connected accounts without prompting
          const accs: string[] = await (window as any).ethereum.request({ method: "eth_accounts" });
          if (accs && accs.length > 0) {
            setAccount(accs[0]);
          }
        } catch {}
      })();

      const onAccountsChanged = (accs: string[]) => {
        setAccount(accs && accs.length > 0 ? accs[0] : null);
      };
      const onChainChanged = async (_: any) => {
        try {
          const n = await p.getNetwork();
          setChainId(Number(n.chainId));
        } catch {}
      };
      (window as any).ethereum.on?.("accountsChanged", onAccountsChanged);
      (window as any).ethereum.on?.("chainChanged", onChainChanged);
      return () => {
        (window as any).ethereum.removeListener?.("accountsChanged", onAccountsChanged);
        (window as any).ethereum.removeListener?.("chainChanged", onChainChanged);
      };
    }
  }, []);

  const connect = async () => {
    if (!provider) return;
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);
    const n = await provider.getNetwork();
    setChainId(Number(n.chainId));
    try { localStorage.setItem("vp_connected", "1"); } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-block mb-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          🌱 Powered by FHEVM & Sepolia
        </div>
        {/* FHEVM runtime status */}
        <div className="mt-2 mb-6 flex items-center justify-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            fhevmStatus === "ready"
              ? "bg-green-100 text-green-700"
              : fhevmStatus === "loading"
              ? "bg-yellow-100 text-yellow-700"
              : fhevmStatus === "error"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            FHEVM: {fhevmStatus}
          </span>
          {fhevmError && (
            <span className="text-xs text-red-500 max-w-md truncate" title={fhevmError.message}>
              {fhevmError.message}
            </span>
          )}
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Decentralized Volunteer Records
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Record, verify and showcase your volunteer service on blockchain with full privacy protection
        </p>
        
        {!account ? (
          <button onClick={connect} disabled={!provider} className="btn-primary text-lg px-8 py-4">
            🔗 Connect Wallet
          </button>
        ) : (
          <div className="card inline-block">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full"></div>
              <div className="text-left">
                <div className="text-sm text-gray-500">Connected</div>
                <div className="font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</div>
              </div>
            </div>
          </div>
        )}
        {!provider && (
          <div className="text-xs text-red-500 mt-2">未检测到钱包，请安装或启用 MetaMask/Rabby</div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">
            ∞
          </div>
          <div className="text-gray-600 font-medium">Total Hours</div>
          <div className="text-sm text-gray-500 mt-1">Encrypted on-chain</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">
            🌍
          </div>
          <div className="text-gray-600 font-medium">Public Records</div>
          <div className="text-sm text-gray-500 mt-1">Verified activities</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">
            🏅
          </div>
          <div className="text-gray-600 font-medium">Badges Issued</div>
          <div className="text-sm text-gray-500 mt-1">NFT achievements</div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">Submit Records</h3>
          <p className="text-gray-600 mb-4">
            Upload volunteer activity with encrypted hours and date. Store proof on IPFS.
          </p>
          <Link href="/add" className="text-green-600 font-medium hover:underline">
            Start Recording →
          </Link>
        </div>

        <div className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl mb-4">🔐</div>
          <h3 className="text-xl font-bold mb-2">Privacy First</h3>
          <p className="text-gray-600 mb-4">
            Choose public or private mode. Your data is encrypted with FHE technology.
          </p>
          <Link href="/my" className="text-green-600 font-medium hover:underline">
            View My Records →
          </Link>
        </div>

        <div className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl mb-4">🌍</div>
          <h3 className="text-xl font-bold mb-2">Public Wall</h3>
          <p className="text-gray-600 mb-4">
            Discover public volunteer activities from the community worldwide.
          </p>
          <Link href="/wall" className="text-green-600 font-medium hover:underline">
            Explore Wall →
          </Link>
        </div>

        <div className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl mb-4">🏅</div>
          <h3 className="text-xl font-bold mb-2">Earn Badges</h3>
          <p className="text-gray-600 mb-4">
            Collect NFT badges as you contribute. Level up your volunteer profile.
          </p>
          <Link href="/badges" className="text-green-600 font-medium hover:underline">
            View Badges →
          </Link>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
        <h3 className="text-2xl font-bold mb-4 text-center">Built with Cutting-Edge Tech</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="font-medium">FHEVM</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="font-medium">Zama Protocol</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="font-medium">Sepolia Testnet</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="font-medium">IPFS</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="font-medium">Next.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}
