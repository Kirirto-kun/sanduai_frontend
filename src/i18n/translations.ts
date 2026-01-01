export type Language = "ru" | "kk";

type HeroTexts = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  emailPlaceholder: string;
};

type Feature = {
  title: string;
  description: string;
};

type Step = {
  title: string;
  items: string[];
};

type Translations = {
  hero: HeroTexts;
  featuresSection: {
    title: string;
    subtitle: string;
    features: Feature[];
  };
  librarySection: {
    title: string;
    subtitle: string;
    items: Feature[];
  };
  mediaSection: {
    title: string;
    subtitle: string;
    items: Feature[];
  };
  benefitsSection: {
    title: string;
    subtitle: string;
    items: string[];
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      phoneLabel: string;
      passwordLabel: string;
      submit: string;
      switchText: string;
    };
    register: {
      title: string;
      subtitle: string;
      phoneLabel: string;
      emailLabel: string;
      passwordLabel: string;
      fullNameLabel: string;
      submit: string;
      switchText: string;
    };
    profile: {
      title: string;
      subtitle: string;
      logout: string;
      name: string;
      email: string;
      phone: string;
    };
    errors: {
      required: string;
      invalidEmail: string;
      shortPassword: string;
      generic: string;
    };
    loading: string;
  };
  kmzh: {
    title: string;
    subtitle: string;
    form: {
      subject: string;
      grade: string;
      period: string;
      hoursTotal: string;
      teacherName: string;
      userInput: string;
      generate: string;
    };
    lessonsTitle: string;
    addLesson: string;
    downloadDocx: string;
    noLessons: string;
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  dashboard: {
    search: string;
    searchPlaceholder: string;
    menu: {
      home: string;
      aiGeneration: string;
      aiGenerationItems: {
        kmzh: string;
        essay: string;
        article: string;
        bjbTjb: string;
        scientificProjects: string;
        classHours: string;
        worksheets: string;
        kindergarten: string;
        tests: string;
        games: string;
        presentations: string;
      };
      library: string;
      libraryItems: {
        courses: string;
        visualAids: string;
        presentations: string;
        games: string;
        sketchHub: string;
        simulations: string;
      };
      media: string;
      mediaItems: {
        photo: string;
        video: string;
        avatar: string;
        voiceover: string;
      };
      profile: string;
      settings: string;
    };
    header: {
      title: string;
      subtitle: string;
      logout: string;
    };
    home: {
      title: string;
      quickLinks: string;
      cards: {
        kmzh: string;
        aiDocs: string;
        library: string;
        media: string;
        profile: string;
      };
    };
  };
  essay: {
    form: {
      title: string;
      topic: string;
      language: string;
      grade: string;
      wordCount: string;
      type: string;
      generate: string;
    };
    types: {
      argumentative: string;
      descriptive: string;
      narrative: string;
    };
    results: {
      plan: string;
      content: string;
      applyGeneral: string;
      applyInline: string;
      targetText: string;
      instruction: string;
      generalInstruction: string;
      apply: string;
      export: string;
      addRevision: string;
      selectedText: string;
      whatToChange: string;
      applyAllRevisions: string;
      revision: string;
      delete: string;
      cancel: string;
      pendingRevisions: string;
      noRevisions: string;
      editBlock: string;
      saveBlock: string;
      sectionTypes: {
        introduction: string;
        body: string;
        conclusion: string;
      };
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  article: {
    form: {
      title: string;
      topic: string;
      language: string;
      authorName: string;
      authorRole: string;
      genre: string;
      customGenre: string;
      additionalContext: string;
      generate: string;
    };
    genres: {
      scientific: string;
      publicistic: string;
      custom: string;
    };
    results: {
      meta: string;
      abstract: string;
      keywords: string;
      sections: string;
      conclusion: string;
      references: string;
      addRevision: string;
      selectedText: string;
      whatToChange: string;
      applyAllRevisions: string;
      revision: string;
      delete: string;
      cancel: string;
      pendingRevisions: string;
      noRevisions: string;
      editBlock: string;
      saveBlock: string;
      export: string;
      generalInstruction: string;
      instruction: string;
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  exam: {
    form: {
      title: string;
      examType: string;
      subject: string;
      grade: string;
      topic: string;
      learningObjectives: string;
      addObjective: string;
      totalScore: string;
      language: string;
      generate: string;
    };
    types: {
      bjb: string;
      tjb: string;
    };
    results: {
      scoreIndicator: string;
      currentTotal: string;
      targetTotal: string;
      valid: string;
      invalid: string;
      warning: string;
      taskNumber: string;
      score: string;
      descriptor: string;
      imagePlaceholder: string;
      exportStudent: string;
      exportTeacher: string;
    };
    widgets: {
      multipleChoice: string;
      matching: string;
      trueFalse: string;
      textOpen: string;
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  lessonPlan: {
    form: {
      title: string;
      subject: string;
      grade: string;
      topic: string;
      teacherName: string;
      sectionName: string;
      lessonNumber: string;
      learningObjectives: string;
      addObjective: string;
      date: string;
      generate: string;
    };
    meta: {
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
      addObjective: string;
      removeObjective: string;
    };
    table: {
      stage: string;
      time: string;
      teacherActivity: string;
      studentActivity: string;
      assessment: string;
      resources: string;
      workType: string;
      methodName: string;
    };
    stages: {
      beginning: string;
      middle: string;
      end: string;
      neuroExercise: string;
    };
    workTypes: {
      individual: string;
      group: string;
    };
    actions: {
      download: string;
      createNew: string;
      addDescriptor: string;
      removeDescriptor: string;
      addTask: string;
      edit: string;
      save: string;
      cancel: string;
    };
    errors: {
      required: string;
      lessonNumberMin: string;
      objectivesMin: string;
      auth: string;
      generic: string;
      flowStagesRequired: string;
      taskMinRequired: string;
    };
    loading: string;
    validation: {
      allFieldsRequired: string;
      lessonNumberPositive: string;
      objectivesRequired: string;
    };
  };
  classHour: {
    form: {
      title: string;
      language: string;
      topic: string;
      grade: string;
      value: string;
      valuePlaceholder: string;
      format: string;
      formatPlaceholder: string;
      wishes: string;
      wishesPlaceholder: string;
      generate: string;
    };
    results: {
      title: string;
      regenerateBlock: string;
      editBlock: string;
      instructionPlaceholder: string;
      regenerateButton: string;
      cancel: string;
      export: string;
      createNew: string;
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
    regenerating: string;
  };
  quiz: {
    form: {
      title: string;
      modeTab: {
        topic: string;
        text: string;
      };
      subject: string;
      grade: string;
      topic: string;
      contextText: string;
      contextTextPlaceholder: string;
      contextTextLimit: string;
      language: string;
      questionCount: string;
      difficulty: string;
      difficultyOptions: {
        easy: string;
        medium: string;
        hard: string;
      };
      questionTypes: string;
      questionTypeOptions: {
        single_choice: string;
        multiple_choice: string;
        true_false: string;
        open: string;
      };
      generate: string;
    };
    results: {
      title: string;
      quizTitle: string;
      quizTitlePlaceholder: string;
      questionNumber: string;
      question: string;
      options: string;
      correctAnswer: string;
      explanation: string;
      addQuestion: string;
      removeQuestion: string;
      export: string;
      createNew: string;
    };
    questionTypeLabels: {
      single_choice: string;
      multiple_choice: string;
      true_false: string;
      open: string;
    };
    errors: {
      required: string;
      questionCountRange: string;
      contextTextTooLong: string;
      questionTypesRequired: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  voiceover: {
    title: string;
    placeholder: string;
    voiceLabel: string;
    voices: {
      alloy: string;
      echo: string;
      fable: string;
      onyx: string;
      nova: string;
      shimmer: string;
    };
    generate: string;
    result: string;
    download: string;
    errors: {
      required: string;
      tooLong: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  scientificProject: {
    form: {
      title: string;
      subject: string;
      topic: string;
      grade: string;
      language: string;
      userComment: string;
      userCommentPlaceholder: string;
      generate: string;
    };
    results: {
      title: string;
      topic: string;
      abstract: string;
      introduction: string;
      mainPart: string;
      conclusion: string;
      references: string;
      export: string;
      createNew: string;
      editBlock: string;
      saveBlock: string;
      cancel: string;
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
  worksheet: {
    form: {
      title: string;
      subject: string;
      topic: string;
      grade: string;
      language: string;
      taskTypes: string;
      userComment: string;
      userCommentPlaceholder: string;
      generate: string;
    };
    taskTypeLabels: {
      multiple_choice: string;
      fill_in_blank: string;
      matching: string;
      open_question: string;
    };
    results: {
      title: string;
      multipleChoice: string;
      fillInBlank: string;
      matching: string;
      openQuestion: string;
      export: string;
      createNew: string;
      editBlock: string;
      saveBlock: string;
      cancel: string;
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
  };
    simulations: {
      title: string;
      subtitle: string;
      categories: {
        all: string;
        physics: string;
        chemistry: string;
        biology: string;
        math: string;
      };
      back: string;
      open: string;
      fullscreen: string;
    };
  footer: {
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    emailPlaceholder: string;
    rights: string;
  };
  common: {
    brand: string;
    ru: string;
    kk: string;
  };
};

export const translations: Record<Language, Translations> = {
  ru: {
    hero: {
      title: "Sandu AI — ИИ-платформа для учителей Казахстана",
      subtitle:
        "Генерация КМЖ, БЖБ, ТЖБ, эссе, рабочих листов и других документов в пару кликов. Экономьте часы подготовки и сосредоточьтесь на учениках.",
      ctaLabel: "Записаться в список ожидания",
      emailPlaceholder: "Введите ваш email",
    },
    featuresSection: {
      title: "ИИ-функции для учебной документации",
      subtitle:
        "Все основные документы педагога в одном месте. На основе ТЗ: КМЖ, ЭССЕ, МАКАЛА, БЖБ, ТЖБ, научные проекты, презентации и многое другое.",
      features: [
        {
          title: "КМЖ (Құндылыққа негізделген адал азамат)",
          description:
            "Генерация календарно-тематического плана с учётом ценностного подхода и требований программы.",
        },
        {
          title: "Эссе и статьи",
          description:
            "Структурированные ЭССЕ и МАКАЛА по заданной теме с учётом уровня класса и предмета.",
        },
        {
          title: "БЖБ и ТЖБ",
          description:
            "Создание заданий для СОР и СОЧ с разными уровнями сложности и типами заданий.",
        },
        {
          title: "Ғылыми жобалар",
          description:
            "Помощь в структурировании и написании научных проектов для школьников.",
        },
        {
          title: "Классные часы и рабочие листы",
          description:
            "Сценарии воспитательных часов и раздаточные материалы с заданиями.",
        },
        {
          title: "Балабақшаға ашық оқу іс-әрекеттері",
          description:
            "Сценарии открытых занятий для детских садов с учётом возраста детей.",
        },
        {
          title: "ИИ-тесты и игры",
          description:
            "Генерация тестов и интерактивных игр в стиле Kahoot для вовлечения учеников.",
        },
        {
          title: "Презентации с помощью ИИ",
          description:
            "Создание структурированных презентаций для уроков и выступлений с автоматической генерацией слайдов.",
        },
        {
          title: "Озвучка с помощью ИИ",
          description:
            "Подготовка материалов с голосовой озвучкой для видеоуроков и презентаций.",
        },
      ],
    },
    librarySection: {
      title: "Библиотека материалов",
      subtitle:
        "Загружайте и структурируйте свои готовые материалы. Подписчики получают к ним удобный доступ 24/7.",
      items: [
        {
          title: "Курсы",
          description: "Видео-уроки и текстовые модули по предметам и темам.",
        },
        {
          title: "Көрнекіліктер",
          description: "Наглядные пособия, плакаты, схемы и раздаточный материал.",
        },
        {
          title: "Интерактивные презентации",
          description: "Слайды и презентации для уроков и классных часов.",
        },
        {
          title: "Интерактивные игры и Скетч-Хаб",
          description:
            "Игры для вовлечения учеников и творческие материалы для уроков.",
        },
      ],
    },
    mediaSection: {
      title: "Медиа и платежи",
      subtitle:
        "Мультимедийные ИИ-функции и безопасные оплаты, встроенные в платформу.",
      items: [
        {
          title: "Генерация фото и видео",
          description:
            "Создание иллюстраций и коротких видеороликов для уроков и курсов.",
        },
        {
          title: "Цифровой аватар",
          description:
            "Оживлённый персонаж или диктор для объяснения материала.",
        },
        {
          title: "Оплата картой и Kaspi QR",
          description:
            "Эквайринг банковских карт и интеграция Kaspi QR для удобной оплаты подписки.",
        },
      ],
    },
    benefitsSection: {
      title: "Для кого Sandu AI",
      subtitle: "Платформа создаётся в первую очередь для практикующих учителей.",
      items: [
        "Учителя экономят часы на подготовке КМЖ, БЖБ, ТЖБ и рабочих листов.",
        "Администрация получает структурированную базу материалов и курсов.",
        "Удобный поиск по предметам, классам и темам.",
        "Возможность монетизации авторских курсов и материалов.",
      ],
    },
    auth: {
      login: {
        title: "Вход в аккаунт",
        subtitle: "Используйте Email или телефон и пароль, чтобы войти.",
        phoneLabel: "Email или телефон",
        passwordLabel: "Пароль",
        submit: "Войти",
        switchText: "Нет аккаунта? Зарегистрироваться",
      },
      register: {
        title: "Регистрация",
        subtitle: "Создайте учётную запись, чтобы использовать Sandu AI.",
        phoneLabel: "Телефон (необязательно)",
        emailLabel: "Email",
        passwordLabel: "Пароль",
        fullNameLabel: "Полное имя",
        submit: "Зарегистрироваться",
        switchText: "Уже есть аккаунт? Войти",
      },
      profile: {
        title: "Личный кабинет",
        subtitle: "Данные вашей учётной записи",
        logout: "Выйти",
        name: "Имя",
        email: "Email",
        phone: "Телефон",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        invalidEmail: "Неверный формат email.",
        shortPassword: "Пароль должен быть не короче 6 символов.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Загрузка...",
    },
    kmzh: {
      title: "Генерация КМЖ",
      subtitle:
        "Получите план уроков от AI, при необходимости поправьте строки и скачайте DOCX.",
      form: {
        subject: "Предмет",
        grade: "Класс",
        period: "Период/четверть",
        hoursTotal: "Всего часов",
        teacherName: "Имя учителя",
        userInput: "Доп. темы или пожелания",
        generate: "Сгенерировать план",
      },
      lessonsTitle: "Список уроков",
      addLesson: "Добавить урок",
      downloadDocx: "Скачать DOCX",
      noLessons: "Пока нет уроков. Сначала сгенерируйте план.",
      errors: {
        required: "Заполните обязательные поля и попробуйте снова.",
        auth: "Авторизуйтесь, чтобы сгенерировать КМЖ.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Идёт генерация (10–30 секунд)...",
    },
    dashboard: {
      search: "Поиск",
      searchPlaceholder: "Поиск по функциям...",
      menu: {
        home: "Главная",
        aiGeneration: "ИИ-генерация",
        aiGenerationItems: {
          kmzh: "КМЖ",
          essay: "Эссе",
          article: "Макала (Статьи)",
          bjbTjb: "БЖБ/ТЖБ (СОР/СОЧ)",
          scientificProjects: "Научные проекты",
          classHours: "Классные часы",
          worksheets: "Рабочие листы",
          kindergarten: "Детский сад",
          tests: "ИИ тесты",
          games: "Игры (Kahoot)",
          presentations: "Презентации ИИ",
        },
        library: "Библиотека",
        libraryItems: {
          courses: "Курсы",
          visualAids: "Наглядные пособия",
          presentations: "Интерактивные презентации",
          games: "Интерактивные игры",
          sketchHub: "Скетч-Хаб",
          simulations: "PhET Симуляции",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Генерация фото",
          video: "Генерация видео",
          avatar: "Цифровой аватар",
          voiceover: "Озвучка ИИ",
        },
        profile: "Профиль",
        settings: "Настройки",
      },
      header: {
        title: "Панель управления",
        subtitle: "Быстрый доступ ко всем функциям Sandu AI",
        logout: "Выйти",
      },
      home: {
        title: "Обзор",
        quickLinks: "Быстрые ссылки",
        cards: {
          kmzh: "Сгенерировать КМЖ и скачать DOCX",
          aiDocs: "Эссе, БЖБ, ТЖБ, презентации и др.",
          library: "Материалы: курсы, наглядные пособия, игры",
          media: "Фото/видео/аватар, Kaspi QR и карты",
          profile: "Профиль и настройки учётной записи",
        },
      },
    },
    essay: {
      form: {
        title: "Эссе",
        topic: "Тема",
        language: "Язык",
        grade: "Класс",
        wordCount: "Объём (слов)",
        type: "Тип эссе",
        generate: "Сгенерировать эссе",
      },
      types: {
        argumentative: "Аргументативное",
        descriptive: "Описательное",
        narrative: "Повествовательное",
      },
      results: {
        plan: "План",
        content: "Текст",
        applyGeneral: "Общая правка",
        applyInline: "Точечная правка",
        targetText: "Что исправить",
        instruction: "Инструкция",
        generalInstruction: "Инструкция для всего текста",
        apply: "Применить",
        export: "Скачать DOCX",
        addRevision: "Добавить правку",
        selectedText: "Выделенный текст",
        whatToChange: "Что изменить?",
        applyAllRevisions: "Применить все правки",
        revision: "Правка",
        delete: "Удалить",
        cancel: "Отмена",
        pendingRevisions: "Накопленные правки",
        noRevisions: "Выделите текст в блоке и добавьте правку",
        editBlock: "Редактировать блок",
        saveBlock: "Сохранить",
        sectionTypes: {
          introduction: "Введение",
          body: "Основная часть",
          conclusion: "Заключение",
        },
      },
      errors: {
        required: "Заполните обязательные поля и попробуйте снова.",
        auth: "Авторизуйтесь, чтобы сгенерировать эссе.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Идёт генерация (15–40 секунд)...",
    },
    article: {
      form: {
        title: "Статья (Мақала)",
        topic: "Тема статьи",
        language: "Язык",
        authorName: "Имя автора",
        authorRole: "Должность автора",
        genre: "Тип статьи",
        customGenre: "Опишите тип статьи",
        additionalContext: "Дополнительная информация (опционально)",
        generate: "Сгенерировать статью",
      },
      genres: {
        scientific: "Научная статья",
        publicistic: "Публицистическая статья",
        custom: "Свой вариант",
      },
      results: {
        meta: "Метаданные",
        abstract: "Аннотация",
        keywords: "Ключевые слова",
        sections: "Разделы",
        conclusion: "Заключение",
        references: "Список литературы",
        addRevision: "Добавить правку",
        selectedText: "Выделенный текст",
        whatToChange: "Что изменить?",
        applyAllRevisions: "Применить все правки",
        revision: "Правка",
        delete: "Удалить",
        cancel: "Отмена",
        pendingRevisions: "Накопленные правки",
        noRevisions: "Выделите текст в разделе и добавьте правку",
        editBlock: "Редактировать раздел",
        saveBlock: "Сохранить",
        export: "Скачать DOCX",
        generalInstruction: "Общая инструкция для всей статьи",
        instruction: "Инструкция",
      },
      errors: {
        required: "Заполните обязательные поля и попробуйте снова.",
        auth: "Авторизуйтесь, чтобы сгенерировать статью.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Идёт генерация (15–40 секунд)...",
    },
    exam: {
      form: {
        title: "БЖБ/ТЖБ (СОР/СОЧ)",
        examType: "Тип работы",
        subject: "Предмет",
        grade: "Класс",
        topic: "Тема",
        learningObjectives: "Цели обучения",
        addObjective: "Добавить цель",
        totalScore: "Общий балл",
        language: "Язык",
        generate: "Сгенерировать",
      },
      types: {
        bjb: "БЖБ (СОР)",
        tjb: "ТЖБ (СОЧ)",
      },
      results: {
        scoreIndicator: "Баллы",
        currentTotal: "Текущая сумма",
        targetTotal: "Целевая сумма",
        valid: "✅",
        invalid: "❌",
        warning: "Сумма баллов не совпадает с заданной. Проверьте баллы каждого задания.",
        taskNumber: "Задание",
        score: "Балл",
        descriptor: "Дескриптор",
        imagePlaceholder: "🖼️ Место для изображения",
        exportStudent: "Скачать для ученика",
        exportTeacher: "Скачать для учителя",
      },
      widgets: {
        multipleChoice: "Множественный выбор",
        matching: "Сопоставление",
        trueFalse: "Верно/Неверно",
        textOpen: "Открытый вопрос",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        auth: "Авторизуйтесь, чтобы сгенерировать экзамен.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Идёт генерация (20–50 секунд)...",
    },
    lessonPlan: {
      form: {
        title: "КМЖ - Краткосрочное планирование урока",
        subject: "Предмет",
        grade: "Класс",
        topic: "Тема урока",
        teacherName: "ФИО учителя",
        sectionName: "Раздел",
        lessonNumber: "Номер урока",
        learningObjectives: "Цели обучения",
        addObjective: "Добавить цель",
        date: "Дата",
        generate: "Сгенерировать план урока",
      },
      meta: {
        title: "Информация об уроке",
        sectionName: "Раздел",
        subject: "Предмет",
        teacherName: "ФИО учителя",
        date: "Дата",
        grade: "Класс",
        studentsPresent: "Присутствующие",
        studentsAbsent: "Отсутствующие",
        topic: "Тема урока",
        learningObjectives: "Цели обучения",
        lessonObjectives: "Задачи урока",
        addObjective: "Добавить задачу",
        removeObjective: "Удалить",
      },
      table: {
        stage: "Этап урока",
        time: "Время",
        teacherActivity: "Действия педагога",
        studentActivity: "Действия учеников",
        assessment: "Оценивание",
        resources: "Ресурсы",
        workType: "Тип работы",
        methodName: "Метод",
      },
      stages: {
        beginning: "Начало урока",
        middle: "Середина урока",
        end: "Конец урока",
        neuroExercise: "Нейроупражнение",
      },
      workTypes: {
        individual: "ЖЖ",
        group: "ТЖ",
      },
      actions: {
        download: "Скачать DOCX",
        createNew: "Создать новый план",
        addDescriptor: "Добавить дескриптор",
        removeDescriptor: "Удалить",
        addTask: "Добавить задание",
        edit: "Редактировать",
        save: "Сохранить",
        cancel: "Отмена",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        lessonNumberMin: "Номер урока должен быть больше 0.",
        objectivesMin: "Добавьте хотя бы одну цель обучения.",
        auth: "Авторизуйтесь, чтобы создать план урока.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
        flowStagesRequired: "План должен содержать ровно 3 этапа.",
        taskMinRequired: "Каждый этап должен содержать минимум 1 задание.",
      },
      loading: "Создание плана урока (это может занять 20-50 секунд)...",
      validation: {
        allFieldsRequired: "Все обязательные поля должны быть заполнены.",
        lessonNumberPositive: "Номер урока должен быть положительным числом.",
        objectivesRequired: "Необходимо указать минимум одну цель обучения.",
      },
    },
    classHour: {
      form: {
        title: "Классный час (Сынып сағаты)",
        language: "Язык сценария",
        topic: "Тема классного часа",
        grade: "Класс",
        value: "Ценность",
        valuePlaceholder: "Например: Отан, Отбасы, Денсаулық...",
        format: "Формат",
        formatPlaceholder: "Например: Дискуссия, Тренинг, Викторина...",
        wishes: "Дополнительные пожелания (необязательно)",
        wishesPlaceholder: "Например: Включи видео про Астану",
        generate: "Сгенерировать сценарий",
      },
      results: {
        title: "Сценарий классного часа",
        regenerateBlock: "Регенерировать блок",
        editBlock: "Редактировать",
        instructionPlaceholder: "Что изменить? (необязательно)",
        regenerateButton: "Регенерировать",
        cancel: "Отмена",
        export: "Скачать DOCX",
        createNew: "Создать новый сценарий",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        auth: "Авторизуйтесь для генерации сценария.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Генерация сценария (20–50 секунд)...",
      regenerating: "Регенерация блока...",
    },
    quiz: {
      form: {
        title: "Тест генератор (Quiz)",
        modeTab: {
          topic: "По теме",
          text: "По тексту",
        },
        subject: "Предмет",
        grade: "Класс",
        topic: "Тема",
        contextText: "Контекстный текст",
        contextTextPlaceholder: "Вставьте текст, по которому нужно создать тест (до 10000 символов)...",
        contextTextLimit: "символов",
        language: "Язык теста",
        questionCount: "Количество вопросов",
        difficulty: "Сложность",
        difficultyOptions: {
          easy: "Легко",
          medium: "Средне",
          hard: "Сложно",
        },
        questionTypes: "Типы вопросов",
        questionTypeOptions: {
          single_choice: "Один верный (Single Choice)",
          multiple_choice: "Несколько верных (Multiple Choice)",
          true_false: "Правда/Ложь (True/False)",
          open: "Открытый вопрос (Open)",
        },
        generate: "Сгенерировать тест",
      },
      results: {
        title: "Сгенерированный тест",
        quizTitle: "Название теста",
        quizTitlePlaceholder: "Введите название теста для экспорта",
        questionNumber: "Вопрос",
        question: "Вопрос",
        options: "Варианты ответов",
        correctAnswer: "Правильный ответ",
        explanation: "Объяснение",
        addQuestion: "Добавить вопрос",
        removeQuestion: "Удалить вопрос",
        export: "Скачать ZIP (2 варианта + ключи)",
        createNew: "Создать новый тест",
      },
      questionTypeLabels: {
        single_choice: "Один верный",
        multiple_choice: "Несколько верных",
        true_false: "Правда/Ложь",
        open: "Открытый",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        questionCountRange: "Количество вопросов должно быть от 5 до 20.",
        contextTextTooLong: "Текст не должен превышать 10000 символов.",
        questionTypesRequired: "Выберите хотя бы один тип вопроса.",
        auth: "Авторизуйтесь для генерации теста.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Генерация теста (20–50 секунд)...",
    },
    voiceover: {
      title: "Озвучка при помощи ИИ",
      placeholder: "Введите текст для озвучки (на казахском или русском)...",
      voiceLabel: "Выберите голос",
      voices: {
        alloy: "Арайлым (Женский)",
        echo: "Арман (Мужской)",
        fable: "Данияр (Мужской)",
        onyx: "Олжас (Мужской)",
        nova: "Жанар (Женский)",
        shimmer: "Айгерім (Женский)",
      },
      generate: "Генерировать",
      result: "Результат озвучки",
      download: "Скачать MP3",
      errors: {
        required: "Введите текст для озвучки.",
        tooLong: "Текст слишком длинный (максимум 4096 символов).",
        auth: "Авторизуйтесь для использования озвучки.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Генерирую аудио...",
    },
    scientificProject: {
      form: {
        title: "Научный проект",
        subject: "Предмет",
        topic: "Тема",
        grade: "Класс",
        language: "Язык проекта",
        userComment: "Факты / Комментарии (для практической части)",
        userCommentPlaceholder: "Например: Мы выращивали плесень 10 дней в темном шкафу и на солнце...",
        generate: "Сгенерировать проект",
      },
      results: {
        title: "Результат генерации",
        topic: "Тема проекта",
        abstract: "Аннотация",
        introduction: "Введение",
        mainPart: "Основная часть",
        conclusion: "Заключение",
        references: "Список литературы",
        export: "Скачать DOCX",
        createNew: "Создать новый проект",
        editBlock: "Редактировать",
        saveBlock: "Сохранить",
        cancel: "Отмена",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        auth: "Авторизуйтесь для генерации проекта.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Пишу научную работу (30-60 секунд)...",
    },
    worksheet: {
      form: {
        title: "Рабочие листы",
        subject: "Предмет",
        topic: "Тема",
        grade: "Класс",
        language: "Язык",
        taskTypes: "Типы заданий",
        userComment: "Комментарий для ИИ (опционально)",
        userCommentPlaceholder: "Например: Сделай акцент на глаголах действия...",
        generate: "Сгенерировать рабочий лист",
      },
      taskTypeLabels: {
        multiple_choice: "Тесты (Multiple Choice)",
        fill_in_blank: "Заполнение пропусков",
        matching: "Соотнесение (Matching)",
        open_question: "Открытые вопросы",
      },
      results: {
        title: "Результат генерации",
        multipleChoice: "Тесты",
        fillInBlank: "Заполнение пропусков",
        matching: "Соотнесение",
        openQuestion: "Открытые вопросы",
        export: "Скачать DOCX",
        createNew: "Создать новый",
        editBlock: "Редактировать",
        saveBlock: "Сохранить",
        cancel: "Отмена",
      },
      errors: {
        required: "Заполните все обязательные поля.",
        auth: "Авторизуйтесь для генерации рабочего листа.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Создаю рабочий лист (20-40 секунд)...",
    },
    simulations: {
      title: "Интерактивные симуляции PhET",
      subtitle: "Бесплатные интерактивные симуляции по физике, химии, биологии и математике.",
      categories: {
        all: "Все",
        physics: "Физика",
        chemistry: "Химия",
        biology: "Биология",
        math: "Математика",
      },
      back: "Назад к списку",
      open: "Открыть симуляцию",
      fullscreen: "На весь экран",
    },
    footer: {
      ctaTitle: "Присоединиться к запуску Sandu AI",
      ctaSubtitle:
        "Оставьте email, чтобы первыми получить доступ к платформе для учителей.",
      ctaButton: "Записаться в список ожидания",
      emailPlaceholder: "Ваш email",
      rights: "Sandu AI. Все права защищены.",
    },
    common: {
      brand: "Sandu AI",
      ru: "Русский",
      kk: "Қазақша",
    },
  },
  kk: {
    hero: {
      title: "Sandu AI — Қазақстан мұғалімдеріне арналған ИИ-платформа",
      subtitle:
        "КҮНТІЗБЕЛІК-ТАҚЫРЫПТЫҚ ЖОСПАР, БЖБ, ТЖБ, эссе, жұмыс парақтары және басқа құжаттарды бірнеше минутта жасаңыз.",
      ctaLabel: "Күту тізіміне жазылу",
      emailPlaceholder: "Email жазыңыз",
    },
    featuresSection: {
      title: "ИИ-мәтін генерациясы",
      subtitle:
        "Мұғалімге керек негізгі құжаттардың барлығы бір жерде. ТЗ негізінде: КМЖ, эссе, мақала, БЖБ, ТЖБ, ғылыми жобалар, презентациялар және т.б.",
      features: [
        {
          title: "КМЖ (Құндылыққа негізделген адал азамат)",
          description:
            "Бағдарлама талаптарына сай құндылыққа бағытталған күнтізбелік-тақырыптық жоспар.",
        },
        {
          title: "Эссе және мақалалар",
          description:
            "Сынып деңгейі мен пәніне сай құрылымдалған эссе және мақалалар.",
        },
        {
          title: "БЖБ және ТЖБ",
          description:
            "СОР және СОЧ үшін әртүрлі деңгейдегі тапсырмалар жиынтығы.",
        },
        {
          title: "Ғылыми жобалар",
          description:
            "Оқушылардың ғылыми жобаларын құрылымдауға және жазуға көмек.",
        },
        {
          title: "Сынып сағаттары және жұмыс парақтары",
          description:
            "Тәрбиелік сабақ сценарийлері және тапсырмалары бар жұмыс парақтары.",
        },
        {
          title: "Балабақшаға ашық оқу іс-әрекеттері",
          description:
            "Мектепке дейінгі ұйымдарға арналған ашық сабақ сценарийлері.",
        },
        {
          title: "ИИ-тесттер және ойындар",
          description:
            "Kahoot стиліндегі интерактивті ойындар мен тесттер генерациясы.",
        },
        {
          title: "ИИ-презентациялар",
          description:
            "Сабақтар мен баяндамаларға арналған құрылымдалған презентацияларды слайдтар түрінде генерациялау.",
        },
        {
          title: "ИИ-дауыс",
          description:
            "Видеосабақтар мен презентациялар үшін мәтінді дауысқа айналдыру.",
        },
      ],
    },
    librarySection: {
      title: "Материалдар кітапханасы",
      subtitle:
        "Дайын материалдарыңызды жүктеп, реттеңіз. Подписчиктер оларға тәулік бойы қол жеткізе алады.",
      items: [
        {
          title: "Курстар",
          description: "Пәндер мен тақырыптар бойынша видео және мәтіндік курстар.",
        },
        {
          title: "Көрнекіліктер",
          description:
            "Плакаттар, сызбалар, кестелер және басқа да көрнекі материалдар.",
        },
        {
          title: "Интерактивті презентациялар",
          description: "Слайдтар мен сабақтарға арналған презентациялар.",
        },
        {
          title: "Интерактивті ойындар және Sketch Hub",
          description:
            "Оқушыларды қызықтыруға арналған ойындар мен шығармашылық материалдар.",
        },
      ],
    },
    mediaSection: {
      title: "Медиа және төлемдер",
      subtitle:
        "Платформаға кіріктірілген медиа-ИИ функциялары және қауіпсіз төлемдер.",
      items: [
        {
          title: "Фото және видео генерациясы",
          description:
            "Сабақтар мен курстарға арналған иллюстрациялар мен қысқа видеолар жасау.",
        },
        {
          title: "Цифрлық аватар",
          description:
            "Материалды түсіндіретін анимациялық кейіпкер немесе диктор.",
        },
        {
          title: "Картамен төлеу және Kaspi QR",
          description:
            "Банк карталары арқылы эквайринг және Kaspi QR интеграциясы.",
        },
      ],
    },
    benefitsSection: {
      title: "Sandu AI кімге арналған",
      subtitle:
        "Платформа ең алдымен практик мұғалімдер мен білім беру ұйымдары үшін жасалуда.",
      items: [
        "Мұғалімдер КМЖ, БЖБ, ТЖБ және жұмыс парақтарын дайындауға кететін уақытты қысқартады.",
        "Әкімшілік үшін курстар мен материалдардың құрылымдалған базасы.",
        "Пән, сынып және тақырып бойынша ыңғайлы іздеу.",
        "Авторлық курстар мен материалдарды монетизациялау мүмкіндігі.",
      ],
    },
    auth: {
      login: {
        title: "Аккаунтқа кіру",
        subtitle: "Кіру үшін Email немесе телефон және парольді қолданыңыз.",
        phoneLabel: "Email немесе телефон",
        passwordLabel: "Пароль",
        submit: "Кіру",
        switchText: "Аккаунт жоқ па? Тіркелу",
      },
      register: {
        title: "Тіркелу",
        subtitle: "Sandu AI пайдалану үшін аккаунт жасаңыз.",
        phoneLabel: "Телефон (міндетті емес)",
        emailLabel: "Email",
        passwordLabel: "Пароль",
        fullNameLabel: "Толық аты-жөні",
        submit: "Тіркелу",
        switchText: "Аккаунт бар ма? Кіру",
      },
      profile: {
        title: "Жеке кабинет",
        subtitle: "Аккаунтыңыздың деректері",
        logout: "Шығу",
        name: "Аты-жөні",
        email: "Email",
        phone: "Телефон",
      },
      errors: {
        required: "Міндетті өрістерді толтырыңыз.",
        invalidEmail: "Email форматы дұрыс емес.",
        shortPassword: "Пароль кемінде 6 таңба болуы керек.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Жүктелуде...",
    },
    kmzh: {
      title: "КМЖ генерациясы",
      subtitle:
        "AI ұсынған сабақ жоспарын алыңыз, қажет болса түзетіп, DOCX жүктеңіз.",
      form: {
        subject: "Пән",
        grade: "Сынып",
        period: "Период/тоқсан",
        hoursTotal: "Сағат саны",
        teacherName: "Мұғалімнің аты",
        userInput: "Қосымша тақырыптар немесе тілектер",
        generate: "Жоспарды генерациялау",
      },
      lessonsTitle: "Сабақтар тізімі",
      addLesson: "Сабақ қосу",
      downloadDocx: "DOCX жүктеу",
      noLessons: "Әзірше сабақтар жоқ. Алдымен жоспарды генерациялаңыз.",
      errors: {
        required: "Міндетті өрістерді толтырыңыз да, қайта көріңіз.",
        auth: "КМЖ генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Генерация жүріп жатыр (10–30 секунд)...",
    },
    dashboard: {
      search: "Іздеу",
      searchPlaceholder: "Функцияларды іздеу...",
      menu: {
        home: "Басты бет",
        aiGeneration: "ИИ-генерация",
        aiGenerationItems: {
          kmzh: "КМЖ",
          essay: "Эссе",
          article: "Мақала",
          bjbTjb: "БЖБ/ТЖБ (СОР/СОЧ)",
          scientificProjects: "Ғылыми жобалар",
          classHours: "Тәрбие сағаттары",
          worksheets: "Жұмыс парақтары",
          kindergarten: "Балабақшаға сабақтар",
          tests: "ИИ тесттер",
          games: "Ойындар (Kahoot)",
          presentations: "ИИ презентациялар",
        },
        library: "Кітапхана",
        libraryItems: {
          courses: "Курстар",
          visualAids: "Көрнекіліктер",
          presentations: "Интерактивті презентациялар",
          games: "Интерактивті ойындар",
          sketchHub: "Скетч-Хаб",
          simulations: "PhET Симуляциялары",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Фото генерациясы",
          video: "Видео генерациясы",
          avatar: "Цифрлық аватар",
          voiceover: "ИИ дыбыстау",
        },
        profile: "Профиль",
        settings: "Баптаулар",
      },
      header: {
        title: "Басқару панелі",
        subtitle: "Sandu AI мүмкіндіктеріне жылдам қолжетімділік",
        logout: "Шығу",
      },
      home: {
        title: "Шолу",
        quickLinks: "Жылдам сілтемелер",
        cards: {
          kmzh: "КМЖ генерациялау және DOCX жүктеу",
          aiDocs: "Эссе, БЖБ, ТЖБ, презентациялар және т.б.",
          library: "Материалдар: курстар, көрнекіліктер, ойындар",
          media: "Фото/видео/аватар, Kaspi QR және карталар",
          profile: "Профиль және аккаунт баптаулары",
        },
      },
    },
    essay: {
      form: {
        title: "Эссе",
        topic: "Тақырып",
        language: "Тіл",
        grade: "Сынып",
        wordCount: "Көлемі (сөз)",
        type: "Эссе түрі",
        generate: "Эссе генерациялау",
      },
      types: {
        argumentative: "Аргументативті",
        descriptive: "Сипаттамалық",
        narrative: "Әңгімелеу",
      },
      results: {
        plan: "Жоспар",
        content: "Мәтін",
        applyGeneral: "Жалпы түзету",
        applyInline: "Нүктелік түзету",
        targetText: "Не түзету керек",
        instruction: "Нұсқау",
        generalInstruction: "Бүкіл мәтінге нұсқау",
        apply: "Қолдану",
        export: "DOCX жүктеу",
        addRevision: "Түзету қосу",
        selectedText: "Таңдалған мәтін",
        whatToChange: "Не өзгерту керек?",
        applyAllRevisions: "Барлық түзетулерді қолдану",
        revision: "Түзету",
        delete: "Жою",
        cancel: "Болдырмау",
        pendingRevisions: "Жиналған түзетулер",
        noRevisions: "Блокта мәтінді таңдап, түзету қосыңыз",
        editBlock: "Блокты өңдеу",
        saveBlock: "Сақтау",
        sectionTypes: {
          introduction: "Кіріспе",
          body: "Негізгі бөлім",
          conclusion: "Қорытынды",
        },
      },
      errors: {
        required: "Міндетті өрістерді толтырыңыз да, қайта көріңіз.",
        auth: "Эссе генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Генерация жүріп жатыр (15–40 секунд)...",
    },
    article: {
      form: {
        title: "Мақала (Статья)",
        topic: "Мақала тақырыбы",
        language: "Тіл",
        authorName: "Автордың аты",
        authorRole: "Автордың лауазымы",
        genre: "Мақала түрі",
        customGenre: "Мақала түрін сипаттаңыз",
        additionalContext: "Қосымша ақпарат (міндетті емес)",
        generate: "Мақала генерациялау",
      },
      genres: {
        scientific: "Ғылыми мақала",
        publicistic: "Публицистикалық мақала",
        custom: "Өз нұсқасы",
      },
      results: {
        meta: "Метадеректер",
        abstract: "Аннотация",
        keywords: "Түйінді сөздер",
        sections: "Бөлімдер",
        conclusion: "Қорытынды",
        references: "Әдебиеттер тізімі",
        addRevision: "Түзету қосу",
        selectedText: "Таңдалған мәтін",
        whatToChange: "Не өзгерту керек?",
        applyAllRevisions: "Барлық түзетулерді қолдану",
        revision: "Түзету",
        delete: "Жою",
        cancel: "Болдырмау",
        pendingRevisions: "Жиналған түзетулер",
        noRevisions: "Бөлімде мәтінді таңдап, түзету қосыңыз",
        editBlock: "Бөлімді өңдеу",
        saveBlock: "Сақтау",
        export: "DOCX жүктеу",
        generalInstruction: "Бүкіл мақалаға жалпы нұсқау",
        instruction: "Нұсқау",
      },
      errors: {
        required: "Міндетті өрістерді толтырыңыз да, қайта көріңіз.",
        auth: "Мақала генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Генерация жүріп жатыр (15–40 секунд)...",
    },
    exam: {
      form: {
        title: "БЖБ/ТЖБ (СОР/СОЧ)",
        examType: "Жұмыс түрі",
        subject: "Пән",
        grade: "Сынып",
        topic: "Тақырып",
        learningObjectives: "Оқу мақсаттары",
        addObjective: "Мақсат қосу",
        totalScore: "Жалпы балл",
        language: "Тіл",
        generate: "Генерациялау",
      },
      types: {
        bjb: "БЖБ (СОР)",
        tjb: "ТЖБ (СОЧ)",
      },
      results: {
        scoreIndicator: "Баллдар",
        currentTotal: "Ағымдағы сома",
        targetTotal: "Мақсатты сома",
        valid: "✅",
        invalid: "❌",
        warning: "Баллдардың сомасы берілгенмен сәйкес келмейді. Әр тапсырманың баллын тексеріңіз.",
        taskNumber: "Тапсырма",
        score: "Балл",
        descriptor: "Дескриптор",
        imagePlaceholder: "🖼️ Сурет орны",
        exportStudent: "Оқушыға арналған жүктеу",
        exportTeacher: "Мұғалімге арналған жүктеу",
      },
      widgets: {
        multipleChoice: "Көп таңдау",
        matching: "Сәйкестендіру",
        trueFalse: "Дұрыс/Бұрыс",
        textOpen: "Ашық сұрақ",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        auth: "Емтихан генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Генерация жүріп жатыр (20–50 секунд)...",
    },
    lessonPlan: {
      form: {
        title: "ҚМЖ - Қысқа мерзімді жоспар",
        subject: "Пән",
        grade: "Сынып",
        topic: "Сабақтың тақырыбы",
        teacherName: "Мұғалімнің аты-жөні",
        sectionName: "Бөлім",
        lessonNumber: "Сабақ нөмірі",
        learningObjectives: "Оқу мақсаттары",
        addObjective: "Мақсат қосу",
        date: "Күні",
        generate: "Сабақ жоспарын жасау",
      },
      meta: {
        title: "Сабақ туралы ақпарат",
        sectionName: "Бөлім",
        subject: "Пән",
        teacherName: "Мұғалімнің аты-жөні",
        date: "Күні",
        grade: "Сынып",
        studentsPresent: "Қатысқандар",
        studentsAbsent: "Қатыспағандар",
        topic: "Сабақтың тақырыбы",
        learningObjectives: "Оқу мақсаттары",
        lessonObjectives: "Сабақ міндеттері",
        addObjective: "Міндет қосу",
        removeObjective: "Жою",
      },
      table: {
        stage: "Сабақ кезеңі",
        time: "Уақыт",
        teacherActivity: "Педагогтің әрекеті",
        studentActivity: "Оқушының әрекеті",
        assessment: "Бағалау",
        resources: "Ресурстар",
        workType: "Жұмыс түрі",
        methodName: "Әдіс",
      },
      stages: {
        beginning: "Сабақтың басы",
        middle: "Сабақтың ортасы",
        end: "Сабақтың соңы",
        neuroExercise: "Нейрожаттығу",
      },
      workTypes: {
        individual: "ЖЖ",
        group: "ТЖ",
      },
      actions: {
        download: "DOCX жүктеу",
        createNew: "Жаңа жоспар жасау",
        addDescriptor: "Дескриптор қосу",
        removeDescriptor: "Жою",
        addTask: "Тапсырма қосу",
        edit: "Өңдеу",
        save: "Сақтау",
        cancel: "Болдырмау",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        lessonNumberMin: "Сабақ нөмірі 0-ден үлкен болуы керек.",
        objectivesMin: "Кемінде бір оқу мақсатын қосыңыз.",
        auth: "Сабақ жоспарын жасау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
        flowStagesRequired: "Жоспарда дәл 3 кезең болуы керек.",
        taskMinRequired: "Әр кезеңде кемінде 1 тапсырма болуы керек.",
      },
      loading: "Сабақ жоспары жасалуда (20-50 секунд)...",
      validation: {
        allFieldsRequired: "Барлық міндетті өрістер толтырылуы керек.",
        lessonNumberPositive: "Сабақ нөмірі оң сан болуы керек.",
        objectivesRequired: "Кемінде бір оқу мақсаты көрсету қажет.",
      },
    },
    classHour: {
      form: {
        title: "Сынып сағаты",
        language: "Сценарий тілі",
        topic: "Сынып сағатының тақырыбы",
        grade: "Сынып",
        value: "Құндылық",
        valuePlaceholder: "Мысалы: Отан, Отбасы, Денсаулық...",
        format: "Формат",
        formatPlaceholder: "Мысалы: Дискуссия, Тренинг, Викторина...",
        wishes: "Қосымша тілектер (міндетті емес)",
        wishesPlaceholder: "Мысалы: Астана туралы бейне қосыңыз",
        generate: "Сценарий жасау",
      },
      results: {
        title: "Сынып сағаты сценарийі",
        regenerateBlock: "Блокты қайта жасау",
        editBlock: "Өңдеу",
        instructionPlaceholder: "Не өзгерту керек? (міндетті емес)",
        regenerateButton: "Қайта жасау",
        cancel: "Болдырмау",
        export: "DOCX жүктеу",
        createNew: "Жаңа сценарий жасау",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        auth: "Сценарий жасау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Сценарий жасалуда (20–50 секунд)...",
      regenerating: "Блок қайта жасалуда...",
    },
    quiz: {
      form: {
        title: "Тест генераторы (Quiz)",
        modeTab: {
          topic: "Тақырып бойынша",
          text: "Мәтін бойынша",
        },
        subject: "Пән",
        grade: "Сынып",
        topic: "Тақырып",
        contextText: "Контекстік мәтін",
        contextTextPlaceholder: "Тест жасау үшін мәтінді енгізіңіз (10000 таңбаға дейін)...",
        contextTextLimit: "таңба",
        language: "Тест тілі",
        questionCount: "Сұрақтар саны",
        difficulty: "Қиындық",
        difficultyOptions: {
          easy: "Оңай",
          medium: "Орташа",
          hard: "Қиын",
        },
        questionTypes: "Сұрақ түрлері",
        questionTypeOptions: {
          single_choice: "Бір дұрыс (Single Choice)",
          multiple_choice: "Бірнеше дұрыс (Multiple Choice)",
          true_false: "Дұрыс/Бұрыс (True/False)",
          open: "Ашық сұрақ (Open)",
        },
        generate: "Тест жасау",
      },
      results: {
        title: "Жасалған тест",
        quizTitle: "Тест атауы",
        quizTitlePlaceholder: "Экспорт үшін тест атауын енгізіңіз",
        questionNumber: "Сұрақ",
        question: "Сұрақ",
        options: "Жауап нұсқалары",
        correctAnswer: "Дұрыс жауап",
        explanation: "Түсініктеме",
        addQuestion: "Сұрақ қосу",
        removeQuestion: "Сұрақты жою",
        export: "ZIP жүктеу (2 нұсқа + кілттер)",
        createNew: "Жаңа тест жасау",
      },
      questionTypeLabels: {
        single_choice: "Бір дұрыс",
        multiple_choice: "Бірнеше дұрыс",
        true_false: "Дұрыс/Бұрыс",
        open: "Ашық",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        questionCountRange: "Сұрақтар саны 5-тен 20-ға дейін болуы керек.",
        contextTextTooLong: "Мәтін 10000 таңбадан аспауы керек.",
        questionTypesRequired: "Кемінде бір сұрақ түрін таңдаңыз.",
        auth: "Тест жасау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Тест жасалуда (20–50 секунд)...",
    },
    voiceover: {
      title: "ИИ арқылы дыбыстау",
      placeholder: "Дыбыстау үшін мәтінді енгізіңіз (қазақша немесе орысша)...",
      voiceLabel: "Дауысты таңдаңыз",
      voices: {
        alloy: "Арайлым (Әйел)",
        echo: "Арман (Ер)",
        fable: "Данияр (Ер)",
        onyx: "Олжас (Ер)",
        nova: "Жанар (Әйел)",
        shimmer: "Айгерім (Әйел)",
      },
      generate: "Генерациялау",
      result: "Дыбыстау нәтижесі",
      download: "MP3 жүктеу",
      errors: {
        required: "Дыбыстау үшін мәтін енгізіңіз.",
        tooLong: "Мәтін тым ұзын (максимум 4096 таңба).",
        auth: "Дыбыстауды қолдану үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Аудио жасалуда...",
    },
    scientificProject: {
      form: {
        title: "Ғылыми жоба",
        subject: "Пән",
        topic: "Тақырып",
        grade: "Сынып",
        language: "Жоба тілі",
        userComment: "Фактілер / Пікірлер (практикалық бөлім үшін)",
        userCommentPlaceholder: "Мысалы: Біз зеңді 10 күн бойы қараңғы шкафта және күн сәулесінде өсірдік...",
        generate: "Жобаны генерациялау",
      },
      results: {
        title: "Генерация нәтижесі",
        topic: "Жоба тақырыбы",
        abstract: "Аннотация",
        introduction: "Кіріспе",
        mainPart: "Негізгі бөлім",
        conclusion: "Қорытынды",
        references: "Әдебиеттер тізімі",
        export: "DOCX жүктеу",
        createNew: "Жаңа жоба жасау",
        editBlock: "Өңдеу",
        saveBlock: "Сақтау",
        cancel: "Болдырмау",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        auth: "Жоба генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Ғылыми жұмыс жазылуда (30-60 секунд)...",
    },
    worksheet: {
      form: {
        title: "Жұмыс парақтары",
        subject: "Пән",
        topic: "Тақырып",
        grade: "Сынып",
        language: "Тіл",
        taskTypes: "Тапсырма түрлері",
        userComment: "ИИ-ге түсініктеме (міндетті емес)",
        userCommentPlaceholder: "Мысалы: Етістіктерге баса назар аудар...",
        generate: "Жұмыс парағын жасау",
      },
      taskTypeLabels: {
        multiple_choice: "Тесттер (Multiple Choice)",
        fill_in_blank: "Бос орындарды толтыру",
        matching: "Сәйкестендіру (Matching)",
        open_question: "Ашық сұрақтар",
      },
      results: {
        title: "Генерация нәтижесі",
        multipleChoice: "Тесттер",
        fillInBlank: "Бос орындарды толтыру",
        matching: "Сәйкестендіру",
        openQuestion: "Ашық сұрақтар",
        export: "DOCX жүктеу",
        createNew: "Жаңа парақ жасау",
        editBlock: "Өңдеу",
        saveBlock: "Сақтау",
        cancel: "Болдырмау",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз.",
        auth: "Жұмыс парағын жасау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Жұмыс парағы жасалуда (20-40 секунд)...",
    },
    simulations: {
      title: "PhET Интерактивті симуляциялары",
      subtitle: "Физика, химия, биология және математика пәндері бойынша тегін интерактивті симуляциялар.",
      categories: {
        all: "Барлығы",
        physics: "Физика",
        chemistry: "Химия",
        biology: "Биология",
        math: "Математика",
      },
      back: "Тізімге оралу",
      open: "Симуляцияны ашу",
      fullscreen: "Толық экран",
    },
    footer: {
      ctaTitle: "Sandu AI іске қосылуына қосылыңыз",
      ctaSubtitle:
        "Платформаға алғашқылардың бірі болып қол жеткізу үшін email қалдырыңыз.",
      ctaButton: "Күту тізіміне жазылу",
      emailPlaceholder: "Email",
      rights: "Sandu AI. Барлық құқықтар қорғалған.",
    },
    common: {
      brand: "Sandu AI",
      ru: "Орысша",
      kk: "Қазақша",
    },
  },
};

// Updated: Added exam translations for BJB/TJB functionality


