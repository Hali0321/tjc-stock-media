# Phase 2 Options

Phase 2 starts only after the MVP proves the 181-file workflow and stakeholders agree to scale.

## Google Shared Drive Connection

Current MVP uses manual batch import. Future options:

1. ResourceSpace upload flow using Google Drive picker/companion service.
2. StaticSync-style folder ingest if files must remain in a standard folder structure.
3. Custom Google Drive API manifest/import automation.

Do not build this during the 181-file MVP. Manual is fine until manual breaks.

## AI Tagging

AI should suggest tags, not approve rights.

Future options:

- ResourceSpace Google Vision plugin
- ResourceSpace CLIP AI Smart Search
- Custom local/hosted image captioning
- OCR for signs and documents
- Speech-to-text for audio/video

MVP rule: learn church vocabulary first with 20-50 manually tagged files.

## Production Hosting

Future options:

- Managed ResourceSpace hosting/support
- Cloud VM
- Church server/NAS

Production decision must include:

- uptime
- remote access
- security patching
- backups
- restore testing
- admin owner
- cost owner

## Scaling Gate

Scale in stages:

```text
181 files -> LM Photos completion run -> 1,000-2,000 broader sources -> broader migration
```

Do not scale until import accuracy, previews, search, rights workflow, metadata export, and restore test pass.

The LM Photos completion run uses a streaming ZIP strategy because the local Mac has limited free space. Process one album ZIP at a time and delete only verified ZIPs.
