import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { proposalApi, rfpApi, type Proposal, type RFP } from "../lib/api";

export default function GlobalSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [rfpResults, setRfpResults] = useState<RFP[]>([]);
  const [proposalResults, setProposalResults] = useState<Proposal[]>([]);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery) {
      setRfpResults([]);
      setProposalResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [rfpsResp, proposalsResp] = await Promise.all([
          rfpApi.list(),
          proposalApi.list(),
        ]);

        const rfps = Array.isArray((rfpsResp as any).data?.data)
          ? (rfpsResp as any).data.data
          : Array.isArray((rfpsResp as any).data)
          ? (rfpsResp as any).data
          : [];

        const proposals = Array.isArray((proposalsResp as any).data?.data)
          ? (proposalsResp as any).data.data
          : Array.isArray((proposalsResp as any).data)
          ? (proposalsResp as any).data
          : [];

        const q = searchQuery.toLowerCase();
        const rfpsFiltered = rfps.filter(
          (r: RFP) =>
            (r.title || "").toLowerCase().includes(q) ||
            (r.clientName || "").toLowerCase().includes(q) ||
            (r.projectType || "").toLowerCase().includes(q)
        );
        const proposalsFiltered = proposals.filter(
          (p: Proposal) =>
            (p.title || "").toLowerCase().includes(q) ||
            (p.status || "").toLowerCase().includes(q)
        );

        setRfpResults(rfpsFiltered);
        setProposalResults(proposalsFiltered);
      } catch (e) {
        console.error("Global search failed", e);
        setRfpResults([]);
        setProposalResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleRoute = () => setSearchOpen(false);
    router.events.on("routeChangeStart", handleRoute);
    return () => {
      router.events.off("routeChangeStart", handleRoute);
    };
  }, [router.events]);

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search proposals, RFPs..."
        value={searchQuery}
        onChange={(e) => {
          const val = e.target.value;
          setSearchQuery(val);
          setSearchOpen(!!val);
        }}
        onFocus={() => {
          if (searchQuery) setSearchOpen(true);
        }}
        className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {searchOpen && (
        <div
          ref={searchContainerRef}
          className="absolute mt-2 w-[22rem] max-h-96 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-40"
        >
          {isSearching ? (
            <div className="p-4 text-sm text-gray-500">Searching…</div>
          ) : (
            <div className="py-2">
              <div className="px-4 pb-1 text-xs font-semibold text-gray-500">
                RFPs
              </div>
              {rfpResults.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No RFPs found
                </div>
              ) : (
                <ul className="mb-2">
                  {rfpResults.slice(0, 5).map((rfp) => (
                    <li key={rfp._id}>
                      <Link
                        href={`/rfps/${rfp._id}`}
                        className="flex items-start px-4 py-2 hover:bg-gray-50"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {rfp.title}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 truncate">
                          {rfp.clientName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 border-t border-gray-100">
                Proposals
              </div>
              {proposalResults.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No proposals found
                </div>
              ) : (
                <ul>
                  {proposalResults.slice(0, 5).map((p) => (
                    <li key={p._id}>
                      <Link
                        href={`/proposals/${p._id}`}
                        className="flex items-start px-4 py-2 hover:bg-gray-50"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {p.title}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 truncate">
                          {p.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {(rfpResults.length > 5 || proposalResults.length > 5) && (
                <div className="px-4 py-2 text-xs text-gray-500">
                  Showing top results
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
