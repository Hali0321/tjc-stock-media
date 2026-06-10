"use client";

import { useState } from "react";
import { CheckCircle2, Database, Download, FileText, MoreHorizontal, Share2, Star } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { useBrandKit } from "@/components/dam/useDamApi";
import { displayTitle, recordIdLabel, sourceLabel, sourceNoun } from "@/lib/enterprise-display";
import { ActionButton, AssetThumb, IconButton, LoadingCard, SourcePill } from "./EnterpriseShared";

export function EnterpriseBrandHubPage() {
  const { role } = useDemoRole();
  const brandKit = useBrandKit("easter-2024", role);
  const [section, setSection] = useState("How to use these assets");
  const [invite, setInvite] = useState("");
  const [sentInvite, setSentInvite] = useState("");
  const kit = brandKit.data?.kit;
  const navItems = kit?.navItems?.length ? kit.navItems : ["How to use these assets", "Key messages", "Logo usage", "Downloads", "Allowed channels"];
  const principles = kit?.principles?.length ? kit.principles : [];
  const keyMessages = kit?.keyMessages?.length ? kit.keyMessages : [];
  const logoUsage = kit?.logoUsage?.length ? kit.logoUsage : [];
  const kitAssets = brandKit.data?.assets || [];
  const connected = Boolean(kit?.configured);
  const noun = sourceNoun(brandKit.source);
  const recordLabel = recordIdLabel(brandKit.source);
  return (
    <div className="enterprise-page enterprise-brand">
      <div className="ed-brand-top"><div className="ed-breadcrumb">Brand Hub <span>›</span> Ministry Kits <span>›</span> Easter at TJC 2024</div><div><ActionButton icon={Star}>Save</ActionButton><ActionButton icon={Share2}>Share Kit</ActionButton><ActionButton tone="dark" icon={Download} disabled={!connected}>Download Kit</ActionButton><IconButton label="More"><MoreHorizontal size={16} /></IconButton></div></div>
      <div className="ed-brand-layout">
        <aside className="ed-panel ed-brand-nav"><strong>Kit Overview</strong>{navItems.map((item) => <button className={section === item ? "is-active" : ""} type="button" key={item} onClick={() => setSection(item)}>{item}</button>)}<div className="ed-help-card">Need help?<br /><a>Contact Brand Steward ↗</a></div></aside>
        <main>
          <section className="ed-brand-hero"><div><span>MINISTRY KIT</span><h1>{kit?.title || "Easter at TJC 2024"} <em>{connected ? "Connected" : "Setup needed"}</em></h1><p>Editorial guidance can be curated here, but downloadable media must resolve to {noun} records or collections.</p><dl><div><dt>Owner</dt><dd>{kit?.owner || "Brand Team"}</dd></div><div><dt>Data source</dt><dd>{sourceLabel(brandKit.source)}</dd></div><div><dt>Next step</dt><dd>{connected ? "Review mapped assets" : "Connect collection"}</dd></div></dl></div></section>
          {brandKit.loading ? <LoadingCard label="Loading Brand Kit mapping..." /> : null}
          {!brandKit.loading && !connected ? <section className="ed-card ed-empty-state"><Database size={24} /><h2>Connect this kit to a {noun} collection</h2><p>Set <strong>{kit?.collectionEnvKey || "BRAND_KIT_EASTER_2024_COLLECTION_ID"}</strong> before showing downloadable kit files. Fake ZIP downloads are disabled.</p><ActionButton>Configure ResourceSpace collection</ActionButton></section> : null}
          {(brandKit.data?.warnings || []).length ? <section className="ed-card ed-setup-note"><strong>Setup warnings</strong>{brandKit.data?.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section> : null}
          <section className="ed-card"><h3>Our brand principles</h3><div className="ed-principle-grid">{principles.map((principle) => <article key={principle.title}><CheckCircle2 size={20} /><strong>{principle.title}</strong><p>{principle.description}</p></article>)}</div></section>
          <section className="ed-card"><header className="ed-card-head"><h3>Logo usage</h3><a>View mapped logo assets →</a></header><div className="ed-logo-grid">{logoUsage.map((item) => <article key={item.title} className={item.discouraged ? "is-wrong" : ""}><div><img src={item.variant === "reverse" ? "/brand/tjc-logo-english-white.png" : "/brand/tjc-logo-english-color.png"} alt="True Jesus Church logo" /></div><strong>{item.title}</strong><small>{item.guidance}</small></article>)}</div></section>
          <div className="ed-two-col"><section className="ed-card"><h3>Key messages</h3>{keyMessages.map((item) => <p className="ed-checkline" key={item}><CheckCircle2 size={16} />{item}</p>)}</section><section className="ed-card"><header className="ed-card-head"><h3>{noun} kit assets</h3><SourcePill source={brandKit.source} live={brandKit.live} /></header><div className="ed-photo-row">{kitAssets.slice(0, 4).map((asset) => <AssetThumb asset={asset} key={asset.id} />)}</div><p>{kitAssets.length ? `Assets matched configured ResourceSpace collection/source membership.` : "No mapped collection assets yet."}</p></section></div>
        </main>
        <aside className="ed-brand-rail"><section className="ed-card"><h3>Share this kit</h3><p>Invite others to view or use Easter at TJC 2024.</p><input className="ed-input" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Enter email address" aria-label="Invite email address" /><ActionButton tone="primary" disabled={!invite.trim()} onClick={() => { setSentInvite(invite); setInvite(""); }}>Send Invite</ActionButton>{sentInvite ? <p className="ed-inline-success">Invite prepared for {sentInvite}</p> : null}</section><section className="ed-card"><h3>Kit details</h3><dl className="ed-metadata">{[["Current section", section], ["Collection", connected ? String(kit?.resourceSpaceCollectionId || "Configured") : "Not connected"], ["Config key", kit?.collectionEnvKey || "BRAND_KIT_EASTER_2024_COLLECTION_ID"], ["Downloads", connected ? `${kitAssets.length} ${noun} assets` : "Disabled"], ["Owner", kit?.owner || "Brand Team"]].map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl></section><section className="ed-card"><header className="ed-card-head"><h3>Quick downloads</h3></header>{connected && kitAssets.length ? kitAssets.slice(0, 5).map((asset) => <p className="ed-file-row" key={asset.id}><FileText size={17} />{displayTitle(asset)}<small>{recordLabel} {asset.resourceSpaceId || asset.id}</small></p>) : <p>Connect this kit to a {noun} collection.</p>}</section></aside>
      </div>
    </div>
  );
}
