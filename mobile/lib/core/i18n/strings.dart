// Interface texts in the three languages of the website. `{name}` marks a placeholder,
// filled with `.f({'name': value})`; counted nouns go through `S.count`.

/// Noun forms by plural category: Russian uses one / few / many, English one / other (many),
/// Turkmen keeps the noun singular after a number (one).
class Pl {
  const Pl(this.one, [String? few, String? many])
      : few = few ?? one,
        many = many ?? few ?? one;
  final String one;
  final String few;
  final String many;
}

extension Fill on String {
  String f(Map<String, Object?> values) =>
      values.entries.fold(this, (text, entry) => text.replaceAll('{${entry.key}}', '${entry.value ?? ''}'));
}

class S {
  const S({
    required this.code,
    required this.appName,
    required this.retry,
    required this.offline,
    required this.loadFailed,
    required this.cancel,
    required this.save,
    required this.delete,
    required this.edit,
    required this.close,
    required this.next,
    required this.done,
    required this.seeAll,
    required this.sessionEnded,
    required this.optional,
    required this.onboardTitles,
    required this.onboardTexts,
    required this.welcomeEyebrow,
    required this.welcomeTitle,
    required this.welcomeText,
    required this.signIn,
    required this.createAccount,
    required this.skip,
    required this.loginTitle,
    required this.loginSubtitle,
    required this.tabSms,
    required this.tabPassword,
    required this.phone,
    required this.getCode,
    required this.sendCodeHint,
    required this.loginField,
    required this.loginHint,
    required this.password,
    required this.forgot,
    required this.noAccount,
    required this.register,
    required this.haveAccount,
    required this.codeTitle,
    required this.codeSentTo,
    required this.resendIn,
    required this.resend,
    required this.yourName,
    required this.nameHint,
    required this.newAccountNote,
    required this.confirm,
    required this.smsSimulated,
    required this.registerTitle,
    required this.registerSubtitle,
    required this.registerTabSms,
    required this.registerTabEmail,
    required this.registerSmsHint,
    required this.registerEmailHint,
    required this.email,
    required this.repeatPassword,
    required this.passwordHint,
    required this.recoveryTitle,
    required this.recoveryPhoneText,
    required this.recoveryEmailText,
    required this.recoveryTabPhone,
    required this.recoveryTabEmail,
    required this.newPassword,
    required this.saveNewPassword,
    required this.sendLink,
    required this.linkSentTitle,
    required this.linkSentText,
    required this.mailSimulated,
    required this.otherEmail,
    required this.vName,
    required this.vPhone,
    required this.vEmail,
    required this.vLogin,
    required this.vPassword,
    required this.vPasswordShort,
    required this.vMismatch,
    required this.vCode,
    required this.vRequired,
    required this.navHome,
    required this.navChildren,
    required this.navCourses,
    required this.navSchedule,
    required this.navProfile,
    required this.morning,
    required this.day,
    required this.evening,
    required this.night,
    required this.homeLead,
    required this.statChildren,
    required this.statCourses,
    required this.statAwaiting,
    required this.myChildren,
    required this.upcoming,
    required this.events,
    required this.recentEnrollments,
    required this.noChildrenTitle,
    required this.noChildrenText,
    required this.addChild,
    required this.noLessonsTitle,
    required this.noLessonsText,
    required this.feedEmptyTitle,
    required this.feedEmptyText,
    required this.feedEnrollmentActive,
    required this.feedAwaitingPayment,
    required this.feedExamResult,
    required this.feedExamBody,
    required this.feedLessonSoon,
    required this.notifTitle,
    required this.confirmNoPayment,
    required this.paymentsOffNote,
    required this.notifEnrollments,
    required this.notifEnrollmentsHint,
    required this.notifScores,
    required this.notifScoresHint,
    required this.notifReminders,
    required this.notifRemindersHint,
    required this.notifBlocked,
    required this.notifAllow,
    required this.notifPromptTitle,
    required this.notifPromptText,
    required this.notifNewScoresFor,
    required this.notifMany,
    required this.notifManyBody,
    required this.remindTomorrow,
    required this.remindSoon,
    required this.markAllRead,
    required this.feedToday,
    required this.feedEarlier,
    required this.today,
    required this.tomorrow,
    required this.yesterday,
    required this.findCourse,
    required this.years,
    required this.gradeN,
    required this.courses,
    required this.latestResult,
    required this.noScores,
    required this.average,
    required this.best,
    required this.exams,
    required this.scoreDynamics,
    required this.childCourses,
    required this.notes,
    required this.enrollChild,
    required this.deleteProfile,
    required this.deleteProfileTitle,
    required this.deleteProfileText,
    required this.profileDeleted,
    required this.newChild,
    required this.editChild,
    required this.firstName,
    required this.lastName,
    required this.birthDate,
    required this.grade,
    required this.gradeNone,
    required this.notesHint,
    required this.childSaved,
    required this.noCoursesYet,
    required this.catalogTitle,
    required this.catalogLead,
    required this.all,
    required this.hoursShort,
    required this.perWeek,
    required this.ageRange,
    required this.groupUpTo,
    required this.levels,
    required this.nothingFound,
    required this.nothingFoundText,
    required this.aboutCourse,
    required this.outcomes,
    required this.skills,
    required this.requirements,
    required this.audience,
    required this.program,
    required this.weekN,
    required this.lessons,
    required this.minutesShort,
    required this.instructor,
    required this.reviews,
    required this.courseLessons,
    required this.certificate,
    required this.teachingLanguage,
    required this.startsOn,
    required this.weeklyHours,
    required this.enrollCta,
    required this.price,
    required this.currency,
    required this.enrollTitle,
    required this.stepChild,
    required this.stepDocument,
    required this.stepPayment,
    required this.whoEnrolls,
    required this.whoEnrollsText,
    required this.alreadyEnrolled,
    required this.documentTitle,
    required this.documentText,
    required this.documentNumber,
    required this.documentNumberHint,
    required this.patronymic,
    required this.takePhoto,
    required this.fromGallery,
    required this.documentUploaded,
    required this.uploading,
    required this.replace,
    required this.vDocument,
    required this.promo,
    required this.apply,
    required this.promoApplied,
    required this.total,
    required this.toPayment,
    required this.confirmFree,
    required this.successTitle,
    required this.successText,
    required this.paymentOpened,
    required this.checkingPayment,
    required this.paymentPending,
    required this.checkAgain,
    required this.toHome,
    required this.openPaymentAgain,
    required this.scheduleTitle,
    required this.scheduleLead,
    required this.scheduleEmptyTitle,
    required this.scheduleEmptyText,
    required this.forChild,
    required this.profileTitle,
    required this.account,
    required this.myEnrollments,
    required this.noEnrollments,
    required this.language,
    required this.theme,
    required this.themeSystem,
    required this.themeLight,
    required this.themeDark,
    required this.contactCenter,
    required this.call,
    required this.writeEmail,
    required this.website,
    required this.siteSettings,
    required this.siteSettingsText,
    required this.signOut,
    required this.signOutTitle,
    required this.signOutText,
    required this.editName,
    required this.nameSaved,
    required this.noEmail,
    required this.noPhone,
    required this.status,
    required this.paymentStatus,
    required this.months,
    required this.weekdaysShort,
  });

  final String code;
  final String appName;
  final String retry;
  final String offline;
  final String loadFailed;
  final String cancel;
  final String save;
  final String delete;
  final String edit;
  final String close;
  final String next;
  final String done;
  final String seeAll;
  final String sessionEnded;
  final String optional;

  final List<String> onboardTitles;
  final List<String> onboardTexts;
  final String welcomeEyebrow;
  final String welcomeTitle;
  final String welcomeText;
  final String signIn;
  final String createAccount;
  final String skip;

  final String loginTitle;
  final String loginSubtitle;
  final String tabSms;
  final String tabPassword;
  final String phone;
  final String getCode;
  final String sendCodeHint;
  final String loginField;
  final String loginHint;
  final String password;
  final String forgot;
  final String noAccount;
  final String register;
  final String haveAccount;

  final String codeTitle;
  final String codeSentTo;
  final String resendIn;
  final String resend;
  final String yourName;
  final String nameHint;
  final String newAccountNote;
  final String confirm;
  final String smsSimulated;

  final String registerTitle;
  final String registerSubtitle;
  final String registerTabSms;
  final String registerTabEmail;
  final String registerSmsHint;
  final String registerEmailHint;
  final String email;
  final String repeatPassword;
  final String passwordHint;

  final String recoveryTitle;
  final String recoveryPhoneText;
  final String recoveryEmailText;
  final String recoveryTabPhone;
  final String recoveryTabEmail;
  final String newPassword;
  final String saveNewPassword;
  final String sendLink;
  final String linkSentTitle;
  final String linkSentText;
  final String mailSimulated;
  final String otherEmail;

  final String vName;
  final String vPhone;
  final String vEmail;
  final String vLogin;
  final String vPassword;
  final String vPasswordShort;
  final String vMismatch;
  final String vCode;
  final String vRequired;

  final String navHome;
  final String navChildren;
  final String navCourses;
  final String navSchedule;
  final String navProfile;

  final String morning;
  final String day;
  final String evening;
  final String night;
  final String homeLead;
  final String statChildren;
  final String statCourses;
  final String statAwaiting;
  final String myChildren;
  final String upcoming;
  final String events;
  final String recentEnrollments;
  final String noChildrenTitle;
  final String noChildrenText;
  final String addChild;
  final String noLessonsTitle;
  final String noLessonsText;
  final String feedEmptyTitle;
  final String feedEmptyText;
  final String feedEnrollmentActive;
  final String feedAwaitingPayment;
  final String feedExamResult;
  final String feedExamBody;
  final String feedLessonSoon;
  final String notifTitle;
  final String confirmNoPayment;
  final String paymentsOffNote;
  final String notifEnrollments;
  final String notifEnrollmentsHint;
  final String notifScores;
  final String notifScoresHint;
  final String notifReminders;
  final String notifRemindersHint;
  final String notifBlocked;
  final String notifAllow;
  final String notifPromptTitle;
  final String notifPromptText;
  final String notifNewScoresFor;
  final String notifMany;
  final String notifManyBody;
  final String remindTomorrow;
  final String remindSoon;
  final String markAllRead;
  final String feedToday;
  final String feedEarlier;
  final String today;
  final String tomorrow;
  final String yesterday;
  final String findCourse;

  final Pl years;
  final String gradeN;
  final Pl courses;
  final String latestResult;
  final String noScores;
  final String average;
  final String best;
  final String exams;
  final String scoreDynamics;
  final String childCourses;
  final String notes;
  final String enrollChild;
  final String deleteProfile;
  final String deleteProfileTitle;
  final String deleteProfileText;
  final String profileDeleted;
  final String newChild;
  final String editChild;
  final String firstName;
  final String lastName;
  final String birthDate;
  final String grade;
  final String gradeNone;
  final String notesHint;
  final String childSaved;
  final String noCoursesYet;

  final String catalogTitle;
  final String catalogLead;
  final String all;
  final String hoursShort;
  final String perWeek;
  final String ageRange;
  final String groupUpTo;
  final Map<String, String> levels;
  final String nothingFound;
  final String nothingFoundText;
  final String aboutCourse;
  final String outcomes;
  final String skills;
  final String requirements;
  final String audience;
  final String program;
  final String weekN;
  final Pl lessons;
  final String minutesShort;
  final String instructor;
  final String reviews;
  final String courseLessons;
  final String certificate;
  final String teachingLanguage;
  final String startsOn;
  final String weeklyHours;
  final String enrollCta;
  final String price;
  final String currency;

  final String enrollTitle;
  final String stepChild;
  final String stepDocument;
  final String stepPayment;
  final String whoEnrolls;
  final String whoEnrollsText;
  final String alreadyEnrolled;
  final String documentTitle;
  final String documentText;
  final String documentNumber;
  final String documentNumberHint;
  final String patronymic;
  final String takePhoto;
  final String fromGallery;
  final String documentUploaded;
  final String uploading;
  final String replace;
  final String vDocument;
  final String promo;
  final String apply;
  final String promoApplied;
  final String total;
  final String toPayment;
  final String confirmFree;
  final String successTitle;
  final String successText;
  final String paymentOpened;
  final String checkingPayment;
  final String paymentPending;
  final String checkAgain;
  final String toHome;
  final String openPaymentAgain;

  final String scheduleTitle;
  final String scheduleLead;
  final String scheduleEmptyTitle;
  final String scheduleEmptyText;
  final String forChild;

  final String profileTitle;
  final String account;
  final String myEnrollments;
  final String noEnrollments;
  final String language;
  final String theme;
  final String themeSystem;
  final String themeLight;
  final String themeDark;
  final String contactCenter;
  final String call;
  final String writeEmail;
  final String website;
  final String siteSettings;
  final String siteSettingsText;
  final String signOut;
  final String signOutTitle;
  final String signOutText;
  final String editName;
  final String nameSaved;
  final String noEmail;
  final String noPhone;
  final Map<String, String> status;
  final Map<String, String> paymentStatus;
  final List<String> months;
  final List<String> weekdaysShort;

  /// "3 занятия", "5 лет": the number and the noun in the right form for this language.
  String count(int n, Pl forms) => '$n ${_form(n, forms)}';

  String _form(int n, Pl forms) {
    if (code == 'ru') {
      final mod10 = n % 10, mod100 = n % 100;
      if (mod10 == 1 && mod100 != 11) return forms.one;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
      return forms.many;
    }
    if (code == 'en') return n == 1 ? forms.one : forms.many;
    return forms.one;
  }

  static S of(String code) => switch (code) { 'tm' => tm, 'en' => en, _ => ru };

  static const languages = {'ru': 'Русский', 'tm': 'Türkmençe', 'en': 'English'};

  // ── Русский ─────────────────────────────────────────────────────────────────
  static const ru = S(
    code: 'ru',
    appName: 'Bilim Merkezi',
    retry: 'Повторить',
    offline: 'Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.',
    loadFailed: 'Не удалось загрузить',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Изменить',
    close: 'Закрыть',
    next: 'Далее',
    done: 'Готово',
    seeAll: 'Все',
    sessionEnded: 'Сеанс завершён. Войдите снова.',
    optional: 'необязательно',
    onboardTitles: ['Баллы и динамика', 'Расписание всех детей', 'Запись за пару минут'],
    onboardTexts: [
      'Результаты экзаменов появляются сами — видно, как ребёнок растёт от недели к неделе.',
      'Ближайшие занятия каждого ребёнка в одной ленте, с временем и местом.',
      'Выберите курс и ребёнка, сфотографируйте документ — место за вами.',
    ],
    welcomeEyebrow: 'Кабинет родителя',
    welcomeTitle: 'Весь прогресс ребёнка — в одном спокойном месте.',
    welcomeText: 'Курсы, расписание и баллы ваших детей — в телефоне.',
    signIn: 'Войти',
    createAccount: 'Создать аккаунт',
    skip: 'Пропустить',
    loginTitle: 'С возвращением',
    loginSubtitle: 'Войдите, чтобы увидеть успехи ребёнка',
    tabSms: 'SMS-код',
    tabPassword: 'Пароль',
    phone: 'Номер телефона',
    getCode: 'Получить код',
    sendCodeHint: 'Отправим SMS с кодом. Пароль не нужен.',
    loginField: 'Email или телефон',
    loginHint: 'you@example.com или 65 12 34 56',
    password: 'Пароль',
    forgot: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться',
    haveAccount: 'Уже есть аккаунт?',
    codeTitle: 'Введите код',
    codeSentTo: 'Мы отправили SMS с кодом на {phone}. Он действует 5 минут.',
    resendIn: 'Отправить снова через {s} с',
    resend: 'Отправить код ещё раз',
    yourName: 'Ваше имя',
    nameHint: 'Например, Айгуль',
    newAccountNote: 'Этот номер ещё не зарегистрирован — аккаунт создастся после подтверждения.',
    confirm: 'Подтвердить',
    smsSimulated: 'SMS-шлюз не подключён — код напечатан в консоли сервера.',
    registerTitle: 'Аккаунт родителя',
    registerSubtitle: 'Бесплатно. Записывайте детей на курсы и следите за их баллами.',
    registerTabSms: 'По SMS-коду',
    registerTabEmail: 'Email и пароль',
    registerSmsHint: 'На этот номер придёт SMS с кодом — аккаунт создастся после подтверждения.',
    registerEmailHint: 'Код не нужен — аккаунт создаётся сразу. Телефон можно добавить позже.',
    email: 'Email',
    repeatPassword: 'Повторите пароль',
    passwordHint: 'Минимум 8 символов',
    recoveryTitle: 'Восстановление доступа',
    recoveryPhoneText: 'Укажите номер, привязанный к аккаунту — пришлём код.',
    recoveryEmailText: 'Укажите email аккаунта — пришлём ссылку для нового пароля.',
    recoveryTabPhone: 'По телефону',
    recoveryTabEmail: 'По email',
    newPassword: 'Новый пароль',
    saveNewPassword: 'Сохранить новый пароль',
    sendLink: 'Отправить ссылку',
    linkSentTitle: 'Проверьте почту',
    linkSentText: 'Если аккаунт с адресом {email} существует, мы отправили на него ссылку. Она действует 1 час — откройте её и задайте новый пароль.',
    mailSimulated: 'Почта не настроена — ссылка напечатана в консоли сервера.',
    otherEmail: 'Указать другой email',
    vName: 'Минимум 2 символа',
    vPhone: 'Введите 8 цифр номера, например 65 12 34 56',
    vEmail: 'Введите корректный email',
    vLogin: 'Введите email или номер телефона',
    vPassword: 'Введите пароль',
    vPasswordShort: 'Минимум 8 символов',
    vMismatch: 'Пароли не совпадают',
    vCode: 'Введите 6 цифр из SMS',
    vRequired: 'Заполните поле',
    navHome: 'Главная',
    navChildren: 'Дети',
    navCourses: 'Курсы',
    navSchedule: 'Расписание',
    navProfile: 'Профиль',
    morning: 'Доброе утро',
    day: 'Добрый день',
    evening: 'Добрый вечер',
    night: 'Доброй ночи',
    homeLead: 'Вот что происходит с учёбой ваших детей.',
    statChildren: 'Дети',
    statCourses: 'Активные курсы',
    statAwaiting: 'Ждут оплаты',
    myChildren: 'Мои дети',
    upcoming: 'Ближайшие занятия',
    events: 'События',
    recentEnrollments: 'Записи на курсы',
    noChildrenTitle: 'Начните с профиля ребёнка',
    noChildrenText: 'После этого запись на курс займёт пару шагов, а баллы за экзамены будут появляться здесь сами.',
    addChild: 'Добавить ребёнка',
    noLessonsTitle: 'Занятий пока нет',
    noLessonsText: 'Когда ребёнок начнёт курс, ближайшие уроки появятся здесь.',
    feedEmptyTitle: 'Пока тихо',
    feedEmptyText: 'Здесь появятся подтверждения записей, новые баллы и напоминания о занятиях.',
    feedEnrollmentActive: 'Запись подтверждена',
    feedAwaitingPayment: 'Запись ждёт оплаты',
    feedExamResult: 'Новые баллы',
    feedExamBody: '{exam}: {score} из {max}',
    feedLessonSoon: 'Скоро занятие',
    notifTitle: 'Уведомления',
    confirmNoPayment: 'Записать без оплаты',
    paymentsOffNote: 'Тестовый режим: оплата отключена, запись подтвердится сразу.',
    notifEnrollments: 'Записи и оплата',
    notifEnrollmentsHint: 'Запись подтверждена или ждёт оплаты',
    notifScores: 'Новые баллы',
    notifScoresHint: 'Результаты контрольных и экзаменов',
    notifReminders: 'Напоминания о занятиях',
    notifRemindersHint: 'Накануне вечером и за час до начала',
    notifBlocked: 'Уведомления запрещены в настройках телефона',
    notifAllow: 'Разрешить',
    notifPromptTitle: 'Не пропускайте важное',
    notifPromptText: 'Сообщим, когда запись подтверждена, появятся новые баллы, и напомним о занятии накануне.',
    notifNewScoresFor: 'Новые баллы у {name}',
    notifMany: 'Новости Bilim Merkezi',
    notifManyBody: 'Новых событий: {n}. Откройте приложение, чтобы посмотреть.',
    remindTomorrow: 'Завтра в {time}: {course}',
    remindSoon: 'Через час: {course}',
    markAllRead: 'Прочитать все',
    feedToday: 'Сегодня',
    feedEarlier: 'Ранее',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    yesterday: 'Вчера',
    findCourse: 'Подобрать курс',
    years: Pl('год', 'года', 'лет'),
    gradeN: '{n} класс',
    courses: Pl('курс', 'курса', 'курсов'),
    latestResult: 'Последний результат',
    noScores: 'Баллов пока нет',
    average: 'Средний',
    best: 'Лучший',
    exams: 'Экзамены',
    scoreDynamics: 'Динамика баллов',
    childCourses: 'Курсы',
    notes: 'Заметки',
    enrollChild: 'Записать на курс',
    deleteProfile: 'Удалить профиль',
    deleteProfileTitle: 'Удалить профиль {name}?',
    deleteProfileText: 'Профиль и его баллы исчезнут из кабинета. Это нельзя отменить.',
    profileDeleted: 'Профиль удалён',
    newChild: 'Новый ребёнок',
    editChild: 'Изменить профиль',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthDate: 'Дата рождения',
    grade: 'Класс',
    gradeNone: 'Не указан',
    notesHint: 'Особенности, цели, аллергии — что важно знать преподавателю',
    childSaved: 'Профиль сохранён',
    noCoursesYet: 'Ещё не записан ни на один курс',
    catalogTitle: 'Курсы',
    catalogLead: 'Подготовка к экзаменам, языки, программирование и не только.',
    all: 'Все',
    hoursShort: '{n} ч',
    perWeek: '{n} в неделю',
    ageRange: '{a}–{b} лет',
    groupUpTo: 'до {n} чел.',
    levels: {'BEGINNER': 'Начальный', 'INTERMEDIATE': 'Средний', 'ADVANCED': 'Продвинутый'},
    nothingFound: 'Ничего не нашлось',
    nothingFoundText: 'Попробуйте другое слово или категорию.',
    aboutCourse: 'О курсе',
    outcomes: 'Чему научится ребёнок',
    skills: 'Навыки',
    requirements: 'Что нужно знать заранее',
    audience: 'Кому подойдёт',
    program: 'Программа',
    weekN: 'Неделя {n}',
    lessons: Pl('урок', 'урока', 'уроков'),
    minutesShort: '{n} мин',
    instructor: 'Преподаватель',
    reviews: 'Отзывы родителей',
    courseLessons: 'Ближайшие занятия',
    certificate: 'Сертификат',
    teachingLanguage: 'Язык обучения',
    startsOn: 'Старт {date}',
    weeklyHours: '{a}–{b} ч в неделю',
    enrollCta: 'Записать ребёнка',
    price: 'Стоимость',
    currency: 'TMT',
    enrollTitle: 'Запись на курс',
    stepChild: 'Ребёнок',
    stepDocument: 'Документ',
    stepPayment: 'Оплата',
    whoEnrolls: 'Кого записываем?',
    whoEnrollsText: 'Выберите профиль — имя и дата рождения попадут в заявку.',
    alreadyEnrolled: 'уже записан',
    documentTitle: 'Документ ребёнка',
    documentText: 'Свидетельство о рождении или паспорт — нужен для договора. Файл видит только администрация центра.',
    documentNumber: 'Номер документа',
    documentNumberHint: 'Например, I-AŞ 123456',
    patronymic: 'Отчество',
    takePhoto: 'Сфотографировать',
    fromGallery: 'Из галереи',
    documentUploaded: 'Документ загружен',
    uploading: 'Загружаем…',
    replace: 'Заменить',
    vDocument: 'Добавьте фото документа',
    promo: 'Промокод',
    apply: 'Применить',
    promoApplied: 'Промокод применён',
    total: 'К оплате',
    toPayment: 'Перейти к оплате',
    confirmFree: 'Подтвердить запись',
    successTitle: 'Запись подтверждена!',
    successText: '{child} на курсе «{course}». Ближайшие занятия появятся в расписании.',
    paymentOpened: 'Оплатите на открывшейся странице и вернитесь в приложение — мы сразу проверим платёж.',
    checkingPayment: 'Проверяем оплату…',
    paymentPending: 'Платёж ещё не подтверждён. Если вы оплатили, статус обновится через пару минут.',
    checkAgain: 'Проверить ещё раз',
    toHome: 'На главную',
    openPaymentAgain: 'Открыть оплату снова',
    scheduleTitle: 'Расписание',
    scheduleLead: 'Занятия всех детей на ближайший месяц.',
    scheduleEmptyTitle: 'Занятий нет',
    scheduleEmptyText: 'Когда ребёнок начнёт курс, уроки появятся здесь с временем и местом.',
    forChild: 'для {name}',
    profileTitle: 'Профиль',
    account: 'Аккаунт',
    myEnrollments: 'Мои записи',
    noEnrollments: 'Записей пока нет',
    language: 'Язык',
    theme: 'Оформление',
    themeSystem: 'Как в системе',
    themeLight: 'Светлое',
    themeDark: 'Тёмное',
    contactCenter: 'Связаться с центром',
    call: 'Позвонить',
    writeEmail: 'Написать письмо',
    website: 'Сайт Bilim Merkezi',
    siteSettings: 'Безопасность и контакты',
    siteSettingsText: 'Пароль, email, номер телефона — на сайте',
    signOut: 'Выйти',
    signOutTitle: 'Выйти из аккаунта?',
    signOutText: 'На этом телефоне нужно будет войти снова.',
    editName: 'Изменить имя',
    nameSaved: 'Имя сохранено',
    noEmail: 'Email не указан',
    noPhone: 'Телефон не указан',
    status: {'ACTIVE': 'Активен', 'PENDING': 'Ожидает оплаты', 'CANCELLED': 'Отменён'},
    paymentStatus: {'SUCCEEDED': 'Оплачено', 'PENDING': 'Ожидает', 'FAILED': 'Не прошла', 'REFUNDED': 'Возврат'},
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    weekdaysShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  );

  // ── Türkmençe ───────────────────────────────────────────────────────────────
  static const tm = S(
    code: 'tm',
    appName: 'Bilim Merkezi',
    retry: 'Gaýtadan synanyş',
    offline: 'Serwer bilen baglanyşyk ýok. Interneti barlaň we gaýtadan synanyşyň.',
    loadFailed: 'Ýükläp bolmady',
    cancel: 'Ýatyr',
    save: 'Ýatda sakla',
    delete: 'Poz',
    edit: 'Üýtget',
    close: 'Ýap',
    next: 'Indiki',
    done: 'Taýýar',
    seeAll: 'Hemmesi',
    sessionEnded: 'Sessiýa tamamlandy. Täzeden giriň.',
    optional: 'hökmany däl',
    onboardTitles: ['Ballar we ösüş', 'Ähli çagalaryň tertibi', 'Iki minutda ýazylyş'],
    onboardTexts: [
      'Synag netijeleri özbaşdak peýda bolýar — çaganyň hepdeden-hepdä ösüşi görünýär.',
      'Her çaganyň ýakyn sapaklary wagty we ýeri bilen bir sanawda.',
      'Kursy we çagany saýlaň, resminamany suratlandyryň — orun siziňki.',
    ],
    welcomeEyebrow: 'Ene-atanyň otagy',
    welcomeTitle: 'Çagaňyzyň ähli ösüşi — bir rahat ýerde.',
    welcomeText: 'Çagalaryňyzyň kurslary, tertibi we ballary — telefonyňyzda.',
    signIn: 'Girmek',
    createAccount: 'Hasap döretmek',
    skip: 'Geç',
    loginTitle: 'Hoş geldiňiz',
    loginSubtitle: 'Çagaňyzyň üstünliklerini görmek üçin giriň',
    tabSms: 'SMS kod',
    tabPassword: 'Parol',
    phone: 'Telefon belgisi',
    getCode: 'Kod al',
    sendCodeHint: 'Kod bilen SMS ibereris. Parol gerek däl.',
    loginField: 'Email ýa-da telefon',
    loginHint: 'you@example.com ýa-da 65 12 34 56',
    password: 'Parol',
    forgot: 'Paroly unutdyňyzmy?',
    noAccount: 'Hasabyňyz ýokmy?',
    register: 'Hasaba durmak',
    haveAccount: 'Hasabyňyz barmy?',
    codeTitle: 'Kody giriziň',
    codeSentTo: '{phone} belgä kod bilen SMS iberdik. Ol 5 minut hereket edýär.',
    resendIn: '{s} sekuntdan soň gaýtadan iber',
    resend: 'Kody gaýtadan iber',
    yourName: 'Adyňyz',
    nameHint: 'Mysal üçin, Aýgül',
    newAccountNote: 'Bu belgi heniz hasaba alynmadyk — tassyklanandan soň hasap dörediler.',
    confirm: 'Tassykla',
    smsSimulated: 'SMS şlýuzy birikdirilmedik — kod serwer konsolynda çap edildi.',
    registerTitle: 'Ene-atanyň hasaby',
    registerSubtitle: 'Mugt. Çagalaryňyzy kurslara ýazdyryň we ballaryny yzarlaň.',
    registerTabSms: 'SMS kody bilen',
    registerTabEmail: 'Email we parol',
    registerSmsHint: 'Bu belgä kod bilen SMS geler — tassyklanandan soň hasap dörediler.',
    registerEmailHint: 'Kod gerek däl — hasap derrew döredilýär. Telefony soňra goşup bilersiňiz.',
    email: 'Email',
    repeatPassword: 'Paroly gaýtalaň',
    passwordHint: 'Iň az 8 nyşan',
    recoveryTitle: 'Girişi dikeltmek',
    recoveryPhoneText: 'Hasaba baglanan belgini görkeziň — kod ibereris.',
    recoveryEmailText: 'Hasabyň emailini görkeziň — täze parol üçin salgy ibereris.',
    recoveryTabPhone: 'Telefon bilen',
    recoveryTabEmail: 'Email bilen',
    newPassword: 'Täze parol',
    saveNewPassword: 'Täze paroly ýatda sakla',
    sendLink: 'Salgy iber',
    linkSentTitle: 'Poçtaňyzy barlaň',
    linkSentText: 'Eger {email} salgyly hasap bar bolsa, oňa salgy iberdik. Ol 1 sagat işleýär — açyň we täze parol belläň.',
    mailSimulated: 'Poçta sazlanmadyk — salgy serwer konsolynda çap edildi.',
    otherEmail: 'Başga email görkezmek',
    vName: 'Iň az 2 nyşan',
    vPhone: 'Belginiň 8 sanyny giriziň, mysal üçin 65 12 34 56',
    vEmail: 'Dogry email giriziň',
    vLogin: 'Email ýa-da telefon belgisini giriziň',
    vPassword: 'Paroly giriziň',
    vPasswordShort: 'Iň az 8 nyşan',
    vMismatch: 'Parollar gabat gelmeýär',
    vCode: 'SMS-den 6 sany giriziň',
    vRequired: 'Meýdany dolduryň',
    navHome: 'Baş sahypa',
    navChildren: 'Çagalar',
    navCourses: 'Kurslar',
    navSchedule: 'Tertip',
    navProfile: 'Profil',
    morning: 'Ertiriňiz haýyrly',
    day: 'Günüňiz haýyrly',
    evening: 'Agşamyňyz haýyrly',
    night: 'Gijäňiz rahat',
    homeLead: 'Çagalaryňyzyň okuwynda näme bolýar — şu ýerde.',
    statChildren: 'Çagalar',
    statCourses: 'Işjeň kurslar',
    statAwaiting: 'Töleg garaşýar',
    myChildren: 'Çagalarym',
    upcoming: 'Ýakyn sapaklar',
    events: 'Wakalar',
    recentEnrollments: 'Kurslara ýazylyşlar',
    noChildrenTitle: 'Çaganyň profilinden başlaň',
    noChildrenText: 'Şondan soň kursa ýazylmak iki ädim alar, synag ballary bolsa şu ýerde özbaşdak peýda bolar.',
    addChild: 'Çaga goşmak',
    noLessonsTitle: 'Heniz sapak ýok',
    noLessonsText: 'Çaga kursa başlanda, ýakyn sapaklar şu ýerde peýda bolar.',
    feedEmptyTitle: 'Häzirlikçe asuda',
    feedEmptyText: 'Bu ýerde ýazylyş tassyklamalary, täze ballar we sapak ýatlatmalary peýda bolar.',
    feedEnrollmentActive: 'Ýazylyş tassyklandy',
    feedAwaitingPayment: 'Ýazylyş töleg garaşýar',
    feedExamResult: 'Täze ballar',
    feedExamBody: '{exam}: {max} baldan {score}',
    feedLessonSoon: 'Ýakynda sapak',
    notifTitle: 'Bildirişler',
    confirmNoPayment: 'Tölegsiz ýazmak',
    paymentsOffNote: 'Synag tertibi: töleg öçürilen, ýazylyş derrew tassyklanar.',
    notifEnrollments: 'Ýazylyşlar we töleg',
    notifEnrollmentsHint: 'Ýazylyş tassyklandy ýa-da töleg garaşýar',
    notifScores: 'Täze ballar',
    notifScoresHint: 'Barlag we synag netijeleri',
    notifReminders: 'Sapak ýatlatmalary',
    notifRemindersHint: 'Öňki gün agşam we başlamazdan bir sagat öň',
    notifBlocked: 'Bildirişler telefonyň sazlamalarynda gadagan edilen',
    notifAllow: 'Rugsat bermek',
    notifPromptTitle: 'Möhüm zady sypdyrmaň',
    notifPromptText: 'Ýazylyş tassyklananda, täze ballar peýda bolanda habar bereris we sapagy öňünden ýatladarys.',
    notifNewScoresFor: '{name} täze ballar aldy',
    notifMany: 'Bilim Merkezi habarlary',
    notifManyBody: 'Täze wakalar: {n}. Görmek üçin programmany açyň.',
    remindTomorrow: 'Ertir sagat {time}: {course}',
    remindSoon: 'Bir sagatdan: {course}',
    markAllRead: 'Hemmesini okalan et',
    feedToday: 'Şu gün',
    feedEarlier: 'Öňräk',
    today: 'Şu gün',
    tomorrow: 'Ertir',
    yesterday: 'Düýn',
    findCourse: 'Kurs saýlamak',
    years: Pl('ýaş'),
    gradeN: '{n}-nji synp',
    courses: Pl('kurs'),
    latestResult: 'Soňky netije',
    noScores: 'Heniz bal ýok',
    average: 'Orta',
    best: 'Iň gowy',
    exams: 'Synaglar',
    scoreDynamics: 'Ballaryň ösüşi',
    childCourses: 'Kurslar',
    notes: 'Bellikler',
    enrollChild: 'Kursa ýazmak',
    deleteProfile: 'Profili pozmak',
    deleteProfileTitle: '{name} profilini pozmalymy?',
    deleteProfileText: 'Profil we onuň ballary otagdan aýrylar. Muny yzyna gaýtaryp bolmaýar.',
    profileDeleted: 'Profil pozuldy',
    newChild: 'Täze çaga',
    editChild: 'Profili üýtgetmek',
    firstName: 'Ady',
    lastName: 'Familiýasy',
    birthDate: 'Doglan senesi',
    grade: 'Synpy',
    gradeNone: 'Görkezilmedik',
    notesHint: 'Aýratynlyklar, maksatlar, allergiýa — mugallymyň bilmeli zatlary',
    childSaved: 'Profil ýatda saklandy',
    noCoursesYet: 'Heniz hiç bir kursa ýazylmadyk',
    catalogTitle: 'Kurslar',
    catalogLead: 'Synaglara taýýarlyk, diller, programmirleme we başgalar.',
    all: 'Hemmesi',
    hoursShort: '{n} sag',
    perWeek: 'hepdede {n}',
    ageRange: '{a}–{b} ýaş',
    groupUpTo: '{n} adama çenli',
    levels: {'BEGINNER': 'Başlangyç', 'INTERMEDIATE': 'Orta', 'ADVANCED': 'Ýokary'},
    nothingFound: 'Hiç zat tapylmady',
    nothingFoundText: 'Başga söz ýa-da kategoriýa synanyşyň.',
    aboutCourse: 'Kurs barada',
    outcomes: 'Çaga näme öwrener',
    skills: 'Başarnyklar',
    requirements: 'Öňünden näme bilmeli',
    audience: 'Kimler üçin',
    program: 'Maksatnama',
    weekN: '{n}-nji hepde',
    lessons: Pl('sapak'),
    minutesShort: '{n} min',
    instructor: 'Mugallym',
    reviews: 'Ene-atalaryň pikirleri',
    courseLessons: 'Ýakyn sapaklar',
    certificate: 'Sertifikat',
    teachingLanguage: 'Okuw dili',
    startsOn: 'Başlanýar: {date}',
    weeklyHours: 'hepdede {a}–{b} sag',
    enrollCta: 'Çagany ýazmak',
    price: 'Bahasy',
    currency: 'TMT',
    enrollTitle: 'Kursa ýazylyş',
    stepChild: 'Çaga',
    stepDocument: 'Resminama',
    stepPayment: 'Töleg',
    whoEnrolls: 'Kimi ýazýarys?',
    whoEnrollsText: 'Profili saýlaň — ady we doglan senesi arza girer.',
    alreadyEnrolled: 'eýýäm ýazylan',
    documentTitle: 'Çaganyň resminamasy',
    documentText: 'Dogluş hakynda şahadatnama ýa-da pasport — şertnama üçin gerek. Faýly diňe merkeziň administrasiýasy görýär.',
    documentNumber: 'Resminamanyň belgisi',
    documentNumberHint: 'Mysal üçin, I-AŞ 123456',
    patronymic: 'Atasynyň ady',
    takePhoto: 'Surata almak',
    fromGallery: 'Galereýadan',
    documentUploaded: 'Resminama ýüklendi',
    uploading: 'Ýüklenýär…',
    replace: 'Çalyşmak',
    vDocument: 'Resminamanyň suratyny goşuň',
    promo: 'Promokod',
    apply: 'Ulanmak',
    promoApplied: 'Promokod ulanyldy',
    total: 'Tölemeli',
    toPayment: 'Töleg geçmek',
    confirmFree: 'Ýazylyşy tassyklamak',
    successTitle: 'Ýazylyş tassyklandy!',
    successText: '{child} «{course}» kursunda. Ýakyn sapaklar tertipde peýda bolar.',
    paymentOpened: 'Açylan sahypada töläň we programma gaýdyp geliň — tölegi derrew barlarys.',
    checkingPayment: 'Töleg barlanýar…',
    paymentPending: 'Töleg heniz tassyklanmady. Eger tölän bolsaňyz, ýagdaý birnäçe minutdan täzeler.',
    checkAgain: 'Gaýtadan barla',
    toHome: 'Baş sahypa',
    openPaymentAgain: 'Tölegi täzeden açmak',
    scheduleTitle: 'Tertip',
    scheduleLead: 'Ähli çagalaryň ýakyn aýdaky sapaklary.',
    scheduleEmptyTitle: 'Sapak ýok',
    scheduleEmptyText: 'Çaga kursa başlanda, sapaklar wagty we ýeri bilen şu ýerde peýda bolar.',
    forChild: '{name} üçin',
    profileTitle: 'Profil',
    account: 'Hasap',
    myEnrollments: 'Ýazylyşlarym',
    noEnrollments: 'Heniz ýazylyş ýok',
    language: 'Dil',
    theme: 'Görnüş',
    themeSystem: 'Ulgamdaky ýaly',
    themeLight: 'Ýagty',
    themeDark: 'Garaňky',
    contactCenter: 'Merkez bilen habarlaşmak',
    call: 'Jaň etmek',
    writeEmail: 'Hat ýazmak',
    website: 'Bilim Merkezi saýty',
    siteSettings: 'Howpsuzlyk we kontaktlar',
    siteSettingsText: 'Parol, email, telefon belgisi — saýtda',
    signOut: 'Çykmak',
    signOutTitle: 'Hasapdan çykmalymy?',
    signOutText: 'Bu telefonda täzeden girmeli bolar.',
    editName: 'Ady üýtgetmek',
    nameSaved: 'At ýatda saklandy',
    noEmail: 'Email görkezilmedik',
    noPhone: 'Telefon görkezilmedik',
    status: {'ACTIVE': 'Işjeň', 'PENDING': 'Töleg garaşýar', 'CANCELLED': 'Ýatyryldy'},
    paymentStatus: {'SUCCEEDED': 'Tölendi', 'PENDING': 'Garaşylýar', 'FAILED': 'Geçmedi', 'REFUNDED': 'Gaýtaryldy'},
    months: ['ýanwar', 'fewral', 'mart', 'aprel', 'maý', 'iýun', 'iýul', 'awgust', 'sentýabr', 'oktýabr', 'noýabr', 'dekabr'],
    weekdaysShort: ['Du', 'Si', 'Ça', 'Pe', 'An', 'Şe', 'Ýe'],
  );

  // ── English ─────────────────────────────────────────────────────────────────
  static const en = S(
    code: 'en',
    appName: 'Bilim Merkezi',
    retry: 'Try again',
    offline: 'Cannot reach the server. Check your connection and try again.',
    loadFailed: 'Could not load',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    next: 'Next',
    done: 'Done',
    seeAll: 'All',
    sessionEnded: 'Your session has ended. Please sign in again.',
    optional: 'optional',
    onboardTitles: ['Scores and progress', 'Every child’s schedule', 'Enrol in two minutes'],
    onboardTexts: [
      'Exam results appear on their own — see how your child grows week by week.',
      'Upcoming lessons of every child in one list, with time and place.',
      'Pick a course and a child, snap the document — the seat is yours.',
    ],
    welcomeEyebrow: 'Parent account',
    welcomeTitle: 'Your child’s whole progress, in one calm place.',
    welcomeText: 'Your children’s courses, schedule and scores — on your phone.',
    signIn: 'Sign in',
    createAccount: 'Create account',
    skip: 'Skip',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to see how your child is doing',
    tabSms: 'SMS code',
    tabPassword: 'Password',
    phone: 'Phone number',
    getCode: 'Get code',
    sendCodeHint: 'We will text you a code. No password needed.',
    loginField: 'Email or phone',
    loginHint: 'you@example.com or 65 12 34 56',
    password: 'Password',
    forgot: 'Forgot password?',
    noAccount: 'No account yet?',
    register: 'Sign up',
    haveAccount: 'Already have an account?',
    codeTitle: 'Enter the code',
    codeSentTo: 'We texted a code to {phone}. It works for 5 minutes.',
    resendIn: 'Resend in {s} s',
    resend: 'Send the code again',
    yourName: 'Your name',
    nameHint: 'For example, Aygul',
    newAccountNote: 'This number is not registered yet — the account is created once you confirm it.',
    confirm: 'Confirm',
    smsSimulated: 'The SMS gateway is not connected — the code is in the server console.',
    registerTitle: 'Parent account',
    registerSubtitle: 'Free. Enrol your children and follow their scores.',
    registerTabSms: 'With SMS code',
    registerTabEmail: 'Email & password',
    registerSmsHint: 'We will text a code to this number — the account is created once you confirm it.',
    registerEmailHint: 'No code needed — the account is created right away. You can add a phone later.',
    email: 'Email',
    repeatPassword: 'Repeat password',
    passwordHint: 'At least 8 characters',
    recoveryTitle: 'Recover access',
    recoveryPhoneText: 'Enter the number linked to your account — we will text a code.',
    recoveryEmailText: 'Enter your account email — we will send a link to set a new password.',
    recoveryTabPhone: 'By phone',
    recoveryTabEmail: 'By email',
    newPassword: 'New password',
    saveNewPassword: 'Save new password',
    sendLink: 'Send link',
    linkSentTitle: 'Check your inbox',
    linkSentText: 'If an account with {email} exists, we have sent a link to it. It works for 1 hour — open it and set a new password.',
    mailSimulated: 'Email is not configured — the link is printed in the server console.',
    otherEmail: 'Use another email',
    vName: 'At least 2 characters',
    vPhone: 'Enter the 8 digits of the number, e.g. 65 12 34 56',
    vEmail: 'Enter a valid email',
    vLogin: 'Enter your email or phone number',
    vPassword: 'Enter your password',
    vPasswordShort: 'At least 8 characters',
    vMismatch: 'Passwords do not match',
    vCode: 'Enter the 6 digits from the SMS',
    vRequired: 'Please fill this in',
    navHome: 'Home',
    navChildren: 'Children',
    navCourses: 'Courses',
    navSchedule: 'Schedule',
    navProfile: 'Profile',
    morning: 'Good morning',
    day: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
    homeLead: 'Here is what is happening with your children’s studies.',
    statChildren: 'Children',
    statCourses: 'Active courses',
    statAwaiting: 'Awaiting payment',
    myChildren: 'My children',
    upcoming: 'Upcoming lessons',
    events: 'Updates',
    recentEnrollments: 'Enrollments',
    noChildrenTitle: 'Start with your child’s profile',
    noChildrenText: 'Then enrolling takes a couple of steps, and exam scores will appear here on their own.',
    addChild: 'Add a child',
    noLessonsTitle: 'No lessons yet',
    noLessonsText: 'Once your child starts a course, upcoming lessons will appear here.',
    feedEmptyTitle: 'All quiet',
    feedEmptyText: 'Confirmed enrollments, new scores and lesson reminders will show up here.',
    feedEnrollmentActive: 'Enrollment confirmed',
    feedAwaitingPayment: 'Enrollment awaits payment',
    feedExamResult: 'New scores',
    feedExamBody: '{exam}: {score} of {max}',
    feedLessonSoon: 'Lesson coming up',
    notifTitle: 'Notifications',
    confirmNoPayment: 'Enroll without payment',
    paymentsOffNote: 'Test mode: payments are off, the seat is confirmed at once.',
    notifEnrollments: 'Enrollments and payments',
    notifEnrollmentsHint: 'A seat is confirmed or awaits payment',
    notifScores: 'New scores',
    notifScoresHint: 'Test and exam results',
    notifReminders: 'Lesson reminders',
    notifRemindersHint: 'The evening before and an hour ahead',
    notifBlocked: 'Notifications are blocked in the phone settings',
    notifAllow: 'Allow',
    notifPromptTitle: 'Never miss what matters',
    notifPromptText: 'We\'ll tell you when a seat is confirmed or new scores arrive, and remind you before each lesson.',
    notifNewScoresFor: 'New scores for {name}',
    notifMany: 'News from Bilim Merkezi',
    notifManyBody: '{n} new updates. Open the app to see them.',
    remindTomorrow: 'Tomorrow at {time}: {course}',
    remindSoon: 'In an hour: {course}',
    markAllRead: 'Mark all read',
    feedToday: 'Today',
    feedEarlier: 'Earlier',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    findCourse: 'Find a course',
    years: Pl('year', 'years', 'years'),
    gradeN: 'Grade {n}',
    courses: Pl('course', 'courses', 'courses'),
    latestResult: 'Latest result',
    noScores: 'No scores yet',
    average: 'Average',
    best: 'Best',
    exams: 'Exams',
    scoreDynamics: 'Score trend',
    childCourses: 'Courses',
    notes: 'Notes',
    enrollChild: 'Enrol in a course',
    deleteProfile: 'Delete profile',
    deleteProfileTitle: 'Delete {name}’s profile?',
    deleteProfileText: 'The profile and its scores will disappear from your account. This cannot be undone.',
    profileDeleted: 'Profile deleted',
    newChild: 'New child',
    editChild: 'Edit profile',
    firstName: 'First name',
    lastName: 'Last name',
    birthDate: 'Date of birth',
    grade: 'Grade',
    gradeNone: 'Not set',
    notesHint: 'Needs, goals, allergies — anything the teacher should know',
    childSaved: 'Profile saved',
    noCoursesYet: 'Not enrolled in any course yet',
    catalogTitle: 'Courses',
    catalogLead: 'Exam preparation, languages, programming and more.',
    all: 'All',
    hoursShort: '{n} h',
    perWeek: '{n} a week',
    ageRange: 'ages {a}–{b}',
    groupUpTo: 'up to {n}',
    levels: {'BEGINNER': 'Beginner', 'INTERMEDIATE': 'Intermediate', 'ADVANCED': 'Advanced'},
    nothingFound: 'Nothing found',
    nothingFoundText: 'Try another word or category.',
    aboutCourse: 'About the course',
    outcomes: 'What your child will learn',
    skills: 'Skills',
    requirements: 'Before you start',
    audience: 'Who it suits',
    program: 'Programme',
    weekN: 'Week {n}',
    lessons: Pl('lesson', 'lessons', 'lessons'),
    minutesShort: '{n} min',
    instructor: 'Teacher',
    reviews: 'Parents’ reviews',
    courseLessons: 'Upcoming lessons',
    certificate: 'Certificate',
    teachingLanguage: 'Language',
    startsOn: 'Starts {date}',
    weeklyHours: '{a}–{b} h a week',
    enrollCta: 'Enrol your child',
    price: 'Price',
    currency: 'TMT',
    enrollTitle: 'Enrollment',
    stepChild: 'Child',
    stepDocument: 'Document',
    stepPayment: 'Payment',
    whoEnrolls: 'Who are we enrolling?',
    whoEnrollsText: 'Pick a profile — the name and date of birth go into the application.',
    alreadyEnrolled: 'already enrolled',
    documentTitle: 'Child’s document',
    documentText: 'Birth certificate or passport — needed for the contract. Only the centre’s staff can see the file.',
    documentNumber: 'Document number',
    documentNumberHint: 'For example, I-AŞ 123456',
    patronymic: 'Patronymic',
    takePhoto: 'Take a photo',
    fromGallery: 'From gallery',
    documentUploaded: 'Document uploaded',
    uploading: 'Uploading…',
    replace: 'Replace',
    vDocument: 'Add a photo of the document',
    promo: 'Promo code',
    apply: 'Apply',
    promoApplied: 'Promo code applied',
    total: 'To pay',
    toPayment: 'Go to payment',
    confirmFree: 'Confirm enrollment',
    successTitle: 'Enrollment confirmed!',
    successText: '{child} is in “{course}”. Upcoming lessons will appear in the schedule.',
    paymentOpened: 'Pay on the page that opened and come back to the app — we will check the payment right away.',
    checkingPayment: 'Checking the payment…',
    paymentPending: 'The payment is not confirmed yet. If you paid, the status will update in a couple of minutes.',
    checkAgain: 'Check again',
    toHome: 'Go home',
    openPaymentAgain: 'Open payment again',
    scheduleTitle: 'Schedule',
    scheduleLead: 'Every child’s lessons for the coming month.',
    scheduleEmptyTitle: 'No lessons',
    scheduleEmptyText: 'Once your child starts a course, lessons will appear here with time and place.',
    forChild: 'for {name}',
    profileTitle: 'Profile',
    account: 'Account',
    myEnrollments: 'My enrollments',
    noEnrollments: 'No enrollments yet',
    language: 'Language',
    theme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    contactCenter: 'Contact the centre',
    call: 'Call',
    writeEmail: 'Write an email',
    website: 'Bilim Merkezi website',
    siteSettings: 'Security and contacts',
    siteSettingsText: 'Password, email, phone number — on the website',
    signOut: 'Sign out',
    signOutTitle: 'Sign out?',
    signOutText: 'You will need to sign in again on this phone.',
    editName: 'Change name',
    nameSaved: 'Name saved',
    noEmail: 'No email',
    noPhone: 'No phone',
    status: {'ACTIVE': 'Active', 'PENDING': 'Awaiting payment', 'CANCELLED': 'Cancelled'},
    paymentStatus: {'SUCCEEDED': 'Paid', 'PENDING': 'Pending', 'FAILED': 'Failed', 'REFUNDED': 'Refunded'},
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  );
}
