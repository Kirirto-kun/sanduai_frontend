import type { ProjectResult } from "./types";

export function projectFixture(): ProjectResult {
  return {
    title: "Өсімдіктің екі жағдайдағы саяхаты", topic: "Өсімдікке жарық не үшін керек?", summary: "Бірге бақылауға арналған қауіпсіз жоба.", goal: "Екі жағдайды салыстыруды үйрену.", assumptions: ["Топта мөлдір пластик ыдыс бар деп болжанады."],
    project_type: "scientific", output_mode: "full_package", age_group: "older", age_years: 4,
    participant_count: 20, duration: "week", language: "kk", project_status: "planned", cost_tokens: 30,
    regulatory_status: "unverified", regulatory_note: "Нормативтік құжаттың қолданыстағы редакциясын тексеру қажет.", competition_note: "",
    sections: [{ id: "passport", title: "Жобаның қысқаша паспорты", content: "Балалар өз еркімен **бақылау** рөлін таңдайды." }],
    ideas: [{ title: "Кішкентай бақша", question: "Қай жерде жапырақ өзгереді?", activity: "Екі ыдысты қарап салыстыру.", product: "Өсімдік суреттері." }],
    calendar: [{ period: "Дүйсенбі", goal: "Алғашқы сұрақты таңдау.", child_action: "Бала ыдысқа белгі таңдайды.", teacher_action: "Педагог қауіпсіз орта дайындайды.", materials: ["Ірі жапсырмалар"], expected_result: "Бала өз белгісін таниды.", recording: "Таңдауды суретпен тіркеу.", session_minutes: 8 }],
    experiments: [{ title: "Жарықтағы жапырақ", question: "Жапырақ қалай өзгереді?", hypothesis: "Жарық әсер етуі мүмкін.", materials: ["Сынбайтын екі ыдыс"], safety: ["Суды ішуге болмайды."], adult_preparation: "Ересек өсімдіктерді алдын ала дайындайды.", child_action: "Бала жапырақты көрсетеді.", steps: ["Бірінші ыдысты таңда.", "Екі жапырақты салыстыр."], observation_period: "Бес күн бойы қысқа бақылау.", recording: "Күнделікке жапсырма қою.", comparison: "Жапырақтың пішінін салыстыру.", conclusion_questions: ["Не өзгерді?"], duration_minutes: 7 }],
    diary: [{ period: "1-күн", activity: "Жапырақты қарау", observation: "", result: "" }],
    artifacts: [{ title: "Бақылау карточкасы", instructions: "Бақылаған соң белгіле.", content: "Мен байқадым: ______.\nМенің сұрағым: ______." }],
    slides: [{ number: 1, title: "Біздің сұрағымыз", on_screen: "Біз нені бақылағымыз келеді?", visual: "Екі ыдыстың қарапайым сызбасы.", photo_placeholder: "Өз тәжірибеңіздің фотосын осында қосыңыз.", speaker_notes: "Бұл — болашақ бақылауымыздың жоспары.", shown_result: "Нәтижелер үшін бос орын." }],
    defense_script: "Сәлеметсіздер ме! Біз өсімдіктерді бақылауды жоспарлаймыз.",
    expected_results: ["Балалар екі жағдайды ажырата алады деп күтіледі."], actual_results: [],
    evaluation: [{ criterion: "Бақылауға қызығушылық білдіреді.", evidence: "Баланың таңдауын жеке тіркеу." }],
    development: [{ direction: "Танымдық даму", child_action: "Бала айырмашылықты көрсетеді." }],
    values: [{ value: "Адалдық", child_action: "Бала байқағанын өзгертпей көрсетеді." }],
    inclusion: ["Сөйлемей, сурет арқылы жауап беруге болады."], safety: ["Балалар ересектің бақылауында болады."],
    sources: [{ organization: "Әділет", title: "Мектепке дейінгі тәрбие стандарты", url: "https://adilet.zan.kz/kaz/docs/V2200029031", verification_status: "unverified" }],
  };
}
