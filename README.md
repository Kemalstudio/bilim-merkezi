# Bilim Merkezi

Сайт образовательного центра для школьников 5–17 лет: каталог курсов с фильтрами, запись ребёнка и оплата через Stripe, кабинет родителя (дети, баллы, расписание), ИИ-помощник по выбору курса и админ-панель. Интерфейс на русском, английском и туркменском.

## Стек

- **Next.js 16** (App Router, TypeScript, Server Actions, Turbopack)
- **PostgreSQL + Prisma ORM** (driver adapter `@prisma/adapter-pg`)
- **Auth.js (NextAuth v5)** — email/пароль + опционально Google OAuth
- **Stripe** — Checkout Sessions + webhook (тестовый режим)
- **Tailwind CSS v4 + Radix UI** — компоненты, своя дизайн-система
- **GSAP / anime.js / three.js**, **Recharts**, **Zod**, **React Hook Form**
- **ИИ-помощник** — локальный поиск (BM25) + языковая модель через Ollama / OpenAI-совместимый сервер / Claude

## Быстрый старт

```bash
npm install
cp .env.example .env      # заполните переменные (см. ниже)
docker compose up -d      # поднимает Postgres на localhost:5434
npx prisma migrate dev    # применяет схему
npx prisma db seed        # заполняет демо-данными
npm run dev
```

Откройте http://localhost:3000.

### Переменные окружения (`.env`)

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | строка подключения к Postgres (порт `5434`, см. `docker-compose.yml`) |
| `AUTH_SECRET` | секрет Auth.js — сгенерировать: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | опционально — вход через Google скрывается, если не заданы |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | тестовые ключи из [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | секрет вебхука (см. ниже) |
| `NEXT_PUBLIC_SITE_URL` | базовый URL сайта, используется в редиректах Stripe |

> **Порт Postgres — 5434, не 5432.** На машине, где собирался проект, порт 5432 уже был занят нативным Windows-сервисом PostgreSQL, из-за чего Docker-контейнер оказывался в тени. Если 5434 у вас тоже занят — поменяйте порт в `docker-compose.yml` и `DATABASE_URL` вместе.

### Демо-доступы (после `prisma db seed`)

| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@bilim.tm` | `Admin123!` |
| Модератор | `moderator@bilim.tm` | `Moderator123!` |
| Студент | `student1@example.com` … `student8@example.com` | `Student123!` |

### Проверка оплаты в тестовом режиме

1. Установите [Stripe CLI](https://docs.stripe.com/stripe-cli), выполните `stripe login`.
2. В отдельном терминале: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — CLI выведет `whsec_...`, вставьте его в `STRIPE_WEBHOOK_SECRET` и перезапустите `npm run dev`.
3. На сайте: зарегистрируйтесь → откройте любой курс → «Записаться на курс» → на странице Stripe Checkout используйте тестовую карту `4242 4242 4242 4242`, любую будущую дату и любой CVC.
4. После оплаты запись появится в «Личный кабинет → Мои курсы» со статусом «Активен».

### Дополнительные переменные

Полный список с комментариями — в `.env.example`.

| Переменная | Назначение |
|---|---|
| `AI_PROVIDER` | `auto` (по умолчанию), `ollama`, `openai`, `anthropic`, `off` |
| `OLLAMA_URL`, `AI_MODEL` | локальная модель, по умолчанию `http://127.0.0.1:11434` и `qwen2.5:7b` |
| `OPENAI_BASE_URL`, `OPENAI_API_KEY` | LM Studio, llama.cpp и другие OpenAI-совместимые серверы |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Claude через API (платно, необязательно) |
| `STORAGE_DRIVER` | `local` (диск), `database` (Postgres), `s3` (+ `S3_*`) |
| `RATE_LIMIT_STORE` | `database` (по умолчанию), `upstash` (+ `UPSTASH_*`), `memory` |
| `SMS_PROVIDER` | `http` для реального SMS-шлюза (`SMS_GATEWAY_URL`, `SMS_GATEWAY_TOKEN`); без него коды пишутся в консоль сервера |

## ИИ-помощник

Кнопка «Помощник по выбору курса» на публичных страницах и в кабинете, плюс «Разбор прогресса» в профиле ребёнка.

- **Всегда работает без внешних сервисов:** курсы и ответы из FAQ находятся локальным поиском (BM25, стемминг ru/en/tm, возраст и класс из вопроса).
- **Нейросеть — локально, без API:** установите [Ollama](https://ollama.com) (`winget install Ollama.Ollama`), скачайте модель `ollama pull qwen2.5:7b` (нужна видеокарта от 6 ГБ; без неё — `qwen2.5:3b`). Сайт подхватит модель сам, перезапуск не нужен.
- **Безопасность:** модель видит только данные каталога, FAQ и контакты; каждое число в ответе сверяется с этими данными, иначе показывается ответ, собранный из данных напрямую. Тексты вопросов не логируются.
- Статус, включение и тестовый вопрос — `/bilim/admin/site/assistant`.

## Проверки

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # модульные тесты (node:test через tsx)
```

## База данных в pgAdmin 4

Postgres проекта работает в Docker на порту **5434** (на 5432 — отдельный системный PostgreSQL 17, это другой сервер).
В pgAdmin: *Register → Server*, вкладка *Connection*: Host `127.0.0.1`, Port `5434`, Maintenance database `bilim_merkezi`,
Username `bilim`, Password `bilim_dev_password`. Таблицы — в *Databases → bilim_merkezi → Schemas → public → Tables*.

## Структура

```
prisma/               схема БД, миграции, seed-скрипт
src/app/               маршруты App Router
  (marketing)/         лендинг, каталог, карточка курса, о нас, контакты
  (auth)/               вход, регистрация
  (dashboard)/account/  личный кабинет студента
  bilim/admin/          админ-панель (RBAC: ADMIN/MODERATOR)
  api/                  NextAuth, Stripe webhook, загрузки, ИИ-помощник
  files/                отдача загрузок из БД или S3
src/actions/           server actions (auth, enrollments, reviews, admin-*)
src/components/        ui/ marketing/ courses/ account/ admin/ shared/
src/lib/               prisma, auth, stripe, валидации, утилиты
  ai/                   ИИ-помощник: поиск, провайдеры моделей, проверки ответа
  i18n/                 словари главной (правятся в админке) и интерфейса (ui/)
  storage/              хранилище файлов: диск, Postgres, S3
tests/                 модульные тесты
```

## Ограничения текущей сборки

- **Домен/хостинг** не настроены — код готов к деплою (Vercel + managed Postgres, или любой Node-хостинг), но сам деплой не выполнялся.
- **Stripe** работает в тестовом режиме на ваших собственных ключах.
- **Google OAuth** опционален — без `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` остаётся вход по email/паролю.
- Обложки курсов — генерируемые градиентные плашки с иконкой категории (без сток-фото); админ может загрузить свою обложку через форму курса.
- Интерфейс переведён на 3 языка, но содержимое курсов (названия, описания, темы) хранится в базе на русском.
