"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { VolunteerProofABI } from "../../abi/VolunteerProofABI";
import { VolunteerProofAddresses } from "../../abi/VolunteerProofAddresses";
import { VolunteerLikeABI } from "../../abi/VolunteerLikeABI";
import { VolunteerLikeAddresses } from "../../abi/VolunteerLikeAddresses";
import { VolunteerCommentABI } from "../../abi/VolunteerCommentABI";
import { VolunteerCommentAddresses } from "../../abi/VolunteerCommentAddresses";

export default function PublicWallPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [posting, setPosting] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

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
      })();
      const onChainChanged = async () => {
        const n = await p.getNetwork();
        setChainId(Number(n.chainId));
      };
      (window as any).ethereum.on?.("chainChanged", onChainChanged);
      return () => {
        (window as any).ethereum.removeListener?.("chainChanged", onChainChanged);
      };
    }
  }, []);

  const load = async () => {
    if (!provider || !chainId) return;
    setLoading(true);
    try {
      const entry = VolunteerProofAddresses[String(chainId)];
      if (!entry) return;
      const c = new ethers.Contract(entry.address, VolunteerProofABI.abi, provider);
      const likeAddr = VolunteerLikeAddresses[String(chainId)]?.address as `0x${string}`;
      const likeContract = likeAddr ? new ethers.Contract(likeAddr, VolunteerLikeABI.abi, provider) : undefined;
      const ids: bigint[] = await c.getPublicRecordWindow(0, 100);
      const out: any[] = [];
      const currentUser = await (async () => {
        try { return await (await provider.getSigner()).getAddress(); } catch { return ethers.ZeroAddress; }
      })();
      for (const id of ids) {
        const r = await c.getRecord(Number(id));
        let liked = false; let likes = 0n;
        if (likeContract) {
          try {
            const res = await likeContract.getLike(Number(id), currentUser);
            liked = Boolean(res[0]);
            likes = BigInt(res[1]);
          } catch {}
        }
        out.push({ id: Number(id), ipfsCid: r[1], isPublic: r[4], user: r[5], createdAt: Number(r[6]), likes: Number(likes), liked });
      }
      setRows(out);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
            toast.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Volunteer Wall</h1>
        <p className="text-gray-600">Discover volunteer activities shared by the community</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-600">
          {rows.length} public record{rows.length !== 1 ? "s" : ""} displayed
        </div>
        <button
          onClick={load}
          disabled={loading || !provider || !chainId}
          className="btn-primary"
        >
          {loading ? "⏳ Loading..." : "🔄 Load Records"}
        </button>
        {!provider && (
          <div className="text-xs text-red-500 ml-3">未检测到钱包，请安装或启用 MetaMask/Rabby</div>
        )}
      </div>

      {rows.length === 0 && !loading && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl font-bold mb-2">No Public Records Yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share your volunteer story!</p>
          <a href="/add" className="btn-primary inline-block">
            Submit Record
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rows.map((r) => (
          <div key={r.id} className="card hover:scale-105 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-mono text-gray-500">#{r.id}</div>
              <span className="badge badge-public">🌍 Public</span>
            </div>

            {r.ipfsCid && (
              <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-48 flex items-center justify-center">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${r.ipfsCid}`}
                  alt="volunteer proof"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as any).style.display = "none";
                    (e.target as any).nextSibling.style.display = "flex";
                  }}
                />
                <div className="text-6xl hidden">📷</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-xs">
                <span className="text-gray-500 mr-2">By:</span>
                <span className="font-mono text-gray-700">
                  {r.user?.slice(0, 6)}...{r.user?.slice(-4)}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(r.createdAt * 1000).toLocaleDateString()}
              </div>
            </div>

            {/* Like & Comment */}
            <div className="mt-3 flex items-center justify-between">
              <button
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${r.liked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                onClick={async () => {
                  try {
                    if (!provider) return;
                    const signer = await provider.getSigner();
                    const likeAddr = VolunteerLikeAddresses[String(chainId!)]?.address as `0x${string}`;
                    const likeContract = new ethers.Contract(likeAddr, VolunteerLikeABI.abi, signer);
                    const tx = await likeContract.toggleLike(r.id);
                    await tx.wait();
                    setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, liked: !x.liked, likes: (x.likes || 0) + (!x.liked ? 1 : -1) } : x));
                  } catch (e) { console.error(e); }
                }}
              >
                {r.liked ? `👍 Liked (${r.likes||0})` : `👍 Like (${r.likes||0})`}
              </button>
            </div>

            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Add a comment..."
                  value={commentDraft[r.id] || ""}
                  onChange={(e) => setCommentDraft({ ...commentDraft, [r.id]: e.target.value })}
                />
                <button
                  className="btn-secondary"
                  disabled={!!posting[r.id]}
                  onClick={async () => {
                    try {
                      if (!provider) return;
                      const signer = await provider.getSigner();
                      const addr = VolunteerCommentAddresses[String(chainId!)]?.address as `0x${string}`;
                      const comContract = new ethers.Contract(addr, VolunteerCommentABI.abi, signer);
                      const text = (commentDraft[r.id] || "").trim();
                      if (!text) return;
                      setPosting({ ...posting, [r.id]: true });
                      const tx = await comContract.addComment(r.id, text);
                      await tx.wait();
                      setCommentDraft({ ...commentDraft, [r.id]: "" });
                      setToast({ type: "success", text: "Comment posted" });
                      setTimeout(() => setToast(null), 2000);
                    } catch (e) {
                      console.error(e);
                      setToast({ type: "error", text: "Failed to post comment" });
                      setTimeout(() => setToast(null), 2000);
                    } finally {
                      setPosting((prev) => ({ ...prev, [r.id]: false }));
                    }
                  }}
                >{posting[r.id] ? "Posting..." : "Post"}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
