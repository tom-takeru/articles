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
	@printf '$(GREEN)Article Publishing System$(NC)\n'
	@printf '\n'
	@printf 'Available commands:\n'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf '\n'
	@printf 'Workflow:\n'
	@printf "  1. Make changes to markdown files\n"
	@printf "  2. Run '$(YELLOW)make draft$(NC)' to create/update drafts\n"
	@printf "  3. Run '$(YELLOW)make publish$(NC)' to publish the drafts\n"

lint: ## Type-check all TypeScript scripts
	@printf '$(GREEN)Type-checking TypeScript files...$(NC)\n'
	@npm run lint

changed-files: ## Show which markdown files have changed
	@printf '$(GREEN)Detecting changed markdown files...$(NC)\n'
	@npx ts-node scripts/getChangedFiles.ts

draft: lint ## Create/update drafts for changed markdown files
	@printf '$(GREEN)Creating/updating drafts for changed files...$(NC)\n'
	@CHANGED_OUTPUT=$$(npx ts-node scripts/getChangedFiles.ts | tail -2); \
	EN_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^EN_FILES=" | cut -d'=' -f2-); \
	JA_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^JA_FILES=" | cut -d'=' -f2-); \
        if [ -n "$$EN_FILES" ]; then \
                printf '$(YELLOW)Processing English files: %s$(NC)\n' "$$EN_FILES"; \
		npx ts-node scripts/entryPoint.ts --platform devto --mode draft $$EN_FILES; \
        fi; \
        if [ -n "$$JA_FILES" ]; then \
                printf '$(YELLOW)Processing Japanese files: %s$(NC)\n' "$$JA_FILES"; \
		npx ts-node scripts/entryPoint.ts --platform qiita --mode draft $$JA_FILES; \
        fi; \
	if [ -z "$$EN_FILES" ] && [ -z "$$JA_FILES" ]; then \
		printf '$(YELLOW)No changed markdown files found. Nothing to do.$(NC)\n'; \
	else \
		printf '$(GREEN)Draft operation completed!$(NC)\n'; \
	fi

publish: lint ## Publish drafts as real articles for changed markdown files
	@printf '$(GREEN)Publishing drafts as real articles...$(NC)\n'
	@CHANGED_OUTPUT=$$(npx ts-node scripts/getChangedFiles.ts | tail -2); \
	EN_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^EN_FILES=" | cut -d'=' -f2-); \
	JA_FILES=$$(echo "$$CHANGED_OUTPUT" | grep "^JA_FILES=" | cut -d'=' -f2-); \
        if [ -n "$$EN_FILES" ]; then \
                printf '$(YELLOW)Publishing English files: %s$(NC)\n' "$$EN_FILES"; \
		npx ts-node scripts/entryPoint.ts --platform devto --mode publish $$EN_FILES; \
        fi; \
        if [ -n "$$JA_FILES" ]; then \
                printf '$(YELLOW)Publishing Japanese files: %s$(NC)\n' "$$JA_FILES"; \
		npx ts-node scripts/entryPoint.ts --platform qiita --mode publish $$JA_FILES; \
        fi; \
	if [ -z "$$EN_FILES" ] && [ -z "$$JA_FILES" ]; then \
		printf '$(YELLOW)No changed markdown files found. Nothing to do.$(NC)\n'; \
	else \
		printf '$(GREEN)Publish operation completed!$(NC)\n'; \
	fi

clean: ## Clean up temporary files
	@printf '$(GREEN)Cleaning up...$(NC)\n'
	@find . -name "*.log" -type f -delete 2>/dev/null || true
	@printf '$(GREEN)Clean completed!$(NC)\n'
