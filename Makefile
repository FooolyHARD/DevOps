SHELL := /bin/bash

REGISTRY_ID = $(shell jq -r '.resources[]? | select(.type == "yandex_container_registry" and .name == "main") | .instances[0].attributes.id // empty' infra/terraform/terraform.tfstate 2>/dev/null)
REGISTRY = $(if $(REGISTRY_ID),cr.yandex/$(REGISTRY_ID),)
VM_IP    = $(shell cd infra/terraform && terraform output -raw vm_external_ip 2>/dev/null)
PLATFORM ?= linux/amd64
TAG      ?= latest
DOCKER_CONFIG_DIR ?= .docker-build

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "Targets:"
	@echo "  tf-init     Terraform init"
	@echo "  tf-apply    Поднять/обновить инфру (VPC, ВМ, Container Registry)"
	@echo "  tf-destroy  Удалить всю инфру (платные ресурсы)"
	@echo "  cr-clean    Удалить все образы из Container Registry"
	@echo "  env         Сгенерировать .env.prod из .env.prod.example (REGISTRY/VM_HOST/SECRET_KEY)"
	@echo "  inventory   Сгенерировать infra/ansible/inventory.ini из VM_IP"
	@echo "  bootstrap   Ansible: установить Docker и yc на ВМ"
	@echo "  build       Собрать образы локально под $(PLATFORM) (без push)"
	@echo "  push        Собрать и запушить образы в cr.yandex"
	@echo "  deploy      Ansible: доставить compose+env и поднять стек"
	@echo "  up          push + deploy (полный цикл обновления)"
	@echo "  ps          Статус контейнеров на ВМ"
	@echo "  logs        Логи backend на ВМ"
	@echo "  ssh         SSH на ВМ"
	@echo ""
	@echo "Vars:"
	@echo "  REGISTRY=$(REGISTRY)"
	@echo "  REGISTRY_ID=$(REGISTRY_ID)"
	@echo "  VM_IP=$(VM_IP)"
	@echo "  PLATFORM=$(PLATFORM)  TAG=$(TAG)"

.PHONY: tf-init tf-apply tf-destroy cr-clean
tf-init:
	cd infra/terraform && terraform init

tf-apply:
	cd infra/terraform && terraform apply

tf-destroy: cr-clean
	cd infra/terraform && terraform destroy

cr-clean:
	@if [ -z "$(REGISTRY_ID)" ]; then \
		true; \
	else \
		repositories=$$(yc container repository list --registry-id "$(REGISTRY_ID)" --format json | jq -r '.[].name'); \
		for repository in $$repositories; do \
			images=$$(yc container image list --registry-id "$(REGISTRY_ID)" --repository-name "$$repository" --format json | jq -r '.[].id'); \
			if [ -n "$$images" ]; then \
				yc container image delete $$images; \
			fi; \
		done; \
	fi

.PHONY: env
env: _check-registry _check-vm
	@if [ -f .env.prod ]; then \
		true; \
	else \
		cp .env.prod.example .env.prod; \
		sed -i '' "s|^REGISTRY=.*|REGISTRY=$(REGISTRY)|"                       .env.prod; \
		sed -i '' "s|^VM_HOST=.*|VM_HOST=$(VM_IP)|"                            .env.prod; \
		sed -i '' "s|^SECRET_KEY=.*|SECRET_KEY=$$(openssl rand -hex 32)|"      .env.prod; \
	fi

.PHONY: inventory
inventory: _check-vm
	@if [ ! -f infra/ansible/inventory.ini ]; then \
		cp infra/ansible/inventory.ini.example infra/ansible/inventory.ini; \
		sed -i '' "s|<VM_EXTERNAL_IP>|$(VM_IP)|" infra/ansible/inventory.ini; \
	else \
		true; \
	fi

.PHONY: bootstrap
bootstrap: inventory
	cd infra/ansible && ansible-playbook playbook.yml

.PHONY: _check-registry
_check-registry:
	@test -n "$(REGISTRY)" || { echo "REGISTRY пуст. Сначала сделай 'make tf-apply'"; exit 1; }

.PHONY: build
build: _check-registry
	docker buildx build --platform $(PLATFORM) -t $(REGISTRY)/marine-backend:$(TAG)  ./backend
	docker buildx build --platform $(PLATFORM) -t $(REGISTRY)/marine-frontend:$(TAG) ./frontend

.PHONY: push
push: _check-registry
	@mkdir -p $(DOCKER_CONFIG_DIR)/cli-plugins
	@ln -sf "$$HOME/.docker/cli-plugins/docker-buildx" "$(DOCKER_CONFIG_DIR)/cli-plugins/docker-buildx"
	yc iam create-token | DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker login --username iam --password-stdin cr.yandex
	DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker buildx prune -af
	DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker buildx build --no-cache --pull --platform $(PLATFORM) -t $(REGISTRY)/marine-backend:$(TAG)  ./backend  --push
	DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker buildx build --no-cache --pull --platform $(PLATFORM) -t $(REGISTRY)/marine-frontend:$(TAG) ./frontend --push

.PHONY: deploy
deploy: inventory
	cd infra/ansible && ansible-playbook deploy.yml

.PHONY: up
up: push deploy

.PHONY: _check-vm
_check-vm:
	@test -n "$(VM_IP)" || { echo "VM_IP пуст. Сначала сделай 'make tf-apply'"; exit 1; }

.PHONY: ssh
ssh: _check-vm
	ssh ubuntu@$(VM_IP)

.PHONY: ps
ps: _check-vm
	ssh ubuntu@$(VM_IP) 'docker compose -f /home/ubuntu/marine-app/docker-compose.prod.yml ps'

.PHONY: logs
logs: _check-vm
	ssh ubuntu@$(VM_IP) 'docker compose -f /home/ubuntu/marine-app/docker-compose.prod.yml logs -f --tail=200 backend'
