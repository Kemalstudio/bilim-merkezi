# Bilim Merkezi

Платформа онлайн-курсов: каталог с фильтрами, запись и оплата через Stripe, личный кабинет студента и админ-панель с аналитикой, управлением курсами/пользователями и журналом действий.

## Стек

- **Next.js 16** (App Router, TypeScript, Server Actions, Turbopack)
- **PostgreSQL + Prisma ORM** (driver adapter `@prisma/adapter-pg`)
- **Auth.js (NextAuth v5)** — email/пароль + опционально Google OAuth
- **Stripe** — Checkout Sessions + webhook (тестовый режим)
- **Tailwind CSS v4 + Radix UI** — компоненты, своя дизайн-система
- **Framer Motion**, **Recharts**, **Zod**, **React Hook Form**

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

## Структура

```
prisma/               схема БД, миграции, seed-скрипт
src/app/               маршруты App Router
  (marketing)/         лендинг, каталог, карточка курса, о нас, контакты
  (auth)/               вход, регистрация
  (dashboard)/account/  личный кабинет студента
  admin/                админ-панель (RBAC: ADMIN/MODERATOR)
  api/                  NextAuth, Stripe webhook, загрузка изображений
src/actions/           server actions (auth, enrollments, reviews, admin-*)
src/components/        ui/ marketing/ courses/ account/ admin/ shared/
src/lib/               prisma, auth, stripe, валидации, утилиты
```

## Ограничения текущей сборки

- **Домен/хостинг** не настроены — код готов к деплою (Vercel + managed Postgres, или любой Node-хостинг), но сам деплой не выполнялся.
- **Stripe** работает в тестовом режиме на ваших собственных ключах.
- **Google OAuth** опционален — без `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` остаётся вход по email/паролю.
- Обложки курсов — генерируемые градиентные плашки с иконкой категории (без сток-фото); админ может загрузить свою обложку через форму курса.
