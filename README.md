# Симулятор токсичности морских организмов

Учебное REST-приложение для моделирования контакта с медузами и ядовитыми рыбами. Система позволяет создавать сценарии поражения, рассчитывать интегральный риск, хранить историю расчетов и администрировать справочник токсинов.

## Стек

- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT
- Frontend: React + Vite
- Инфраструктура: Docker Compose

## Возможности

- регистрация и вход через JWT
- роли `user` и `admin`
- CRUD сценариев поражения
- предварительный расчет риска без сохранения
- админское управление типами токсинов
- healthcheck `GET /health`
- OpenAPI/Swagger `http://localhost:8000/docs`

## Доменная модель

Сценарий учитывает:

- тип организма
- тип токсина
- степень воздействия
- категорию поражения
- площадь контакта
- длительность контакта
- возраст пострадавшего
- наличие аллергии
- место поражения

Расчет риска учебный, но не линейный: используются коэффициенты токсина, логарифмический вклад площади и длительности, а также мультипликаторы для зоны поражения, типа организма, категории повреждения, возраста и аллергии.

## Запуск через Docker

```bash
docker compose up --build
```

После запуска:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8000`
- swagger: `http://localhost:8000/docs`

Начальный администратор:

- логин: `admin`
- пароль: `admin12345`

## Локальный запуск без Docker

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Развертывание в Yandex Cloud через Terraform

### 1. Подготовка Yandex Cloud (через `yc` CLI)

Установите CLI: <https://yandex.cloud/docs/cli/quickstart>.

Авторизуйтесь и выберите облако/каталог по умолчанию:

```bash
yc init
```

Получите идентификаторы облака и каталога — они понадобятся для `terraform.tfvars`:

```bash
yc config list
```

Создайте сервисный аккаунт для Terraform и выдайте ему права:

```bash
yc iam service-account create --name terraform-sa

SA_ID=$(yc iam service-account get --name terraform-sa --format json | jq -r .id)
FOLDER_ID=$(yc config get folder-id)

for ROLE in editor vpc.admin compute.admin container-registry.admin iam.serviceAccounts.user; do
  yc resource-manager folder add-access-binding "$FOLDER_ID" \
    --role "$ROLE" \
    --subject "serviceAccount:$SA_ID"
done
```

Сгенерируйте авторизованный ключ — Terraform читает его через переменную `service_account_key_file`:

```bash
cd infra/terraform
yc iam key create \
  --service-account-id "$SA_ID" \
  --output key.json
```

Файл [`key.json`](infra/terraform/key.json) содержит приватный ключ и в репозиторий не коммитится (см. [.gitignore](.gitignore)).

Проверьте, что у вас есть SSH-ключ для входа на ВМ; иначе создайте:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
```

### 2. Конфигурация Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

В [`terraform.tfvars`](infra/terraform/terraform.tfvars.example) укажите минимум:

```hcl
service_account_key_file = "./key.json"
cloud_id                 = "<cloud-id из yc config list>"
folder_id                = "<folder-id из yc config list>"
ssh_public_key_path      = "~/.ssh/id_ed25519.pub"
```

При необходимости можно переопределить `vm_cores`, `vm_memory`, `vm_disk_size`, `registry_name`, `preemptible` — все переменные описаны в [variables.tf](infra/terraform/variables.tf).

### 3. Применение

```bash
terraform init
terraform plan
terraform apply
```

После успешного `apply` Terraform выведет:

- `vm_external_ip` — публичный IP виртуалки
- `ssh_command` — готовая команда для подключения по SSH
- `registry_id` и `registry_endpoint` — для пуша образов в формате `cr.yandex/<registry_id>/<image>:<tag>`

### 4. Удаление

```bash
terraform destroy
```

## Быстрая шпаргалка через Makefile

После того как Yandex Cloud настроен, инфра поднята и `.env.prod` заполнен — весь цикл укладывается в несколько `make`-команд:

```bash
make tf-apply
make env
make bootstrap
make push
make deploy

make up           # = push + deploy

make ps
make logs
make ssh
make tf-destroy
```

Все цели описаны в [Makefile](Makefile), переменные `REGISTRY` и `VM_IP` читаются автоматически из `terraform output`.

## Установка Docker на ВМ через Ansible

Плейбук [infra/ansible/playbook.yml](infra/ansible/playbook.yml) ставит на ВМ Docker Engine, Compose-плагин и Yandex Cloud CLI. Во время deploy плейбук [infra/ansible/deploy.yml](infra/ansible/deploy.yml) выполняет `docker login` в `cr.yandex` через IAM token сервисного аккаунта.

### 1. Подготовить inventory

```bash
cd infra/ansible
cp inventory.ini.example inventory.ini

VM_IP=$(cd ../terraform && terraform output -raw vm_external_ip)
sed -i '' "s/<VM_EXTERNAL_IP>/$VM_IP/" inventory.ini
```

В [inventory.ini](infra/ansible/inventory.ini.example) проверь, что `ansible_ssh_private_key_file` указывает на приватный ключ, парный `ssh_public_key_path` из `terraform.tfvars`.

### 2. Запуск

```bash
ansible-playbook playbook.yml
```

## Сборка и публикация образов в Yandex Container Registry

Образы собираем локально и пушим в реестр.

### Build & push

```bash
make push
```

Проверить, что образы появились в реестре:

```bash
yc container image list --registry-id $(cd infra/terraform && terraform output -raw registry_id)
```

## Запуск стека на ВМ через Ansible

Деплой описан в [infra/ansible/deploy.yml](infra/ansible/deploy.yml): он копирует на ВМ [docker-compose.prod.yml](docker-compose.prod.yml) и локальный `.env.prod` (как `.env`) в `/home/ubuntu/marine-app/`, после чего делает `docker compose pull` и `up -d`.

### 1. Подготовить `.env.prod`

```bash
make env
```

### 2. Запустить деплой

```bash
make deploy
```

### Доступы

- frontend: `http://<vm_external_ip>:5173`
- backend:  `http://<vm_external_ip>:8000`
- swagger:  `http://<vm_external_ip>:8000/docs`

### Логи и статус

```bash
make ps
make logs
```

## Основные endpoint'ы

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Справочники

- `GET /api/v1/reference/organisms`
- `GET /api/v1/reference/damage-categories`
- `GET /api/v1/reference/body-locations`
- `GET /api/v1/toxins`

### Сценарии

- `POST /api/v1/scenarios/calculate`
- `GET /api/v1/scenarios`
- `GET /api/v1/scenarios/{id}`
- `POST /api/v1/scenarios`
- `PUT /api/v1/scenarios/{id}`
- `POST /api/v1/scenarios/{id}/recalculate`
- `DELETE /api/v1/scenarios/{id}`

### Admin

- `GET /api/v1/admin/toxins`
- `POST /api/v1/admin/toxins`
- `PUT /api/v1/admin/toxins/{id}`
- `DELETE /api/v1/admin/toxins/{id}`
