import type { ContentLanguage } from "./content-languages";


export type GeneratedContentCopy = {
  essay: {
    introduction: string;
    body: string;
    conclusion: string;
  };
  article: {
    abstract: string;
    keywords: string;
    conclusion: string;
    references: string;
  };
  classHour: {
    title: string;
  };
  comic: {
    script: string;
    panel: string;
  };
  quiz: {
    quizTitle: string;
    quizTitlePlaceholder: string;
    questionNumber: string;
    question: string;
    options: string;
    correctAnswer: string;
    explanation: string;
    editHint: string;
    singleChoice: string;
    multipleChoice: string;
    trueFalse: string;
    openQuestion: string;
  };
  exam: {
    scoreIndicator: string;
    scoreMismatch: string;
    valid: string;
    invalid: string;
    taskNumber: string;
    score: string;
    descriptor: string;
    imagePlaceholder: string;
    multipleChoice: string;
    matching: string;
    trueFalse: string;
    textOpen: string;
    fillInBlank: string;
    question: string;
    options: string;
    instruction: string;
    pairs: string;
    leftColumn: string;
    rightColumn: string;
    statement: string;
    trueFalseChoice: string;
    fillBlanks: string;
    answers: string;
  };
  lessonPlan: {
    title: string;
    sectionName: string;
    subject: string;
    teacherName: string;
    date: string;
    grade: string;
    studentsPresent: string;
    studentsAbsent: string;
    topic: string;
    learningObjectives: string;
    lessonObjectives: string;
    stage: string;
    teacherActivity: string;
    studentActivity: string;
    assessment: string;
    resources: string;
    neuroExercise: string;
  };
  worksheet: {
    answers: string;
    answersHint: string;
    answerFileSuffix: string;
  };
  cyclogram: {
    documentTitle: string;
    organization: string;
    group: string;
    age: string;
    years: string;
    teacher: string;
    week: string;
    theme: string;
    sectionLabel: string;
    version: string;
    regulatory: string;
  };
  scientificProject: {
    hypothesis: string;
    object: string;
    subject: string;
    methods: string;
    scientificNovelty: string;
    practicalSignificance: string;
    chapter: string;
    subsections: string;
    titlePage: string;
    annotation: string;
    introduction: string;
    chapterTheory: string;
    chapterResearch: string;
    conclusion: string;
    references: string;
    appendix: string;
  };
  race: {
    team: string;
    questionsEnded: string;
    blocked: string;
    progress: string;
    victory: string;
    winner: string;
    playAgain: string;
    backToGames: string;
    trackAlt: string;
    horseAlt: string;
    finish: string;
    enterFullscreen: string;
    exitFullscreen: string;
    openFailed: string;
    reopenFromHistory: string;
    generating: string;
    serverStatus: string;
    loadFailed: string;
    genericError: string;
    unavailable: string;
    wrongMaterial: string;
    selectGame: string;
    createFailed: string;
    refundedRetry: string;
    incomplete: string;
    createNew: string;
  };
};


const GENERATED_CONTENT_COPY = {
  kk: {
    essay: { introduction: "Кіріспе", body: "Негізгі бөлім", conclusion: "Қорытынды" },
    article: { abstract: "Аңдатпа", keywords: "Түйін сөздер", conclusion: "Қорытынды", references: "Пайдаланылған әдебиеттер" },
    classHour: { title: "Сынып сағаты" },
    comic: { script: "Сценарий", panel: "Кадр" },
    quiz: {
      quizTitle: "Тест атауы", quizTitlePlaceholder: "Тест атауын енгізіңіз", questionNumber: "Сұрақ",
      question: "Сұрақ мәтіні", options: "Жауап нұсқалары", correctAnswer: "Дұрыс жауап",
      explanation: "Түсіндірме", editHint: "Өңдеу үшін басыңыз", singleChoice: "Бір жауапты таңдау",
      multipleChoice: "Бірнеше жауапты таңдау", trueFalse: "Дұрыс / Бұрыс", openQuestion: "Ашық сұрақ",
    },
    exam: {
      scoreIndicator: "Ұпайлар", scoreMismatch: "Ұпайлар қосындысы белгіленген мәнге сәйкес келмейді",
      valid: "дұрыс", invalid: "сәйкес емес",
      taskNumber: "Тапсырма", score: "Ұпай", descriptor: "Дескриптор", imagePlaceholder: "Суретке арналған орын",
      multipleChoice: "Бірнеше жауаптың бірін таңдау", matching: "Сәйкестендіру", trueFalse: "Дұрыс / Бұрыс",
      textOpen: "Ашық сұрақ", fillInBlank: "Бос орынды толтыру", question: "Сұрақ", options: "Нұсқалар",
      instruction: "Нұсқаулық", pairs: "Жұптар", leftColumn: "Сол жақ баған", rightColumn: "Оң жақ баған",
      statement: "Тұжырым", trueFalseChoice: "Дұрыс / Бұрыс", fillBlanks: "Бос орындарды толтырыңыз", answers: "Жауаптар",
    },
    lessonPlan: {
      title: "Қысқа мерзімді жоспар", sectionName: "Бөлім", subject: "Пән", teacherName: "Педагогтің аты-жөні",
      date: "Күні", grade: "Сынып", studentsPresent: "Қатысқандар саны", studentsAbsent: "Қатыспағандар саны",
      topic: "Сабақтың тақырыбы", learningObjectives: "Оқу мақсаттары", lessonObjectives: "Сабақтың мақсаты",
      stage: "Сабақ кезеңі / Уақыты", teacherActivity: "Педагогтің әрекеті", studentActivity: "Оқушының әрекеті",
      assessment: "Бағалау", resources: "Ресурстар", neuroExercise: "Нейрожаттығу",
    },
    worksheet: { answers: "Жауаптар", answersHint: "Жауаптар оқушыға арналған парақта көрсетілмейді.", answerFileSuffix: "жауаптар" },
    cyclogram: {
      documentTitle: "Балабақша циклограммасы", organization: "Ұйым", group: "Топ", age: "Жас тобы", years: "жас",
      teacher: "Тәрбиеші", week: "Апта", theme: "Апта тақырыбы", sectionLabel: "Бөлім", version: "Нұсқа",
      regulatory: "Қазақстан Республикасының мектепке дейінгі тәрбие мен оқыту талаптарына сәйкес",
    },
    scientificProject: {
      hypothesis: "Болжам", object: "Зерттеу нысаны", subject: "Зерттеу пәні", methods: "Зерттеу әдістері",
      scientificNovelty: "Ғылыми жаңалығы", practicalSignificance: "Практикалық маңыздылығы", chapter: "Тарау",
      subsections: "Бөлімшелер", titlePage: "Титул беті", annotation: "Аңдатпа", introduction: "Кіріспе",
      chapterTheory: "Теориялық бөлім", chapterResearch: "Зерттеу бөлімі", conclusion: "Қорытынды",
      references: "Пайдаланылған әдебиеттер", appendix: "Қосымша",
    },
    race: {
      team: "Команда", questionsEnded: "Сұрақтар аяқталды", blocked: "Бұғатталған", progress: "Ілгерілеу",
      victory: "Жеңіс!", winner: "Жеңімпаз:", playAgain: "Қайта ойнау", backToGames: "Ойындарға оралу",
      trackAlt: "Ат жарысы жолы", horseAlt: "Ат", finish: "Мәре!", enterFullscreen: "Толық экран",
      exitFullscreen: "Толық экраннан шығу", openFailed: "Ойынды ашу мүмкін болмады",
      reopenFromHistory: "Ойынды бөлім тарихынан қайта ашыңыз немесе жаңасын жасаңыз.",
      generating: "Ойын жасалып жатыр", serverStatus: "Жұмыс серверде жалғасады. Бетті жабуға болады.",
      loadFailed: "Ойынды жүктеу мүмкін болмады",
      genericError: "Қызметпен байланысу мүмкін болмады. Сәлден кейін қайталап көріңіз.",
      unavailable: "Бұл ойын енді қолжетімді емес. «Ат жарыс» бөлімінен басқа ойынды ашыңыз немесе жаңасын жасаңыз.",
      wrongMaterial: "Бұл басқа материал", selectGame: "«Ат жарыс» бөлімінен ойынды таңдаңыз.",
      createFailed: "Ойынды жасау мүмкін болмады",
      refundedRetry: "Монеталар қайтарылды. Параметрлерді тексеріп, қайта жасап көріңіз.",
      incomplete: "Ойын толық сақталмаған",
      createNew: "Жаңа ойын жасап көріңіз. Монеталарға қатысты мәселе болса, қолдау қызметіне жазыңыз.",
    },
  },
  ru: {
    essay: { introduction: "Введение", body: "Основная часть", conclusion: "Заключение" },
    article: { abstract: "Аннотация", keywords: "Ключевые слова", conclusion: "Заключение", references: "Список литературы" },
    classHour: { title: "Классный час" },
    comic: { script: "Сценарий", panel: "Кадр" },
    quiz: {
      quizTitle: "Название теста", quizTitlePlaceholder: "Введите название теста", questionNumber: "Вопрос",
      question: "Текст вопроса", options: "Варианты ответа", correctAnswer: "Правильный ответ",
      explanation: "Пояснение", editHint: "Нажмите для редактирования", singleChoice: "Один вариант ответа",
      multipleChoice: "Несколько вариантов ответа", trueFalse: "Верно / Неверно", openQuestion: "Открытый вопрос",
    },
    exam: {
      scoreIndicator: "Баллы", scoreMismatch: "Сумма баллов не соответствует заданному значению",
      valid: "верно", invalid: "не совпадает",
      taskNumber: "Задание", score: "Балл", descriptor: "Дескриптор", imagePlaceholder: "Место для изображения",
      multipleChoice: "Выбор ответа", matching: "Сопоставление", trueFalse: "Верно / Неверно",
      textOpen: "Открытый вопрос", fillInBlank: "Заполнение пропусков", question: "Вопрос", options: "Варианты",
      instruction: "Инструкция", pairs: "Пары", leftColumn: "Левая колонка", rightColumn: "Правая колонка",
      statement: "Утверждение", trueFalseChoice: "Верно / Неверно", fillBlanks: "Заполните пропуски", answers: "Ответы",
    },
    lessonPlan: {
      title: "Краткосрочный план", sectionName: "Раздел", subject: "Предмет", teacherName: "ФИО педагога",
      date: "Дата", grade: "Класс", studentsPresent: "Присутствуют", studentsAbsent: "Отсутствуют",
      topic: "Тема урока", learningObjectives: "Цели обучения", lessonObjectives: "Цель урока",
      stage: "Этап урока / Время", teacherActivity: "Действия педагога", studentActivity: "Действия ученика",
      assessment: "Оценивание", resources: "Ресурсы", neuroExercise: "Нейроупражнение",
    },
    worksheet: { answers: "Ответы", answersHint: "Ответы не напечатаны на листе для ученика.", answerFileSuffix: "ответы" },
    cyclogram: {
      documentTitle: "Циклограмма детского сада", organization: "Организация", group: "Группа", age: "Возраст", years: "лет",
      teacher: "Воспитатель", week: "Неделя", theme: "Тема недели", sectionLabel: "Раздел", version: "Версия",
      regulatory: "В соответствии с требованиями дошкольного воспитания и обучения",
    },
    scientificProject: {
      hypothesis: "Гипотеза", object: "Объект исследования", subject: "Предмет исследования", methods: "Методы исследования",
      scientificNovelty: "Научная новизна", practicalSignificance: "Практическая значимость", chapter: "Глава",
      subsections: "Подразделы", titlePage: "Титульная страница", annotation: "Аннотация", introduction: "Введение",
      chapterTheory: "Теоретическая глава", chapterResearch: "Исследовательская глава", conclusion: "Заключение",
      references: "Список литературы", appendix: "Приложение",
    },
    race: {
      team: "Команда", questionsEnded: "Вопросы закончились", blocked: "Заблокировано", progress: "Прогресс",
      victory: "Победа!", winner: "Победитель:", playAgain: "Играть заново", backToGames: "Вернуться к играм",
      trackAlt: "Ипподром", horseAlt: "Лошадь", finish: "Финиш!", enterFullscreen: "На весь экран",
      exitFullscreen: "Выйти из полноэкранного режима", openFailed: "Не удалось открыть игру",
      reopenFromHistory: "Откройте игру заново из истории раздела или создайте новую.",
      generating: "Создаём игру", serverStatus: "Работа продолжается на сервере. Страницу можно закрыть.",
      loadFailed: "Не удалось загрузить игру",
      genericError: "Не удалось связаться с сервисом. Подождите немного и попробуйте ещё раз.",
      unavailable: "Эта игра больше недоступна. Откройте другую игру в разделе «Скачки» или создайте новую.",
      wrongMaterial: "Это другой материал", selectGame: "Выберите игру в разделе «Скачки».",
      createFailed: "Не удалось создать игру",
      refundedRetry: "Монеты возвращены. Проверьте параметры и попробуйте ещё раз.",
      incomplete: "Игра сохранилась не полностью",
      createNew: "Создайте новую игру. Если возник вопрос по монетам, напишите в поддержку.",
    },
  },
  en: {
    essay: { introduction: "Introduction", body: "Main body", conclusion: "Conclusion" },
    article: { abstract: "Abstract", keywords: "Keywords", conclusion: "Conclusion", references: "References" },
    classHour: { title: "Class hour" },
    comic: { script: "Script", panel: "Panel" },
    quiz: {
      quizTitle: "Quiz title", quizTitlePlaceholder: "Enter the quiz title", questionNumber: "Question",
      question: "Question text", options: "Answer options", correctAnswer: "Correct answer",
      explanation: "Explanation", editHint: "Click to edit", singleChoice: "Single choice",
      multipleChoice: "Multiple choice", trueFalse: "True / False", openQuestion: "Open question",
    },
    exam: {
      scoreIndicator: "Points", scoreMismatch: "The points total does not match the specified value",
      valid: "valid", invalid: "does not match",
      taskNumber: "Task", score: "Point", descriptor: "Descriptor", imagePlaceholder: "Image placeholder",
      multipleChoice: "Multiple choice", matching: "Matching", trueFalse: "True / False", textOpen: "Open question",
      fillInBlank: "Fill in the blanks", question: "Question", options: "Options", instruction: "Instructions", pairs: "Pairs",
      leftColumn: "Left column", rightColumn: "Right column", statement: "Statement", trueFalseChoice: "True / False",
      fillBlanks: "Fill in the blanks", answers: "Answers",
    },
    lessonPlan: {
      title: "Short-term lesson plan", sectionName: "Unit", subject: "Subject", teacherName: "Teacher",
      date: "Date", grade: "Grade", studentsPresent: "Present", studentsAbsent: "Absent", topic: "Lesson topic",
      learningObjectives: "Learning objectives", lessonObjectives: "Lesson objectives", stage: "Lesson stage / Time",
      teacherActivity: "Teacher actions", studentActivity: "Student actions", assessment: "Assessment",
      resources: "Resources", neuroExercise: "Brain exercise",
    },
    worksheet: { answers: "Answers", answersHint: "Answers are not printed on the student worksheet.", answerFileSuffix: "answers" },
    cyclogram: {
      documentTitle: "Kindergarten weekly plan", organization: "Organization", group: "Group", age: "Age group", years: "years",
      teacher: "Teacher", week: "Week", theme: "Weekly theme", sectionLabel: "Section", version: "Version",
      regulatory: "Prepared in accordance with preschool education requirements",
    },
    scientificProject: {
      hypothesis: "Hypothesis", object: "Research object", subject: "Research subject", methods: "Research methods",
      scientificNovelty: "Scientific novelty", practicalSignificance: "Practical significance", chapter: "Chapter",
      subsections: "Subsections", titlePage: "Title page", annotation: "Abstract", introduction: "Introduction",
      chapterTheory: "Theoretical chapter", chapterResearch: "Research chapter", conclusion: "Conclusion",
      references: "References", appendix: "Appendix",
    },
    race: {
      team: "Team", questionsEnded: "No questions left", blocked: "Blocked", progress: "Progress",
      victory: "Victory!", winner: "Winner:", playAgain: "Play again", backToGames: "Back to games",
      trackAlt: "Horse race track", horseAlt: "Horse", finish: "Finish!", enterFullscreen: "Full screen",
      exitFullscreen: "Exit full screen", openFailed: "Could not open the game",
      reopenFromHistory: "Open the game again from this section’s history or create a new one.",
      generating: "Creating the game", serverStatus: "Work continues on the server. You can close this page.",
      loadFailed: "Could not load the game",
      genericError: "Could not reach the service. Wait a moment and try again.",
      unavailable: "This game is no longer available. Open another game in Horse Race Quiz or create a new one.",
      wrongMaterial: "This is a different material", selectGame: "Select a game in Horse Race Quiz.",
      createFailed: "Could not create the game",
      refundedRetry: "Your coins were refunded. Check the settings and try again.",
      incomplete: "The game was not saved completely",
      createNew: "Create a new game. If there is an issue with your coins, contact support.",
    },
  },
  ky: {
    essay: { introduction: "Киришүү", body: "Негизги бөлүк", conclusion: "Корутунду" },
    article: { abstract: "Аннотация", keywords: "Ачкыч сөздөр", conclusion: "Корутунду", references: "Адабияттар тизмеси" },
    classHour: { title: "Класстык саат" },
    comic: { script: "Сценарий", panel: "Кадр" },
    quiz: {
      quizTitle: "Тесттин аталышы", quizTitlePlaceholder: "Тесттин аталышын киргизиңиз", questionNumber: "Суроо",
      question: "Суроонун тексти", options: "Жооп варианттары", correctAnswer: "Туура жооп",
      explanation: "Түшүндүрмө", editHint: "Түзөтүү үчүн басыңыз", singleChoice: "Бир жоопту тандоо",
      multipleChoice: "Бир нече жоопту тандоо", trueFalse: "Туура / Туура эмес", openQuestion: "Ачык суроо",
    },
    exam: {
      scoreIndicator: "Упайлар", scoreMismatch: "Упайлардын суммасы берилген мааниге дал келбейт",
      valid: "туура", invalid: "дал келбейт",
      taskNumber: "Тапшырма", score: "Упай", descriptor: "Дескриптор", imagePlaceholder: "Сүрөт үчүн орун",
      multipleChoice: "Жоопту тандоо", matching: "Дал келтирүү", trueFalse: "Туура / Туура эмес", textOpen: "Ачык суроо",
      fillInBlank: "Бош орундарды толтуруу", question: "Суроо", options: "Варианттар", instruction: "Нускама", pairs: "Жуптар",
      leftColumn: "Сол тилке", rightColumn: "Оң тилке", statement: "Билдирүү", trueFalseChoice: "Туура / Туура эмес",
      fillBlanks: "Бош орундарды толтуруңуз", answers: "Жооптор",
    },
    lessonPlan: {
      title: "Кыска мөөнөттүү план", sectionName: "Бөлүм", subject: "Предмет", teacherName: "Мугалимдин аты-жөнү",
      date: "Күнү", grade: "Класс", studentsPresent: "Катышкандар", studentsAbsent: "Катышпагандар", topic: "Сабактын темасы",
      learningObjectives: "Окуу максаттары", lessonObjectives: "Сабактын максаты", stage: "Сабактын этабы / Убакыт",
      teacherActivity: "Мугалимдин аракеттери", studentActivity: "Окуучунун аракеттери", assessment: "Баалоо",
      resources: "Ресурстар", neuroExercise: "Нейрокөнүгүү",
    },
    worksheet: { answers: "Жооптор", answersHint: "Жооптор окуучунун иш барагына басылбайт.", answerFileSuffix: "жооптор" },
    cyclogram: {
      documentTitle: "Бала бакчанын циклограммасы", organization: "Уюм", group: "Топ", age: "Жаш тобу", years: "жаш",
      teacher: "Тарбиячы", week: "Апта", theme: "Аптанын темасы", sectionLabel: "Бөлүм", version: "Версия",
      regulatory: "Мектепке чейинки тарбия жана билим берүү талаптарына ылайык",
    },
    scientificProject: {
      hypothesis: "Божомол", object: "Изилдөө объектиси", subject: "Изилдөө предмети", methods: "Изилдөө ыкмалары",
      scientificNovelty: "Илимий жаңылык", practicalSignificance: "Практикалык мааниси", chapter: "Бөлүм",
      subsections: "Бөлүмчөлөр", titlePage: "Титулдук барак", annotation: "Аннотация", introduction: "Киришүү",
      chapterTheory: "Теориялык бөлүм", chapterResearch: "Изилдөө бөлүмү", conclusion: "Корутунду",
      references: "Адабияттар тизмеси", appendix: "Тиркеме",
    },
    race: {
      team: "Команда", questionsEnded: "Суроолор бүттү", blocked: "Бөгөттөлдү", progress: "Илгерилөө",
      victory: "Жеңиш!", winner: "Жеңүүчү:", playAgain: "Кайра ойноо", backToGames: "Оюндарга кайтуу",
      trackAlt: "Ат чабыш жолу", horseAlt: "Ат", finish: "Мара!", enterFullscreen: "Толук экран",
      exitFullscreen: "Толук экрандан чыгуу", openFailed: "Оюнду ачуу мүмкүн болгон жок",
      reopenFromHistory: "Оюнду бөлүмдүн тарыхынан кайра ачыңыз же жаңысын түзүңүз.",
      generating: "Оюн түзүлүп жатат", serverStatus: "Жумуш серверде уланат. Бул баракты жаба аласыз.",
      loadFailed: "Оюнду жүктөө мүмкүн болгон жок",
      genericError: "Кызмат менен байланышуу мүмкүн болгон жок. Бир аз күтүп, кайра аракет кылыңыз.",
      unavailable: "Бул оюн мындан ары жеткиликтүү эмес. «Ат жарыш» бөлүмүнөн башка оюнду ачыңыз же жаңысын түзүңүз.",
      wrongMaterial: "Бул башка материал", selectGame: "«Ат жарыш» бөлүмүнөн оюнду тандаңыз.",
      createFailed: "Оюнду түзүү мүмкүн болгон жок",
      refundedRetry: "Монеталар кайтарылды. Жөндөөлөрдү текшерип, кайра аракет кылыңыз.",
      incomplete: "Оюн толук сакталган жок",
      createNew: "Жаңы оюн түзүңүз. Монеталар боюнча маселе болсо, колдоо кызматына кайрылыңыз.",
    },
  },
  uz: {
    essay: { introduction: "Kirish", body: "Asosiy qism", conclusion: "Xulosa" },
    article: { abstract: "Annotatsiya", keywords: "Kalit so‘zlar", conclusion: "Xulosa", references: "Foydalanilgan adabiyotlar" },
    classHour: { title: "Sinf soati" },
    comic: { script: "Ssenariy", panel: "Kadr" },
    quiz: {
      quizTitle: "Test nomi", quizTitlePlaceholder: "Test nomini kiriting", questionNumber: "Savol",
      question: "Savol matni", options: "Javob variantlari", correctAnswer: "To‘g‘ri javob",
      explanation: "Izoh", editHint: "Tahrirlash uchun bosing", singleChoice: "Bitta javobni tanlash",
      multipleChoice: "Bir nechta javobni tanlash", trueFalse: "To‘g‘ri / Noto‘g‘ri", openQuestion: "Ochiq savol",
    },
    exam: {
      scoreIndicator: "Ballar", scoreMismatch: "Ballar yig‘indisi belgilangan qiymatga mos emas",
      valid: "to‘g‘ri", invalid: "mos emas",
      taskNumber: "Topshiriq", score: "Ball", descriptor: "Deskriptor", imagePlaceholder: "Rasm uchun joy",
      multipleChoice: "Javobni tanlash", matching: "Moslashtirish", trueFalse: "To‘g‘ri / Noto‘g‘ri", textOpen: "Ochiq savol",
      fillInBlank: "Bo‘sh joylarni to‘ldirish", question: "Savol", options: "Variantlar", instruction: "Ko‘rsatma", pairs: "Juftliklar",
      leftColumn: "Chap ustun", rightColumn: "O‘ng ustun", statement: "Bayonot", trueFalseChoice: "To‘g‘ri / Noto‘g‘ri",
      fillBlanks: "Bo‘sh joylarni to‘ldiring", answers: "Javoblar",
    },
    lessonPlan: {
      title: "Qisqa muddatli reja", sectionName: "Bo‘lim", subject: "Fan", teacherName: "O‘qituvchining F.I.Sh.",
      date: "Sana", grade: "Sinf", studentsPresent: "Qatnashganlar", studentsAbsent: "Qatnashmaganlar", topic: "Dars mavzusi",
      learningObjectives: "Ta’lim maqsadlari", lessonObjectives: "Dars maqsadi", stage: "Dars bosqichi / Vaqt",
      teacherActivity: "O‘qituvchi harakatlari", studentActivity: "O‘quvchi harakatlari", assessment: "Baholash",
      resources: "Resurslar", neuroExercise: "Neyromashq",
    },
    worksheet: { answers: "Javoblar", answersHint: "Javoblar o‘quvchi ish varag‘ida chop etilmaydi.", answerFileSuffix: "javoblar" },
    cyclogram: {
      documentTitle: "Bolalar bog‘chasi siklogrammasi", organization: "Tashkilot", group: "Guruh", age: "Yosh guruhi", years: "yosh",
      teacher: "Tarbiyachi", week: "Hafta", theme: "Hafta mavzusi", sectionLabel: "Bo‘lim", version: "Versiya",
      regulatory: "Maktabgacha tarbiya va ta’lim talablariga muvofiq",
    },
    scientificProject: {
      hypothesis: "Gipoteza", object: "Tadqiqot obyekti", subject: "Tadqiqot predmeti", methods: "Tadqiqot usullari",
      scientificNovelty: "Ilmiy yangilik", practicalSignificance: "Amaliy ahamiyati", chapter: "Bob",
      subsections: "Bo‘limlar", titlePage: "Titul sahifasi", annotation: "Annotatsiya", introduction: "Kirish",
      chapterTheory: "Nazariy bob", chapterResearch: "Tadqiqot bobi", conclusion: "Xulosa",
      references: "Foydalanilgan adabiyotlar", appendix: "Ilova",
    },
    race: {
      team: "Jamoa", questionsEnded: "Savollar tugadi", blocked: "Bloklangan", progress: "Jarayon",
      victory: "G‘alaba!", winner: "G‘olib:", playAgain: "Qayta o‘ynash", backToGames: "O‘yinlarga qaytish",
      trackAlt: "Ot poygasi yo‘lagi", horseAlt: "Ot", finish: "Marra!", enterFullscreen: "To‘liq ekran",
      exitFullscreen: "To‘liq ekrandan chiqish", openFailed: "O‘yinni ochib bo‘lmadi",
      reopenFromHistory: "O‘yinni bo‘lim tarixidan qayta oching yoki yangisini yarating.",
      generating: "O‘yin yaratilmoqda", serverStatus: "Ish serverda davom etadi. Bu sahifani yopishingiz mumkin.",
      loadFailed: "O‘yinni yuklab bo‘lmadi",
      genericError: "Xizmat bilan bog‘lanib bo‘lmadi. Biroz kutib, qayta urinib ko‘ring.",
      unavailable: "Bu o‘yin endi mavjud emas. «Ot poygasi» bo‘limidan boshqa o‘yinni oching yoki yangisini yarating.",
      wrongMaterial: "Bu boshqa material", selectGame: "«Ot poygasi» bo‘limidan o‘yinni tanlang.",
      createFailed: "O‘yinni yaratib bo‘lmadi",
      refundedRetry: "Tangalar qaytarildi. Sozlamalarni tekshirib, qayta urinib ko‘ring.",
      incomplete: "O‘yin to‘liq saqlanmagan",
      createNew: "Yangi o‘yin yarating. Tangalar bilan muammo bo‘lsa, yordam xizmatiga yozing.",
    },
  },
} satisfies Record<ContentLanguage, GeneratedContentCopy>;


export function generatedContentCopy(language: ContentLanguage): GeneratedContentCopy {
  return GENERATED_CONTENT_COPY[language];
}
