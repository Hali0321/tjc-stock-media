.PHONY: init up down restart logs smoke import-audit import-mvp-batch approve-mvp-batch heic-derivatives polish-mvp-ui lm-photos-zip-inventory lm-photos-stream-run lm-photos-run-report export-metadata backup restore-test

IMPORT_DIR ?= /Users/halim4pro/Desktop/MVP/ResourceSpace/MVP 2024
LM_PHOTOS_ZIP_DIR ?= /Users/halim4pro/Desktop/MVP/ResourceSpace/lm-photo

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

export-metadata:
	./scripts/export-metadata.sh

backup:
	./scripts/backup.sh

restore-test:
	./scripts/restore-test.sh
