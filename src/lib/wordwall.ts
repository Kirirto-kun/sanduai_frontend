export type WordwallSubject = "literacy" | "math" | "logic" | "natural_science" | "culture" | "biology" | "social_studies" | "art" | "general" | "other";

export interface WordwallSimulation {
    id: string;
    title: {
      ru: string;
      kk: string;
    };
    subject: WordwallSubject;
    // Base URL pattern. Replaces {{lang}} with "ru" or "kk" (or "en" fallback).
    urlPattern: string; 
    thumbnail?: string;
  }

export const WORDWALL_SIMULATIONS: WordwallSimulation[] = [
        {
          "id": "literary-reading",
          "title": {
            "ru": "Литературное чтение",
            "kk": "Әдебиеттік оқу"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/dedf97ccd8fb458d86d7fd56c7e5ef3c?themeId=43&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/dedf97ccd8fb458d86d7fd56c7e5ef3c_43"
        },
        {
          "id": "sound-letter-zh",
          "title": {
            "ru": "Звук и буква Ж",
            "kk": "Ж дыбысы мен әрпі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/fdacff7ac6164f2eb38593119c9afc75?themeId=66&templateId=73&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/fdacff7ac6164f2eb38593119c9afc75_66"
        },
        {
          "id": "syllable-reading",
          "title": {
            "ru": "Чтение по слогам",
            "kk": "Буындап оқу"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/d898e90b701f4629831eea398e4c5512?themeId=65&templateId=70&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/d898e90b701f4629831eea398e4c5512_65"
        },
        {
          "id": "syllable",
          "title": {
            "ru": "Слог",
            "kk": "Буын"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/0bda534236ad4ae187c0b007948cdaa2?themeId=66&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/0bda534236ad4ae187c0b007948cdaa2_66"
        },
        {
          "id": "grade-1-lesson-1",
          "title": {
            "ru": "1 класс 1 урок",
            "kk": "1 сынып 1 сабақ"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/7cfaa54010b2444da857b3693a4ed685?themeId=1&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/7cfaa54010b2444da857b3693a4ed685_0"
        },
        {
          "id": "guess-it",
          "title": {
            "ru": "Угадай-ка",
            "kk": "Тауып көр"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/31c911a0aa2642acaf188de475cc8db7?themeId=1&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/31c911a0aa2642acaf188de475cc8db7_0"
        },
        {
          "id": "remember-again",
          "title": {
            "ru": "Запомни еще раз",
            "kk": "Есте сақта тағы"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/f06fb0974ff044f0a973223b270c2352?themeId=49&templateId=23&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/f06fb0974ff044f0a973223b270c2352_49"
        },
        {
          "id": "memory-exercise",
          "title": {
            "ru": "Упражнение для развития памяти",
            "kk": "Есте сақтау қабілеті төмен оқушыларға арналған жаттығу"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8201ee0d50c94aceab8cc9264c1c7e1a?themeId=61&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8201ee0d50c94aceab8cc9264c1c7e1a_61"
        },
        {
          "id": "multiple-comparison",
          "title": {
            "ru": "Кратное сравнение",
            "kk": "Еселік салыстыру"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/59b8ab78b6bb48c780ff83e9125d6e8a?themeId=1&templateId=3&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/59b8ab78b6bb48c780ff83e9125d6e8a_0"
        },
        {
          "id": "math-2digit-add-sub",
          "title": {
            "ru": "Сложение и вычитание двузначных чисел",
            "kk": "Математика екі таңбалы сандарды қосу және азайту"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/79e7afd3bebe4fd9b062d50b6f090ab3?themeId=42&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/79e7afd3bebe4fd9b062d50b6f090ab3_42"
        },
        {
          "id": "oral-add-sub-tens",
          "title": {
            "ru": "Устное сложение и вычитание десятками",
            "kk": "Ондықтармен ауызша қосу және азайту"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/b2cc637a19b74404a3b7db7bcac61e43?themeId=21&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/b2cc637a19b74404a3b7db7bcac61e43_21"
        },
        {
          "id": "verbs-simple-complex",
          "title": {
            "ru": "Простые и сложные глаголы",
            "kk": "Дара және күрделі етістік"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/563f8b3ca9a5497eb176321dfbe907fa?themeId=51&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/563f8b3ca9a5497eb176321dfbe907fa_51"
        },
        {
          "id": "numbers-11-20",
          "title": {
            "ru": "Числа от 11 до 20",
            "kk": "11-ден 20-ға дейінгі сандар"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/13fe218d300d466880284e55f167c647?themeId=1&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/13fe218d300d466880284e55f167c647_0"
        },
        {
          "id": "lesson-60-native-language",
          "title": {
            "ru": "60 урок родной язык",
            "kk": "60 сабақ ана тілі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/a2abb004dad64ad1ae4a9cc4d6563e72?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/a2abb004dad64ad1ae4a9cc4d6563e72_0"
        },
        {
          "id": "natural-phenomena",
          "title": {
            "ru": "Природные явления",
            "kk": "Табиғат құбылыстары"
          },
          "subject": "natural_science",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/4c01d64c5e9c4801a1055d76833c8b30?themeId=51&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/4c01d64c5e9c4801a1055d76833c8b30_52"
        },
        {
          "id": "find-offspring",
          "title": {
            "ru": "Найди детенышей",
            "kk": "Төлдерін,балаларын тап"
          },
          "subject": "natural_science",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/17ab82e5dd7c48808c0bb8279f45118a?themeId=41&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/17ab82e5dd7c48808c0bb8279f45118a_41"
        },
        {
          "id": "national-games-items",
          "title": {
            "ru": "Национальные игры и предметы",
            "kk": "Ұлттық ойындар мен соған қатысты заттарды қос"
          },
          "subject": "culture",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/bf84a9a27d354c5dbc52b38f84e254b9?themeId=52&templateId=88&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/bf84a9a27d354c5dbc52b38f84e254b9_52"
        },
        {
          "id": "find-national-dishes",
          "title": {
            "ru": "Найди национальные блюда",
            "kk": "Ұлттық тағамдарды тап"
          },
          "subject": "culture",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/85d2db5d8bbf42f3ac0a94eaec6250d4?themeId=21&templateId=69&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/85d2db5d8bbf42f3ac0a94eaec6250d4_0"
        },
        {
          "id": "national-games",
          "title": {
            "ru": "Национальные игры",
            "kk": "Ұлттық ойындар"
          },
          "subject": "culture",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/505ea1e519094945b045449e48dd07f3?themeId=51&templateId=70&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/505ea1e519094945b045449e48dd07f3_51"
        },
        {
          "id": "national-dishes",
          "title": {
            "ru": "Национальные блюда",
            "kk": "Ұлттық тағамдар"
          },
          "subject": "culture",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8c6121c9b9764caa830f29ff62bb48de?themeId=65&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8c6121c9b9764caa830f29ff62bb48de_0"
        },
        {
          "id": "brain-hemispheres",
          "title": {
            "ru": "Мозг. Большие полушария",
            "kk": "Ми. Үлкен ми сыңарлары"
          },
          "subject": "biology",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/67dfa5a1d886497a91d33ece150ff712?themeId=23&templateId=22&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/67dfa5a1d886497a91d33ece150ff712_23b"
        },
        {
          "id": "math-grade-3-multiplication",
          "title": {
            "ru": "Математика 3 класс. Умножение",
            "kk": "Математика 3 сынып Көбейту"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/aca06ad05f1142579147c171b80ce27c?themeId=46&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/aca06ad05f1142579147c171b80ce27c_46"
        },
        {
          "id": "adjective",
          "title": {
            "ru": "Имя прилагательное",
            "kk": "Сын есім"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/93a2d00044514c55a6ea824684dfde1f?themeId=1&templateId=78&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/93a2d00044514c55a6ea824684dfde1f_0"
        },
        {
          "id": "numerals-cardinal-ordinal",
          "title": {
            "ru": "Количественные и порядковые числительные",
            "kk": "Есептік және реттік сан есім"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/fa4ef58c57794647a1429a0063fd1645?themeId=57&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/fa4ef58c57794647a1429a0063fd1645_57"
        },
        {
          "id": "adjectives-basic-derivative",
          "title": {
            "ru": "Непроизводные и производные прилагательные",
            "kk": "Негізгі және туынды сын есім"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/530f908717fc433f9edf0b48963540d3?themeId=50&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/530f908717fc433f9edf0b48963540d3_50"
        },
        {
          "id": "parts-of-speech-grade-3",
          "title": {
            "ru": "Части речи 3 класс",
            "kk": "Қазақ тілі 3 сынып Сөз таптары"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/45f0e13dae9f442d8691c7703765fbc2?themeId=21&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/45f0e13dae9f442d8691c7703765fbc2_21"
        },
        {
          "id": "abbreviations",
          "title": {
            "ru": "Сокращенные слова",
            "kk": "Қысқарған сөздер"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/bd55c7f7e17a4eabadb57b3698bc3554?themeId=64&templateId=76&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/bd55c7f7e17a4eabadb57b3698bc3554_64"
        },
        {
          "id": "paired-words",
          "title": {
            "ru": "Парные слова",
            "kk": "Қос сөздер"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/59e421c42a534e4caa969af6be017fa7?themeId=53&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/59e421c42a534e4caa969af6be017fa7_53"
        },
        {
          "id": "compound-words-grade-4",
          "title": {
            "ru": "Сложные слова 4 класс",
            "kk": "Біріккен сөздер 4 СЫНЫП"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/9b141f8c925645cd98be2cb26bb98f3a?themeId=43&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/9b141f8c925645cd98be2cb26bb98f3a_43"
        },
        {
          "id": "compound-words-grade-4-kazakh",
          "title": {
            "ru": "Сложные слова 4 класс (Каз)",
            "kk": "Біріккен сөздер 4-сынып қазақ тілі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/eff76461d5a342c7b419728f5be39c56?themeId=48&templateId=10&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/eff76461d5a342c7b419728f5be39c56_48"
        },
        {
          "id": "idioms",
          "title": {
            "ru": "Фразеологизмы",
            "kk": "Тұрақты сөз тіркестері"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/39fe83e99bfb419fba0de211d566cc74?themeId=48&templateId=3&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/39fe83e99bfb419fba0de211d566cc74_48"
        },
        {
          "id": "homogeneous-members",
          "title": {
            "ru": "Однородные члены",
            "kk": "Біріңғай мүшелер"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/93e8c86145034e0d96096951ba1b971e?themeId=21&templateId=69&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/93e8c86145034e0d96096951ba1b971e_0"
        },
        {
          "id": "cube-grade-3",
          "title": {
            "ru": "Куб 3 класс",
            "kk": "Текше 3 сынып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/08c97fc0bc3b4477b0338d7b4ce44135?themeId=21&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/08c97fc0bc3b4477b0338d7b4ce44135_21"
        },
        {
          "id": "complex-words",
          "title": {
            "ru": "Сложные слова",
            "kk": "Күрделі сөздер"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/c7fde809234743e5814784e5a9617ec8?themeId=46&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/c7fde809234743e5814784e5a9617ec8_46"
        },
        {
          "id": "productivity-grade-4",
          "title": {
            "ru": "Производительность 4 класс",
            "kk": "Өнімділік 4 сыгып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/4aef3daeb9d040c0a984b8accedd99c9?themeId=45&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/4aef3daeb9d040c0a984b8accedd99c9_45"
        },
        {
          "id": "subject-predicate",
          "title": {
            "ru": "Подлежащее и сказуемое",
            "kk": "Бастауыш пен баяндауышты"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/b797b3c750514116834479dd038d314b?themeId=21&templateId=69&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/b797b3c750514116834479dd038d314b_21"
        },
        {
          "id": "km-mm",
          "title": {
            "ru": "Километр. Миллиметр",
            "kk": "Километр. Миллиметр"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/a903ffcd859243e6b7a79cac4079a4b1?themeId=45&templateId=36&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/a903ffcd859243e6b7a79cac4079a4b1_45"
        },
        {
          "id": "fractions-grade-3",
          "title": {
            "ru": "Доли и дроби 3 класс",
            "kk": "Математика 3 сынып Үлес және бөлшек"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/da1118e6515e41e19552909867b80f57?themeId=62&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/da1118e6515e41e19552909867b80f57_62"
        },
        {
          "id": "sentence-parts",
          "title": {
            "ru": "Члены предложения",
            "kk": "Сөйлем мүшелері"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2185b3c3bd9941d4b7fb79b8667353fb?themeId=1&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2185b3c3bd9941d4b7fb79b8667353fb_0"
        },
        {
          "id": "root-suffix",
          "title": {
            "ru": "Корень и окончание",
            "kk": "Түбір мен қосымша"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/257abb790e5d4351989388bd3a929b40?themeId=2&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/257abb790e5d4351989388bd3a929b40_2"
        },
        {
          "id": "mass-kg-g",
          "title": {
            "ru": "Масса (кг и г) 3 класс",
            "kk": "Масса(кг и г) килограмм и грамм 3 кл"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/93f17934ad284d14a4829efdbc4b26b6?themeId=46&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/93f17934ad284d14a4829efdbc4b26b6_46"
        },
        {
          "id": "interrogative-sentence",
          "title": {
            "ru": "Вопросительное предложение",
            "kk": "Сұраулы сөйлем"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8a31c7a1a7e44999bee0669f969f71bf?themeId=55&templateId=35&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8a31c7a1a7e44999bee0669f969f71bf_55"
        },
        {
          "id": "sentence-types",
          "title": {
            "ru": "Виды предложений",
            "kk": "Сөйлем түрлері"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/fad7fc73aebd4ac59e9a4f2d85779213?themeId=44&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/fad7fc73aebd4ac59e9a4f2d85779213_44"
        },
        {
          "id": "multiplication-division",
          "title": {
            "ru": "Умножение и деление",
            "kk": "Көбейту және бөлу"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/7d0ce7ab121842cda1b149625e752b89?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/7d0ce7ab121842cda1b149625e752b89_0"
        },
        {
          "id": "true-false",
          "title": {
            "ru": "Истина Ложь",
            "kk": "Ақиқат жалған"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/0d467c4d8740492e8ba56f0e4334c084?themeId=49&templateId=35&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/0d467c4d8740492e8ba56f0e4334c084_49"
        },
        {
          "id": "length",
          "title": {
            "ru": "Длина",
            "kk": "Ұзындық"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/f363ad6063594b399fca2583aa402e6c?themeId=48&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/f363ad6063594b399fca2583aa402e6c_48"
        },
        {
          "id": "time-units-grade-2",
          "title": {
            "ru": "Единицы времени 2 класс",
            "kk": "Уақыт бірліктері 2 сынып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/0c4c1050dddd4ed29045de6a30a10937?themeId=43&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/0c4c1050dddd4ed29045de6a30a10937_43"
        },
        {
          "id": "time",
          "title": {
            "ru": "Время",
            "kk": "Уақыт"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/3ac291e616184c5aa22b78e5b7c6f238?themeId=54&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/3ac291e616184c5aa22b78e5b7c6f238_54"
        },
        {
          "id": "roman-numerals",
          "title": {
            "ru": "Римские цифры",
            "kk": "Сандарды рим цифрмен жазу"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/1fc3b57b26ed4dff8d87de93a50deca1?themeId=42&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/1fc3b57b26ed4dff8d87de93a50deca1_42"
        },
        {
          "id": "add-sub-tens-v2",
          "title": {
            "ru": "Устное сложение и вычитание десятками (2)",
            "kk": "Ондықтармен ауызша қосу және азайту"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/b8ae985fa06d43be806efc3e9c469287?themeId=41&templateId=76&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/b8ae985fa06d43be806efc3e9c469287_0"
        },
        {
          "id": "add-sub-tens-v3",
          "title": {
            "ru": "Устное сложение и вычитание десятками (3)",
            "kk": "Ондықтармен ауызша қосу және азайту"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/9e772a7d84034645b25543b56792e5ff?themeId=1&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/9e772a7d84034645b25543b56792e5ff_0"
        },
        {
          "id": "seasons",
          "title": {
            "ru": "Времена года",
            "kk": "Жыл мезгілдері"
          },
          "subject": "natural_science",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/9054907e5f1446b29468d776e5ee017f?themeId=27&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/9054907e5f1446b29468d776e5ee017f_27"
        },
        {
          "id": "math-grade-1",
          "title": {
            "ru": "Математика 1 класс",
            "kk": "математика 1 СЫНЫП"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/3121f6c74c70479180c6efd82dfdad57?themeId=21&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/3121f6c74c70479180c6efd82dfdad57_21"
        },
        {
          "id": "letters-i-yu-ya",
          "title": {
            "ru": "Буквы И, Ю, Я",
            "kk": "И, Ю , Я әріпі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/4c9d34ee2bf94ca8a67894ce4f5277ca?themeId=1&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/4c9d34ee2bf94ca8a67894ce4f5277ca_0"
        },
        {
          "id": "letter-o-kaz",
          "title": {
            "ru": "Буква Ө",
            "kk": "Ө әрпі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/66a97a1a8df7439db4b371ed3a352c6b?themeId=56&templateId=3&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/66a97a1a8df7439db4b371ed3a352c6b_56"
        },
        {
          "id": "letter-u-kaz",
          "title": {
            "ru": "Буква Ү",
            "kk": "Ү әріпі"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/38d08ab240454b72b5548dbea1054086?themeId=45&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/38d08ab240454b72b5548dbea1054086_45"
        },
        {
          "id": "place-letters",
          "title": {
            "ru": "Расставь буквы",
            "kk": "Әріптерді орнына қой"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8b88ac613ceb4c22aa58130c5a1eadf2?themeId=46&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8b88ac613ceb4c22aa58130c5a1eadf2_46"
        },
        {
          "id": "math-grade-1-ru",
          "title": {
            "ru": "Математика 1 класс",
            "kk": "математика 1 класс"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/6733f5ebb10945c4a97d669e0f7f752e?themeId=55&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/6733f5ebb10945c4a97d669e0f7f752e_55"
        },
        {
          "id": "composition-10",
          "title": {
            "ru": "Состав числа 10",
            "kk": "10 санының құрамы"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/33f4313b250d40879f2066998c6d38a6?themeId=61&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/33f4313b250d40879f2066998c6d38a6_61"
        },
        {
          "id": "multiplication-table",
          "title": {
            "ru": "Таблица умножения",
            "kk": "Көбейту кестесі"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/233a50318b604a8f9fa26832f18c064b?themeId=58&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/233a50318b604a8f9fa26832f18c064b_58"
        },
        {
          "id": "seasons-2",
          "title": {
            "ru": "Времена года (2)",
            "kk": "Жыл мезгілдері"
          },
          "subject": "natural_science",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/b35e8d2f05454fec840e4ef6d6311c0c?themeId=57&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/b35e8d2f05454fec840e4ef6d6311c0c_57"
        },
        {
          "id": "composition-7",
          "title": {
            "ru": "Состав числа 7",
            "kk": "7 санының құрамы"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2a6cbbdd5727443e9ead857cd6764bed?themeId=1&templateId=45&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2a6cbbdd5727443e9ead857cd6764bed_1"
        },
        {
          "id": "composition-8",
          "title": {
            "ru": "Состав числа 8",
            "kk": "8 санының құрамы"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/376490acd7d44c9bbacef8e44ef64de2?themeId=23&templateId=45&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/376490acd7d44c9bbacef8e44ef64de2_23b"
        },
        {
          "id": "arrange-letters",
          "title": {
            "ru": "Упорядочить буквы",
            "kk": "Әріптерді реттестір"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/567ee9185f834fe8930a1d0effa3598b?themeId=41&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/567ee9185f834fe8930a1d0effa3598b_41"
        },
        {
          "id": "untitled-50",
          "title": {
            "ru": "Безымянный50",
            "kk": "Безымянный50"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/53d44844544c4d0bb40da1b9e3d9c962?themeId=49&templateId=69&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/53d44844544c4d0bb40da1b9e3d9c962_49"
        },
        {
          "id": "numbers-game-kinder",
          "title": {
            "ru": "Игра с числами для детсада",
            "kk": "Сандарға ойын балабақша"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/fb197c7502c84658aeda9feeee729771?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/fb197c7502c84658aeda9feeee729771_22"
        },
        {
          "id": "high-low-copy",
          "title": {
            "ru": "Высокий/низкий (копия)",
            "kk": "Копия биік/аласа"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/bc9cb6e1d1d847ffb276810701166f0e?themeId=23&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/bc9cb6e1d1d847ffb276810701166f0e_23b"
        },
        {
          "id": "numbers",
          "title": {
            "ru": "Числа",
            "kk": "Сандар"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8675f58167ff490bbed5d819cb38c8b9?themeId=1&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8675f58167ff490bbed5d819cb38c8b9_0"
        },
        {
          "id": "shapes-kinder",
          "title": {
            "ru": "Фигуры для садика",
            "kk": "Пішіндер садик"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/d9b4d1b5fa9c41fa90381a161d22a467?themeId=53&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/d9b4d1b5fa9c41fa90381a161d22a467_53"
        },
        {
          "id": "shapes-kinder-2",
          "title": {
            "ru": "Фигуры для детского сада",
            "kk": "Пішіндер балабақшаға"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/1fa60d303d1247ee8ccb05164c4b29a2?themeId=46&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/1fa60d303d1247ee8ccb05164c4b29a2_46"
        },
        {
          "id": "add-sub-grade-1",
          "title": {
            "ru": "Сложение и вычитание 1 класс",
            "kk": "Қосу және азайту 1 сынып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/1259a869793249ecbb8a66556c3c93b5?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/1259a869793249ecbb8a66556c3c93b5_0"
        },
        {
          "id": "compare-grade-3",
          "title": {
            "ru": "Сравни 3 класс",
            "kk": "Салыстыр 3 сынып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/6d0d4b8c4e8b413da3cf7e961f647dc3?themeId=1&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/6d0d4b8c4e8b413da3cf7e961f647dc3_0"
        },
        {
          "id": "comparison-grade-3",
          "title": {
            "ru": "Сравнение 3 класс",
            "kk": "Салыстыру 3 сынып"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2c67945237f34ae893e6a8d3898a4e0d?themeId=1&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2c67945237f34ae893e6a8d3898a4e0d_0"
        },
        {
          "id": "vowels-consonants",
          "title": {
            "ru": "Гласные и согласные звуки 1 класс",
            "kk": "Дауысты және дауыссыз дыбыстар 1 сынып әріптер"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/02abb17a4f1a40c192ec51a43a83ec52?themeId=60&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/02abb17a4f1a40c192ec51a43a83ec52_60"
        },
        {
          "id": "parts-of-speech-grade-4",
          "title": {
            "ru": "Части речи 4 класс",
            "kk": "Сөз таптары 4-сынып"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/ec641778a2ba4679b0bda2c73fde5af4?themeId=1&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/ec641778a2ba4679b0bda2c73fde5af4_0"
        },
        {
          "id": "fairies",
          "title": {
            "ru": "Феи",
            "kk": "Перілер"
          },
          "subject": "other",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/b310eca3c5a546e0a6822d9dd380fce7?themeId=26&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/b310eca3c5a546e0a6822d9dd380fce7_26b"
        },
        {
          "id": "speaking-portraits",
          "title": {
            "ru": "Говорящие портреты",
            "kk": "Портреттер сөйлейді"
          },
          "subject": "culture",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/0c162dc12621443896d1f8d191d0c95b?themeId=2&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/0c162dc12621443896d1f8d191d0c95b_2"
        },
        {
          "id": "grade-1-wheel",
          "title": {
            "ru": "Колесо 1 класс",
            "kk": "1-сынып дөңгелегі"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/5ecd1890b7fc471a8190db902c1df66e?themeId=21&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/5ecd1890b7fc471a8190db902c1df66e_21"
        },
        {
          "id": "how-to-remember",
          "title": {
            "ru": "Как мы запоминаем",
            "kk": "есте қалай сақтаймыз"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2eb394b6577b4ebda42eadc1c64900f3?themeId=65&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2eb394b6577b4ebda42eadc1c64900f3_0"
        },
        {
          "id": "name-colors",
          "title": {
            "ru": "Назови цвета",
            "kk": "Түстерді ата"
          },
          "subject": "art",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/229487adfdfb4308a236007bc3434722?themeId=50&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/229487adfdfb4308a236007bc3434722_50"
        },
        {
          "id": "wheel-mad",
          "title": {
            "ru": "Колесо МАД",
            "kk": "Колесо МАД"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/c5f494b7ff3d4936b065dc770c10a4ba?themeId=51&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/c5f494b7ff3d4936b065dc770c10a4ba_51"
        },
        {
          "id": "finish-text",
          "title": {
            "ru": "Закончи текст",
            "kk": "Мәтінді аяқта"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/c5516be1de644e87a12bbb92cdbb349b?themeId=52&templateId=36&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/c5516be1de644e87a12bbb92cdbb349b_52"
        },
        {
          "id": "solve-problems",
          "title": {
            "ru": "Решение задач",
            "kk": "Есеп шығару"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/81ad73355f914da5b329e12026ae14cc?themeId=46&templateId=82&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/81ad73355f914da5b329e12026ae14cc_46"
        },
        {
          "id": "find-correct-answer",
          "title": {
            "ru": "Найди правильный ответ",
            "kk": "Есептің дұрыс жауабын тап"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/e0e2a7fd50d3490babe5b64aec3d7cf5?themeId=1&templateId=81&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/e0e2a7fd50d3490babe5b64aec3d7cf5_0"
        },
        {
          "id": "improve-memory",
          "title": {
            "ru": "Улучшение памяти",
            "kk": "ЕСКЕ САҚТАУ ҚАБІЛЕТІН АРТТЫРУ"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/64e1ebd5f46546ffbdc28c2f44d0cab7?themeId=52&templateId=23&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/64e1ebd5f46546ffbdc28c2f44d0cab7_52"
        },
        {
          "id": "crossword-grade-1",
          "title": {
            "ru": "Кроссворд 1 класс",
            "kk": "1-сынып кроссворд"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/60e1db1f3bc1441ab6fd5f60d542e427?themeId=1&templateId=11&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/60e1db1f3bc1441ab6fd5f60d542e427_0"
        },
        {
          "id": "solve-problems-2",
          "title": {
            "ru": "Решение задач (2)",
            "kk": "Есеп шығару"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/f5592fce9e4c4af2a2932c3d56d6d586?themeId=26&templateId=8&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/f5592fce9e4c4af2a2932c3d56d6d586_26b"
        },
        {
          "id": "anagram",
          "title": {
            "ru": "Анаграмма",
            "kk": "Анаграмма"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/0dae94cf624749d3bc5ee7995cc3f1a7?themeId=2&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/0dae94cf624749d3bc5ee7995cc3f1a7_2"
        },
        {
          "id": "find-single-digit",
          "title": {
            "ru": "Найди однозначные числа",
            "kk": "Бір таңбалы сандарды тап"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/e850f4535eaa41b8b01d50d285b221eb?themeId=6&templateId=45&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/e850f4535eaa41b8b01d50d285b221eb_6"
        },
        {
          "id": "copy-grade-1",
          "title": {
            "ru": "Копия 1 класс",
            "kk": "Копия 1 сынып"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/92220816141b4f73bfd747b70de2c283?themeId=65&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/92220816141b4f73bfd747b70de2c283_0"
        },
        {
          "id": "composition-5",
          "title": {
            "ru": "Состав числа 5 (копия)",
            "kk": "Копия Состав числа 5"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/af2824f1ba204a1eafb44ff6c1b7c7ba?themeId=1&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/af2824f1ba204a1eafb44ff6c1b7c7ba_0"
        },
        {
          "id": "find-same",
          "title": {
            "ru": "Найди одинаковые",
            "kk": "Бірдейлерді тап"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/d30bf30aaa9c4e1b93e00f0ef797aa40?themeId=65&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/d30bf30aaa9c4e1b93e00f0ef797aa40_0"
        },
        {
          "id": "solve-correctly",
          "title": {
            "ru": "Реши без ошибок",
            "kk": "Есепті қатесіз шығарайық"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/da7a768f6d354856a5013b2adb6bbfa2?themeId=50&templateId=46&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/da7a768f6d354856a5013b2adb6bbfa2_50"
        },
        {
          "id": "reach-answer",
          "title": {
            "ru": "Доберись до ответа",
            "kk": "Жауапқа еш кедергісіз жет"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/48dab616f88548e7b1ee11162c5bc2d1?themeId=26&templateId=49&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/48dab616f88548e7b1ee11162c5bc2d1_26b"
        },
        {
          "id": "untitled-1",
          "title": {
            "ru": "Без названия 1",
            "kk": "Untitled"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2977039ffa2343dc99ced57f0eebe847?themeId=1&templateId=35&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2977039ffa2343dc99ced57f0eebe847_0"
        },
        {
          "id": "untitled-2",
          "title": {
            "ru": "Без названия 2",
            "kk": "Untitled"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/34efe1a7c860426d9cb667a518131ac9?themeId=22&templateId=45&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/34efe1a7c860426d9cb667a518131ac9_0"
        },
        {
          "id": "untitled-3",
          "title": {
            "ru": "Без названия 3",
            "kk": "Untitled"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/f85e211e29694108afb60610a17896df?themeId=1&templateId=3&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/f85e211e29694108afb60610a17896df_0"
        },
        {
          "id": "find-answer",
          "title": {
            "ru": "Найди ответ",
            "kk": "Есептің жауабын тап"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/5b51d7fcabb2429ebcd529abd8ed32f1?themeId=23&templateId=49&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/5b51d7fcabb2429ebcd529abd8ed32f1_0"
        },
        {
          "id": "math-general",
          "title": {
            "ru": "Математика",
            "kk": "математика"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/ad4b2a5dac4143adab10a897a2396b09?themeId=21&templateId=69&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/ad4b2a5dac4143adab10a897a2396b09_0"
        },
        {
          "id": "copy-grade-1-2",
          "title": {
            "ru": "Копия 1 класс (2)",
            "kk": "Копия 1-сынып"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/db5a4bf9be9c4f84b2a7118c46841c52?themeId=23&templateId=49&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/db5a4bf9be9c4f84b2a7118c46841c52_0"
        },
        {
          "id": "about-myself",
          "title": {
            "ru": "О себе (1 класс)",
            "kk": "Копия 1 - сынып 1 - бөлім \"Өзім туралы\""
          },
          "subject": "social_studies",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/add100c90c404aaf80070cb40b9e4f19?themeId=2&templateId=10&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/add100c90c404aaf80070cb40b9e4f19_0"
        },
        {
          "id": "complete-letters",
          "title": {
            "ru": "Дополни буквы 1 класс",
            "kk": "1 СЫНЫП әріптерді толықтыр"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/96c787df4caa4831b86ac97592e12466?themeId=41&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/96c787df4caa4831b86ac97592e12466_41"
        },
        {
          "id": "copy-grade-1-3",
          "title": {
            "ru": "Копия 1 класс (3)",
            "kk": "Копия 1 сынып"
          },
          "subject": "general",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/448f795f54234493ab2eed3c5c6bb31d?themeId=1&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/448f795f54234493ab2eed3c5c6bb31d_0"
        },
        {
          "id": "who-what",
          "title": {
            "ru": "Кто это? Что это?",
            "kk": "Бұл кім,не"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/81d6ad50e66f4f4ca900bf45d08d2f3d?themeId=1&templateId=2&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/81d6ad50e66f4f4ca900bf45d08d2f3d_0"
        },
        {
          "id": "anagram-2",
          "title": {
            "ru": "Анаграмма (2)",
            "kk": "Анаграмма"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/8622b0fd4b79450395c6e5bf50a2fba6?themeId=49&templateId=38&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/8622b0fd4b79450395c6e5bf50a2fba6_49"
        },
        {
          "id": "find-same-2",
          "title": {
            "ru": "Найди одинаковые (2)",
            "kk": "Бірдейлерді тап"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/c7ad93d936cc4318ae909a179b7b7c67?themeId=23&templateId=25&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/c7ad93d936cc4318ae909a179b7b7c67_23b"
        },
        {
          "id": "quiz-questions-copy",
          "title": {
            "ru": "Интересные вопросы викторины (копия)",
            "kk": "Копия Қызықты викториналық сұрақтар"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/e52f34379bdf4c888b70ad1940f53886?themeId=65&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/e52f34379bdf4c888b70ad1940f53886_0"
        },
        {
          "id": "welcome-qa",
          "title": {
            "ru": "Вопрос-ответ",
            "kk": "Сұрақ-жауап айдарына қош келдіңіздер"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/e662014d957f417ab9815a47fa5bd3ce?themeId=1&templateId=5&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/e662014d957f417ab9815a47fa5bd3ce_0"
        },
        {
          "id": "numbers-2",
          "title": {
            "ru": "Числа (2)",
            "kk": "сандар"
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/65e57dd08d844ca1bcee0ba55f1c403f?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/65e57dd08d844ca1bcee0ba55f1c403f_0"
        },
        {
          "id": "proverbs",
          "title": {
            "ru": "Найди место пословицы",
            "kk": "Копия Мақалдың орнын тап"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/2a200d570e4a44f4913a113c0756250a?themeId=45&templateId=72&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/2a200d570e4a44f4913a113c0756250a_0"
        },
        {
          "id": "answer-questions",
          "title": {
            "ru": "Ответь на вопросы",
            "kk": "Срақтарға жауап бер"
          },
          "subject": "logic",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/04dc53d7f705469cbac6535105e3332c?themeId=65&templateId=30&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/04dc53d7f705469cbac6535105e3332c_0"
        },
        {
          "id": "find-correct-answer-2",
          "title": {
            "ru": "Найди правильный ответ (2)",
            "kk": "Есептің дұрыс жауабын тап."
          },
          "subject": "math",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/1a657d6637084f0db564ce306557fa63?themeId=27&templateId=82&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/1a657d6637084f0db564ce306557fa63_0"
        },
        {
          "id": "place-verbs",
          "title": {
            "ru": "Расположи глаголы правильно",
            "kk": "Етістіктерді дұрыс орналастыр"
          },
          "subject": "literacy",
          "urlPattern": "https://wordwall.net/{{lang}}/embed/4b5496958c3b4e8888fcea42fff1c0a7?themeId=22&templateId=71&fontStackId=0",
          "thumbnail": "https://screens.cdn.wordwall.net/200/4b5496958c3b4e8888fcea42fff1c0a7_0"
        }
]
