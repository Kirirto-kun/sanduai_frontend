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
    id: "states-of-matter-basics",
    title: {
      ru: "Состояния вещества",
      kk: "Заттың күйлері",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics-600.png",
  },
  {
    id: "circuit-construction-kit-dc",
    title: {
      ru: "Электрические цепи",
      kk: "Электр тізбектері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
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
    id: "energy-forms-and-changes",
    title: {
      ru: "Формы энергии и их изменения",
      kk: "Энергия түрлері және өзгерістері",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes-600.png",
  },
  {
    id: "ideal-gas-law",
    title: {
      ru: "Законы идеального газа",
      kk: "Идеал газ заңдары",
    },
    subject: "physics",
    urlPattern: "https://phet.colorado.edu/sims/html/ideal-gas-law/latest/ideal-gas-law_{{lang}}.html",
    // Note: If 600.png fails, try a generic placeholder or verify manually. 
    // Using a different potential image name as fallback isn't easy here.
    // We will stick to the standard pattern and rely on 'unoptimized' to avoid 500s.
    thumbnail: "https://phet.colorado.edu/sims/html/ideal-gas-law/latest/ideal-gas-law-600.png",
  },
  {
    id: "balancing-act",
    title: {
      ru: "Балансировка",
      kk: "Тепе-теңдік",
    },
    subject: "math",
    urlPattern: "https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_{{lang}}.html", 
    thumbnail: "https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act-600.png",
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
    id: "ph-scale-basics",
    title: {
      ru: "Шкала pH: Основы",
      kk: "pH шкаласы: Негіздер",
    },
    subject: "chemistry",
    urlPattern: "https://phet.colorado.edu/sims/html/ph-scale-basics/latest/ph-scale-basics_{{lang}}.html",
    thumbnail: "https://phet.colorado.edu/sims/html/ph-scale-basics/latest/ph-scale-basics-600.png",
  },
];
