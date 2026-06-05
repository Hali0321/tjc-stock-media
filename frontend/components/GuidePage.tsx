export function GuidePage() {
  const sections = [
    ["What is TJC Stock Media?", "A church media portal for finding approved photos, videos, audio, graphics, and documents."],
    ["How to search", "Use plain terms like Bible, worship, fellowship, flowers, or MVP 2024. Approved media appears first."],
    ["How to know if something is approved", "Look for the status label. Approved Public and Approved Internal are usable. Needs Review is not usable yet."],
    ["Approved Public vs Approved Internal", "Public can be used for public church communication. Internal stays inside ministry or church use."],
    ["How uploads work", "Contributors submit context and files. New uploads enter Needs Review / Do Not Publish until a reviewer approves."],
    ["Why some assets are blocked", "People, minors, music, sermons, sacrament, unclear source, or rights concerns require review before use."],
    ["Large media intake", "Files over 100 MB should go to the approved Shared Drive Incoming folder and DAM admin intake."],
    ["Backend/source of truth", "ResourceSpace remains the backend for assets, review state, permissions, and download eligibility."]
  ];

  return (
    <div className="page-shell page-shell--narrow">
      <section className="form-intro">
        <p className="eyebrow">User guide</p>
        <h1>How to use TJC Stock Media</h1>
        <p>Find approved media. Upload for review. Avoid unsafe files.</p>
      </section>
      <div className="guide-list">
        {sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
