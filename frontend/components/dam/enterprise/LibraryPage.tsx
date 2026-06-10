"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Download, Folder, MoreHorizontal, Search, Share2 } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useAssetsSearch } from "@/components/dam/useDamApi";
import type { StockMediaAsset } from "@/lib/types";
import { sourceNoun } from "@/lib/enterprise-display";
import { ActionButton, AssetCard, ErrorCard, IconButton, InspectorDrawer, LoadingCard, PageHeader, SavedViewPanel, SourcePill } from "./EnterpriseShared";

export function EnterpriseLibraryPage() {
  const { role } = useDemoRole();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const search = useAssetsSearch({ role, query, limit: 15 });
  const assets = search.data?.assets || [];
  useEffect(() => {
    if (!selectedId && assets[0]) {
      setSelectedId(assets[0].id);
      setSelectedIds([assets[0].id]);
    }
  }, [assets, selectedId]);
  const selected = assets.find((asset) => asset.id === selectedId) || assets[0];
  const toggleAsset = (asset: StockMediaAsset) => {
    setSelectedId(asset.id);
    setSelectedIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id]);
  };
  return (
    <div className="enterprise-page enterprise-library">
      <PageHeader title="Asset Library" count={search.data ? `${search.data.total.toLocaleString()} assets` : undefined} actions={<><ActionButton>Saved views <ChevronDown size={14} /></ActionButton><ActionButton tone="primary">Save this search</ActionButton><IconButton label="More"><MoreHorizontal size={17} /></IconButton></>} />
      <section className="ed-approved-banner"><CheckCircle2 size={24} /><div><strong>{search.live ? `Showing ${sourceNoun(search.source)}-backed records` : `${sourceNoun(search.source)} disconnected or read-only`}</strong><span>{search.source?.detail || "The UI is waiting for the backend DAM source."}</span></div><SourcePill source={search.source} live={search.live} /><button type="button">×</button></section>
      <form className="ed-library-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="library-local-search">Search media assets</label>
        <input id="library-local-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${sourceNoun(search.source)} title, keyword, collection, source, or filename...`} />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </form>
      <div className="ed-filter-bar">{["Type", "Usage rights", "People", "Status", "Collection", "Review risk", "More filters"].map((item) => <button type="button" key={item}>{item}<ChevronDown size={14} /></button>)}<a>Clear all</a></div>
      {search.loading ? <LoadingCard /> : search.error ? <ErrorCard message={search.error} source={search.source} /> : (
        <div className="ed-library-grid">
          <SavedViewPanel savedViews={search.data?.savedViews} collections={search.data?.collections} source={search.source} />
          <main className="ed-asset-workspace">
            <div className="ed-bulk-toolbar"><strong>{selectedIds.length} selected</strong><button><Download size={15} />Download</button><button><Folder size={15} />Add to collection</button><button><Share2 size={15} />Share</button><button><MoreHorizontal size={15} />More</button><button type="button" onClick={() => setSelectedIds(assets.map((asset) => asset.id))}>Select visible</button></div>
            {assets.length ? <div className="ed-grid">{assets.map((asset) => <AssetCard asset={asset} selected={selectedIds.includes(asset.id)} onSelect={() => toggleAsset(asset)} key={asset.id} />)}</div> : <section className="ed-empty-state"><Search size={24} /><h2>No {sourceNoun(search.source)} records match this search</h2><p>Try a broader ministry, category, channel, or rights term.</p><ActionButton onClick={() => setQuery("")}>Clear search</ActionButton></section>}
          </main>
          <InspectorDrawer asset={selected} source={search.source} live={search.live} />
        </div>
      )}
    </div>
  );
}
