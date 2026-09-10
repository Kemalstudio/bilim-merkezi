import "dotenv/config";
import { PrismaClient, type CourseLevel } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Программирование", slug: "programming" },
  { name: "Дизайн", slug: "design" },
  { name: "Маркетинг", slug: "marketing" },
  { name: "Иностранные языки", slug: "languages" },
  { name: "Бизнес и финансы", slug: "business" },
  { name: "Личностный рост", slug: "growth" },
] as const;

type SeedModule = { title: string; lessons: { title: string; durationMin: number }[] };

type SeedCourse = {
  title: string;
  slug: string;
  categorySlug: (typeof categories)[number]["slug"];
  level: CourseLevel;
  durationHours: number;
  price: number;
  discountPrice?: number;
  summary: string;
  description: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  featured?: boolean;
  modules: SeedModule[];
};

const courses: SeedCourse[] = [
  {
    title: "Веб-разработка с нуля: HTML, CSS и JavaScript",
    slug: "web-razrabotka-s-nulya",
    categorySlug: "programming",
    level: "BEGINNER",
    durationHours: 40,
    price: 199,
    summary: "Постройте первые сайты и разберитесь, как устроен веб — от вёрстки до интерактивности.",
    description:
      "Курс для тех, кто никогда не писал код. Вы пройдёте путь от структуры HTML-документа до интерактивных страниц на JavaScript, разберётесь с адаптивной вёрсткой и опубликуете три собственных проекта в портфолио.",
    instructorName: "Аман Дурдыев",
    instructorTitle: "Frontend-разработчик, 7 лет опыта",
    instructorBio: "Работал над продуктами для международных стартапов, преподаёт веб-разработку с 2020 года.",
    featured: true,
    modules: [
      {
        title: "Основы HTML и семантика",
        lessons: [
          { title: "Структура документа и теги", durationMin: 35 },
          { title: "Семантическая вёрстка", durationMin: 40 },
          { title: "Формы и валидация", durationMin: 30 },
        ],
      },
      {
        title: "CSS и адаптивный дизайн",
        lessons: [
          { title: "Блочная модель и flexbox", durationMin: 45 },
          { title: "CSS Grid на практике", durationMin: 40 },
          { title: "Адаптивная вёрстка под мобильные", durationMin: 35 },
        ],
      },
      {
        title: "JavaScript в браузере",
        lessons: [
          { title: "Переменные, функции, события", durationMin: 50 },
          { title: "Работа с DOM", durationMin: 45 },
          { title: "Итоговый проект: интерактивный лендинг", durationMin: 60 },
        ],
      },
    ],
  },
  {
    title: "React и Next.js: современные веб-приложения",
    slug: "react-nextjs-sovremennye-prilozheniya",
    categorySlug: "programming",
    level: "INTERMEDIATE",
    durationHours: 32,
    price: 249,
    discountPrice: 199,
    summary: "Соберите полноценное приложение на React и Next.js с серверным рендерингом и базой данных.",
    description:
      "Практический курс о современном фронтенде: компоненты, состояние, роутинг, серверные компоненты Next.js и подключение к базе данных. В конце — готовое приложение в вашем портфолио.",
    instructorName: "Мердан Аннаев",
    instructorTitle: "Senior Frontend Engineer",
    instructorBio: "Разрабатывает продукты на React с 2017 года, ранее руководил командой фронтенда в финтех-стартапе.",
    featured: true,
    modules: [
      {
        title: "Основы React",
        lessons: [
          { title: "Компоненты и пропсы", durationMin: 40 },
          { title: "Состояние и хуки", durationMin: 45 },
          { title: "Работа с формами", durationMin: 35 },
        ],
      },
      {
        title: "Next.js App Router",
        lessons: [
          { title: "Серверные и клиентские компоненты", durationMin: 50 },
          { title: "Роутинг и layout", durationMin: 40 },
          { title: "Server Actions", durationMin: 45 },
        ],
      },
      {
        title: "Данные и деплой",
        lessons: [
          { title: "Подключение базы данных", durationMin: 45 },
          { title: "Аутентификация пользователей", durationMin: 40 },
          { title: "Деплой приложения", durationMin: 30 },
        ],
      },
    ],
  },
  {
    title: "Python для анализа данных",
    slug: "python-dlya-analiza-dannyh",
    categorySlug: "programming",
    level: "INTERMEDIATE",
    durationHours: 36,
    price: 229,
    summary: "Научитесь обрабатывать, визуализировать и анализировать данные с помощью Python.",
    description:
      "От основ Python до работы с pandas, numpy и построения графиков в matplotlib. Курс построен на реальных наборах данных и заканчивается собственным аналитическим проектом.",
    instructorName: "Гульнара Сапарова",
    instructorTitle: "Data Analyst",
    instructorBio: "Более 5 лет работает с данными в аналитике и консалтинге, преподаёт Python с 2021 года.",
    modules: [
      {
        title: "Основы Python",
        lessons: [
          { title: "Синтаксис и структуры данных", durationMin: 40 },
          { title: "Функции и модули", durationMin: 35 },
        ],
      },
      {
        title: "Работа с данными",
        lessons: [
          { title: "Pandas: очистка и агрегация", durationMin: 50 },
          { title: "NumPy и векторные вычисления", durationMin: 40 },
        ],
      },
      {
        title: "Визуализация и проект",
        lessons: [
          { title: "Графики в matplotlib", durationMin: 40 },
          { title: "Итоговый аналитический проект", durationMin: 60 },
        ],
      },
    ],
  },
  {
    title: "UI/UX-дизайн: от идеи до прототипа в Figma",
    slug: "ui-ux-dizayn-figma",
    categorySlug: "design",
    level: "BEGINNER",
    durationHours: 28,
    price: 179,
    summary: "Освойте процесс дизайна интерфейсов — от исследования пользователей до кликабельного прототипа.",
    description:
      "Пошаговый курс по UI/UX-дизайну: вы изучите принципы пользовательского опыта, основы визуального дизайна и соберёте кликабельный прототип мобильного приложения в Figma.",
    instructorName: "Огулгерек Чарыева",
    instructorTitle: "Product Designer",
    instructorBio: "Проектировала интерфейсы для банковских и образовательных продуктов, ментор по UX-дизайну.",
    featured: true,
    modules: [
      {
        title: "Исследование и UX",
        lessons: [
          { title: "Пользовательские сценарии", durationMin: 35 },
          { title: "Информационная архитектура", durationMin: 30 },
        ],
      },
      {
        title: "Визуальный дизайн",
        lessons: [
          { title: "Типографика и цвет", durationMin: 40 },
          { title: "Дизайн-системы и компоненты", durationMin: 45 },
        ],
      },
      {
        title: "Прототипирование в Figma",
        lessons: [
          { title: "Auto Layout и компоненты", durationMin: 45 },
          { title: "Интерактивный прототип", durationMin: 50 },
        ],
      },
    ],
  },
  {
    title: "Графический дизайн и брендинг",
    slug: "graficheskiy-dizayn-i-brending",
    categorySlug: "design",
    level: "INTERMEDIATE",
    durationHours: 24,
    price: 159,
    summary: "Создавайте логотипы, фирменный стиль и графику для реальных брендов.",
    description:
      "Курс о том, как разработать айдентику бренда с нуля: от концепции и логотипа до брендбука и оформления соцсетей.",
    instructorName: "Джемал Овезова",
    instructorTitle: "Графический дизайнер",
    instructorBio: "Разрабатывает фирменный стиль для локальных брендов более 6 лет.",
    modules: [
      {
        title: "Основы брендинга",
        lessons: [
          { title: "Позиционирование бренда", durationMin: 30 },
          { title: "Разработка логотипа", durationMin: 45 },
        ],
      },
      {
        title: "Визуальная идентика",
        lessons: [
          { title: "Цвет и типографика бренда", durationMin: 35 },
          { title: "Брендбук", durationMin: 40 },
        ],
      },
    ],
  },
  {
    title: "Digital-маркетинг и таргетированная реклама",
    slug: "digital-marketing-targetirovannaya-reklama",
    categorySlug: "marketing",
    level: "BEGINNER",
    durationHours: 20,
    price: 149,
    summary: "Запускайте эффективные рекламные кампании и анализируйте результаты.",
    description:
      "Практический курс по digital-маркетингу: настройка рекламных кабинетов, таргетинг, аналитика и оптимизация бюджета. Вы запустите свою первую кампанию уже во время обучения.",
    instructorName: "Сердар Атаев",
    instructorTitle: "Digital-маркетолог",
    instructorBio: "Ведёт рекламные кампании для локального и международного бизнеса с 2018 года.",
    featured: true,
    modules: [
      {
        title: "Основы digital-маркетинга",
        lessons: [
          { title: "Воронка продаж", durationMin: 30 },
          { title: "Целевая аудитория", durationMin: 25 },
        ],
      },
      {
        title: "Таргетированная реклама",
        lessons: [
          { title: "Настройка рекламного кабинета", durationMin: 40 },
          { title: "Тестирование креативов", durationMin: 35 },
        ],
      },
      {
        title: "Аналитика",
        lessons: [{ title: "Метрики и оптимизация бюджета", durationMin: 40 }],
      },
    ],
  },
  {
    title: "SMM: продвижение в социальных сетях",
    slug: "smm-prodvizhenie-v-socsetyah",
    categorySlug: "marketing",
    level: "BEGINNER",
    durationHours: 18,
    price: 129,
    summary: "Ведите соцсети бренда системно: контент-план, визуал и работа с аудиторией.",
    description:
      "Вы научитесь строить контент-стратегию, создавать визуально привлекательные публикации и общаться с аудиторией так, чтобы она превращалась в клиентов.",
    instructorName: "Джерен Реджепова",
    instructorTitle: "SMM-специалист",
    instructorBio: "Ведёт аккаунты брендов в социальных сетях с суммарной аудиторией более 200 000 подписчиков.",
    modules: [
      {
        title: "Стратегия и контент",
        lessons: [
          { title: "Контент-план", durationMin: 30 },
          { title: "Форматы публикаций", durationMin: 25 },
        ],
      },
      {
        title: "Работа с аудиторией",
        lessons: [{ title: "Общение и работа с отзывами", durationMin: 30 }],
      },
    ],
  },
  {
    title: "Английский язык для делового общения",
    slug: "angliyskiy-dlya-delovogo-obshcheniya",
    categorySlug: "languages",
    level: "INTERMEDIATE",
    durationHours: 45,
    price: 189,
    summary: "Уверенно вести переписку, переговоры и презентации на английском языке.",
    description:
      "Курс делового английского: деловая переписка, телефонные и видеозвонки, презентации и переговоры. Много разговорной практики и реальных кейсов.",
    instructorName: "Джахан Кулиева",
    instructorTitle: "Преподаватель английского языка, IELTS 8.5",
    instructorBio: "Преподаёт деловой английский более 8 лет, готовила специалистов к международным переговорам.",
    modules: [
      {
        title: "Деловая переписка",
        lessons: [
          { title: "Структура делового письма", durationMin: 30 },
          { title: "Электронные письма и запросы", durationMin: 30 },
        ],
      },
      {
        title: "Переговоры и звонки",
        lessons: [
          { title: "Телефонный этикет", durationMin: 35 },
          { title: "Ведение переговоров", durationMin: 40 },
        ],
      },
      {
        title: "Презентации",
        lessons: [{ title: "Структура и подача презентации", durationMin: 40 }],
      },
    ],
  },
  {
    title: "Основы предпринимательства и финансовой грамотности",
    slug: "osnovy-predprinimatelstva",
    categorySlug: "business",
    level: "BEGINNER",
    durationHours: 22,
    price: 169,
    summary: "От бизнес-идеи до финансовой модели — постройте фундамент своего дела.",
    description:
      "Практический курс о запуске бизнеса: проверка идеи, финансовое планирование, юридические основы и первые шаги в привлечении клиентов.",
    instructorName: "Максат Ходжаниязов",
    instructorTitle: "Предприниматель, основатель двух компаний",
    instructorBio: "Запустил и вывел на прибыль два бизнеса в сфере услуг и розничной торговли.",
    featured: true,
    modules: [
      {
        title: "От идеи к бизнесу",
        lessons: [
          { title: "Проверка бизнес-идеи", durationMin: 35 },
          { title: "Анализ рынка и конкурентов", durationMin: 30 },
        ],
      },
      {
        title: "Финансы",
        lessons: [
          { title: "Финансовая модель", durationMin: 40 },
          { title: "Учёт доходов и расходов", durationMin: 30 },
        ],
      },
    ],
  },
  {
    title: "Публичные выступления и уверенная коммуникация",
    slug: "publichnye-vystupleniya",
    categorySlug: "growth",
    level: "BEGINNER",
    durationHours: 16,
    price: 99,
    summary: "Избавьтесь от страха сцены и научитесь убедительно доносить свои идеи.",
    description:
      "Курс о том, как готовить и произносить выступления, работать с волнением, удерживать внимание аудитории и отвечать на сложные вопросы.",
    instructorName: "Аигуль Назарова",
    instructorTitle: "Тренер по коммуникациям",
    instructorBio: "Проводит тренинги по публичным выступлениям для руководителей и команд с 2016 года.",
    modules: [
      {
        title: "Подготовка выступления",
        lessons: [
          { title: "Структура убедительной речи", durationMin: 30 },
          { title: "Работа с волнением", durationMin: 25 },
        ],
      },
      {
        title: "Выступление на публике",
        lessons: [{ title: "Удержание внимания аудитории", durationMin: 30 }],
      },
    ],
  },
];

// Stored digits-only (country code + number, no spaces) so lookups can
// normalize user input the same way and compare reliably.
// Account holders are parents; each brings one or two children to the centre.
const studentSeeds = [
  {
    name: "Сердар Атаев",
    phone: "99365123456",
    children: [
      { firstName: "Мерджен", lastName: "Атаева", grade: 9 },
      { firstName: "Довлет", lastName: "Атаев", grade: 6 },
    ],
  },
  { name: "Бибигуль Реджепова", phone: "99365234567", children: [{ firstName: "Огулджан", lastName: "Реджепова", grade: 11 }] },
  { name: "Руслан Кулиев", phone: "99361345678", children: [{ firstName: "Тимур", lastName: "Кулиев", grade: 8 }] },
  {
    name: "Джерен Овезова",
    phone: "99362456789",
    children: [
      { firstName: "Сельби", lastName: "Овезова", grade: 10 },
      { firstName: "Батыр", lastName: "Овезов", grade: 7 },
    ],
  },
  { name: "Мурат Аннаев", phone: "99365567890", children: [{ firstName: "Ахмет", lastName: "Аннаев", grade: 11 }] },
  { name: "Айгуль Дурдыева", phone: "99361678901", children: [{ firstName: "Лейли", lastName: "Дурдыева", grade: 9 }] },
  { name: "Вепа Чарыев", phone: "99362789012", children: [{ firstName: "Керим", lastName: "Чарыев", grade: 10 }] },
  { name: "Мая Сапарова", phone: "99365890123", children: [{ firstName: "Гозель", lastName: "Сапарова", grade: 8 }] },
];

function randomDateWithinDays(days: number) {
  const now = Date.now();
  const past = now - Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(past);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Очистка базы данных...");
  await prisma.examResult.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.child.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.phoneOtp.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Создание категорий...");
  const categoryRecords = await Promise.all(
    categories.map((c) => prisma.category.create({ data: c }))
  );
  const categoryBySlug = new Map(categoryRecords.map((c) => [c.slug, c]));

  console.log("Создание курсов...");
  const courseRecords = [];
  for (const c of courses) {
    const category = categoryBySlug.get(c.categorySlug)!;
    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        description: c.description,
        level: c.level,
        durationHours: c.durationHours,
        price: c.price,
        discountPrice: c.discountPrice,
        instructorName: c.instructorName,
        instructorTitle: c.instructorTitle,
        instructorBio: c.instructorBio,
        featured: c.featured ?? false,
        published: true,
        categoryId: category.id,
        modules: {
          create: c.modules.map((mod, index) => ({
            title: mod.title,
            position: index,
            lessons: {
              create: mod.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                durationMin: lesson.durationMin,
                position: lessonIndex,
              })),
            },
          })),
        },
      },
    });
    courseRecords.push(course);
  }

  console.log("Создание пользователей...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const moderatorPasswordHash = await bcrypt.hash("Moderator123!", 12);
  const studentPasswordHash = await bcrypt.hash("Student123!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Администратор платформы",
      email: "admin@bilim.tm",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "Модератор курсов",
      email: "moderator@bilim.tm",
      passwordHash: moderatorPasswordHash,
      role: "MODERATOR",
    },
  });

  const students = [];
  let childCount = 0;
  for (let i = 0; i < studentSeeds.length; i++) {
    const student = await prisma.user.create({
      data: {
        name: studentSeeds[i].name,
        email: `student${i + 1}@example.com`,
        phone: studentSeeds[i].phone,
        passwordHash: studentPasswordHash,
        role: "STUDENT",
        createdAt: randomDateWithinDays(200),
      },
    });

    const children = [];
    for (let c = 0; c < studentSeeds[i].children.length; c++) {
      const seed = studentSeeds[i].children[c];
      children.push(
        await prisma.child.create({
          data: {
            parentId: student.id,
            firstName: seed.firstName,
            lastName: seed.lastName,
            grade: seed.grade,
            // Age that matches the school year they are in.
            birthDate: new Date(new Date().getFullYear() - (seed.grade + 6), 4, 12),
            avatarHue: (childCount * 67) % 360,
          },
        })
      );
      childCount++;
    }

    students.push({ ...student, children });
  }

  console.log("Создание записей на курсы и платежей...");
  const reviewComments = [
    "Очень понятно объясняют, много практики.",
    "Курс превзошёл ожидания, преподаватель отвечает на все вопросы.",
    "Материал структурирован, было легко следовать программе.",
    "Хотелось бы больше практических заданий, но в целом отлично.",
    "Уже применяю полученные знания на работе, спасибо!",
    "Лучший курс, который я проходил на этой платформе.",
  ];

  const examNames = ["Промежуточный тест", "Итоговый экзамен", "Практическая работа"];

  let enrollmentCount = 0;
  let examResultCount = 0;
  for (const student of students) {
    const enrollCount = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...courseRecords].sort(() => Math.random() - 0.5).slice(0, enrollCount);

    for (const course of shuffled) {
      const child = pick(student.children);
      const roll = Math.random();
      const status = roll < 0.75 ? "ACTIVE" : roll < 0.9 ? "PENDING" : "CANCELLED";
      const createdAt = randomDateWithinDays(180);
      const price = Number(course.discountPrice ?? course.price);

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          childId: child.id,
          status,
          createdAt,
          updatedAt: createdAt,
        },
      });
      enrollmentCount++;

      const paymentStatus =
        status === "ACTIVE" ? "SUCCEEDED" : status === "CANCELLED" ? "REFUNDED" : "PENDING";

      await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          userId: student.id,
          courseId: course.id,
          amount: price,
          status: paymentStatus,
          stripeCheckoutId: `cs_test_seed_${enrollment.id}`,
          stripePaymentIntentId:
            paymentStatus !== "PENDING" ? `pi_test_seed_${enrollment.id}` : null,
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (status === "ACTIVE" && Math.random() < 0.6) {
        await prisma.review.create({
          data: {
            userId: student.id,
            courseId: course.id,
            rating: Math.random() < 0.7 ? 5 : Math.random() < 0.5 ? 4 : 3,
            comment: pick(reviewComments),
            createdAt,
          },
        });
      }

      if (status === "ACTIVE" && student.phone && Math.random() < 0.7) {
        // A short series rather than one mark, so the parent dashboard has a
        // trend to draw and the landing page has a spread to report.
        const sittings = 2 + Math.floor(Math.random() * 3);
        const maxScore = 100;
        let score = 48 + Math.floor(Math.random() * 22);

        for (let sitting = 0; sitting < sittings; sitting++) {
          // Preparation mostly helps, but not every sitting is better.
          score = Math.min(100, Math.max(35, score + Math.floor(Math.random() * 16) - 4));
          await prisma.examResult.create({
            data: {
              phone: student.phone,
              childId: child.id,
              studentName: `${child.firstName} ${child.lastName}`,
              examName: examNames[sitting % examNames.length],
              score,
              maxScore,
              examDate: new Date(
                Date.now() - (sittings - sitting) * 32 * 24 * 60 * 60 * 1000
              ),
              courseId: course.id,
            },
          });
          examResultCount++;
        }
      }
    }
  }

  console.log("Создание расписания занятий...");
  const eventTitles = [
    "Занятие в группе",
    "Пробный экзамен",
    "Разбор домашней работы",
    "Консультация с преподавателем",
  ];
  const rooms = ["Кабинет 201", "Кабинет 104", "Онлайн", "Актовый зал"];

  let scheduleCount = 0;
  for (const course of courseRecords) {
    for (let week = 0; week < 4; week++) {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + week * 7 + 1 + Math.floor(Math.random() * 3));
      startsAt.setHours(15 + Math.floor(Math.random() * 3), 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);

      await prisma.scheduleEvent.create({
        data: {
          courseId: course.id,
          title: week === 2 ? eventTitles[1] : pick(eventTitles),
          startsAt,
          endsAt,
          location: pick(rooms),
        },
      });
      scheduleCount++;
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "database.seeded",
      targetType: "system",
      metadata: { courses: courseRecords.length, students: students.length, enrollments: enrollmentCount },
    },
  });

  console.log(
    `Готово: ${categoryRecords.length} категорий, ${courseRecords.length} курсов, ${students.length} родителей, ${childCount} детей, ${enrollmentCount} записей, ${examResultCount} результатов экзаменов, ${scheduleCount} занятий в расписании.`
  );
  console.log("Вход в админ-панель: admin@bilim.tm / Admin123!");
  console.log(`Проверка результатов по телефону, например: +${studentSeeds[0].phone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
