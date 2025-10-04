"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../../hooks/useFhevm";
import { useVolunteerProof } from "../../hooks/useVolunteerProof";

export default function AddRecordPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).ethereum &&
      typeof (window as any).ethereum.request === "function"
    ) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      (async () => {
        const n = await p.getNetwork();
        setChainId(Number(n.chainId));
        // silently restore connected account
        try {
          const accs: string[] = await (window as any).ethereum.request({ method: "eth_accounts" });
          if (accs && accs.length > 0) {
            setSigner(await p.getSigner());
          }
        } catch {}
      })();
    }
  }, []);

  const connect = async () => {
    if (!provider) return;
    await provider.send("eth_requestAccounts", []);
    setSigner(await provider.getSigner());
    const n = await provider.getNetwork();
    setChainId(Number(n.chainId));
    try { localStorage.setItem("vp_connected", "1"); } catch {}
  };

  const { instance, status } = useFhevm(provider ?? undefined, chainId);
  const { submitRecord } = useVolunteerProof({ instance, provider, chainId, signer });

  const [activity, setActivity] = useState("");
  const [hours, setHours] = useState(1);
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 10));
  const [ipfsCid, setIpfsCid] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadToIPFS = async () => {
    if (!file) return;
    setLoading(true);
    setMessage("📤 Uploading to IPFS...");
    try {
      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT || "";
      const web3StorageToken = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN || "";

      if (pinataJwt) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${pinataJwt}`
          } as any,
          body: form
        });
        if (!r.ok) throw new Error(`Pinata upload failed (${r.status})`);
        const j = await r.json();
        setIpfsCid(j?.IpfsHash || j?.cid || "");
        setMessage("✅ Upload complete via Pinata!");
        return;
      }

      if (web3StorageToken) {
        const r = await fetch("https://api.web3.storage/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${web3StorageToken}`
          } as any,
          body: file
        });
        if (!r.ok) throw new Error(`Web3.Storage upload failed (${r.status})`);
        const j = await r.json();
        setIpfsCid(j?.cid || "");
        setMessage("✅ Upload complete via Web3.Storage!");
        return;
      }

      setMessage("⚠️ 未配置 IPFS 上传凭据。请在 .env.local 中设置 NEXT_PUBLIC_PINATA_JWT 或 NEXT_PUBLIC_WEB3STORAGE_TOKEN");
    } catch (e: any) {
      setMessage(`❌ Upload failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!activity || !ipfsCid) {
      setMessage("⚠️ Please fill activity name and IPFS CID");
      return;
    }
    try {
      setLoading(true);
      setMessage("🔐 Encrypting & submitting to blockchain...");
      const date = Number((dateStr || new Date().toISOString().slice(0,10)).replaceAll('-', ''));
      const receipt = await submitRecord({ activity, ipfsCid, hours, date, isPublic });
      setMessage(`✅ Successfully recorded! Tx: ${receipt?.hash ?? ""}`);
      // Reset form
      setActivity("");
      setHours(1);
      setIpfsCid("");
      setFile(null);
      setDateStr(new Date().toISOString().slice(0, 10));
    } catch (e: any) {
      setMessage(`❌ Failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Volunteer Record</h1>
        <p className="text-gray-600">Record your volunteer activity on blockchain with privacy</p>
      </div>

      {!signer ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">Connect to Sepolia testnet to submit records</p>
          <button onClick={connect} disabled={!provider} className="btn-primary">
            Connect Wallet
          </button>
          {!provider && (
            <div className="text-xs text-red-500 mt-2">未检测到钱包，请安装或启用 MetaMask/Rabby</div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activity Name */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Activity Name
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Beach Cleanup, Food Bank, Tree Planting"
              className="input-field"
            />
          </div>

          {/* Hours & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏱️ Hours (Encrypted)
              </label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                min="1"
                className="input-field"
              />
            </div>
            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Date (picker)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📷 Proof Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                {file ? (
                  <div className="text-green-600">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-medium">{file.name}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📁</div>
                    <div className="text-gray-600">Click to select image</div>
                  </div>
                )}
              </label>
            </div>
            {file && !ipfsCid && (
              <button
                onClick={uploadToIPFS}
                disabled={loading}
                className="btn-primary w-full mt-4"
              >
                Upload to IPFS
              </button>
            )}
            {ipfsCid && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800 font-mono break-all">
                  CID: {ipfsCid}
                </div>
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <div className="card">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-gray-700">🌍 Public Record</div>
                <div className="text-xs text-gray-500 mt-1">
                  {isPublic ? "Visible on public wall" : "Private, only you can see"}
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-14 h-8 rounded-full transition-colors ${
                    isPublic ? "bg-green-500" : "bg-gray-300"
                  }`}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      isPublic ? "translate-x-7" : "translate-x-1"
                    } mt-1`}
                  ></div>
                </div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={loading || !signer || !activity || !ipfsCid}
            className="btn-primary w-full text-lg py-4"
          >
            {loading ? "⏳ Processing..." : "🚀 Submit to Blockchain"}
          </button>

          {/* Status Message */}
          {message && (
            <div className={`card ${message.includes("✅") ? "bg-green-50 border-2 border-green-200" : message.includes("❌") ? "bg-red-50 border-2 border-red-200" : "bg-blue-50 border-2 border-blue-200"}`}>
              <div className="text-sm">{message}</div>
            </div>
          )}

          {/* Info Box */}
          <div className="card bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
            <div className="text-sm text-gray-700">
              <div className="font-semibold mb-2">ℹ️ Privacy Notice</div>
              <ul className="space-y-1 text-xs">
                <li>• Hours and date are encrypted with FHE on-chain</li>
                <li>• Only you can decrypt your private records</li>
                <li>• Activity name is hashed for privacy</li>
                <li>• Images are stored on decentralized IPFS</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
