.PHONY: init up down restart logs smoke import-audit import-mvp-batch approve-mvp-batch heic-derivatives polish-mvp-ui lm-photos-zip-inventory lm-photos-stream-run lm-photos-run-report video-manifest export-metadata backup restore-test launch-readiness frontend-dev frontend-check demo-check portal-api-smoke portal-browser-qa

IMPORT_DIR ?= /Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Imported/MVP 2024
LM_PHOTOS_ZIP_DIR ?= /Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Photos/Incoming/lm-photo
VIDEO_DIR ?= /Users/halim4pro/Desktop/MVP/Stock Media/01_Source Exports/Videos/Incoming/Samuel Kuo/Samuel Kuo

init:
	./scripts/bootstrap-official-docker.sh

up: init
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=100

smoke:
	./scripts/smoke.sh

import-audit:
	./scripts/import-audit.sh "$(IMPORT_DIR)"

import-mvp-batch:
	./scripts/import-mvp-batch.sh "$(IMPORT_DIR)"

approve-mvp-batch:
	./scripts/approve-mvp-batch.sh

heic-derivatives:
	./scripts/heic-derivatives.sh "$(IMPORT_DIR)"

polish-mvp-ui:
	./scripts/polish-mvp-ui.sh

lm-photos-zip-inventory:
	./scripts/lm-photos-zip-inventory.sh "$(LM_PHOTOS_ZIP_DIR)"

lm-photos-stream-run:
	./scripts/lm-photos-stream-run.sh "$(LM_PHOTOS_ZIP_DIR)"

lm-photos-run-report:
	./scripts/generate-run-report.py

video-manifest:
	./scripts/video-manifest.sh "$(VIDEO_DIR)"

export-metadata:
	./scripts/export-metadata.sh

backup:
	./scripts/backup.sh

restore-test:
	./scripts/restore-test.sh

launch-readiness:
	./scripts/launch-readiness.sh

frontend-dev:
	npm --prefix frontend run dev

frontend-check:
	./scripts/frontend-check.sh

demo-check:
	./scripts/demo-check.sh

portal-api-smoke:
	./scripts/portal-api-smoke.sh

portal-browser-qa:
	./scripts/portal-browser-qa.mjs
