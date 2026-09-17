/**
 * What the course page shows before the programme: results, skills, requirements, who the course
 * suits, the age range and the group. Keyed by course slug; used by the seed and by
 * `npm run courses:catalog` for an existing database.
 */

export type CourseDetails = {
  outcomes: string[];
  skills: string[];
  requirements: string[];
  audience: string[];
  ageMin?: number;
  ageMax?: number;
  groupSize?: number;
  teachingLanguage?: string;
  certificate?: boolean;
  track?: string;
  levelCode?: string;
};

export const courseDetails: Record<string, CourseDetails> = {
  "web-razrabotka-s-nulya": {
    outcomes: [
      "Сверстать адаптивный сайт из нескольких страниц",
      "Оформлять страницы с помощью Flexbox и CSS Grid",
      "Оживить страницу на JavaScript: меню, формы, эффекты",
      "Опубликовать проект в интернете через GitHub Pages",
    ],
    skills: ["HTML5", "CSS3", "Flexbox и Grid", "JavaScript", "Git и GitHub", "Адаптивная вёрстка"],
    requirements: ["Уверенно пользоваться компьютером и клавиатурой", "Ноутбук для домашних заданий — желательно"],
    audience: ["Школьникам, которые хотят сделать свой первый сайт", "Тем, кто выбирает профессию в IT"],
    ageMin: 12,
    ageMax: 17,
    groupSize: 10,
    teachingLanguage: "Русский, туркменский",
  },
  "react-nextjs-sovremennye-prilozheniya": {
    outcomes: [
      "Собирать интерфейсы из React-компонентов",
      "Загружать данные из API и обрабатывать ошибки",
      "Делать многостраничные приложения на Next.js",
      "Подключить базу данных, вход и опубликовать проект",
    ],
    skills: ["React", "Next.js", "TypeScript", "Работа с API", "Формы и валидация", "Деплой"],
    requirements: ["Знать HTML, CSS и основы JavaScript", "Свой ноутбук для практики"],
    audience: ["Выпускникам курса «Веб-разработка с нуля»", "Старшеклассникам, которые уже верстают сайты"],
    ageMin: 14,
    ageMax: 17,
    groupSize: 10,
    teachingLanguage: "Русский",
  },
  "python-dlya-analiza-dannyh": {
    outcomes: [
      "Писать программы на Python: условия, циклы, функции",
      "Очищать и анализировать таблицы с помощью Pandas",
      "Строить понятные графики и делать выводы по данным",
      "Защитить собственное мини-исследование",
    ],
    skills: ["Python", "Pandas", "NumPy", "Matplotlib", "Jupyter Notebook", "Аналитическое мышление"],
    requirements: ["Математика на уровне 7–8 класса", "Желательно — опыт любого языка программирования"],
    audience: ["Школьникам, которые любят математику и логику", "Тем, кто готовится к олимпиадам по информатике"],
    ageMin: 13,
    ageMax: 17,
    groupSize: 10,
    teachingLanguage: "Русский, туркменский",
  },
  "ui-ux-dizayn-figma": {
    outcomes: [
      "Исследовать задачу пользователя и описывать сценарии",
      "Собирать макеты в Figma с компонентами и Auto Layout",
      "Подбирать шрифты и цвета для интерфейса",
      "Сделать кликабельный прототип мобильного приложения",
    ],
    skills: ["Figma", "UX-исследование", "Прототипирование", "Типографика", "Дизайн-системы"],
    requirements: ["Опыт рисования не нужен", "Компьютер с браузером для работы в Figma"],
    audience: ["Творческим ребятам, которым интересны приложения", "Тем, кто хочет попробовать профессию дизайнера"],
    ageMin: 12,
    ageMax: 17,
    groupSize: 12,
    teachingLanguage: "Русский",
  },
  "graficheskiy-dizayn-i-brending": {
    outcomes: [
      "Придумать название и позиционирование бренда",
      "Нарисовать логотип и подобрать фирменные цвета",
      "Собрать брендбук и макеты для соцсетей",
      "Подготовить файлы к печати и публикации",
    ],
    skills: ["Композиция", "Цвет и типографика", "Логотипы", "Брендбук", "Adobe Illustrator"],
    requirements: ["Базовые навыки работы в любом графическом редакторе"],
    audience: ["Тем, кто прошёл UI/UX-курс или рисует на компьютере", "Будущим дизайнерам для портфолио"],
    ageMin: 13,
    ageMax: 17,
    groupSize: 12,
    teachingLanguage: "Русский",
  },
  "digital-marketing-targetirovannaya-reklama": {
    outcomes: [
      "Описать целевую аудиторию и воронку продаж",
      "Настроить и протестировать рекламную кампанию",
      "Считать основные метрики: охват, клики, заявки",
      "Составить медиаплан для небольшого бизнеса",
    ],
    skills: ["Маркетинговая стратегия", "Таргетированная реклама", "Аналитика", "Копирайтинг"],
    requirements: ["Аккаунт в социальных сетях", "Интерес к бизнесу и цифрам"],
    audience: ["Старшеклассникам, которые думают о профессии маркетолога", "Студентам и начинающим предпринимателям"],
    ageMin: 15,
    ageMax: 17,
    groupSize: 14,
    teachingLanguage: "Русский, туркменский",
  },
  "smm-prodvizhenie-v-socsetyah": {
    outcomes: [
      "Составить контент-план на месяц",
      "Снимать и монтировать короткие видео на телефон",
      "Оформить профиль и писать вовлекающие посты",
      "Анализировать статистику и расти без накруток",
    ],
    skills: ["SMM-стратегия", "Контент-план", "Мобильная съёмка", "Instagram и TikTok", "Аналитика"],
    requirements: ["Смартфон с камерой", "Свой или учебный аккаунт в соцсетях"],
    audience: ["Будущим SMM-менеджерам", "Тем, кто хочет развивать блог или страницу семейного бизнеса"],
    ageMin: 14,
    ageMax: 17,
    groupSize: 14,
    teachingLanguage: "Русский, туркменский",
  },
  "angliyskiy-dlya-delovogo-obshcheniya": {
    outcomes: [
      "Вести переписку и деловые письма на английском",
      "Уверенно представлять себя и свой проект",
      "Участвовать в переговорах и онлайн-встречах",
      "Подготовиться к собеседованию на английском",
    ],
    skills: ["Business English", "Speaking", "Writing", "Presentations", "Negotiations"],
    requirements: ["Уровень английского не ниже A2 (Pre-Intermediate)", "Пройти бесплатное входное тестирование"],
    audience: ["Старшеклассникам, которые готовятся к учёбе за рубежом", "Тем, кто закончил 2-й курс и идёт дальше"],
    ageMin: 14,
    ageMax: 17,
    groupSize: 8,
    teachingLanguage: "Английский, русский",
    track: "english",
    levelCode: "B1",
  },
  "osnovy-predprinimatelstva": {
    outcomes: [
      "Найти идею и проверить её на реальных людях",
      "Посчитать доходы, расходы и точку безубыточности",
      "Вести личный бюджет и разбираться в финансах",
      "Защитить бизнес-план перед жюри",
    ],
    skills: ["Финансовая грамотность", "Бизнес-план", "Бухгалтерия для начинающих", "Менеджмент", "Презентация"],
    requirements: ["Специальных знаний не нужно"],
    audience: ["Школьникам, которые мечтают о своём деле", "Тем, кто хочет разобраться в деньгах и бюджете"],
    ageMin: 13,
    ageMax: 17,
    groupSize: 14,
    teachingLanguage: "Русский, туркменский",
  },
  "publichnye-vystupleniya": {
    outcomes: [
      "Спокойно выступать перед классом и зрителями",
      "Строить речь: вступление, аргументы, вывод",
      "Делать понятные слайды и отвечать на вопросы",
      "Спорить по правилам дебатов",
    ],
    skills: ["Ораторское мастерство", "Сторителлинг", "Дебаты", "Уверенность в себе"],
    requirements: ["Желание говорить — остальному научим"],
    audience: ["Стеснительным детям, которым трудно отвечать у доски", "Участникам конкурсов и олимпиад"],
    ageMin: 10,
    ageMax: 17,
    groupSize: 12,
    teachingLanguage: "Русский, туркменский",
  },
};

/** Course columns for a details entry; a certificate is issued unless the entry says otherwise. */
export function courseDetailsData(details: CourseDetails) {
  return { certificate: true, ...details };
}
