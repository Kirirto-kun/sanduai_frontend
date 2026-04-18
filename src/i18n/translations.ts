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

type MaterialItem = {
  title: string;
  description: string;
  url: string;
  image: string;
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
  materialsSection: {
    title: string;
    subtitle: string;
    items: MaterialItem[];
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
      phoneVerification: string;
      sendCode: string;
      verifyCode: string;
      codeSent: string;
      enterCode: string;
      codePlaceholder: string;
      invalidCode: string;
      resendCode: string;
      phoneRequired: string;
      invalidPhoneFormat: string;
      stepIndicator: string;
      termsAgreement: string;
      termsLink: string;
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
      invalidCredentials: string;
      userExists: string;
    };
    loading: string;
  };
  tokens: {
    balance: string;
    cost: string;
    insufficient: string;
    required: string;
    available: string;
    loading: string;
    refresh: string;
    transactions: string;
    subscription: string;
    subscriptionStatus: string;
    subscriptionActive: string;
    subscriptionInactive: string;
    subscriptionEnd: string;
    subscriptionPlan: string;
    free: string;
    premium: string;
  };
  admin: {
    title: string;
    subtitle: string;
    usersList: string;
    noUsers: string;
    email: string;
    phone: string;
    fullName: string;
    role: string;
    balance: string;
    createdAt: string;
    actions: string;
    addTokens: string;
    viewTransactions: string;
    previous: string;
    next: string;
    transactions: string;
    close: string;
    noTransactions: string;
    date: string;
    operation: string;
    amount: string;
    description: string;
    addTokensTo: string;
    adding: string;
    add: string;
    cancel: string;
    subscription: string;
    addSubscription: string;
    subscriptionDays: string;
    subscriptionDaysPlaceholder: string;
    subscriptionActive: string;
    subscriptionInactive: string;
    subscriptionEnd: string;
    subscriptionPlan: string;
    searchPlaceholder: string;
    loadUsersError: string;
    fillAllFields: string;
    tokensPositiveNumber: string;
    daysPositiveNumber: string;
    addTokensError: string;
    loadTransactionsError: string;
    subscriptionError: string;
    defaultTokenDescription: string;
    subscriptionExtendNote: string;
    subscriptionNewNote: string;
    total: string;
    loading: string;
    selectedFile: string;
    videoTitleMaxLength: string;
    deleteVideoError: string;
    videoUploadError: string;
    videoUploadAuthError: string;
    videoUploadAccessError: string;
    videoListLoadError: string;
    syncError: string;
    videos: {
      title: string;
      uploadVideo: string;
      videoTitle: string;
      videoTitlePlaceholder: string;
      selectFile: string;
      uploading: string;
      processing: string;
      ready: string;
      error: string;
      uploadProgress: string;
      status: string;
      upload: string;
      cancel: string;
      videosList: string;
      noVideos: string;
      refresh: string;
      syncStatuses: string;
      syncing: string;
      selectThumbnail: string;
      tableName: string;
      tableCreatedAt: string;
      tableActions: string;
      delete: string;
      deleting: string;
      deleteConfirmTitle: string;
      deleteConfirmMessage: string;
      deleteConfirmWarning: string;
      youtubeImportTitle: string;
      youtubeUrlLabel: string;
      youtubeUrlPlaceholder: string;
      youtubeVideoTitle: string;
      youtubeVideoTitlePlaceholder: string;
      youtubeThumbnailLabel: string;
      youtubeImporting: string;
      youtubeImportButton: string;
      youtubeImportError: string;
    };
    visuals: {
      title: string;
      subtitle: string;
      goToPage: string;
    };
    materials: {
      title: string;
      subtitle: string;
      goToPage: string;
    };
  };
  videos: {
    title: string;
    subtitle: string;
    noVideos: string;
    watch: string;
    duration: string;
    uploaded: string;
    subscriptionRequired: string;
    subscriptionRequiredMessage: string;
    loading: string;
    error: string;
    videoNotReady: string;
    videoNotFound: string;
    watchTokenError: string;
    paginationOf: string;
  };
  presentationsPage: {
    title: string;
    subtitle: string;
    filterByClassSubject: string;
    searchPlaceholder: string;
    search: string;
    subject: string;
    class: string;
    noItems: string;
    resetFilters: string;
    loading: string;
    back: string;
    next: string;
    paginationOf: string;
    subscriptionRequired: string;
    subscriptionRequiredMessage: string;
    premiumRequired: string;
    premiumRequiredMessage: string;
    downloadMaterial: string;
    downloadFile: string;
    downloadHint: string;
    previewUnavailable: string;
    download: string;
  };
  presentationsAdmin: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    classLabel: string;
    classPlaceholder: string;
    coverLabel: string;
    coverSelected: string;
    fileLabel: string;
    fileHint: string;
    addFileAndName: string;
    upload: string;
    uploading: string;
    toLibrary: string;
    uploadedList: string;
    loading: string;
    noItems: string;
    delete: string;
    deleting: string;
    deleteConfirm: string;
    uploadSuccess: string;
    deleteSuccess: string;
    uploadError: string;
    deleteError: string;
    classSuffix: string;
  };
  visualAidsPage: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    search: string;
    noItems: string;
    resetFilters: string;
    loading: string;
    back: string;
    next: string;
    paginationOf: string;
    subscriptionRequired: string;
    subscriptionRequiredMessage: string;
  };
  visualAidsAdmin: {
    title: string;
    subtitle: string;
    tabMaterials: string;
    tabCategories: string;
    tabUpload: string;
    searchPlaceholder: string;
    search: string;
    allCategories: string;
    loading: string;
    noItems: string;
    loadError: string;
    addFilesAndTitle: string;
    materialUploaded: string;
    groupCreated: string;
    uploadError: string;
    materialUpdated: string;
    updateError: string;
    deleteMaterialConfirm: string;
    deleteMaterialSuccess: string;
    deleteGroupConfirm: string;
    deleteGroupSuccess: string;
    deleteError: string;
    categoryRequired: string;
    categoryCreated: string;
    categoryCreateError: string;
    categoryUpdated: string;
    categoryUpdateError: string;
    deleteCategoryConfirm: string;
    categoryDeleted: string;
    deleteCategoryError: string;
    categoryCreatedAndSelected: string;
    viewGrid: string;
    viewTable: string;
    editPrefix: string;
    nameLabel: string;
    categoriesLabel: string;
    activeLabel: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    deleteGroup: string;
    back: string;
    forward: string;
    paginationOf: string;
    editCategory: string;
    createCategory: string;
    nameRuLabel: string;
    nameKkLabel: string;
    update: string;
    create: string;
    categoriesList: string;
    typeGroup: string;
    typeFile: string;
    tableType: string;
    tablePreview: string;
    tableName: string;
    tableCategories: string;
    tableSizeFiles: string;
    tableStatus: string;
    tableActions: string;
    statusActive: string;
    statusInactive: string;
    filesCount: string;
    dropFiles: string;
    dropFilesOrClick: string;
    multipleWillZip: string;
    titleLabel: string;
    titlePackagePlaceholder: string;
    titleMaterialPlaceholder: string;
    categoriesRequired: string;
    noCategoryNeeded: string;
    categoryNameRuPlaceholder: string;
    categoryNameKkPlaceholder: string;
    createQuick: string;
    filesLabel: string;
    uploadButton: string;
    uploadPackage: string;
    uploading: string;
  };
  photoPage: {
    title: string;
    warningTitle: string;
    warningText: string;
    promptLabel: string;
    promptPlaceholder: string;
    promptHint: string;
    enterPrompt: string;
    generationError: string;
    generating: string;
    generate: string;
    resultTitle: string;
    download: string;
    openInNewTab: string;
    errorLabel: string;
    unknownError: string;
    insufficientTokensFormat: string;
  };
  qrGenerator: {
    title: string;
    subtitle: string;
    textLabel: string;
    textPlaceholder: string;
    sizeLabel: string;
    errorCorrectionLabel: string;
    errorCorrectionHint: string;
    fgColorLabel: string;
    bgColorLabel: string;
    previewTitle: string;
    downloadPNG: string;
    downloadSVG: string;
    emptyState: string;
  };
  atZharys: {
    setup: {
      title: string;
      subtitle: string;
      topic: string;
      topicPlaceholder: string;
      grade: string;
      gradePlaceholder: string;
      additionalInfo: string;
      additionalInfoPlaceholder: string;
      teamsCount: string;
      victoryCondition: string;
      victoryConditionDescription: string;
      questionsCount: string;
      language: string;
      generate: string;
      generating: string;
      cost: string;
    };
    game: {
      blocked: string;
      questionsEnded: string;
      progress: string;
      finish: string;
    };
    victory: {
      title: string;
      winner: string;
      playAgain: string;
      goToLibrary: string;
    };
    errors: {
      required: string;
      insufficientTokens: string;
      invalidData: string;
      generationError: string;
      auth: string;
    };
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
    loading: string;
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
        interactiveGames: string;
        materials: string;
      };
      media: string;
      mediaItems: {
        photo: string;
        video: string;
        avatar: string;
        voiceover: string;
        qrGenerator: string;
      };
      profile: string;
      settings: string;
      admin: string;
    };
    header: {
      title: string;
      subtitle: string;
      logout: string;
    };
    libraryPage: {
      title: string;
      description: string;
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
        sandubot: string;
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
      taskTypesLabel: string;
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
      fillInBlank: string;
    };
    taskTypes: {
      multiple_choice: string;
      matching: string;
      fill_in_blank: string;
      true_false: string;
      text_open: string;
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
      lessonType: string;
      lessonTypeOptions: {
        new: string;
        consolidation: string;
        review: string;
      };
      textbookImages: string;
      textbookText: string;
      preferredPlatform: string;
      platformOptions: {
        kahoot: string;
        bilimClass: string;
        sanduAI: string;
        mentimeter: string;
        quizlet: string;
        wordwall: string;
        none: string;
      };
      language: string;
      languageOptions: {
        kazakh: string;
        russian: string;
      };
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
    voiceFilterAll: string;
    voiceFilterFemale: string;
    voiceFilterMale: string;
    voiceFilterNeutral: string;
    voiceSearchPlaceholder: string;
    voicesLoading: string;
    voicesLoadError: string;
    voices: {
      roger: string;
      sarah: string;
      laura: string;
      charlie: string;
      george: string;
      callum: string;
      river: string;
      harry: string;
      liam: string;
      alice: string;
      matilda: string;
      will: string;
      jessica: string;
      eric: string;
      bella: string;
      chris: string;
      brian: string;
      daniel: string;
      lily: string;
      adam: string;
      bill: string;
    };
    charactersUsed?: string;
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
      topic: string;
      direction: string;
      grade: string;
      researchType: string;
      experimental: string;
      theoretical: string;
      subject: string;
      language: string;
      schoolName: string;
      schoolNamePlaceholder: string;
      supervisor: string;
      supervisorPlaceholder: string;
      city: string;
      cityPlaceholder: string;
      userComment: string;
      userCommentPlaceholder: string;
      generate: string;
    };
    wizard: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      createPlan: string;
      approvePlan: string;
      regenerateSection: string;
      regenerateCost: string;
      finalize: string;
      progress: {
        introduction: string;
        chapter1: string;
        chapter2: string;
        conclusion: string;
        complete: string;
      };
    };
    plan: {
      hypothesis: string;
      object: string;
      subjectField: string;
      methods: string;
      chapter1Title: string;
      chapter1Subsections: string;
      chapter2Title: string;
      chapter2Subsections: string;
      scientificNovelty: string;
      practicalSignificance: string;
      edit: string;
      save: string;
      structure?: string;
      editPlan?: string;
    };
    results: {
      title: string;
      titlePage: string;
      annotation: string;
      tableOfContents: string;
      introduction: string;
      chapterTheory: string;
      chapterResearch: string;
      conclusion: string;
      references: string;
      appendix: string;
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
    interactiveGames: {
      title: string;
      subtitle: string;
      categories: {
        all: string;
        literacy: string;
        math: string;
        logic: string;
        natural_science: string;
        culture: string;
        biology: string;
        social_studies: string;
        art: string;
        general: string;
        other: string;
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
    termsLink: string;
  };
  sandubot: {
    title: string;
    placeholder: string;
    inputPlaceholder: string;
    send: string;
    insufficientTokens: string;
    thinking: string;
  };
  aiPresentations: {
    title: string;
    subtitle: string;
    create: string;
    createSubtitle: string;
    contentLabel: string;
    contentPlaceholder: string;
    instructionsLabel: string;
    instructionsPlaceholder: string;
    slidesCount: string;
    language: string;
    template: string;
    format: string;
    tone: string;
    generate: string;
    generating: string;
    download: string;
    downloading: string;
    status: string;
    noPresentations: string;
    delete: string;
    deleteConfirm: string;
    export: string;
    editor: string;
    outlines: string;
    outlinesSubtitle: string;
    editOutline: string;
    addOutline: string;
    removeOutline: string;
    prepareSlides: string;
    generateSlides: string;
    generatingSlides: string;
    themes: string;
    createTheme: string;
    themeName: string;
    primaryColor: string;
    generateColors: string;
    fonts: string;
    uploadFont: string;
    images: string;
    generateImage: string;
    uploadImage: string;
    icons: string;
    searchIcons: string;
    aiEdit: string;
    aiEditPlaceholder: string;
    undo: string;
    redo: string;
    slides: string;
    addSlide: string;
    deleteSlide: string;
    loading: string;
    error: string;
    errorGeneration: string;
    back: string;
    backToList: string;
    webSearch: string;
    tableOfContents: string;
    titleSlide: string;
    selectLayout: string;
    exportPptx: string;
    exportPdf: string;
    templateSubtitle: string;
    statusPending: string;
    statusProcessing: string;
    statusCompleted: string;
    statusError: string;
    tipMagic: string;
    tipAnalyzing: string;
    tipOrganizing: string;
    tipVisuals: string;
    tipFinishing: string;
    layoutsCount: string;
    selectTemplate: string;
    selected: string;
    createdAt: string;
    defaultBadge: string;
    uploadTemplate: string;
    uploadTemplateHint: string;
    langEnglish: string;
    langRussian: string;
    langKazakh: string;
    errorTemplates: string;
    retry: string;
  };
  common: {
    brand: string;
    ru: string;
    kk: string;
  };
  cookieBanner: {
    message: string;
    learnMore: string;
    accept: string;
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
    materialsSection: {
      title: "Полезные материалы для учителей",
      subtitle: "AI инструменты и ресурсы для повышения эффективности преподавания.",
      items: [
        {
          title: "EduAide.ai",
          description: "AI платформа для создания учебных материалов и планов уроков.",
          url: "https://www.eduaide.ai/",
          image: "/materials_section/eduaide_ai.png",
        },
        {
          title: "MagicSchool.ai",
          description: "Безопасная AI платформа для школ с инструментами для учителей и учеников.",
          url: "https://www.magicschool.ai/",
          image: "/materials_section/magic_school.png",
        },
        {
          title: "Canva AI",
          description: "Создание визуального контента с помощью искусственного интеллекта.",
          url: "https://www.canva.com/ai",
          image: "/materials_section/canva.png",
        },
        {
          title: "Мұғалім Talks 2025",
          description: "Конференция для учителей с обсуждением современных образовательных технологий.",
          url: "https://www.youtube.com/watch?v=iZQ9uOLTiW8",
          image: "/materials_section/Teacher_Talks_2025.png",
        },
        {
          title: "ChatGPT",
          description: "Универсальный AI помощник для создания контента и ответов на вопросы.",
          url: "https://chatgpt.com/",
          image: "/materials_section/chat_gpt.jpeg",
        },
        {
          title: "Grammarly",
          description: "AI инструмент для проверки грамматики и улучшения письма.",
          url: "https://www.grammarly.com/",
          image: "/materials_section/grammarly.png",
        },
        {
          title: "Мұғалім Talks 2024",
          description: "Запись конференции для учителей с полезными материалами и обсуждениями.",
          url: "https://www.youtube.com/watch?v=OEF4GiBGh_A&t=191s",
          image: "/materials_section/Teacher_Talks_2024.jpg",
        },
        {
          title: "Bing Image Creator",
          description: "Создание изображений с помощью искусственного интеллекта.",
          url: "https://www.bing.com/images/create",
          image: "/materials_section/bing_image.png",
        },
        {
          title: "Synthesia",
          description: "Создание видео с AI аватарами для образовательных целей.",
          url: "https://www.synthesia.io/",
          image: "/materials_section/video_ai.png",
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
        phoneLabel: "Телефон",
        emailLabel: "Email",
        passwordLabel: "Пароль",
        fullNameLabel: "Полное имя",
        submit: "Зарегистрироваться",
        switchText: "Уже есть аккаунт? Войти",
        phoneVerification: "Верификация телефона",
        sendCode: "Отправить код",
        verifyCode: "Подтвердить код",
        codeSent: "Код отправлен на {phone}",
        enterCode: "Введите код из SMS",
        codePlaceholder: "123456",
        invalidCode: "Неверный код",
        resendCode: "Отправить код повторно",
        phoneRequired: "Телефон обязателен",
        invalidPhoneFormat: "Неверный формат телефона. Используйте международный формат: +7...",
        stepIndicator: "Шаг {current} из {total}",
        termsAgreement: "Регистрируясь, вы принимаете Пользовательское соглашение",
        termsLink: "Пользовательское соглашение",
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
        invalidCredentials: "Неправильный логин или пароль.",
        userExists: "Пользователь с таким email или телефоном уже существует.",
      },
      loading: "Загрузка...",
    },
    tokens: {
      balance: "Баланс токенов",
      cost: "Стоимость",
      insufficient: "Недостаточно токенов",
      required: "Требуется",
      available: "Доступно",
      loading: "Загрузка...",
      refresh: "Обновить",
      transactions: "История транзакций",
      subscription: "Подписка",
      subscriptionStatus: "Статус подписки",
      subscriptionActive: "Активна",
      subscriptionInactive: "Неактивна",
      subscriptionEnd: "Окончание подписки",
      subscriptionPlan: "Тип подписки",
      free: "Бесплатная",
      premium: "Премиум",
    },
    admin: {
      title: "Админ панель",
      subtitle: "Управление пользователями и токенами",
      usersList: "Список пользователей",
      noUsers: "Пользователи не найдены",
      email: "Email",
      phone: "Телефон",
      fullName: "Имя",
      role: "Роль",
      balance: "Баланс",
      createdAt: "Дата регистрации",
      actions: "Действия",
      addTokens: "Добавить токены",
      viewTransactions: "Транзакции",
      previous: "Назад",
      next: "Вперед",
      transactions: "История транзакций",
      close: "Закрыть",
      noTransactions: "Транзакций нет",
      date: "Дата",
      operation: "Операция",
      amount: "Сумма",
      description: "Описание",
      addTokensTo: "Добавить токены",
      adding: "Добавление...",
      add: "Добавить",
      cancel: "Отмена",
      subscription: "Подписка",
      addSubscription: "Выдать подписку",
      subscriptionDays: "Количество дней",
      subscriptionDaysPlaceholder: "30",
      subscriptionActive: "Активна",
      subscriptionInactive: "Неактивна",
      subscriptionEnd: "Окончание",
      subscriptionPlan: "Тип",
      searchPlaceholder: "Поиск по email или номеру телефона...",
      loadUsersError: "Ошибка загрузки пользователей",
      fillAllFields: "Заполните все поля",
      tokensPositiveNumber: "Количество токенов должно быть положительным числом",
      daysPositiveNumber: "Количество дней должно быть положительным числом",
      addTokensError: "Ошибка начисления токенов",
      loadTransactionsError: "Ошибка загрузки транзакций",
      subscriptionError: "Ошибка выдачи подписки",
      defaultTokenDescription: "Начисление токенов администратором",
      subscriptionExtendNote: "Подписка будет продлена от текущей даты окончания",
      subscriptionNewNote: "Будет создана новая подписка на указанное количество дней",
      total: "Всего",
      loading: "Загрузка...",
      selectedFile: "Выбрано",
      videoTitleMaxLength: "Название видео не должно превышать 255 символов",
      deleteVideoError: "Ошибка удаления видео",
      videoUploadError: "Ошибка загрузки видео",
      videoUploadAuthError: "Ошибка авторизации при загрузке. Проверьте настройки Bunny CDN на сервере.",
      videoUploadAccessError: "Доступ запрещен. Убедитесь, что у вас есть права администратора.",
      videoListLoadError: "Ошибка загрузки списка видео",
      syncError: "Ошибка синхронизации статусов",
      videos: {
        title: "Видео",
        uploadVideo: "Загрузить видео",
        videoTitle: "Название видео",
        videoTitlePlaceholder: "Введите название видео",
        selectFile: "Выберите видеофайл",
        uploading: "Загрузка",
        processing: "Обработка",
        ready: "Готово",
        error: "Ошибка",
        uploadProgress: "Загрузка",
        status: "Статус",
        upload: "Загрузить",
        cancel: "Отмена",
        videosList: "Список видео",
        noVideos: "Видео не найдены",
        refresh: "Обновить",
        syncStatuses: "Синхронизировать статусы",
        syncing: "Синхронизация...",
        selectThumbnail: "Выберите обложку (необязательно)",
        tableName: "Название",
        tableCreatedAt: "Дата создания",
        tableActions: "Действия",
        delete: "Удалить",
        deleting: "Удаление...",
        deleteConfirmTitle: "Подтверждение удаления",
        deleteConfirmMessage: "Вы уверены, что хотите удалить видео",
        deleteConfirmWarning: "Это действие нельзя отменить. Видео будет удалено из Bunny CDN и базы данных.",
        youtubeImportTitle: "Импорт видео с YouTube",
        youtubeUrlLabel: "Ссылка на YouTube",
        youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... или https://youtu.be/...",
        youtubeVideoTitle: "Название видео",
        youtubeVideoTitlePlaceholder: "Введите название видео",
        youtubeThumbnailLabel: "Превью (необязательно)",
        youtubeImporting: "Импорт видео с YouTube...",
        youtubeImportButton: "Импортировать с YouTube",
        youtubeImportError: "Ошибка импорта видео с YouTube",
      },
      visuals: {
        title: "Визуальные материалы",
        subtitle: "Управление визуальными материалами и категориями",
        goToPage: "Перейти к управлению",
      },
      materials: {
        title: "Интерактивные презентации",
        subtitle: "Загрузка интерактивных презентаций",
        goToPage: "Перейти к загрузке",
      },
    },
    videos: {
      title: "Видео курсы",
      subtitle: "Просмотр обучающих видео",
      noVideos: "Видео не найдены",
      watch: "Смотреть",
      duration: "Длительность",
      uploaded: "Загружено",
      subscriptionRequired: "Требуется подписка",
      subscriptionRequiredMessage: "Для просмотра видео необходима активная подписка. Обратитесь к администратору для оформления подписки.",
      loading: "Загрузка...",
      error: "Ошибка",
      videoNotReady: "Видео обрабатывается, попробуйте позже",
      videoNotFound: "Видео не найдено",
      watchTokenError: "Ошибка загрузки токена просмотра",
      paginationOf: "из",
    },
    presentationsPage: {
      title: "Интерактивные презентации",
      subtitle: "Фильтруйте по классу и предмету.",
      filterByClassSubject: "Фильтруйте по классу и предмету.",
      searchPlaceholder: "Поиск по названию...",
      search: "Искать",
      subject: "Предмет",
      class: "Класс",
      noItems: "Презентации не найдены",
      resetFilters: "Сбросить фильтры",
      loading: "Загрузка...",
      back: "Назад",
      next: "Вперед",
      paginationOf: "из",
      subscriptionRequired: "Требуется подписка",
      subscriptionRequiredMessage: "Для просмотра интерактивных презентаций необходима активная подписка. Обратитесь к администратору для оформления подписки.",
      premiumRequired: "Требуется премиум-подписка",
      premiumRequiredMessage: "Презентации доступны только премиум-подписчикам. Обратитесь к администратору для оформления подписки.",
      downloadMaterial: "СКАЧАТЬ МАТЕРИАЛ",
      downloadFile: "Скачать файл",
      downloadHint: "Скачайте материал для просмотра",
      previewUnavailable: "Предпросмотр недоступен для этого типа файла",
      download: "Скачать",
    },
    presentationsAdmin: {
      title: "Интерактивные презентации",
      subtitle: "Загрузка интерактивных презентаций в Bunny CDN",
      uploadTitle: "Загрузить презентацию",
      nameLabel: "Название *",
      namePlaceholder: "Урок математики 5 класс",
      subjectLabel: "Предмет",
      subjectPlaceholder: "Математика",
      classLabel: "Класс",
      classPlaceholder: "5",
      coverLabel: "Обложка (необязательно)",
      coverSelected: "Выбрано",
      fileLabel: "Файл *",
      fileHint: "PPTX, PDF, Word, видео, HTML5 (index.html)",
      addFileAndName: "Добавьте файл и название",
      upload: "Загрузить",
      uploading: "Загрузка...",
      toLibrary: "К библиотеке",
      uploadedList: "Загруженные презентации",
      loading: "Загрузка...",
      noItems: "Презентаций пока нет",
      delete: "Удалить",
      deleting: "Удаление...",
      deleteConfirm: "Удалить презентацию?",
      uploadSuccess: "Презентация загружена успешно",
      deleteSuccess: "Презентация удалена",
      uploadError: "Ошибка загрузки",
      deleteError: "Ошибка удаления",
      classSuffix: "класс",
    },
    visualAidsPage: {
      title: "Наглядные пособия",
      subtitle: "Библиотека визуальных материалов, схем и плакатов",
      searchPlaceholder: "Поиск материалов...",
      search: "Искать",
      noItems: "Материалы не найдены",
      resetFilters: "Сбросить фильтры",
      loading: "Загрузка...",
      back: "Назад",
      next: "Вперед",
      paginationOf: "из",
      subscriptionRequired: "Требуется подписка",
      subscriptionRequiredMessage: "Для просмотра наглядных пособий необходима активная подписка. Обратитесь к администратору для оформления подписки.",
    },
    visualAidsAdmin: {
      title: "Управление наглядными пособиями",
      subtitle: "Загрузка и редактирование визуальных материалов",
      tabMaterials: "Материалы",
      tabCategories: "Категории",
      tabUpload: "Загрузить",
      searchPlaceholder: "Поиск...",
      search: "Искать",
      allCategories: "Все категории",
      loading: "Загрузка...",
      noItems: "Материалы не найдены",
      loadError: "Ошибка загрузки материалов",
      addFilesAndTitle: "Добавьте файлы, название и категории",
      materialUploaded: "Материал загружен",
      groupCreated: "Пакет создан",
      uploadError: "Ошибка загрузки",
      materialUpdated: "Материал обновлен",
      updateError: "Ошибка обновления",
      deleteMaterialConfirm: "Удалить этот материал?",
      deleteMaterialSuccess: "Материал удален",
      deleteGroupConfirm: "Удалить этот пакет и все файлы?",
      deleteGroupSuccess: "Пакет удален",
      deleteError: "Ошибка удаления",
      categoryRequired: "Заполните обязательные поля категории",
      categoryCreated: "Категория создана",
      categoryCreateError: "Ошибка создания категории",
      categoryUpdated: "Категория обновлена",
      categoryUpdateError: "Ошибка обновления",
      deleteCategoryConfirm: "Удалить эту категорию?",
      categoryDeleted: "Категория удалена",
      deleteCategoryError: "Ошибка удаления категории",
      categoryCreatedAndSelected: "Категория создана и выбрана",
      viewGrid: "Сетка",
      viewTable: "Таблица",
      editPrefix: "Редактировать",
      nameLabel: "Название",
      categoriesLabel: "Категории",
      activeLabel: "Активный",
      save: "Сохранить",
      cancel: "Отмена",
      edit: "Изменить",
      delete: "Удалить",
      deleteGroup: "Удалить пакет",
      back: "Назад",
      forward: "Вперед",
      paginationOf: "из",
      editCategory: "Редактировать категорию",
      createCategory: "Создать категорию",
      nameRuLabel: "Название (RU) *",
      nameKkLabel: "Название (KK)",
      update: "Обновить",
      create: "Создать",
      categoriesList: "Категории:",
      typeGroup: "Пакет",
      typeFile: "Файл",
      tableType: "Тип",
      tablePreview: "Превью",
      tableName: "Название",
      tableCategories: "Категории",
      tableSizeFiles: "Размер/Файлов",
      tableStatus: "Статус",
      tableActions: "Действия",
      statusActive: "Активный",
      statusInactive: "Неактивный",
      filesCount: "файлов",
      dropFiles: "Отпустите файлы",
      dropFilesOrClick: "Перетащите файлы сюда или нажмите",
      multipleWillZip: "Один или несколько — при нескольких будет ZIP",
      titleLabel: "Название",
      titlePackagePlaceholder: "Например: Плакаты по биологии",
      titleMaterialPlaceholder: "Название материала",
      categoriesRequired: "Категории *",
      noCategoryNeeded: "Нет нужной категории?",
      categoryNameRuPlaceholder: "Название (RU)",
      categoryNameKkPlaceholder: "Название (KK)",
      createQuick: "+ Создать",
      filesLabel: "Файлы",
      uploadButton: "Загрузить",
      uploadPackage: "Загрузить пакет",
      uploading: "Загрузка...",
    },
    photoPage: {
      title: "Генерация изображений",
      warningTitle: "Внимание: Изображение не сохраняется в истории",
      warningText: "Скачайте изображение сразу после генерации. Ссылка действительна только 1 час.",
      promptLabel: "Описание изображения",
      promptPlaceholder: "Например: Абай Кунанбаев читает книгу",
      promptHint: "Опишите детально, какое изображение вы хотите создать",
      enterPrompt: "Введите описание изображения",
      generationError: "Ошибка генерации изображения",
      generating: "Генерация...",
      generate: "Сгенерировать изображение",
      resultTitle: "Сгенерированное изображение",
      download: "Скачать изображение",
      openInNewTab: "Открыть в новой вкладке",
      errorLabel: "Ошибка генерации:",
      unknownError: "Неизвестная ошибка",
      insufficientTokensFormat: "Недостаточно токенов для генерации. Требуется: {cost}, доступно: {balance}",
    },
    qrGenerator: {
      title: "QR-генератор",
      subtitle: "Создавайте QR-коды для ссылок, текста или любой информации",
      textLabel: "Содержимое",
      textPlaceholder: "Введите URL, текст или любое содержимое...",
      sizeLabel: "Размер",
      errorCorrectionLabel: "Коррекция ошибок",
      errorCorrectionHint: "H = максимальная надежность, L = больше данных",
      fgColorLabel: "Цвет QR",
      bgColorLabel: "Фон",
      previewTitle: "Предпросмотр",
      downloadPNG: "Скачать PNG",
      downloadSVG: "Скачать SVG",
      emptyState: "Введите текст или URL для генерации QR-кода",
    },
    atZharys: {
      setup: {
        title: "Ат Жарыс",
        subtitle: "Интерактивная игра-викторина",
        topic: "Тема урока",
        topicPlaceholder: "Биография Абая Кунанбаева",
        grade: "Класс",
        gradePlaceholder: "7 класс",
        additionalInfo: "Дополнительная информация",
        additionalInfoPlaceholder: "Упор на 'Слова назидания'",
        teamsCount: "Количество команд",
        victoryCondition: "Условие победы",
        victoryConditionDescription: "Сколько правильных ответов нужно для финиша?",
        questionsCount: "Количество вопросов",
        language: "Язык",
        generate: "Сгенерировать игру",
        generating: "Генерация...",
        cost: "Стоимость: 10 токенов",
      },
      game: {
        blocked: "Заблокировано",
        questionsEnded: "Вопросы закончились",
        progress: "Прогресс",
        finish: "Финиш!",
      },
      victory: {
        title: "Победа!",
        winner: "Победитель:",
        playAgain: "Играть заново",
        goToLibrary: "В библиотеку",
      },
      errors: {
        required: "Заполните все обязательные поля",
        insufficientTokens: "Недостаточно токенов. Нужно 10 токенов.",
        invalidData: "Невалидные данные",
        generationError: "Ошибка генерации игры",
        auth: "Авторизуйтесь для создания игры",
      },
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
      loading: "Загрузка...",
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
          interactiveGames: "Интерактивные игры Wordwall",
          materials: "Полезные материалы",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Генерация фото",
          video: "Генерация видео",
          avatar: "Цифровой аватар",
          voiceover: "Озвучка ИИ",
          qrGenerator: "QR-генератор",
        },
        profile: "Профиль",
        settings: "Настройки",
        admin: "Админ панель",
      },
      header: {
        title: "Панель управления",
        subtitle: "Быстрый доступ ко всем функциям Sandu AI",
        logout: "Выйти",
      },
      libraryPage: {
        title: "Библиотека материалов",
        description: "Здесь будут курсы, наглядные пособия, интерактивные презентации и игры (Sketch Hub).",
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
          sandubot: "Sandu Bot — помощник по навигации и ответам на вопросы",
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
        taskTypesLabel: "Типы заданий (оставьте пустым — будет выбрано автоматически)",
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
        fillInBlank: "Заполнение пропусков",
      },
      taskTypes: {
        multiple_choice: "Тест (один/несколько ответов)",
        matching: "Соотнесение",
        fill_in_blank: "Заполнение пропусков",
        true_false: "Истина/Ложь",
        text_open: "Открытый вопрос / Задача",
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
        lessonType: "Тип урока",
        lessonTypeOptions: {
          new: "Жаңа сабақ",
          consolidation: "Бекіту",
          review: "Қайталау",
        },
        textbookImages: "Изображения учебника",
        textbookText: "Текст из учебника",
        preferredPlatform: "Предпочитаемая платформа",
        platformOptions: {
          kahoot: "Kahoot",
          bilimClass: "BilimClass",
          sanduAI: "SanduAI.kz",
          mentimeter: "Mentimeter",
          quizlet: "Quizlet",
          wordwall: "Wordwall",
          none: "Не указано",
        },
        language: "Язык ответа",
        languageOptions: {
          kazakh: "Қазақша",
          russian: "Русский",
        },
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
      placeholder: "Введите текст для озвучки (на казахском, русском или английском)...",
      voiceLabel: "Выберите голос",
      voiceFilterAll: "Все",
      voiceFilterFemale: "Женские",
      voiceFilterMale: "Мужские",
      voiceFilterNeutral: "Нейтральные",
      voiceSearchPlaceholder: "Поиск по имени",
      voicesLoading: "Загрузка голосов…",
      voicesLoadError: "Не удалось загрузить список голосов",
      voices: {
        roger: "Роджер — расслабленный, уверенный",
        sarah: "Сара — зрелая, внушающая доверие",
        laura: "Лора — энергичная, с характером",
        charlie: "Чарли — глубокий, уверенный, энергичный",
        george: "Джордж — тёплый, завораживающий",
        callum: "Каллум — хрипловатый, с изюминкой",
        river: "Ривер — спокойный, нейтральный",
        harry: "Гарри — напористый, волевой",
        liam: "Лиам — энергичный, современный",
        alice: "Элис — чёткий, располагающий",
        matilda: "Матильда — эрудированная, профессиональная",
        will: "Уилл — спокойный оптимист",
        jessica: "Джессика — игривый, яркий, тёплый",
        eric: "Эрик — мягкий, надёжный",
        bella: "Белла — профессиональная, яркая, тёплая",
        chris: "Крис — обаятельный, приземлённый",
        brian: "Бриан — глубокий, бархатный",
        daniel: "Даниэль — ровный диктор",
        lily: "Лили — бархатный, актёрский",
        adam: "Адам — доминантный, твёрдый",
        bill: "Билл — мудрый, зрелый",
      },
      charactersUsed: "Символов использовано",
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
        topic: "Тақырып (Тема)",
        direction: "Бағыты (Направление)",
        grade: "Сыныбы (Класс)",
        researchType: "Зерттеу түрі (Тип исследования)",
        experimental: "Тәжірибелік (Практический)",
        theoretical: "Теориялық (Теоретический)",
        subject: "Пәні (Предмет)",
        language: "Язык проекта",
        schoolName: "Мектеп атауы (Название школы)",
        schoolNamePlaceholder: "Например: СШ №1",
        supervisor: "Жетекші (Научный руководитель)",
        supervisorPlaceholder: "ФИО руководителя",
        city: "Қала/ауыл (Город/село)",
        cityPlaceholder: "Например: Алматы",
        userComment: "Факты / Комментарии (для практической части)",
        userCommentPlaceholder: "Например: Мы выращивали плесень 10 дней в темном шкафу и на солнце...",
        generate: "Сгенерировать проект",
      },
      wizard: {
        step1: "Создание плана",
        step2: "Просмотр плана",
        step3: "Генерация текста",
        step4: "Редактирование",
        createPlan: "Составить план",
        approvePlan: "Утвердить и начать писать",
        regenerateSection: "Перегенерировать секцию",
        regenerateCost: "3 токена",
        finalize: "Финализировать проект",
        progress: {
          introduction: "Генерация Введения...",
          chapter1: "Генерация I Главы...",
          chapter2: "Генерация II Главы...",
          conclusion: "Генерация Заключения...",
          complete: "Готово!",
        },
      },
      plan: {
        hypothesis: "Гипотеза",
        object: "Объект исследования",
        subjectField: "Предмет исследования",
        methods: "Методы",
        chapter1Title: "Название I Главы",
        chapter1Subsections: "Подразделы теории",
        chapter2Title: "Название II Главы",
        chapter2Subsections: "Подразделы практики",
        scientificNovelty: "Научная новизна",
        practicalSignificance: "Практическая значимость",
        edit: "Редактировать",
        save: "Сохранить",
      },
      results: {
        title: "Результат генерации",
        titlePage: "Титул парағы (Титульная страница)",
        annotation: "Аннотация",
        tableOfContents: "Мазмұны (Содержание)",
        introduction: "Кіріспе (Введение)",
        chapterTheory: "I тарау. Теориялық бөлім",
        chapterResearch: "II тарау. Зерттеу бөлімі",
        conclusion: "Қорытынды (Заключение)",
        references: "Пайдаланылған әдебиеттер тізімі (Список литературы)",
        appendix: "Қосымша (Приложение)",
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
    interactiveGames: {
      title: "Интерактивные игры Wordwall",
      subtitle: "Интерактивные образовательные игры для изучения различных предметов.",
      categories: {
        all: "Все",
        literacy: "Грамотность",
        math: "Математика",
        logic: "Логика",
        natural_science: "Естествознание",
        culture: "Культура",
        biology: "Биология",
        social_studies: "Обществознание",
        art: "Искусство",
        general: "Общее",
        other: "Другое",
      },
      back: "Назад к списку",
      open: "Открыть игру",
      fullscreen: "На весь экран",
    },
    footer: {
      ctaTitle: "Присоединиться к запуску Sandu AI",
      ctaSubtitle:
        "Оставьте email, чтобы первыми получить доступ к платформе для учителей.",
      ctaButton: "Записаться в список ожидания",
      emailPlaceholder: "Ваш email",
      rights: "Sandu AI. Все права защищены.",
      termsLink: "Пользовательское соглашение",
    },
    sandubot: {
      title: "Sandu Bot",
      placeholder: "Напишите вопрос или попросите помочь с навигацией. Например: «Нужен КМЖ»",
      inputPlaceholder: "Введите сообщение...",
      send: "Отправить",
      insufficientTokens: "Недостаточно токенов",
      thinking: "Думаю...",
    },
    aiPresentations: {
      title: "ИИ Презентации",
      subtitle: "Создавайте презентации с помощью искусственного интеллекта",
      create: "Создать презентацию",
      createSubtitle: "Введите тему или загрузите файл для генерации",
      contentLabel: "Тема / содержание",
      contentPlaceholder: "Например: «Урок по фотосинтезу для 7 класса: цель, понятия, примеры, мини-тест»",
      instructionsLabel: "Доп. инструкции (необязательно)",
      instructionsPlaceholder: "Например: «Добавь примеры, сделай стиль академическим, избегай сложных терминов»",
      slidesCount: "Кол-во слайдов",
      language: "Язык презентации",
      template: "Шаблон оформления",
      templateSubtitle: "Выберите стиль оформления для вашей презентации",
      format: "Формат файла",
      tone: "Тон",
      generate: "Создать презентацию",
      generating: "Создаём презентацию...",
      download: "Скачать файл",
      downloading: "Скачивание...",
      status: "Статус",
      noPresentations: "У вас пока нет презентаций. Создайте первую!",
      delete: "Удалить",
      deleteConfirm: "Вы уверены, что хотите удалить эту презентацию?",
      export: "Экспорт",
      editor: "Открыть в редакторе",
      outlines: "План презентации",
      outlinesSubtitle: "Редактируйте план и выберите макеты для слайдов",
      editOutline: "Нажмите для редактирования",
      addOutline: "Добавить пункт",
      removeOutline: "Удалить",
      prepareSlides: "Подготовить слайды",
      generateSlides: "Генерировать слайды",
      generatingSlides: "Генерация слайдов...",
      themes: "Темы",
      createTheme: "Создать тему",
      themeName: "Название темы",
      primaryColor: "Основной цвет",
      generateColors: "Сгенерировать палитру",
      fonts: "Шрифты",
      uploadFont: "Загрузить шрифт",
      images: "Изображения",
      generateImage: "Сгенерировать изображение",
      uploadImage: "Загрузить изображение",
      icons: "Иконки",
      searchIcons: "Поиск иконок",
      aiEdit: "ИИ-редактирование",
      aiEditPlaceholder: "Опишите, что нужно изменить на слайде...",
      undo: "Отменить",
      redo: "Повторить",
      slides: "слайдов",
      addSlide: "Добавить слайд",
      deleteSlide: "Удалить слайд",
      loading: "Загрузка...",
      error: "Ошибка",
      errorGeneration: "Не удалось создать презентацию. Попробуйте ещё раз.",
      back: "Назад",
      backToList: "К списку презентаций",
      webSearch: "Искать информацию в интернете",
      tableOfContents: "Добавить оглавление",
      titleSlide: "Добавить титульный слайд",
      selectLayout: "Выбрать макет",
      exportPptx: "Скачать PPTX",
      exportPdf: "Скачать PDF",
      statusPending: "Подготавливаем вашу презентацию...",
      statusProcessing: "ИИ создаёт слайды. Это займёт 1–2 минуты",
      statusCompleted: "Презентация готова!",
      statusError: "Произошла ошибка при генерации",
      tipMagic: "Создаём презентацию с помощью ИИ",
      tipAnalyzing: "Анализируем вашу тему для идеальных слайдов",
      tipOrganizing: "Структурируем информацию для максимального эффекта",
      tipVisuals: "Добавляем визуальные элементы для вовлечения аудитории",
      tipFinishing: "Почти готово! Финальные штрихи",
      layoutsCount: "макетов",
      selectTemplate: "Выбрать",
      selected: "Выбран",
      createdAt: "Создана",
      defaultBadge: "Рекомендуем",
      uploadTemplate: "Загрузить свой шаблон",
      uploadTemplateHint: "Загрузите .pptx файл для создания шаблона",
      langEnglish: "English",
      langRussian: "Русский",
      langKazakh: "Қазақша",
      errorTemplates: "Не удалось загрузить шаблоны",
      retry: "Попробовать ещё раз",
    },
    common: {
      brand: "Sandu AI",
      ru: "Русский",
      kk: "Қазақша",
    },
    cookieBanner: {
      message: "Мы используем cookies",
      learnMore: "Подробнее",
      accept: "Принять",
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
    materialsSection: {
      title: "Мұғалімге арналған пайдалы материалдар",
      subtitle: "Оқыту тиімділігін арттыруға арналған AI құралдары мен ресурстар.",
      items: [
        {
          title: "EduAide.ai",
          description: "Оқу материалдары мен сабақ жоспарларын жасауға арналған AI платформасы.",
          url: "https://www.eduaide.ai/",
          image: "/materials_section/eduaide_ai.png",
        },
        {
          title: "MagicSchool.ai",
          description: "Мұғалімдер мен оқушыларға арналған құралдары бар мектептерге арналған қауіпсіз AI платформасы.",
          url: "https://www.magicschool.ai/",
          image: "/materials_section/magic_school.png",
        },
        {
          title: "Canva AI",
          description: "Жасанды интеллект көмегімен визуалды контент жасау.",
          url: "https://www.canva.com/ai",
          image: "/materials_section/canva.png",
        },
        {
          title: "Мұғалім Talks 2025",
          description: "Заманауи білім беру технологияларын талқылауға арналған мұғалімдер конференциясы.",
          url: "https://www.youtube.com/watch?v=iZQ9uOLTiW8",
          image: "/materials_section/Teacher_Talks_2025.png",
        },
        {
          title: "ChatGPT",
          description: "Контент жасау және сұрақтарға жауап беруге арналған универсалды AI көмекшісі.",
          url: "https://chatgpt.com/",
          image: "/materials_section/chat_gpt.jpeg",
        },
        {
          title: "Grammarly",
          description: "Грамматиканы тексеру және жазуды жақсартуға арналған AI құралы.",
          url: "https://www.grammarly.com/",
          image: "/materials_section/grammarly.png",
        },
        {
          title: "Мұғалім Talks 2024",
          description: "Пайдалы материалдар мен талқылаулармен мұғалімдер конференциясының жазбасы.",
          url: "https://www.youtube.com/watch?v=OEF4GiBGh_A&t=191s",
          image: "/materials_section/Teacher_Talks_2024.jpg",
        },
        {
          title: "Bing Image Creator",
          description: "Жасанды интеллект көмегімен суреттер жасау.",
          url: "https://www.bing.com/images/create",
          image: "/materials_section/bing_image.png",
        },
        {
          title: "Synthesia",
          description: "Білім беру мақсатында AI аватарлармен бейнелер жасау.",
          url: "https://www.synthesia.io/",
          image: "/materials_section/video_ai.png",
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
        phoneLabel: "Телефон",
        emailLabel: "Email",
        passwordLabel: "Пароль",
        fullNameLabel: "Толық аты-жөні",
        submit: "Тіркелу",
        switchText: "Аккаунт бар ма? Кіру",
        phoneVerification: "Телефон растау",
        sendCode: "Код жіберу",
        verifyCode: "Кодты растау",
        codeSent: "Код {phone} нөміріне жіберілді",
        enterCode: "SMS-тен келген кодты енгізіңіз",
        codePlaceholder: "123456",
        invalidCode: "Қате код",
        resendCode: "Кодты қайта жіберу",
        phoneRequired: "Телефон міндетті",
        invalidPhoneFormat: "Телефон форматы қате. Халықаралық форматты қолданыңыз: +7...",
        stepIndicator: "{current}/{total} қадам",
        termsAgreement: "Тіркелу арқылы сіз Пайдаланушы келісімін қабылдайсыз",
        termsLink: "Пайдаланушы келісімі",
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
        invalidCredentials: "Логин немесе құпия сөз қате.",
        userExists: "Бұл email немесе телефон нөмірі қазірдің өзінде тіркелген.",
      },
      loading: "Жүктелуде...",
    },
    tokens: {
      balance: "Токен балансы",
      cost: "Бағасы",
      insufficient: "Токен жеткіліксіз",
      required: "Қажет",
      available: "Қолжетімді",
      loading: "Жүктелуде...",
      refresh: "Жаңарту",
      transactions: "Транзакциялар тарихы",
      subscription: "Жазылым",
      subscriptionStatus: "Жазылым мәртебесі",
      subscriptionActive: "Белсенді",
      subscriptionInactive: "Белсенді емес",
      subscriptionEnd: "Жазылым аяқталуы",
      subscriptionPlan: "Жазылым түрі",
      free: "Тегін",
      premium: "Премиум",
    },
    admin: {
      title: "Админ панелі",
      subtitle: "Пайдаланушылар мен токендерді басқару",
      usersList: "Пайдаланушылар тізімі",
      noUsers: "Пайдаланушылар табылмады",
      email: "Email",
      phone: "Телефон",
      fullName: "Аты-жөні",
      role: "Рөлі",
      balance: "Баланс",
      createdAt: "Тіркелген күні",
      actions: "Әрекеттер",
      addTokens: "Токен қосу",
      viewTransactions: "Транзакциялар",
      previous: "Артқа",
      next: "Алға",
      transactions: "Транзакциялар тарихы",
      close: "Жабу",
      noTransactions: "Транзакциялар жоқ",
      date: "Күні",
      operation: "Операция",
      amount: "Сома",
      description: "Сипаттама",
      addTokensTo: "Токен қосу",
      adding: "Қосылуда...",
      add: "Қосу",
      cancel: "Болдырмау",
      subscription: "Жазылым",
      addSubscription: "Жазылым беру",
      subscriptionDays: "Күн саны",
      subscriptionDaysPlaceholder: "30",
      subscriptionActive: "Белсенді",
      subscriptionInactive: "Белсенді емес",
      subscriptionEnd: "Аяқталуы",
      subscriptionPlan: "Түрі",
      searchPlaceholder: "Email немесе телефон нөмірі бойынша іздеу...",
      loadUsersError: "Пайдаланушыларды жүктеу қатесі",
      fillAllFields: "Барлық өрістерді толтырыңыз",
      tokensPositiveNumber: "Токен саны оң сан болуы керек",
      daysPositiveNumber: "Күн саны оң сан болуы керек",
      addTokensError: "Токен қосу қатесі",
      loadTransactionsError: "Транзакцияларды жүктеу қатесі",
      subscriptionError: "Жазылым беру қатесі",
      defaultTokenDescription: "Әкімші тарапынан токен қосу",
      subscriptionExtendNote: "Жазылым ағымдағы аяқталу күнінен ұзартылады",
      subscriptionNewNote: "Көрсетілген күн санына жаңа жазылым жасалады",
      total: "Барлығы",
      loading: "Жүктелуде...",
      selectedFile: "Таңдалған",
      videoTitleMaxLength: "Бейне атауы 255 таңбадан аспауы керек",
      deleteVideoError: "Бейне жою қатесі",
      videoUploadError: "Бейне жүктеу қатесі",
      videoUploadAuthError: "Жүктеу кезінде авторизация қатесі. Сервердегі Bunny CDN баптауларын тексеріңіз.",
      videoUploadAccessError: "Рұқсат жоқ. Әкімші құқығыңыз бар екеніне көз жеткізіңіз.",
      videoListLoadError: "Бейне тізімін жүктеу қатесі",
      syncError: "Мәртебелерді синхрондау қатесі",
      videos: {
        title: "Бейнелер",
        uploadVideo: "Бейне жүктеу",
        videoTitle: "Бейне атауы",
        videoTitlePlaceholder: "Бейне атауын енгізіңіз",
        selectFile: "Бейне файлын таңдаңыз",
        uploading: "Жүктелуде",
        processing: "Өңделуде",
        ready: "Дайын",
        error: "Қате",
        uploadProgress: "Жүктеу",
        status: "Мәртебе",
        upload: "Жүктеу",
        cancel: "Болдырмау",
        videosList: "Бейнелер тізімі",
        noVideos: "Бейнелер табылмады",
        refresh: "Жаңарту",
        syncStatuses: "Мәртебелерді синхрондау",
        syncing: "Синхрондау...",
        selectThumbnail: "Қаптаманы таңдаңыз (міндетті емес)",
        tableName: "Атауы",
        tableCreatedAt: "Жасалған күні",
        tableActions: "Әрекеттер",
        delete: "Жою",
        deleting: "Жойылуда...",
        deleteConfirmTitle: "Жоюды растау",
        deleteConfirmMessage: "Бейнені жоюды қалайсыз ба",
        deleteConfirmWarning: "Бұл әрекетті кері қайтару мүмкін емес. Бейне Bunny CDN мен деректер қорынан жойылады.",
        youtubeImportTitle: "YouTube-тен бейне импорттау",
        youtubeUrlLabel: "YouTube сілтемесі",
        youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... немесе https://youtu.be/...",
        youtubeVideoTitle: "Бейне атауы",
        youtubeVideoTitlePlaceholder: "Бейне атауын енгізіңіз",
        youtubeThumbnailLabel: "Алдын ала қарау (міндетті емес)",
        youtubeImporting: "YouTube-тен бейне импорттау...",
        youtubeImportButton: "YouTube-тен импорттау",
        youtubeImportError: "YouTube-тен бейне импорттау қатесі",
      },
      visuals: {
        title: "Көрнекі материалдар",
        subtitle: "Көрнекі материалдар мен категорияларды басқару",
        goToPage: "Басқаруға өту",
      },
      materials: {
        title: "Интерактивті презентациялар",
        subtitle: "Интерактивті презентацияларды жүктеу",
        goToPage: "Жүктеуге өту",
      },
    },
    videos: {
      title: "Бейне курстар",
      subtitle: "Оқу бейнелерін көру",
      noVideos: "Бейнелер табылмады",
      watch: "Көру",
      duration: "Ұзақтығы",
      uploaded: "Жүктелген",
      subscriptionRequired: "Жазылым қажет",
      subscriptionRequiredMessage: "Бейнелерді көру үшін белсенді жазылым қажет. Жазылымды рәсімдеу үшін әкімшіге хабарласыңыз.",
      loading: "Жүктелуде...",
      error: "Қате",
      videoNotReady: "Бейне өңделуде, кейінірек қайта көріңіз",
      videoNotFound: "Бейне табылмады",
      watchTokenError: "Көру токенін жүктеу қатесі",
      paginationOf: "/",
    },
    presentationsPage: {
      title: "Интерактивті презентациялар",
      subtitle: "Сынып пен пәні бойынша сүзгілеңіз.",
      filterByClassSubject: "Сынып пен пәні бойынша сүзгілеңіз.",
      searchPlaceholder: "Атау бойынша іздеу...",
      search: "Іздеу",
      subject: "Пәні",
      class: "Сынып",
      noItems: "Презентациялар табылмады",
      resetFilters: "Сүзгілерді қалпына келтіру",
      loading: "Жүктелуде...",
      back: "Артқа",
      next: "Алға",
      paginationOf: "/",
      subscriptionRequired: "Жазылым қажет",
      subscriptionRequiredMessage: "Интерактивті презентацияларды көру үшін белсенді жазылым қажет. Жазылымды рәсімдеу үшін әкімшіге хабарласыңыз.",
      premiumRequired: "Премиум жазылым қажет",
      premiumRequiredMessage: "Презентациялар тек премиум жазылымды пайдаланушыларға қолжетімді. Жазылымды рәсімдеу үшін әкімшіге хабарласыңыз.",
      downloadMaterial: "МАТЕРИАЛДЫ ЖҮКТЕУ",
      downloadFile: "Файлды жүктеу",
      downloadHint: "Материалды көру үшін жүктеңіз",
      previewUnavailable: "Бұл файл түрі үшін алдын ала қарау қолжетімсіз",
      download: "Жүктеу",
    },
    presentationsAdmin: {
      title: "Интерактивті презентациялар",
      subtitle: "Интерактивті презентацияларды Bunny CDN-ге жүктеу",
      uploadTitle: "Презентацияны жүктеу",
      nameLabel: "Атауы *",
      namePlaceholder: "Математика сабағы 5 сынып",
      subjectLabel: "Пәні",
      subjectPlaceholder: "Математика",
      classLabel: "Сынып",
      classPlaceholder: "5",
      coverLabel: "Қаптама (міндетті емес)",
      coverSelected: "Таңдалған",
      fileLabel: "Файл *",
      fileHint: "PPTX, PDF, Word, бейне, HTML5 (index.html)",
      addFileAndName: "Файл мен атауын қосыңыз",
      upload: "Жүктеу",
      uploading: "Жүктелуде...",
      toLibrary: "Кітапханаға",
      uploadedList: "Жүктелген презентациялар",
      loading: "Жүктелуде...",
      noItems: "Презентациялар әзірше жоқ",
      delete: "Жою",
      deleting: "Жойылуда...",
      deleteConfirm: "Презентацияны жойыңыз ба?",
      uploadSuccess: "Презентация сәтті жүктелді",
      deleteSuccess: "Презентация жойылды",
      uploadError: "Жүктеу қатесі",
      deleteError: "Жою қатесі",
      classSuffix: "сынып",
    },
    visualAidsPage: {
      title: "Көрнекіліктер",
      subtitle: "Визуалды материалдар, сызбалар мен плакаттар кітапханасы",
      searchPlaceholder: "Материалдарды іздеу...",
      search: "Іздеу",
      noItems: "Материалдар табылмады",
      resetFilters: "Сүзгілерді қалпына келтіру",
      loading: "Жүктелуде...",
      back: "Артқа",
      next: "Алға",
      paginationOf: "/",
      subscriptionRequired: "Жазылым қажет",
      subscriptionRequiredMessage: "Көрнекіліктерді көру үшін белсенді жазылым қажет. Жазылымды рәсімдеу үшін әкімшіге хабарласыңыз.",
    },
    visualAidsAdmin: {
      title: "Көрнекіліктерді басқару",
      subtitle: "Визуалды материалдарды жүктеу және өңдеу",
      tabMaterials: "Материалдар",
      tabCategories: "Категориялар",
      tabUpload: "Жүктеу",
      searchPlaceholder: "Іздеу...",
      search: "Іздеу",
      allCategories: "Барлық категориялар",
      loading: "Жүктелуде...",
      noItems: "Материалдар табылмады",
      loadError: "Материалдарды жүктеу қатесі",
      addFilesAndTitle: "Файлдар, атауы және категориялар қосыңыз",
      materialUploaded: "Материал жүктелді",
      groupCreated: "Пакет жасалды",
      uploadError: "Жүктеу қатесі",
      materialUpdated: "Материал жаңартылды",
      updateError: "Жаңарту қатесі",
      deleteMaterialConfirm: "Бұл материалды жоюды қалайсыз ба?",
      deleteMaterialSuccess: "Материал жойылды",
      deleteGroupConfirm: "Бұл пакетті және барлық файлдарды жоюды қалайсыз ба?",
      deleteGroupSuccess: "Пакет жойылды",
      deleteError: "Жою қатесі",
      categoryRequired: "Категорияның міндетті өрістерін толтырыңыз",
      categoryCreated: "Категория жасалды",
      categoryCreateError: "Категория жасау қатесі",
      categoryUpdated: "Категория жаңартылды",
      categoryUpdateError: "Жаңарту қатесі",
      deleteCategoryConfirm: "Бұл категорияны жоюды қалайсыз ба?",
      categoryDeleted: "Категория жойылды",
      deleteCategoryError: "Категорияны жою қатесі",
      categoryCreatedAndSelected: "Категория жасалды және таңдалды",
      viewGrid: "Тор",
      viewTable: "Кесте",
      editPrefix: "Өңдеу",
      nameLabel: "Атауы",
      categoriesLabel: "Категориялар",
      activeLabel: "Белсенді",
      save: "Сақтау",
      cancel: "Болдырмау",
      edit: "Өзгерту",
      delete: "Жою",
      deleteGroup: "Пакетті жою",
      back: "Артқа",
      forward: "Алға",
      paginationOf: "/",
      editCategory: "Категорияны өңдеу",
      createCategory: "Категория жасау",
      nameRuLabel: "Атауы (RU) *",
      nameKkLabel: "Атауы (KK)",
      update: "Жаңарту",
      create: "Жасау",
      categoriesList: "Категориялар:",
      typeGroup: "Пакет",
      typeFile: "Файл",
      tableType: "Түрі",
      tablePreview: "Алдын ала қарау",
      tableName: "Атауы",
      tableCategories: "Категориялар",
      tableSizeFiles: "Көлемі/Файлдар",
      tableStatus: "Мәртебе",
      tableActions: "Әрекеттер",
      statusActive: "Белсенді",
      statusInactive: "Белсенді емес",
      filesCount: "файл",
      dropFiles: "Файлдарды жіберіңіз",
      dropFilesOrClick: "Файлдарды осында сүйреңіз немесе басыңыз",
      multipleWillZip: "Бір немесе бірнеше — бірнешеуінде ZIP болады",
      titleLabel: "Атауы",
      titlePackagePlaceholder: "Мысалы: Биология бойынша плакаттар",
      titleMaterialPlaceholder: "Материал атауы",
      categoriesRequired: "Категориялар *",
      noCategoryNeeded: "Қажетті категория жоқ па?",
      categoryNameRuPlaceholder: "Атауы (RU)",
      categoryNameKkPlaceholder: "Атауы (KK)",
      createQuick: "+ Жасау",
      filesLabel: "Файлдар",
      uploadButton: "Жүктеу",
      uploadPackage: "Пакетті жүктеу",
      uploading: "Жүктелуде...",
    },
    photoPage: {
      title: "Сурет генерациясы",
      warningTitle: "Назар: Сурет тарихта сақталмайды",
      warningText: "Суретті генерациялағаннан кейін дереу жүктеңіз. Сілтеме тек 1 сағатқа жарамды.",
      promptLabel: "Сурет сипаттамасы",
      promptPlaceholder: "Мысалы: Абай Құнанбаев кітап оқып отыр",
      promptHint: "Қандай сурет жасағыңыз келетінін егжей-тегжейлі сипаттаңыз",
      enterPrompt: "Сурет сипаттамасын енгізіңіз",
      generationError: "Сурет генерациялау қатесі",
      generating: "Генерациялау...",
      generate: "Суретті генерациялау",
      resultTitle: "Генерацияланған сурет",
      download: "Суретті жүктеу",
      openInNewTab: "Жаңа қойындыда ашу",
      errorLabel: "Генерация қатесі:",
      unknownError: "Белгісіз қате",
      insufficientTokensFormat: "Генерация үшін токендер жеткіліксіз. Қажет: {cost}, қолжетімді: {balance}",
    },
    qrGenerator: {
      title: "QR-генератор",
      subtitle: "Сілтемелер, мәтін немесе кез-келген ақпарат үшін QR-код жасаңыз",
      textLabel: "Мазмұны",
      textPlaceholder: "URL, мәтін немесе кез-келген мазмұнды енгізіңіз...",
      sizeLabel: "Өлшемі",
      errorCorrectionLabel: "Қателерді түзету",
      errorCorrectionHint: "H = ең жоғары сенімділік, L = көп деректер",
      fgColorLabel: "QR түсі",
      bgColorLabel: "Фон",
      previewTitle: "Алдын ала көру",
      downloadPNG: "PNG жүктеу",
      downloadSVG: "SVG жүктеу",
      emptyState: "QR-код жасау үшін мәтін немесе URL енгізіңіз",
    },
    atZharys: {
      setup: {
        title: "Ат Жарыс",
        subtitle: "Интерактивті викторина ойыны",
        topic: "Сабақ тақырыбы",
        topicPlaceholder: "Абай Құнанбаевтың өмірбаяны",
        grade: "Сынып",
        gradePlaceholder: "7 сынып",
        additionalInfo: "Қосымша ақпарат",
        additionalInfoPlaceholder: "'Қара сөздер' бөліміне назар аудару",
        teamsCount: "Командалар саны",
        victoryCondition: "Жеңіс шарты",
        victoryConditionDescription: "Финишке жету үшін қанша дұрыс жауап керек?",
        questionsCount: "Сұрақтар саны",
        language: "Тіл",
        generate: "Ойынды генерациялау",
        generating: "Генерациялау...",
        cost: "Бағасы: 10 токен",
      },
      game: {
        blocked: "Бұғатталған",
        questionsEnded: "Сұрақтар аяқталды",
        progress: "Прогресс",
        finish: "Финиш!",
      },
      victory: {
        title: "Жеңіс!",
        winner: "Жеңімпаз:",
        playAgain: "Қайта ойнау",
        goToLibrary: "Кітапханаға",
      },
      errors: {
        required: "Барлық міндетті өрістерді толтырыңыз",
        insufficientTokens: "Токендер жеткіліксіз. 10 токен қажет.",
        invalidData: "Жарамсыз деректер",
        generationError: "Ойын генерациялау қатесі",
        auth: "Ойын жасау үшін авторизациядан өтіңіз",
      },
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
      loading: "Жүктелуде...",
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
          interactiveGames: "Wordwall Интерактивті ойындары",
          materials: "Пайдалы материалдар",
        },
        media: "Медиа",
        mediaItems: {
          photo: "Фото генерациясы",
          video: "Видео генерациясы",
          avatar: "Цифрлық аватар",
          voiceover: "ИИ дыбыстау",
          qrGenerator: "QR-генератор",
        },
        profile: "Профиль",
        settings: "Баптаулар",
        admin: "Админ панелі",
      },
      header: {
        title: "Басқару панелі",
        subtitle: "Sandu AI мүмкіндіктеріне жылдам қолжетімділік",
        logout: "Шығу",
      },
      libraryPage: {
        title: "Материалдар кітапханасы",
        description: "Мұнда курстар, көрнекіліктер, интерактивті презентациялар және ойындар (Sketch Hub) болады.",
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
          sandubot: "Sandu Bot — навигацияға және сұрақтарға көмекші",
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
        taskTypesLabel: "Тапсырма түрлері (бос қалдырсаңыз — автоматты түрде таңдалады)",
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
        fillInBlank: "Бос орындарды толтыру",
      },
      taskTypes: {
        multiple_choice: "Тест (бір/бірнеше жауап)",
        matching: "Сәйкестендіру",
        fill_in_blank: "Бос орындарды толтыру",
        true_false: "Ақиқат/Жалған",
        text_open: "Ашық сұрақ / Есеп",
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
        lessonType: "Сабақ түрі",
        lessonTypeOptions: {
          new: "Жаңа сабақ",
          consolidation: "Бекіту",
          review: "Қайталау",
        },
        textbookImages: "Оқулық суреттері",
        textbookText: "Оқулықтан мәтін",
        preferredPlatform: "Қалаған платформа",
        platformOptions: {
          kahoot: "Kahoot",
          bilimClass: "BilimClass",
          sanduAI: "SanduAI.kz",
          mentimeter: "Mentimeter",
          quizlet: "Quizlet",
          wordwall: "Wordwall",
          none: "Көрсетілмеген",
        },
        language: "Жауап тілі",
        languageOptions: {
          kazakh: "Қазақша",
          russian: "Орысша",
        },
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
      placeholder: "Дыбыстау үшін мәтінді енгізіңіз (қазақша, орысша немесе ағылшынша)...",
      voiceLabel: "Дауысты таңдаңыз",
      voiceFilterAll: "Барлығы",
      voiceFilterFemale: "Әйелдер",
      voiceFilterMale: "Ерлер",
      voiceFilterNeutral: "Бейтарап",
      voiceSearchPlaceholder: "Аты бойынша іздеу",
      voicesLoading: "Дауыстар жүктелуде…",
      voicesLoadError: "Дауыстар тізімін жүктеу мүмкін болмады",
      voices: {
        roger: "Роджер — босаң, сенімді",
        sarah: "Сара — жетілген, сенімді",
        laura: "Лора — қызу, ерекше мінез",
        charlie: "Чарли — терең, сенімді, қарқынды",
        george: "Джордж — жылы, тартымды",
        callum: "Каллум — дыбысы қалың, озық",
        river: "Ривер — тыныш, бейтарап",
        harry: "Гарри — күшті, ерлі",
        liam: "Лиам — қарқынды, заманауи",
        alice: "Элис — анық, тартымды",
        matilda: "Мәтилда — білімді, кәсіби",
        will: "Уилл — тыныш оптимист",
        jessica: "Джессика — ойнақы, жарқын, жылы",
        eric: "Эрик — жұмсақ, сенімді",
        bella: "Бәйше — кәсіби, жарқын, жылы",
        chris: "Крис — тартымды, қарапайым",
        brian: "Бриан — терең, ыңғайлы",
        daniel: "Даниэль — тұрақты диктор",
        lily: "Лили — жұмсақ, актерлік",
        adam: "Әділет — басым, қатты",
        bill: "Билл — дана, жетілген",
      },
      charactersUsed: "Пайдаланылған таңбалар",
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
        topic: "Тақырып",
        direction: "Бағыты",
        grade: "Сыныбы",
        researchType: "Зерттеу түрі",
        experimental: "Тәжірибелік",
        theoretical: "Теориялық",
        subject: "Пәні",
        language: "Жоба тілі",
        schoolName: "Мектеп атауы",
        schoolNamePlaceholder: "Мысалы: СШ №1",
        supervisor: "Жетекші",
        supervisorPlaceholder: "Жетекшінің аты-жөні",
        city: "Қала/ауыл",
        cityPlaceholder: "Мысалы: Алматы",
        userComment: "Фактілер / Пікірлер (практикалық бөлім үшін)",
        userCommentPlaceholder: "Мысалы: Біз зеңді 10 күн бойы қараңғы шкафта және күн сәулесінде өсірдік...",
        generate: "Жобаны генерациялау",
      },
      results: {
        title: "Генерация нәтижесі",
        titlePage: "Титул парағы",
        annotation: "Аннотация",
        tableOfContents: "Мазмұны",
        introduction: "Кіріспе",
        chapterTheory: "I тарау. Теориялық бөлім",
        chapterResearch: "II тарау. Зерттеу (тәжірибелік) бөлім",
        conclusion: "Қорытынды",
        references: "Пайдаланылған әдебиеттер тізімі",
        appendix: "Қосымша",
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
      wizard: {
        step1: "Жоспар жасау",
        step2: "Жоспарды қарау",
        step3: "Мәтін генерациялау",
        step4: "Өңдеу",
        createPlan: "Жоспар құру",
        approvePlan: "Бекіту және жазуды бастау",
        regenerateSection: "Бөлімді қайта генерациялау",
        regenerateCost: "3 токен",
        finalize: "Жобаны аяқтау",
        progress: {
          introduction: "Кіріспе генерациялануда...",
          chapter1: "I тарау генерациялануда...",
          chapter2: "II тарау генерациялануда...",
          conclusion: "Қорытынды генерациялануда...",
          complete: "Дайын!",
        },
      },
      plan: {
        hypothesis: "Болжам",
        object: "Зерттеу нысаны",
        subjectField: "Зерттеу пәні",
        methods: "Әдістер",
        chapter1Title: "I тарау атауы",
        chapter1Subsections: "Теориялық бөлімдер",
        chapter2Title: "II тарау атауы",
        chapter2Subsections: "Практикалық бөлімдер",
        scientificNovelty: "Ғылыми жаңалығы",
        practicalSignificance: "Практикалық маңызы",
        edit: "Өңдеу",
        save: "Сақтау",
        structure: "Құрылым",
        editPlan: "Жоспарды өңдеу",
      },
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
    interactiveGames: {
      title: "Wordwall Интерактивті ойындары",
      subtitle: "Әртүрлі пәндерді оқуға арналған интерактивті білім беру ойындары.",
      categories: {
        all: "Барлығы",
        literacy: "Сауаттылық",
        math: "Математика",
        logic: "Логика",
        natural_science: "Табиғи ғылым",
        culture: "Мәдениет",
        biology: "Биология",
        social_studies: "Әлеуметтану",
        art: "Өнер",
        general: "Жалпы",
        other: "Басқа",
      },
      back: "Тізімге оралу",
      open: "Ойынды ашу",
      fullscreen: "Толық экран",
    },
    footer: {
      ctaTitle: "Sandu AI іске қосылуына қосылыңыз",
      ctaSubtitle:
        "Платформаға алғашқылардың бірі болып қол жеткізу үшін email қалдырыңыз.",
      ctaButton: "Күту тізіміне жазылу",
      emailPlaceholder: "Email",
      rights: "Sandu AI. Барлық құқықтар қорғалған.",
      termsLink: "Пайдаланушы келісімі",
    },
    sandubot: {
      title: "Sandu Bot",
      placeholder: "Сұрақ жазыңыз немесе навигацияға көмек сұраңыз. Мысалы: «КМЖ керек»",
      inputPlaceholder: "Хабарламаны енгізіңіз...",
      send: "Жіберу",
      insufficientTokens: "Токендер жеткіліксіз",
      thinking: "Ойланып жатырмын...",
    },
    aiPresentations: {
      title: "ИИ Презентациялар",
      subtitle: "Жасанды интеллект көмегімен презентация жасаңыз",
      create: "Презентация жасау",
      createSubtitle: "Тақырыпты енгізіңіз немесе файл жүктеңіз",
      contentLabel: "Тақырып / мазмұны",
      contentPlaceholder: "Мысалы: «7-сынып фотосинтез сабағы: мақсат, ұғымдар, мысалдар, мини-тест»",
      instructionsLabel: "Қосымша нұсқаулар (міндетті емес)",
      instructionsPlaceholder: "Мысалы: «Мысалдар қосыңыз, академиялық стиль жасаңыз»",
      slidesCount: "Слайд саны",
      language: "Презентация тілі",
      template: "Безендіру шаблоны",
      templateSubtitle: "Презентацияңыз үшін безендіру стилін таңдаңыз",
      format: "Файл форматы",
      tone: "Тон",
      generate: "Презентация жасау",
      generating: "Презентация жасалып жатыр...",
      download: "Файлды жүктеу",
      downloading: "Жүктелуде...",
      status: "Күйі",
      noPresentations: "Сізде әзірше презентациялар жоқ. Біріншісін жасаңыз!",
      delete: "Жою",
      deleteConfirm: "Бұл презентацияны жойғыңыз келе ме?",
      export: "Экспорт",
      editor: "Редакторда ашу",
      outlines: "Презентация жоспары",
      outlinesSubtitle: "Жоспарды өзгертіңіз және макеттерді таңдаңыз",
      editOutline: "Өзгерту үшін басыңыз",
      addOutline: "Тармақ қосу",
      removeOutline: "Жою",
      prepareSlides: "Слайдтарды дайындау",
      generateSlides: "Слайдтарды генерациялау",
      generatingSlides: "Слайдтар генерацияланып жатыр...",
      themes: "Тақырыптар",
      createTheme: "Тақырып жасау",
      themeName: "Тақырып атауы",
      primaryColor: "Негізгі түс",
      generateColors: "Палитра генерациялау",
      fonts: "Қаріптер",
      uploadFont: "Қаріп жүктеу",
      images: "Суреттер",
      generateImage: "Сурет генерациялау",
      uploadImage: "Сурет жүктеу",
      icons: "Белгішелер",
      searchIcons: "Белгіше іздеу",
      aiEdit: "ИИ-редакциялау",
      aiEditPlaceholder: "Слайдта не өзгерту керек екенін сипаттаңыз...",
      undo: "Болдырмау",
      redo: "Қайтару",
      slides: "слайд",
      addSlide: "Слайд қосу",
      deleteSlide: "Слайдты жою",
      loading: "Жүктелуде...",
      error: "Қате",
      errorGeneration: "Презентация жасау мүмкін болмады. Қайтадан көріңіз.",
      back: "Артқа",
      backToList: "Презентациялар тізіміне",
      webSearch: "Интернеттен ақпарат іздеу",
      tableOfContents: "Мазмұн қосу",
      titleSlide: "Титулдық слайд қосу",
      selectLayout: "Макет таңдау",
      exportPptx: "PPTX жүктеу",
      exportPdf: "PDF жүктеу",
      statusPending: "Презентацияңыз дайындалып жатыр...",
      statusProcessing: "ИИ слайдтар жасап жатыр. 1–2 минут күтіңіз",
      statusCompleted: "Презентация дайын!",
      statusError: "Генерация кезінде қате болды",
      tipMagic: "ИИ көмегімен презентация жасалуда",
      tipAnalyzing: "Тақырыпты тамаша слайдтар үшін талдап жатырмыз",
      tipOrganizing: "Ақпаратты максималды әсер үшін құрылымдап жатырмыз",
      tipVisuals: "Аудиторияны тарту үшін визуал элементтер қосып жатырмыз",
      tipFinishing: "Дерлік дайын! Соңғы штрихтар",
      layoutsCount: "макет",
      selectTemplate: "Таңдау",
      selected: "Таңдалды",
      createdAt: "Жасалған",
      defaultBadge: "Ұсынамыз",
      uploadTemplate: "Өз шаблонын жүктеу",
      uploadTemplateHint: "Шаблон жасау үшін .pptx файлын жүктеңіз",
      langEnglish: "English",
      langRussian: "Орысша",
      langKazakh: "Қазақша",
      errorTemplates: "Шаблондарды жүктеу мүмкін болмады",
      retry: "Қайталап көріңіз",
    },
    common: {
      brand: "Sandu AI",
      ru: "Орысша",
      kk: "Қазақша",
    },
    cookieBanner: {
      message: "Біз cookie қолданамыз",
      learnMore: "Толығырақ",
      accept: "Қабылдау",
    },
  },
};

// Updated: Added exam translations for BJB/TJB functionality


