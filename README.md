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
