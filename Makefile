SHELL := /bin/bash

# Load local environment variables if .env exists
ifneq (,$(wildcard .env))
  include .env
  export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

.PHONY: draft publish clean help lint changed-files

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Display this help message
	@echo "$(GREEN)Article Publishing System$(NC)"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Workflow:"
	@echo "  1. Make changes to markdown files"
	@echo "  2. Run '$(YELLOW)make draft$(NC)' to create/update drafts"
	@echo "  3. Run '$(YELLOW)make publish$(NC)' to publish the drafts"

lint: ## Type-check all TypeScript scripts
	@echo "$(GREEN)Type-checking TypeScript files...$(NC)"
	@npm run lint

changed-files: ## Show which markdown files have changed
	@echo "$(GREEN)Detecting changed markdown files...$(NC)"
	@npx ts-node scripts/get_changed_files.ts

draft: lint ## Create/update drafts for changed markdown files
	@echo "$(GREEN)Creating/updating drafts for changed files...$(NC)"
	@CHANGED_OUTPUT=$$(npx ts-node scripts/get_changed_files.ts | tail -2); \
	EN_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^EN_FILES=" | cut -d'=' -f2-); \
	JA_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^JA_FILES=" | cut -d'=' -f2-); \
	if [ -n "$$EN_FILES" ]; then \
		echo "$(YELLOW)Processing English files: $$EN_FILES$(NC)"; \
		PUBLISH_MODE=draft npx ts-node scripts/publish_devto.ts $$EN_FILES; \
	fi; \
	if [ -n "$$JA_FILES" ]; then \
		echo "$(YELLOW)Processing Japanese files: $$JA_FILES$(NC)"; \
		PUBLISH_MODE=draft npx ts-node scripts/publish_qiita.ts $$JA_FILES; \
	fi; \
	if [ -z "$$EN_FILES" ] && [ -z "$$JA_FILES" ]; then \
		echo "$(YELLOW)No changed markdown files found. Nothing to do.$(NC)"; \
	else \
		echo "$(GREEN)Draft operation completed!$(NC)"; \
	fi

publish: lint ## Publish drafts as real articles for changed markdown files
	@echo "$(GREEN)Publishing drafts as real articles...$(NC)"
	@CHANGED_OUTPUT=$$(npx ts-node scripts/get_changed_files.ts | tail -2); \
	EN_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^EN_FILES=" | cut -d'=' -f2-); \
	JA_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^JA_FILES=" | cut -d'=' -f2-); \
	if [ -n "$$EN_FILES" ]; then \
		echo "$(YELLOW)Publishing English files: $$EN_FILES$(NC)"; \
		PUBLISH_MODE=publish npx ts-node scripts/publish_devto.ts $$EN_FILES; \
	fi; \
	if [ -n "$$JA_FILES" ]; then \
		echo "$(YELLOW)Publishing Japanese files: $$JA_FILES$(NC)"; \
		PUBLISH_MODE=publish npx ts-node scripts/publish_qiita.ts $$JA_FILES; \
	fi; \
	if [ -z "$$EN_FILES" ] && [ -z "$$JA_FILES" ]; then \
		echo "$(YELLOW)No changed markdown files found. Nothing to do.$(NC)"; \
	else \
		echo "$(GREEN)Publish operation completed!$(NC)"; \
	fi

clean: ## Clean up temporary files
	@echo "$(GREEN)Cleaning up...$(NC)"
	@find . -name "*.log" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)Clean completed!$(NC)"
