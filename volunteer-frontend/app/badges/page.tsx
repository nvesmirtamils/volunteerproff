"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { VolunteerBadgeABI } from "../../abi/VolunteerBadgeABI";
import { VolunteerBadgeAddresses } from "../../abi/VolunteerBadgeAddresses";
import { VolunteerProofABI } from "../../abi/VolunteerProofABI";
import { VolunteerProofAddresses } from "../../abi/VolunteerProofAddresses";

const BADGE_LEVELS = [
  { level: 1, name: "Green Starter", emoji: "🌱", minRecords: 1, color: "from-green-300 to-green-400" },
  { level: 2, name: "Eco Warrior", emoji: "🌳", minRecords: 5, color: "from-green-400 to-green-500" },
  { level: 3, name: "Community Hero", emoji: "🦸", minRecords: 10, color: "from-blue-400 to-blue-500" },
  { level: 4, name: "Change Maker", emoji: "⭐", minRecords: 20, color: "from-purple-400 to-purple-500" }
];

export default function BadgesPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [userLevel, setUserLevel] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const thresholds = [1, 5, 10, 20];

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).ethereum &&
      typeof (window as any).ethereum.request === "function"
    ) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      // silent connect
      (async () => {
        try {
          const accs: string[] = await (window as any).ethereum.request({ method: "eth_accounts" });
          if (accs && accs.length > 0) {
            setSigner(await p.getSigner());
          }
        } catch {}
      })();
      const onChainChanged = async () => {
        // trigger refresh when chain changes
        await refresh();
      };
      (window as any).ethereum.on?.("chainChanged", onChainChanged);
      (window as any).ethereum.on?.("accountsChanged", onChainChanged);
      return () => {
        (window as any).ethereum.removeListener?.("chainChanged", onChainChanged);
        (window as any).ethereum.removeListener?.("accountsChanged", onChainChanged);
      };
    }
  }, []);

  const connect = async () => {
    if (!provider) return;
    await provider.send("eth_requestAccounts", []);
    setSigner(await provider.getSigner());
  };

  const refresh = async () => {
    try {
      if (!provider) return;
      const n = await provider.getNetwork();
      const badgeAddr = VolunteerBadgeAddresses[String(Number(n.chainId))]?.address as `0x${string}`;
      if (!badgeAddr) return;
      const contract = new ethers.Contract(badgeAddr, VolunteerBadgeABI.abi, provider);
      let me = ethers.ZeroAddress;
      try {
        me = signer ? await signer.getAddress() : await provider.getSigner().getAddress();
      } catch {
        await provider.send("eth_requestAccounts", []);
        me = await provider.getSigner().getAddress();
        setSigner(await provider.getSigner());
      }
      if (me !== ethers.ZeroAddress) {
        const lvl: number = Number(await contract.highestLevel(me));
        setUserLevel(Math.max(0, Math.min(3, lvl - 1)));
        const proofAddr = VolunteerProofAddresses[String(Number(n.chainId))]?.address as `0x${string}`;
        if (proofAddr) {
          const proof = new ethers.Contract(proofAddr, VolunteerProofABI.abi, provider);
          const cnt: number = Number(await proof.getPublicRecordCount(me));
          setRecordCount(cnt);
        }
      }
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, [provider, signer]);

  const claim = async () => {
    try {
      if (!provider || !signer) return;
      setClaiming(true);
      const n = await provider.getNetwork();
      const proofAddr = VolunteerProofAddresses[String(Number(n.chainId))]?.address as `0x${string}`;
      if (!proofAddr) return;
      const me = await signer.getAddress();
      const proof = new ethers.Contract(proofAddr, VolunteerProofABI.abi, signer);
      const tx = await proof.awardBadge(me);
      await tx.wait();
      // refresh level
      const badgeAddr = VolunteerBadgeAddresses[String(Number(n.chainId))]?.address as `0x${string}`;
      const badge = new ethers.Contract(badgeAddr, VolunteerBadgeABI.abi, provider);
      const lvl: number = Number(await badge.highestLevel(me));
      setUserLevel(Math.max(0, Math.min(3, lvl - 1)));
      // refresh count
      const cnt: number = Number(await proof.getPublicRecordCount(me));
      setRecordCount(cnt);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Volunteer Badges</h1>
        <p className="text-gray-600">Collect NFT badges as you contribute to the community</p>
      </div>

      {!signer ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏅</div>
          <h3 className="text-xl font-bold mb-4">Connect to View Your Badges</h3>
          <button onClick={connect} disabled={!provider} className="btn-primary">
            Connect Wallet
          </button>
          {!provider && (
            <div className="text-xs text-red-500 mt-2">未检测到钱包，请安装或启用 MetaMask/Rabby</div>
          )}
        </div>
      ) : (
        <div>
          {/* Current Level */}
          <div className="card mb-8 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
            <div className="text-center py-6">
              <div className="text-6xl mb-4">
                {BADGE_LEVELS[userLevel]?.emoji || "🌟"}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {BADGE_LEVELS[userLevel]?.name || "New Volunteer"}
              </h2>
              <div className="text-gray-600 mb-4">
                Level {userLevel + 1} • {recordCount} public records
              </div>
              <div className="max-w-md mx-auto bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${BADGE_LEVELS[userLevel]?.color || "from-gray-400 to-gray-500"} transition-all duration-500`}
                  style={{
                    width: `${Math.min((recordCount / (BADGE_LEVELS[userLevel + 1]?.minRecords || 100)) * 100, 100)}%`
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {BADGE_LEVELS[userLevel + 1]
                  ? `${BADGE_LEVELS[userLevel + 1].minRecords - recordCount} more records to next level`
                  : "Max level reached!"}
              </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button className="btn-secondary" onClick={refresh}>Refresh</button>
            <button className="btn-primary" onClick={claim} disabled={claiming}>
              {claiming ? "Claiming..." : "Claim Badge"}
            </button>
          </div>
            </div>
          </div>

          {/* All Badge Levels */}
          <h3 className="text-2xl font-bold mb-6">All Badge Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BADGE_LEVELS.map((badge) => {
              const isUnlocked = recordCount >= badge.minRecords;
              return (
                <div
                  key={badge.level}
                  className={`card text-center transition-all ${
                    isUnlocked
                      ? "hover:scale-105 border-2 border-green-200"
                      : "opacity-50 grayscale"
                  }`}
                >
                  <div className="text-6xl mb-4">{badge.emoji}</div>
                  <h4 className="font-bold text-lg mb-2">{badge.name}</h4>
                  <div className="text-sm text-gray-600 mb-3">Level {badge.level}</div>
                  <div className={`badge ${isUnlocked ? "badge-public" : "badge-private"}`}>
                    {isUnlocked ? "✅ Unlocked" : `🔒 ${badge.minRecords} records`}
                  </div>
                  {isUnlocked && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-gray-500">NFT Badge</div>
                      <div className="text-xs font-mono text-gray-400 break-all">
                        Token #{badge.level}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="card mt-8 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
            <div className="text-sm text-gray-700">
              <div className="font-semibold mb-2">ℹ️ How Badge System Works</div>
              <ul className="space-y-1 text-xs">
                <li>• Badges are NFTs minted automatically based on your public record count</li>
                <li>• Only public records count towards badge progression</li>
                <li>• Each level unlocks a unique NFT badge</li>
                <li>• Badges are stored on Sepolia testnet</li>
                <li>• You can display badges in your wallet and across dApps</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

