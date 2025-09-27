SHELL := /bin/bash

# Load local environment variables if .env exists
ifneq (,$(wildcard .env))
  include .env
  export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

.PHONY: help publish-devto publish-qiita publish

help:
	@echo "Available targets:" \
	  && echo "  make publish-devto DEVTO_FILES=\"content/en/article.md\"" \
	  && echo "      Publish one or more English markdown files to dev.to." \
	  && echo "  make publish-qiita QIITA_FILES=\"content/ja/article.md\"" \
	  && echo "      Publish one or more Japanese markdown files to Qiita." \
	  && echo "  make publish DEVTO_FILES=... QIITA_FILES=..." \
	  && echo "      Publish to either platform (or both) in one command." \
	  && echo "Environment variables are loaded from .env when present."

publish-devto:
	@if [ -z "$(DEVTO_FILES)" ]; then \
	  echo "Set DEVTO_FILES to the space-separated list of English markdown files."; \
	  echo "Example: make publish-devto DEVTO_FILES=\"content/en/article.md\""; \
	  exit 1; \
	fi
	npx ts-node scripts/publish_devto.ts $(DEVTO_FILES)

publish-qiita:
	@if [ -z "$(QIITA_FILES)" ]; then \
	  echo "Set QIITA_FILES to the space-separated list of Japanese markdown files."; \
	  echo "Example: make publish-qiita QIITA_FILES=\"content/ja/article.md\""; \
	  exit 1; \
	fi
	npx ts-node scripts/publish_qiita.ts $(QIITA_FILES)

publish:
	@if [ -z "$(DEVTO_FILES)$(QIITA_FILES)" ]; then \
	  echo "Provide at least DEVTO_FILES or QIITA_FILES."; \
	  echo "Example: make publish DEVTO_FILES=\"content/en/article.md\" QIITA_FILES=\"content/ja/article.md\""; \
	  exit 1; \
	fi
	@if [ -n "$(DEVTO_FILES)" ]; then \
	  $(MAKE) --no-print-directory publish-devto DEVTO_FILES="$(DEVTO_FILES)"; \
	fi
	@if [ -n "$(QIITA_FILES)" ]; then \
	  $(MAKE) --no-print-directory publish-qiita QIITA_FILES="$(QIITA_FILES)"; \
	fi
