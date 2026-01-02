export type PhetSubject = "physics" | "chemistry" | "biology" | "math";

export interface PhetSimulation {
  id: string;
  title: {
    ru: string;
    kk: string;
  };
  subject: PhetSubject;
  // Base URL pattern. Replaces {{lang}} with "ru" or "kk" (or "en" fallback).
  urlPattern: string; 
  thumbnail?: string;
}
export const PHET_SIMULATIONS: PhetSimulation[] = [
  {
    id: "acid-base-solutions",
    title: {
      ru: "Кислотно-основные растворы",
      kk: "Судағы ерітінділердегі қышқылдық-негіздік реакциялар",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions-600.png",
  },
  {
    id: "area-builder",
    title: {
      ru: "Конструктор фигур",
      kk: "Фигуралардың конструкторы",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/area-builder/latest/area-builder-600.png",
  },
  {
    id: "area-model-algebra",
    title: {
      ru: "Вычисление площади (Алгебра)",
      kk: "Ауданды есептеу (Алгебра)",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/area-model-algebra/latest/area-model-algebra_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/area-model-algebra/latest/area-model-algebra-600.png",
  },
  {
    id: "area-model-decimals",
    title: {
      ru: "Вычисление площади с десятичными дробями",
      kk: "Ауданды ондық бөлшектермен есептеу",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/area-model-decimals/latest/area-model-decimals_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/area-model-decimals/latest/area-model-decimals-600.png",
  },
  {
    id: "area-model-introduction",
    title: {
      ru: "Основы нахождения площади",
      kk: "Ауданды табудың негіздері",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/area-model-introduction/latest/area-model-introduction_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/area-model-introduction/latest/area-model-introduction-600.png",
  },
  {
    id: "area-model-multiplication",
    title: {
      ru: "Вычисление площади путем умножения",
      kk: "Көбейту жолымен ауданды есептеу",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/area-model-multiplication/latest/area-model-multiplication_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/area-model-multiplication/latest/area-model-multiplication-600.png",
  },
  {
    id: "arithmetic",
    title: {
      ru: "Таблица умножения",
      kk: "Көбейту кестесі",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/arithmetic/latest/arithmetic_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/arithmetic/latest/arithmetic-600.png",
  },
  {
    id: "atomic-interactions",
    title: {
      ru: "Взаимодействие атомов",
      kk: "Атомдардың өзара әсерлесуі",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/atomic-interactions/latest/atomic-interactions_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/atomic-interactions/latest/atomic-interactions-600.png",
  },
  {
    id: "balancing-act",
    title: {
      ru: "Равновесие",
      kk: "Тепе-теңдік",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act-600.png",
  },
  {
    id: "balancing-chemical-equations",
    title: {
      ru: "Балансировка химических уравнений",
      kk: "Химиялық теңдеулерді теңестіру",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png",
  },
  {
    id: "balloons-and-static-electricity",
    title: {
      ru: "Статическое электричество на воздушных шарах",
      kk: "Шарлар және статикалық электр",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity-600.png",
  },
  {
    id: "beers-law-lab",
    title: {
      ru: "Растворы: Закон Бера",
      kk: "Ерітінділер: Бер заңы",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/beers-law-lab/latest/beers-law-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/beers-law-lab/latest/beers-law-lab-600.png",
  },
  {
    id: "bending-light",
    title: {
      ru: "Преломление света",
      kk: "Жарықтың сынуы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light-600.png",
  },
  {
    id: "blackbody-spectrum",
    title: {
      ru: "Спектр абсолютно чёрного тела",
      kk: "Қара дене спектрі",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/blackbody-spectrum/latest/blackbody-spectrum_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/blackbody-spectrum/latest/blackbody-spectrum-600.png",
  },
  {
    id: "build-a-fraction",
    title: {
      ru: "Запиши в виде дроби",
      kk: "Бөлшек түрінде жаз",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/build-a-fraction/latest/build-a-fraction_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/build-a-fraction/latest/build-a-fraction-600.png",
  },
  {
    id: "build-a-molecule",
    title: {
      ru: "Собери молекулу",
      kk: "Молекула құрастыру",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule-600.png",
  },
  {
    id: "build-a-nucleus",
    title: {
      ru: "Собери ядро",
      kk: "Ядро құрастыру",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/build-a-nucleus/latest/build-a-nucleus_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/build-a-nucleus/latest/build-a-nucleus-600.png",
  },
  {
    id: "build-an-atom",
    title: {
      ru: "Строение атома",
      kk: "Атом құрылысы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom-600.png",
  },
  {
    id: "buoyancy",
    title: {
      ru: "Плавучесть",
      kk: "Жүзу қабілеті",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy-600.png",
  },
  {
    id: "buoyancy-basics",
    title: {
      ru: "Плавучесть: Основы",
      kk: "Жүзу қабілеті: Негіздер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/buoyancy-basics/latest/buoyancy-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/buoyancy-basics/latest/buoyancy-basics-600.png",
  },
  {
    id: "calculus-grapher",
    title: {
      ru: "График производной",
      kk: "Туынды графигі",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher-600.png",
  },
  {
    id: "capacitor-lab-basics",
    title: {
      ru: "Основы «Электроёмкость конденсатора»",
      kk: "Конденсаторлардың сыйымдылығы: негізі",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics-600.png",
  },
  {
    id: "center-and-variability",
    title: {
      ru: "Центр и вариативность",
      kk: "Орталық және өзгергіштік",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability-600.png",
  },
  {
    id: "charges-and-fields",
    title: {
      ru: "Электрические поля точечных зарядов",
      kk: "Зарядтар және өрістер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields-600.png",
  },
  {
    id: "circuit-construction-kit-ac",
    title: {
      ru: "Электрические схемы: «Переменный ток»",
      kk: "Электр тізбегін құрастыру: «Айнымалы ток»",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac-600.png",
  },
  {
    id: "circuit-construction-kit-ac-virtual-lab",
    title: {
      ru: "Лаборатория: «Построение электрических схем (Переменный ток)»",
      kk: "Зертхана: «Электр тізбектерін құру (Айнымалы ток)»",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab-600.png",
  },
  {
    id: "circuit-construction-kit-dc",
    title: {
      ru: "Электрические схемы: «Постоянный ток»",
      kk: "Тұрақты токтың электр тізбегі",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
  },
  {
    id: "circuit-construction-kit-dc-virtual-lab",
    title: {
      ru: "Электрическая цепь постоянного тока: Виртуальная лаборатория",
      kk: "Тұрақты токтың электр тізбегі: Виртуалды зертхана",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab-600.png",
  },
  {
    id: "collision-lab",
    title: {
      ru: "Лаборатория: «Столкновение»",
      kk: "Зертхана: «Соқтығысу»",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab-600.png",
  },
  {
    id: "color-vision",
    title: {
      ru: "Цветовое зрение",
      kk: "Түсті көру",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/color-vision/latest/color-vision-600.png",
  },
  {
    id: "concentration",
    title: {
      ru: "Молярная концентрация",
      kk: "Молярлық концентрация",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/concentration/latest/concentration_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/concentration/latest/concentration-600.png",
  },
  {
    id: "coulombs-law",
    title: {
      ru: "Закон Кулона",
      kk: "Кулон заңы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law-600.png",
  },
  {
    id: "curve-fitting",
    title: {
      ru: "Построение графика функции",
      kk: "Функция графигін тұрғызу",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/curve-fitting/latest/curve-fitting_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/curve-fitting/latest/curve-fitting-600.png",
  },
  {
    id: "density",
    title: {
      ru: "Плотность",
      kk: "Тығыздық",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/density/latest/density_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/density/latest/density-600.png",
  },
  {
    id: "diffusion",
    title: {
      ru: "Диффузия",
      kk: "Диффузия",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/diffusion/latest/diffusion_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/diffusion/latest/diffusion-600.png",
  },
  {
    id: "energy-forms-and-changes",
    title: {
      ru: "Виды и преобразование энергии",
      kk: "Энергия түрлері және олардың түрленуі",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes-600.png",
  },
  {
    id: "energy-skate-park",
    title: {
      ru: "Энергетический скейт-парк",
      kk: "Энергетикалық скейт-парк",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park-600.png",
  },
  {
    id: "energy-skate-park-basics",
    title: {
      ru: "Энергетический скейт-парк: основы",
      kk: "Энергетикалық скейт-парк: негіздер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics-600.png",
  },
  {
    id: "equality-explorer",
    title: {
      ru: "Исследователь равенств",
      kk: "Теңдіктерді зерттеу",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/equality-explorer/latest/equality-explorer_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/equality-explorer/latest/equality-explorer-600.png",
  },
  {
    id: "equality-explorer-basics",
    title: {
      ru: "Равенства: Основы",
      kk: "Теңдік: Негіздері",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/equality-explorer-basics/latest/equality-explorer-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/equality-explorer-basics/latest/equality-explorer-basics-600.png",
  },
  {
    id: "equality-explorer-two-variables",
    title: {
      ru: "Равенства с двумя переменными",
      kk: "Екі айнымалысы бар теңдік",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/equality-explorer-two-variables/latest/equality-explorer-two-variables_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/equality-explorer-two-variables/latest/equality-explorer-two-variables-600.png",
  },
  {
    id: "expression-exchange",
    title: {
      ru: "Рациональные выражения",
      kk: "Рационал өрнектер",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/expression-exchange/latest/expression-exchange_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/expression-exchange/latest/expression-exchange-600.png",
  },
  {
    id: "faradays-electromagnetic-lab",
    title: {
      ru: "Электромагнитная лаборатория Фарадея",
      kk: "Фарадейдің электромагниттік зертханасы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/faradays-electromagnetic-lab/latest/faradays-electromagnetic-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/faradays-electromagnetic-lab/latest/faradays-electromagnetic-lab-600.png",
  },
  {
    id: "faradays-law",
    title: {
      ru: "Закон Фарадея",
      kk: "Фарадей заңы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law-600.png",
  },
  {
    id: "forces-and-motion-basics",
    title: {
      ru: "Силы и движение: основы",
      kk: "Күштер және қозғалыс: негіздері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics-600.png",
  },
  {
    id: "fourier-making-waves",
    title: {
      ru: "Фурье: создание волн",
      kk: "Фурье: толқындарды құру",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/fourier-making-waves/latest/fourier-making-waves_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/fourier-making-waves/latest/fourier-making-waves-600.png",
  },
  {
    id: "fraction-matcher",
    title: {
      ru: "Сравнение дробей",
      kk: "Бөлшектерді сәйкестендіру",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher-600.png",
  },
  {
    id: "fractions-equality",
    title: {
      ru: "Дроби: Равенство",
      kk: "Бөлшектер: Теңдік",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/fractions-equality/latest/fractions-equality_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/fractions-equality/latest/fractions-equality-600.png",
  },
  {
    id: "fractions-intro",
    title: {
      ru: "Дроби: Введение",
      kk: "Бөлшектер: Кіріспе",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/fractions-intro/latest/fractions-intro_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/fractions-intro/latest/fractions-intro-600.png",
  },
  {
    id: "fractions-mixed-numbers",
    title: {
      ru: "Дроби: Смешанные числа",
      kk: "Бөлшектер: Аралас сандар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/fractions-mixed-numbers/latest/fractions-mixed-numbers_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/fractions-mixed-numbers/latest/fractions-mixed-numbers-600.png",
  },
  {
    id: "friction",
    title: {
      ru: "Трение",
      kk: "Үйкеліс",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/friction/latest/friction_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/friction/latest/friction-600.png",
  },
  {
    id: "function-builder",
    title: {
      ru: "Построитель функций",
      kk: "Функцияларды құрушы",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/function-builder/latest/function-builder_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/function-builder/latest/function-builder-600.png",
  },
  {
    id: "function-builder-basics",
    title: {
      ru: "Построитель функций: основы",
      kk: "Функцияларды құру: негіздері",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/function-builder-basics/latest/function-builder-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/function-builder-basics/latest/function-builder-basics-600.png",
  },
  {
    id: "gas-properties",
    title: {
      ru: "Свойства газа",
      kk: "Газдың қасиеттері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties-600.png",
  },
  {
    id: "gases-intro",
    title: {
      ru: "Газы: Введение",
      kk: "Газдар: Кіріспе",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/gases-intro/latest/gases-intro_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gases-intro/latest/gases-intro-600.png",
  },
  {
    id: "gene-expression-essentials",
    title: {
      ru: "Экспрессия генов: Основы",
      kk: "Ген экспрессиясы: Негіздер",
    },
    subject: "biology",
    urlPattern: "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials-600.png",
  },
  {
    id: "generator",
    title: {
      ru: "Генератор",
      kk: "Генератор",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/generator/latest/generator_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/generator/latest/generator-600.png",
  },
  {
    id: "geometric-optics",
    title: {
      ru: "Геометрическая оптика",
      kk: "Геометриялық оптика",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics-600.png",
  },
  {
    id: "geometric-optics-basics",
    title: {
      ru: "Геометрическая оптика: Основы",
      kk: "Геометриялық оптика: Негіздері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics-600.png",
  },
  {
    id: "graphing-lines",
    title: {
      ru: "Построение прямых",
      kk: "Түзулерді құру",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines-600.png",
  },
  {
    id: "graphing-quadratics",
    title: {
      ru: "График квадратичной функции",
      kk: "Квадраттық функция графигі",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/graphing-quadratics/latest/graphing-quadratics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/graphing-quadratics/latest/graphing-quadratics-600.png",
  },
  {
    id: "graphing-slope-intercept",
    title: {
      ru: "Уравнение прямой с угловым коэффициентом",
      kk: "Түзудің бұрыштық коэффициентпен теңдеуі",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept-600.png",
  },
  {
    id: "gravity-and-orbits",
    title: {
      ru: "Гравитация и орбиты",
      kk: "Гравитация және орбиталар",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits-600.png",
  },
  {
    id: "gravity-force-lab",
    title: {
      ru: "Лаборатория гравитации",
      kk: "Гравитациялық күш зертханасы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab-600.png",
  },
  {
    id: "gravity-force-lab-basics",
    title: {
      ru: "Сила тяготения: Основы",
      kk: "Тартылыс күші: Негіздері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/gravity-force-lab-basics/latest/gravity-force-lab-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/gravity-force-lab-basics/latest/gravity-force-lab-basics-600.png",
  },
  {
    id: "greenhouse-effect",
    title: {
      ru: "Парниковый эффект",
      kk: "Парниктік эффект",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/greenhouse-effect/latest/greenhouse-effect_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/greenhouse-effect/latest/greenhouse-effect-600.png",
  },
  {
    id: "hookes-law",
    title: {
      ru: "Закон Гука",
      kk: "Гук заңы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law-600.png",
  },
  {
    id: "isotopes-and-atomic-mass",
    title: {
      ru: "Изотопы и атомная масса",
      kk: "Изотоптар және атомдық масса",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass-600.png",
  },
  {
    id: "john-travoltage",
    title: {
      ru: "Джон Травольтаж",
      kk: "Джон Травольтаж",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage-600.png",
  },
  {
    id: "keplers-laws",
    title: {
      ru: "Законы Кеплера",
      kk: "Кеплер заңдары",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/keplers-laws/latest/keplers-laws_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/keplers-laws/latest/keplers-laws-600.png",
  },
  {
    id: "least-squares-regression",
    title: {
      ru: "Регрессия наименьших квадратов",
      kk: "Ең кіші квадраттар регрессиясы",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/least-squares-regression/latest/least-squares-regression_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/least-squares-regression/latest/least-squares-regression-600.png",
  },
  {
    id: "magnet-and-compass",
    title: {
      ru: "Магнит и компас",
      kk: "Магнит және компас",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/magnet-and-compass/latest/magnet-and-compass_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/magnet-and-compass/latest/magnet-and-compass-600.png",
  },
  {
    id: "magnets-and-electromagnets",
    title: {
      ru: "Магниты и электромагниты",
      kk: "Магниттер және электромагниттер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets-600.png",
  },
  {
    id: "make-a-ten",
    title: {
      ru: "Собери десятку",
      kk: "Ондықты құра",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/make-a-ten/latest/make-a-ten_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/make-a-ten/latest/make-a-ten-600.png",
  },
  {
    id: "masses-and-springs",
    title: {
      ru: "Массы и пружины",
      kk: "Массалар және серіппелер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs-600.png",
  },
  {
    id: "masses-and-springs-basics",
    title: {
      ru: "Массы и пружины: Основы",
      kk: "Массалар және серіппелер: Негіздері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/masses-and-springs-basics/latest/masses-and-springs-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/masses-and-springs-basics/latest/masses-and-springs-basics-600.png",
  },
  {
    id: "mean-share-and-balance",
    title: {
      ru: "Среднее значение: Дели и уравновешивай",
      kk: "Орташа мән: Бөліс және теңгер",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/mean-share-and-balance/latest/mean-share-and-balance_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/mean-share-and-balance/latest/mean-share-and-balance-600.png",
  },
  {
    id: "membrane-transport",
    title: {
      ru: "Транспорт через мембрану",
      kk: "Мембраналық тасымал",
    },
    subject: "biology",
    urlPattern: "https://phet.colorado.edu/sims/html/membrane-transport/latest/membrane-transport_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/membrane-transport/latest/membrane-transport-600.png",
  },
  {
    id: "models-of-the-hydrogen-atom",
    title: {
      ru: "Модели атома водорода",
      kk: "Сутегі атомының модельдері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/models-of-the-hydrogen-atom/latest/models-of-the-hydrogen-atom_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/models-of-the-hydrogen-atom/latest/models-of-the-hydrogen-atom-600.png",
  },
  {
    id: "molarity",
    title: {
      ru: "Молярность",
      kk: "Молярлық",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/molarity/latest/molarity_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/molarity/latest/molarity-600.png",
  },
  {
    id: "molecule-polarity",
    title: {
      ru: "Полярность молекулы",
      kk: "Молекула полярлығы",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/molecule-polarity/latest/molecule-polarity_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/molecule-polarity/latest/molecule-polarity-600.png",
  },
  {
    id: "molecule-shapes",
    title: {
      ru: "Формы молекул",
      kk: "Молекула пішіндері",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes-600.png",
  },
  {
    id: "molecule-shapes-basics",
    title: {
      ru: "Формы молекул: основы",
      kk: "Молекула пішіндері: негіздері",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/molecule-shapes-basics/latest/molecule-shapes-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/molecule-shapes-basics/latest/molecule-shapes-basics-600.png",
  },
  {
    id: "molecules-and-light",
    title: {
      ru: "Молекулы и свет",
      kk: "Молекулалар және жарық",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light-600.png",
  },
  {
    id: "my-solar-system",
    title: {
      ru: "Моя Солнечная система",
      kk: "Менің Күн жүйем",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/my-solar-system/latest/my-solar-system_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/my-solar-system/latest/my-solar-system-600.png",
  },
  {
    id: "natural-selection",
    title: {
      ru: "Естественный отбор",
      kk: "Табиғи сұрыпталу",
    },
    subject: "biology",
    urlPattern: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection-600.png",
  },
  {
    id: "neuron",
    title: {
      ru: "Нейрон",
      kk: "Нейрон",
    },
    subject: "biology",
    urlPattern: "https://phet.colorado.edu/sims/html/neuron/latest/neuron_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/neuron/latest/neuron-600.png",
  },
  {
    id: "number-compare",
    title: {
      ru: "Сравнение чисел",
      kk: "Сандарды салыстыру",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-compare/latest/number-compare_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-compare/latest/number-compare-600.png",
  },
  {
    id: "number-line-distance",
    title: {
      ru: "Числовая прямая: Расстояние",
      kk: "Сандық түзу: Қашықтық",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-line-distance/latest/number-line-distance_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-line-distance/latest/number-line-distance-600.png",
  },
  {
    id: "number-line-integers",
    title: {
      ru: "Числовая прямая: Целые числа",
      kk: "Сандық түзу: Бүтін сандар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-line-integers/latest/number-line-integers_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-line-integers/latest/number-line-integers-600.png",
  },
  {
    id: "number-line-operations",
    title: {
      ru: "Числовая прямая: Операции",
      kk: "Сандық түзу: Амалдар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-line-operations/latest/number-line-operations_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-line-operations/latest/number-line-operations-600.png",
  },
  {
    id: "number-pairs",
    title: {
      ru: "Парные числа",
      kk: "Жұп сандар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-pairs/latest/number-pairs_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-pairs/latest/number-pairs-600.png",
  },
  {
    id: "number-play",
    title: {
      ru: "Игры с числами",
      kk: "Сандармен ойын",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/number-play/latest/number-play_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/number-play/latest/number-play-600.png",
  },
  {
    id: "ohms-law",
    title: {
      ru: "Закон Ома",
      kk: "Ом заңы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law-600.png",
  },
  {
    id: "pendulum-lab",
    title: {
      ru: "Маятниковая лаборатория",
      kk: "Маятник зертханасы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab-600.png",
  },
  {
    id: "ph-scale",
    title: {
      ru: "Шкала pH",
      kk: "pH шкаласы",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale-600.png",
  },
  {
    id: "ph-scale-basics",
    title: {
      ru: "Шкала pH: основы",
      kk: "pH шкаласы: негіздер",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/ph-scale-basics/latest/ph-scale-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/ph-scale-basics/latest/ph-scale-basics-600.png",
  },
  {
    id: "plinko-probability",
    title: {
      ru: "Плинко: Вероятность",
      kk: "Плинко: Ықтималдық",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability-600.png",
  },
  {
    id: "projectile-data-lab",
    title: {
      ru: "Лаборатория движения снаряда: Данные",
      kk: "Снаряд қозғалысы зертханасы: Деректер",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/projectile-data-lab/latest/projectile-data-lab_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/projectile-data-lab/latest/projectile-data-lab-600.png",
  },
  {
    id: "projectile-motion",
    title: {
      ru: "Движение снаряда",
      kk: "Снаряд қозғалысы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png",
  },
  {
    id: "projectile-sampling-distributions",
    title: {
      ru: "Выборочные распределения (Снаряд)",
      kk: "Іріктемелік үлестірімдер (Снаряд)",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/projectile-sampling-distributions/latest/projectile-sampling-distributions_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/projectile-sampling-distributions/latest/projectile-sampling-distributions-600.png",
  },
  {
    id: "proportion-playground",
    title: {
      ru: "Игра с пропорциями",
      kk: "Пропорция ойындары",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/proportion-playground/latest/proportion-playground_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/proportion-playground/latest/proportion-playground-600.png",
  },
  {
    id: "quadrilateral",
    title: {
      ru: "Четырехугольники",
      kk: "Төртбұрыштар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral-600.png",
  },
  {
    id: "quantum-coin-toss",
    title: {
      ru: "Квантовое подбрасывание монеты",
      kk: "Кванттық тиын лақтыру",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/quantum-coin-toss/latest/quantum-coin-toss_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/quantum-coin-toss/latest/quantum-coin-toss-600.png",
  },
  {
    id: "quantum-measurement",
    title: {
      ru: "Квантовое измерение",
      kk: "Кванттық өлшеу",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/quantum-measurement/latest/quantum-measurement_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/quantum-measurement/latest/quantum-measurement-600.png",
  },
  {
    id: "ratio-and-proportion",
    title: {
      ru: "Отношения и пропорции",
      kk: "Қатынас және пропорция",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/ratio-and-proportion/latest/ratio-and-proportion_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/ratio-and-proportion/latest/ratio-and-proportion-600.png",
  },
  {
    id: "reactants-products-and-leftovers",
    title: {
      ru: "Реагенты, продукты и остатки",
      kk: "Реагенттер, өнімдер және қалдықтар",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers-600.png",
  },
  {
    id: "resistance-in-a-wire",
    title: {
      ru: "Сопротивление проводника",
      kk: "Өткізгіштің кедергісі",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire-600.png",
  },
  {
    id: "rutherford-scattering",
    title: {
      ru: "Рассеяние Резерфорда",
      kk: "Резерфорд шашырауы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering-600.png",
  },
  {
    id: "states-of-matter",
    title: {
      ru: "Агрегатные состояния вещества",
      kk: "Заттың агрегаттық күйлері",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter-600.png",
  },
  {
    id: "states-of-matter-basics",
    title: {
      ru: "Агрегатные состояния: основы",
      kk: "Заттың агрегаттық күйлері: негіздері",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics-600.png",
  },
  {
    id: "trig-tour",
    title: {
      ru: "Тригонометрическое путешествие",
      kk: "Тригонометриялық саяхат",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour-600.png",
  },
  {
    id: "under-pressure",
    title: {
      ru: "Под давлением",
      kk: "Қысым астында",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure-600.png",
  },
  {
    id: "unit-rates",
    title: {
      ru: "Удельная стоимость",
      kk: "Бірлік бағалар",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/unit-rates/latest/unit-rates_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/unit-rates/latest/unit-rates-600.png",
  },
  {
    id: "vector-addition",
    title: {
      ru: "Сложение векторов",
      kk: "Векторларды қосу",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition-600.png",
  },
  {
    id: "vector-addition-equations",
    title: {
      ru: "Сложение векторов: Уравнения",
      kk: "Векторларды қосу: Теңдеулер",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/vector-addition-equations/latest/vector-addition-equations_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/vector-addition-equations/latest/vector-addition-equations-600.png",
  },
  {
    id: "wave-interference",
    title: {
      ru: "Интерференция волн",
      kk: "Толқындар интерференциясы",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference-600.png",
  },
  {
    id: "wave-on-a-string",
    title: {
      ru: "Волна на струне",
      kk: "Ішектегі толқын",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string-600.png",
  },
  {
    id: "waves-intro",
    title: {
      ru: "Волны: Введение",
      kk: "Толқындар: Кіріспе",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro-600.png",
  },
];