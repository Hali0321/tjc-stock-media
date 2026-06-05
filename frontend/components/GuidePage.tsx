export function GuidePage() {
  const sections = [
    ["What is TJC Stock Media?", "A church media portal for finding approved photos, videos, graphics, templates, and documents for ministry work."],
    ["How to search", "Use plain words like Bible, worship, fellowship, flowers, youth, sermon graphics, or event names. Approved media appears first."],
    ["How to know if something is approved", "Look for the approval label. Approved for church-wide use and Internal ministry use only are usable within their stated scope."],
    ["Church-wide vs internal", "Church-wide assets may be used for public ministry communication. Internal assets stay inside church or ministry coworker use."],
    ["Photo use", "Keep ministry context intact. Please avoid cropping or editing in a way that changes the meaning of a worship, fellowship, or church-life moment."],
    ["Logo use", "Use approved logo and template files when available. Please avoid recreating logos from screenshots or old files."],
    ["Children/youth", "Use with care when children or youth may be visible. Please ask a media coworker before public sharing."],
    ["Credit/source", "Keep source and photographer notes with the asset record. If a credit is required, include it where the media is used."],
    ["How uploads work", "Contributors submit context and files. New media starts in review, and a reviewer approves it before anyone can reuse it."],
    ["Large media intake", "Files over 100 MB should go to the approved Shared Drive Incoming folder and DAM admin intake."],
    ["Ask a media coworker", "If you are unsure whether an asset is safe to use, pause and ask. The goal is care, clarity, and good stewardship."],
    ["Why ResourceSpace remains backend", "ResourceSpace remains the backend for assets, review state, permissions, and download eligibility."]
  ];

  return (
    <div className="page-shell page-shell--narrow">
      <section className="form-intro">
        <p className="eyebrow">User guide</p>
        <h1>How to use TJC Stock Media</h1>
        <p>Find approved media, understand how to use it, and ask when something needs care.</p>
      </section>
      <div className="guide-list">
        {sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <section className="do-avoid-block">
          <div>
            <h2>Do</h2>
            <p>Use approved copies, keep source context, respect people in photos, and choose assets that fit the ministry message.</p>
          </div>
          <div>
            <h2>Avoid</h2>
            <p>Please avoid public sharing before review, using archive-only files as approved media, or removing important ministry context.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
