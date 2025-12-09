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
        bjb: string;
        tjb: string;
        scientificProjects: string;
        classHours: string;
        worksheets: string;
        kindergarten: string;
        tests: string;
        games: string;
        voiceover: string;
        presentations: string;
      };
      library: string;
      libraryItems: {
        courses: string;
        visualAids: string;
        presentations: string;
        games: string;
        sketchHub: string;
      };
      media: string;
      mediaItems: {
        photo: string;
        video: string;
        avatar: string;
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
    };
    errors: {
      required: string;
      auth: string;
      generic: string;
    };
    loading: string;
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
        subtitle: "Используйте телефон и пароль, чтобы войти.",
        phoneLabel: "Телефон",
        passwordLabel: "Пароль",
        submit: "Войти",
        switchText: "Нет аккаунта? Зарегистрироваться",
      },
      register: {
        title: "Регистрация",
        subtitle: "Создайте учётную запись, чтобы использовать Sandu AI.",
        phoneLabel: "Телефон",
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
          bjb: "БЖБ (СОР)",
          tjb: "ТЖБ (СОЧ)",
          scientificProjects: "Научные проекты",
          classHours: "Классные часы",
          worksheets: "Рабочие листы",
          kindergarten: "Детский сад",
          tests: "ИИ тесты",
          games: "Игры (Kahoot)",
          voiceover: "Озвучка ИИ",
          presentations: "Презентации ИИ",
        },
        library: "Библиотека",
        libraryItems: {
          courses: "Курсы",
          visualAids: "Наглядные пособия",
          presentations: "Интерактивные презентации",
          games: "Интерактивные игры",
          sketchHub: "Скетч-Хаб",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Генерация фото",
          video: "Генерация видео",
          avatar: "Цифровой аватар",
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
      },
      errors: {
        required: "Заполните обязательные поля и попробуйте снова.",
        auth: "Авторизуйтесь, чтобы сгенерировать статью.",
        generic: "Произошла ошибка. Попробуйте ещё раз.",
      },
      loading: "Идёт генерация (15–40 секунд)...",
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
        subtitle: "Телефон мен парольді қолданып кіріңіз.",
        phoneLabel: "Телефон",
        passwordLabel: "Пароль",
        submit: "Кіру",
        switchText: "Аккаунт жоқ па? Тіркелу",
      },
      register: {
        title: "Тіркелу",
        subtitle: "Sandu AI пайдалану үшін аккаунт жасаңыз.",
        phoneLabel: "Телефон",
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
          bjb: "БЖБ",
          tjb: "ТЖБ",
          scientificProjects: "Ғылыми жобалар",
          classHours: "Тәрбие сағаттары",
          worksheets: "Жұмыс парақтары",
          kindergarten: "Балабақшаға сабақтар",
          tests: "ИИ тесттер",
          games: "Ойындар (Kahoot)",
          voiceover: "ИИ дыбыстау",
          presentations: "ИИ презентациялар",
        },
        library: "Кітапхана",
        libraryItems: {
          courses: "Курстар",
          visualAids: "Көрнекіліктер",
          presentations: "Интерактивті презентациялар",
          games: "Интерактивті ойындар",
          sketchHub: "Скетч-Хаб",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Фото генерациясы",
          video: "Видео генерациясы",
          avatar: "Цифрлық аватар",
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
      },
      errors: {
        required: "Міндетті өрістерді толтырыңыз да, қайта көріңіз.",
        auth: "Мақала генерациялау үшін авторизациядан өтіңіз.",
        generic: "Қате пайда болды. Қайта көріңіз.",
      },
      loading: "Генерация жүріп жатыр (15–40 секунд)...",
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


