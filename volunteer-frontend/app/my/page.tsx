"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "../../hooks/useFhevm";
import { useVolunteerProof } from "../../hooks/useVolunteerProof";
import { VolunteerProofAddresses } from "../../abi/VolunteerProofAddresses";
import { userDecryptSingle } from "../../lib/userDecrypt";
import { addComment, getComments, getLike, toggleLike } from "../../lib/localFeedback";
import { buildUserDecryptArgs } from "../../lib/buildUserDecryptArgs";
import { VolunteerLikeABI } from "../../abi/VolunteerLikeABI";
import { VolunteerLikeAddresses } from "../../abi/VolunteerLikeAddresses";
import { VolunteerCommentABI } from "../../abi/VolunteerCommentABI";
import { VolunteerCommentAddresses } from "../../abi/VolunteerCommentAddresses";

export default function MyRecordsPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [records, setRecords] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [viewerSigned, setViewerSigned] = useState<Record<number, boolean>>({});
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
  const { contract, getMyRecordIds, getRecord } = useVolunteerProof({ instance, provider, chainId, signer });

  const load = async () => {
    if (!signer || !contract) return;
    setLoading(true);
    try {
      const ids = await getMyRecordIds();
      const addr = VolunteerProofAddresses[String(chainId!)]?.address as `0x${string}`;
      const rs: any[] = [];
      for (const id of ids) {
        const r = await getRecord(id);
        const hoursHandle = r[2] as string;
        const clearHours = "Encrypted";
        // fetch on-chain like count & whether current user liked
        let liked = false; let likes = 0n; let commentsCount = 0n;
        try {
          if (chainId && provider) {
            const likeAddr = VolunteerLikeAddresses[String(chainId)]?.address as `0x${string}`;
            const commentAddr = VolunteerCommentAddresses[String(chainId)]?.address as `0x${string}`;
            const currentUser = await (await provider.getSigner()).getAddress();
            const likeContract = new ethers.Contract(likeAddr, VolunteerLikeABI.abi, provider);
            const commentContract = new ethers.Contract(commentAddr, VolunteerCommentABI.abi, provider);
            const res = await likeContract.getLike(id, currentUser);
            liked = Boolean(res[0]);
            likes = BigInt(res[1]);
            commentsCount = await commentContract.getCount(id);
          }
        } catch {}
        rs.push({
          id,
          activityHash: r[0],
          ipfsCid: r[1],
          hours: clearHours,
          hoursHandle,
          isPublic: r[4],
          createdAt: Number(r[6]),
          liked,
          likes: Number(likes),
          commentsCount: Number(commentsCount),
          comments: []
        });
      }
      setRecords(rs);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (recordId: number, start = 0, count = 10) => {
    if (!provider || !chainId) return;
    try {
      // 强化版签名：使用 FHEVM 的 EIP-712 解密授权签名（与 Decrypt 相同的域/类型），
      // 但这里仅作为访问评论的强签名门槛，并不真正调用 userDecrypt。
      if (!viewerSigned[recordId]) {
        try {
          if (instance && signer) {
            const commentAddr = VolunteerCommentAddresses[String(chainId)]?.address as `0x${string}`;
            const args = instance.buildUserDecryptArgs
              ? await instance.buildUserDecryptArgs([commentAddr], signer)
              : await buildUserDecryptArgs(instance as any, [commentAddr], signer);
            // args 仅用于完成一次 EIP-712 授权签名，不上链，仅作为本地门槛
            setViewerSigned((prev) => ({ ...prev, [recordId]: true }));
          } else {
            const s = await provider.getSigner();
            await s.signMessage(`ViewComments:${recordId}:${Date.now()}`);
            setViewerSigned((prev) => ({ ...prev, [recordId]: true }));
          }
        } catch {
          return; // 用户拒签或失败则不加载
        }
      }
      setLoadingComments((prev) => ({ ...prev, [recordId]: true }));
      const addr = VolunteerCommentAddresses[String(chainId)]?.address as `0x${string}`;
      const c = new ethers.Contract(addr, VolunteerCommentABI.abi, provider);
      const res = await c.getWindow(recordId, start, count);
      const users: string[] = res[0];
      const texts: string[] = res[1];
      const timestamps: bigint[] = res[2];
      const items = users.map((u, i) => ({ user: u, text: texts[i], at: Number(timestamps[i]) * 1000 }));
      setRecords((prev) => prev.map((x) => x.id === recordId ? { ...x, comments: (x.comments || []).concat(items) } : x));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Volunteer Records</h1>
        <p className="text-gray-600">View and decrypt your volunteer activities</p>
      </div>

      {!signer ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
          <button onClick={connect} disabled={!provider} className="btn-primary">
            Connect Wallet
          </button>
          {!provider && (
            <div className="text-xs text-red-500 mt-2">未检测到钱包，请安装或启用 MetaMask/Rabby</div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-600">
              {records.length} record{records.length !== 1 ? "s" : ""} found
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "⏳ Loading..." : "🔄 Load Records"}
            </button>
          </div>

          {records.length === 0 && !loading && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold mb-2">No Records Yet</h3>
              <p className="text-gray-600 mb-6">Start by submitting your first volunteer record</p>
              <a href="/add" className="btn-primary inline-block">
                Submit Record
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((r) => (
              <div key={r.id} className="card hover:scale-105 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm font-mono text-gray-500">#{r.id}</div>
                  <span className={`badge ${r.isPublic ? "badge-public" : "badge-private"}`}>
                    {r.isPublic ? "🌍 Public" : "🔒 Private"}
                  </span>
                </div>

                {r.ipfsCid && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-48 flex items-center justify-center">
                    <img
                      src={`https://gateway.pinata.cloud/ipfs/${r.ipfsCid}`}
                      alt="proof"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as any).style.display = "none";
                        (e.target as any).nextSibling.style.display = "block";
                      }}
                    />
                    <div className="text-4xl" style={{ display: "none" }}>
                      📷
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-16">Hours:</span>
                    <span className="font-semibold text-green-600">{r.hours}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-16">IPFS:</span>
                    <span className="font-mono text-xs break-all">{r.ipfsCid}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Created: {new Date(r.createdAt * 1000).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-600">{r.hours !== "Encrypted" ? (<span>👍 {r.likes ?? 0} • 💬 {r.commentsCount ?? 0}</span>) : (<span className="text-gray-400">Decrypt to view stats</span>)}</div>
                  <button
                    className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700"
                    onClick={() => setActiveId(activeId === r.id ? null : r.id)}
                  >
                    🔍 Details / Decrypt
                  </button>
                </div>

                {/* Details Panel */}
                {activeId === r.id && (
                  <div className="mt-4 p-3 rounded-lg border bg-gray-50">
                    <div className="text-sm font-semibold mb-2">Details</div>
                    <div className="text-xs text-gray-600 mb-2">Activity Hash: <span className="font-mono break-all">{r.activityHash}</span></div>
                    <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">Hours (decrypted): <span className="font-semibold text-green-700">{r.hours}</span>
                      {r.hours === "Encrypted" && (
                        <button
                          className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold"
                          onClick={async () => {
                            if (!instance || !signer) return;
                            try {
                              // EIP-712 签名授权解密
                              const args = instance.buildUserDecryptArgs
                                ? await instance.buildUserDecryptArgs([VolunteerProofAddresses[String(chainId!)]?.address], signer)
                                : await buildUserDecryptArgs(instance, [VolunteerProofAddresses[String(chainId!)]?.address], signer);
                              const res = await instance.userDecrypt(
                                [{ handle: r.hoursHandle, contractAddress: VolunteerProofAddresses[String(chainId!)]?.address }],
                                ...args
                              );
                              const value = res[r.hoursHandle];
                              // After decrypt, fetch like/comment counts
                              let liked = false; let likes = 0n; let commentsCount = 0n;
                              try {
                                if (chainId && provider) {
                                  const likeAddr = VolunteerLikeAddresses[String(chainId)]?.address as `0x${string}`;
                                  const commentAddr = VolunteerCommentAddresses[String(chainId)]?.address as `0x${string}`;
                                  const currentUser = await (await provider.getSigner()).getAddress();
                                  const likeContract = new ethers.Contract(likeAddr, VolunteerLikeABI.abi, provider);
                                  const commentContract = new ethers.Contract(commentAddr, VolunteerCommentABI.abi, provider);
                                  const likeRes = await likeContract.getLike(r.id, currentUser);
                                  liked = Boolean(likeRes[0]);
                                  likes = BigInt(likeRes[1]);
                                  commentsCount = await commentContract.getCount(r.id);
                                }
                              } catch {}
                              setRecords((prev) => prev.map((x) => x.id === r.id ? { ...x, hours: value?.toString?.() ?? String(value), liked, likes: Number(likes), commentsCount: Number(commentsCount) } : x));
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                        >Decrypt</button>
                      )}
                    </div>

                    {/* Comments */}
                    <div className="mb-2 text-sm font-semibold">Comments</div>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {(r.comments && r.comments.length > 0) ? r.comments.map((c: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-700 bg-white p-2 rounded border">
                          <div className="text-[10px] text-gray-400">{new Date(c.at).toLocaleString()} • {c.user?.slice ? `${c.user.slice(0,6)}...${c.user.slice(-4)}` : ""}</div>
                          <div>{c.text}</div>
                        </div>
                      )) : (
                        <div className="text-xs text-gray-400">No comments loaded</div>
                      )}
                    </div>
                    <div className="mt-2">
                      {(r.comments?.length || 0) < (r.commentsCount || 0) && (
                        <button
                          className="btn-secondary"
                          onClick={() => loadComments(r.id, r.comments?.length || 0)}
                          disabled={!!loadingComments[r.id]}
                        >
                          {loadingComments[r.id] ? "Loading..." : "Load more"}
                        </button>
                      )}
                      {(r.comments?.length || 0) === 0 && (r.commentsCount || 0) > 0 && (
                        <button
                          className="btn-secondary"
                          onClick={() => loadComments(r.id, 0)}
                          disabled={!!loadingComments[r.id]}
                        >
                          {loadingComments[r.id] ? "Loading..." : "Load comments"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
