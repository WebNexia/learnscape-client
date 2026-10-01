import type {
  AnswerOptionId,
  CefrLevel,
  ReadingLevelContent,
  ReadingPassage,
  ReadingQuestion,
  ReadingQuestionType,
} from "./types";

export const READING_TEST_CONTENT_VERSION = "2026-10-c1c2-items";
export const QUESTIONS_PER_PASSAGE = 4;
export const QUESTIONS_PER_VERIFICATION_PASSAGE = 2;
export const QUESTIONS_PER_UPPER_PASSAGE = 6;
export const QUESTIONS_PER_A1_PASSAGE = 8;
export const QUESTIONS_PER_UPPER_VERIFICATION_PASSAGE = 3;

export function isUpperReadingLevel(level: CefrLevel) {
  return level === "B2" || level === "C1" || level === "C2";
}

export function questionsPerPrimaryPassage(level: CefrLevel) {
  if (level === "A1") return QUESTIONS_PER_A1_PASSAGE;
  if (level === "A2" || level === "B1" || isUpperReadingLevel(level))
    return QUESTIONS_PER_UPPER_PASSAGE;
  return QUESTIONS_PER_PASSAGE;
}

export function questionsPerVerificationPassage(_level: CefrLevel) {
  return QUESTIONS_PER_UPPER_VERIFICATION_PASSAGE;
}

const optionIds: AnswerOptionId[] = ["A", "B", "C", "D"];

function choice(
  id: string,
  type: ReadingQuestionType,
  prompt: string,
  options: [string, string, string, string],
  correctAnswer: AnswerOptionId,
): ReadingQuestion {
  return {
    id,
    type,
    prompt,
    options: options.map((text, index) => ({ id: optionIds[index], text })),
    correctAnswer,
  };
}

function gap(
  id: string,
  prompt: string,
  correctAnswer: string,
  acceptedAnswers: string[],
): ReadingQuestion {
  return {
    id,
    type: "gap_fill",
    format: "gap_fill",
    prompt,
    options: [],
    correctAnswer,
    acceptedAnswers,
  };
}

function reading(
  id: string,
  level: CefrLevel,
  kind: ReadingPassage["kind"],
  paragraphs: string[],
  questions: ReadingQuestion[],
): ReadingPassage {
  return { id, level, kind, format: "reading", paragraphs, questions };
}

function listening(
  id: string,
  level: CefrLevel,
  script: string[],
  questions: ReadingQuestion[],
): ReadingPassage {
  return {
    id,
    level,
    kind: "primary",
    format: "listening",
    paragraphs: [],
    listeningScript: script,
    audioSrc: `/audio/level-test/${id}.mp3`,
    questions,
  };
}

const a1Reading = reading(
  "a1-tom-bicycle",
  "A1",
  "primary",
  [
    "Tom has a bicycle. Every day he goes to work by bicycle. The ride is twenty minutes. Tom likes his bicycle.",
  ],
  [
    choice(
      "a1-r1",
      "explicit_detail",
      "How does Tom go to work?",
      ["By bus.", "By bicycle.", "By car.", "On foot."],
      "B",
    ),
    gap("a1-r2", "The ride is ______ minutes.", "twenty", ["twenty", "20"]),
  ],
);

const a1Listening = listening(
  "a1-anna-dog",
  "A1",
  [
    "Hi, my name is Anna. I have a small dog. Every morning I walk with my dog in the park. Today it is sunny, so we will stay a little longer.",
  ],
  [
    choice(
      "a1-l1",
      "explicit_detail",
      "Where does Anna walk with her dog?",
      ["In the park.", "Near her house.", "At the bus stop.", "In a shop."],
      "A",
    ),
    choice(
      "a1-l2",
      "cause_and_effect",
      "Why will Anna stay longer today?",
      [
        "Because her dog is small.",
        "Because she walks every morning.",
        "Because the weather is sunny.",
        "Because the park is closed.",
      ],
      "C",
    ),
    gap("a1-l5", "Today it is ______.", "sunny", ["sunny"]),
  ],
);

const a1ListeningTwo = listening(
  "a1-sam-shop",
  "A1",
  [
    "Hello. My name is Sam. I am in a small shop. I need bread and milk. After I pay, I will walk home.",
  ],
  [
    choice(
      "a1-l3",
      "explicit_detail",
      "Where is Sam?",
      ["In a small shop.", "In the park.", "At the office.", "On the bus."],
      "A",
    ),
    gap("a1-l6", "Sam needs bread and ______.", "milk", ["milk"]),
    choice(
      "a1-l4",
      "explicit_detail",
      "What will Sam do after he pays?",
      [
        "He will take the bus.",
        "He will walk home.",
        "He will stay in the shop.",
        "He will buy more bread.",
      ],
      "B",
    ),
  ],
);

const a1Verification = reading(
  "a1-ben-shop",
  "A1",
  "verification",
  [
    "Ben likes Tom's bicycle. Next week they will go to a shop near the office and look at bicycles for Ben.",
  ],
  [
    choice(
      "a1-v1",
      "explicit_detail",
      "What will Tom and Ben do next week?",
      [
        "They will ride Tom's bicycle to work.",
        "They will look at bicycles for Ben.",
        "They will work at the office.",
        "They will buy bread at the shop.",
      ],
      "B",
    ),
    choice(
      "a1-v2",
      "inference",
      "What can we understand about Ben?",
      [
        "He already has a bicycle.",
        "He will sell Tom's bicycle.",
        "He does not have a bicycle now.",
        "He does not like Tom.",
      ],
      "C",
    ),
    choice(
      "a1-v3",
      "explicit_detail",
      "Where is the shop?",
      [
        "Near the office.",
        "Near the park.",
        "At Ben's house.",
        "Next to the station.",
      ],
      "A",
    ),
  ],
);

const a2Reading = reading(
  "a2-sara-market",
  "A2",
  "primary",
  [
    "Sara used to buy all her food at the supermarket because it was quick. Then she found a street market nearby. The fruit there was fresher and cheaper. Now she goes every Saturday. She still uses the supermarket, but only for pasta and cleaning products.",
  ],
  [
    choice(
      "a2-r1",
      "main_idea",
      "What is the text mainly about?",
      [
        "Why the supermarket fruit is fresher.",
        "How Sara's Saturday shopping changed.",
        "Why Sara stopped buying fruit.",
        "Sara's new job at the street market.",
      ],
      "B",
    ),
    choice(
      "a2-r2",
      "explicit_detail",
      "Why does Sara still use the supermarket?",
      [
        "The street market is closed on Saturday.",
        "She only needs it for pasta and cleaning products.",
        "The fruit there is fresher and cheaper.",
        "She works at the supermarket now.",
      ],
      "B",
    ),
  ],
);

const a2Listening = listening(
  "a2-mark-train",
  "A2",
  [
    "Last Friday, Mark missed his usual train after work. The next one was forty minutes later, so he waited in a small café near the station. He called his sister and told her he would be late for dinner. When he finally arrived, the food was still warm, and nobody was angry.",
  ],
  [
    choice(
      "a2-l1",
      "explicit_detail",
      "Why did Mark wait in a café?",
      [
        "He wanted to eat dinner in the café.",
        "His next train was much later.",
        "His sister works in the café.",
        "He missed the café, not the train.",
      ],
      "B",
    ),
    choice(
      "a2-l2",
      "inference",
      "What can we tell about the dinner?",
      [
        "They finished the meal before he arrived.",
        "They were angry because the food was cold.",
        "His meal was still ready, and they were not upset.",
        "They had left the house before he arrived.",
      ],
      "C",
    ),
  ],
);

const a2ListeningTwo = listening(
  "a2-emma-walk",
  "A2",
  [
    "Hi, this is Emma. I'm calling about Saturday. The walking group will start at ten, not nine. Please bring a bottle of water. If it rains, we will meet in the museum café instead.",
  ],
  [
    choice(
      "a2-l3",
      "explicit_detail",
      "What time will the walking group start?",
      ["At nine.", "At ten.", "At half past nine.", "After the museum closes."],
      "B",
    ),
    choice(
      "a2-l4",
      "explicit_detail",
      "What will they do if it rains?",
      [
        "They will start at nine instead.",
        "They will walk in the rain.",
        "They will meet in the museum café.",
        "They will bring extra water and continue.",
      ],
      "C",
    ),
  ],
);

const a2Verification = reading(
  "a2-maria-tea",
  "A2",
  "verification",
  [
    "Sara's neighbour Maria sometimes comes to the market with her. After shopping, they usually drink tea at a small café and talk. For Sara, Saturday is now the best part of the week.",
  ],
  [
    choice(
      "a2-v1",
      "explicit_detail",
      "What do Sara and Maria often do after shopping?",
      [
        "They go back to the supermarket.",
        "They drink tea and talk.",
        "They walk with a Saturday group.",
        "They clean the market.",
      ],
      "B",
    ),
    choice(
      "a2-v2",
      "explicit_detail",
      "How does Sara feel about Saturday now?",
      [
        "It has become her favourite part of the week.",
        "She wants to stop going to the market.",
        "She prefers to stay at home.",
        "She is bored of the market.",
      ],
      "A",
    ),
    choice(
      "a2-v3",
      "explicit_detail",
      "Who is Maria?",
      [
        "Sara's sister.",
        "The owner of the café.",
        "Sara's neighbour.",
        "A seller at the market.",
      ],
      "C",
    ),
  ],
);

const b1Reading = reading(
  "b1-office-change",
  "B1",
  "primary",
  [
    "When Lena's company asked staff to work from home two days a week, she expected to feel more relaxed. Instead, she found it harder to switch off. Emails arrived late in the evening, and she often kept working after dinner. After a month she made a rule: the laptop closes at seven. The work is still there the next morning, but her evenings feel like evenings again.",
  ],
  [
    choice(
      "b1-r1",
      "main_idea",
      "What is the text mainly about?",
      [
        "Why Lena's company closed its office.",
        "How Lena stopped work from taking over her evenings.",
        "Why Lena now prefers to answer emails at night.",
        "How working from home made Lena more relaxed.",
      ],
      "B",
    ),
    choice(
      "b1-r2",
      "cause_and_effect",
      "Why did Lena close the laptop at seven?",
      [
        "The company told her to finish at seven.",
        "She could not stop working after dinner.",
        "She wanted more evening emails.",
        "The office building closes at seven.",
      ],
      "B",
    ),
    choice(
      "b1-r3",
      "inference",
      "What changed for Lena after the rule?",
      [
        "She stopped receiving emails.",
        "Her evenings felt separate from work again.",
        "She returned to the office every evening.",
        "She began working later than before.",
      ],
      "B",
    ),
  ],
);

const b1Listening = listening(
  "b1-city-library",
  "B1",
  [
    "The city library used to be quiet only in the mornings. These days, students arrive after school and stay until closing time. The staff added extra tables, but the real change was a simple booking system for study rooms. People still talk, but they do it in the café downstairs. For many students, the library is now the one place where they can actually finish their work.",
  ],
  [
    choice(
      "b1-l1",
      "explicit_detail",
      "What change did the library make?",
      [
        "It became quiet only in the mornings.",
        "It added extra tables, and that solved the noise.",
        "It added a booking system for study rooms.",
        "It stopped students from staying after school.",
      ],
      "C",
    ),
    choice(
      "b1-l3",
      "explicit_detail",
      "Where do people talk now?",
      [
        "In the booked study rooms.",
        "In the café downstairs.",
        "In the street after closing time.",
        "Only during the quiet mornings.",
      ],
      "B",
    ),
    choice(
      "b1-l2",
      "inference",
      "Why do many students value the library now?",
      [
        "It is the only café in the city.",
        "It is a place where they can finish their work.",
        "It stays empty all afternoon.",
        "Talking is now forbidden everywhere in it.",
      ],
      "B",
    ),
  ],
);

const b1Verification = reading(
  "b1-lena-rule",
  "B1",
  "verification",
  [
    "Lena told a colleague about her seven o'clock rule. The colleague laughed at first, then tried it too. Both of them still answer urgent messages, but ordinary emails wait until morning.",
  ],
  [
    choice(
      "b1-v1",
      "explicit_detail",
      "What still happens after seven o'clock?",
      [
        "They answer only urgent messages.",
        "They answer every email at once.",
        "They close the office for the night.",
        "They ignore urgent messages until Monday.",
      ],
      "A",
    ),
    choice(
      "b1-v2",
      "inference",
      "What does the colleague's later decision suggest?",
      [
        "He laughed, then ignored the rule.",
        "He came to think the rule was worth trying.",
        "He left Lena's company.",
        "He asked Lena to work later than seven.",
      ],
      "B",
    ),
    choice(
      "b1-v3",
      "explicit_detail",
      "What happens to ordinary emails?",
      [
        "They are left until the next morning.",
        "They are deleted at seven.",
        "They are treated as urgent.",
        "They are answered together with urgent ones at night.",
      ],
      "A",
    ),
  ],
);

const b2Reading = reading(
  "b2-remote-meetings",
  "B2",
  "primary",
  [
    "Remote meetings were supposed to save time. In practice, many teams now spend longer talking than they did in the office, because it is easier to add one more person than to decide who is actually needed. The meetings feel inclusive, but the work often starts only after they end.",
    "A few managers have begun asking a sharper question: would this conversation still happen if everyone had to travel across town for it? The point is not to make work less friendly. It is to notice that convenience can hide a cost. When a meeting is cheap to call, people call it even when a short written update would have been enough.",
  ],
  [
    choice(
      "b2-r1",
      "main_idea",
      "What is the writer's main point?",
      [
        "Because online meetings are easy to start, teams hold more of them than they need.",
        "Teams should return to the office so that meetings stay short.",
        "A meeting is useful only after everyone has travelled.",
        "Written updates have already made meetings unnecessary.",
      ],
      "A",
    ),
    choice(
      "b2-r2",
      "vocabulary_in_context",
      'What does "convenience can hide a cost" mean here?',
      [
        "A meeting that is easy to call can waste time nobody notices.",
        "Travel is always more expensive than a video call.",
        "Friendly teams should meet more often.",
        "A written update costs more than a meeting.",
      ],
      "A",
    ),
    choice(
      "b2-r3",
      "purpose",
      "What is the train-journey question meant to test?",
      [
        "Whether people enjoy travelling to the office.",
        "Whether the conversation is important enough to deserve a meeting.",
        "Whether the office should close.",
        "Whether trains are cheaper than video calls.",
      ],
      "B",
    ),
  ],
);

const b2Listening = listening(
  "b2-neighbour-garden",
  "B2",
  [
    "When the city offered residents a small grant to turn unused roof space into gardens, most people imagined vegetables. What actually appeared were chairs, lights, and evening conversations. A few pots of herbs survived the first summer, but the real change was social rather than agricultural.",
    "The food was limited, but the roofs became places where neighbours finally learned one another's names. The grant was meant to support local food. It may have done something more useful: it made the building feel shared. Several residents now say they would keep the chairs even if the money never came again.",
  ],
  [
    choice(
      "b2-l1",
      "explicit_detail",
      "What did most people expect the roofs to be used for?",
      [
        "Chairs and evening conversations.",
        "Growing vegetables.",
        "A larger city grant.",
        "New apartments on the roof.",
      ],
      "B",
    ),
    choice(
      "b2-l2",
      "inference",
      "What mattered more than the food?",
      [
        "The herbs that survived the summer.",
        "Neighbours began to feel that the building was shared.",
        "The size of the grant.",
        "Moving the gardens down to the street.",
      ],
      "B",
    ),
    choice(
      "b2-l3",
      "explicit_detail",
      "What do several residents say they would keep even without more money?",
      [
        "The chairs.",
        "The herb pots, because they fed the building.",
        "The city grant office.",
        "A vegetable market.",
      ],
      "A",
    ),
  ],
);

const b2Verification = reading(
  "b2-meeting-test",
  "B2",
  "verification",
  [
    "One manager now uses a simple test before sending a calendar invite: if the same conversation would not justify a train journey, it becomes a written note instead. The team still meets, but less often, and the remaining meetings usually have a decision attached.",
    "At first some people felt left out. After a month, though, most of them said they had more time to finish their own work, and they still heard about the important choices in a short summary afterwards.",
  ],
  [
    choice(
      "b2-v1",
      "purpose",
      "Why does the manager use the train-journey test?",
      [
        "To replace every written note with a journey.",
        "To keep only conversations that are worth meeting for.",
        "To make staff travel more often.",
        "To make the remaining meetings last longer.",
      ],
      "B",
    ),
    choice(
      "b2-v2",
      "inference",
      "What is true of the team's remaining meetings?",
      [
        "They are usually there to reach a decision.",
        "They now last the whole afternoon.",
        "They happen more often than before.",
        "They have replaced the written summaries.",
      ],
      "A",
    ),
    choice(
      "b2-v3",
      "explicit_detail",
      "How did most people feel after a month?",
      [
        "They could finish more of their own work and still hear the key decisions.",
        "They still felt left out and wanted the old calendar back.",
        "They stopped reading the short summaries.",
        "They asked to travel across town every day.",
      ],
      "A",
    ),
  ],
);

const c1Reading = reading(
  "c1-attention-economy",
  "C1",
  "primary",
  [
    "We talk about attention as if it were a personal failing: people cannot focus, therefore they must try harder. That story is convenient, because it leaves the design of our tools unexamined. Many platforms are not merely available; they are arranged to interrupt. A notification is rarely an accident. It is a small claim on the next few seconds of somebody's day.",
    "Recovering concentration, then, is less a matter of willpower than of refusing environments that treat interruption as a feature. The people who last longest in deep work are not always the strongest-willed. They are often the ones who have made it slightly harder for a machine to reach them.",
  ],
  [
    choice(
      "c1-r1",
      "main_idea",
      "What is the writer arguing?",
      [
        "People cannot focus because they have not yet made a serious effort.",
        "The way tools are built explains weak focus better than a lack of effort.",
        "Willpower still matters more than design, though tools make effort slightly harder.",
        "Notifications are rare accidents, so they are not worth redesigning.",
      ],
      "B",
    ),
    choice(
      "c1-r2",
      "vocabulary_in_context",
      'In "arranged to interrupt", "arranged" is closest in meaning to:',
      [
        "set up on purpose.",
        "available whenever the user opens them.",
        "laid out neatly on the screen.",
        "broken, so they stop the user by mistake.",
      ],
      "A",
    ),
    choice(
      "c1-r3",
      "inference",
      "Who, according to the writer, tends to last longest in deep work?",
      [
        "People whose willpower is strong enough to answer every claim on their time.",
        "People who have made it a little harder for the tools to reach them.",
        "People who clear each notification quickly, so each claim stays small.",
        "People who treat interruption as an accident and return to work at once.",
      ],
      "B",
    ),
  ],
);

const c1Listening = listening(
  "c1-museum-silence",
  "C1",
  [
    "The museum's newest room is, at first glance, almost an absence: a bench, a window, and none of the labels that usually tell you what you are supposed to notice. Visitors linger there longer than they do in the galleries crowded with objects, and a few photograph the emptiness as if they needed proof that they were permitted to stop.",
    "The curator insists the point is not vacancy for its own sake. It is to offer a place where looking is not immediately converted into information — where the eye is not hurried toward a caption. Some guests leave restless, as though the building had withheld its usual service. Others say it is the first time the museum has allowed them to think. The institution has decided to keep the room for a year, even if the comments remain divided.",
  ],
  [
    choice(
      "c1-l1",
      "explicit_detail",
      "What is unusual about the new room?",
      [
        "It does not tell visitors what they are supposed to notice.",
        "It is more crowded with objects than the other galleries.",
        "Its labels explain which emptiness visitors should photograph.",
        "It offers the usual information service more quickly than the galleries.",
      ],
      "A",
    ),
    choice(
      "c1-l2",
      "attitude",
      "What do the different reactions suggest?",
      [
        "Visitors agree that the room has failed to provide a service.",
        "Some feel a service was withheld; others feel they were allowed to think.",
        "Visitors stay longer because they are photographing the captions.",
        "Divided comments have already led the museum to restore the labels.",
      ],
      "B",
    ),
    choice(
      "c1-l3",
      "purpose",
      "What is the curator trying to protect?",
      [
        "Emptiness as something valuable in itself.",
        "A kind of looking that is not immediately turned into information.",
        "Proof that object-filled galleries are no longer useful.",
        "The feeling that the museum has withheld its usual service.",
      ],
      "B",
    ),
  ],
);

const c1Verification = reading(
  "c1-tool-design",
  "C1",
  "verification",
  [
    "If a tool can wait five minutes without calling you back, it is probably designed for your work. If it cannot, it is designed for its own metrics. The difference is easy to feel and surprisingly hard to explain to the people who built it.",
    "They often reply that users asked for more alerts. What they rarely ask is whether those same users later regretted the noise. A quieter product can look like a weaker one in a weekly report, even when it is the one people actually finish their work with.",
  ],
  [
    choice(
      "c1-v1",
      "inference",
      "What does the writer suggest about impatient tools?",
      [
        "They help people finish work sooner than tools that can wait.",
        "They are organised around the product's own measurements.",
        "They are easier to justify to the people who built them.",
        "A five-minute wait shows that they were designed for the user's task.",
      ],
      "B",
    ),
    choice(
      "c1-v2",
      "vocabulary_in_context",
      'In this text, "calling you back" is closest in meaning to:',
      [
        "telephoning your family.",
        "pulling your attention back.",
        "waiting quietly until you choose to return.",
        "recording how long you stay in the product.",
      ],
      "B",
    ),
    choice(
      "c1-v3",
      "inference",
      "Why can a quieter product look weaker in a weekly report?",
      [
        "Because the report can count alerts more easily than finished work.",
        "Because people do not actually finish their work with quiet products.",
        "Because users later say they missed the noise.",
        "Because the builders refused the alerts that users had requested.",
      ],
      "A",
    ),
  ],
);

const c2Reading = reading(
  "c2-competence-trap",
  "C2",
  "primary",
  [
    "There is a particular trap that waits for the highly competent: they become so good at meeting the standard in front of them that they stop asking whether the standard is worth meeting. Their days fill with elegant solutions to inherited problems. Praise arrives on time. The calendar stays full. Nothing in the usual measures of success suggests that anything is wrong.",
    "From the outside this looks like mastery. From the inside it can feel like motion without destination — a kind of professional restlessness that no extra hour of work will cure. The uncomfortable question is not “How can I do this better?” It is “Why is this the problem I am so busy solving?”",
  ],
  [
    choice(
      "c2-r1",
      "main_idea",
      "What trap does the writer describe?",
      [
        "Skill can be spent perfecting a standard that was never worth meeting.",
        "Restlessness comes from failing the standard in front of them.",
        "Praise that arrives late is what reveals the trap.",
        "A full calendar shows that the standard was the right one.",
      ],
      "A",
    ),
    choice(
      "c2-r2",
      "inference",
      "Why is it part of the trap that ordinary success measures show nothing wrong?",
      [
        "Those measures reward the performance that hides the deeper question.",
        "Those measures reveal that the person is missing the standard.",
        "The restlessness shows clearly in the calendar, so more hours can cure it.",
        "Once praise arrives on time, the inherited problems have been solved.",
      ],
      "A",
    ),
    choice(
      "c2-r3",
      "inference",
      "Which question does the writer think matters more?",
      [
        "How can I meet this standard more elegantly?",
        "Does this problem deserve the ability I am using on it?",
        "How can I make the praise arrive sooner?",
        "Which of tomorrow's inherited problems should be solved first?",
      ],
      "B",
    ),
  ],
);

const c2Listening = listening(
  "c2-archive-letters",
  "C2",
  [
    "What survives in an archive is rarely a faithful sample of what once mattered. The letters that remain are not, as a rule, the decisive ones. They are the ones somebody could not quite bring themselves to throw away — the awkward remainder of a private hesitation. A historian can reconstruct a public argument from newspapers with almost mechanical ease; the moment of doubt that preceded it is far harder to recover. Entire debates can be mapped from headlines, and still that pause is missing.",
    "This is why the unfinished note, the crossed-out sentence, is often more revealing than the polished statement that followed it. The official record tells us what people claimed once they had chosen a position. The discarded draft tells us what they almost said, and at what cost they abandoned it. If we want to understand a decision rather than merely its announcement, we may need the version of the thought that never reached the public.",
  ],
  [
    choice(
      "c2-l1",
      "explicit_detail",
      "According to the speaker, which documents often survive?",
      [
        "The decisive official reports.",
        "Papers someone could not quite bring themselves to discard.",
        "The public argument a historian can rebuild most easily.",
        "The polished statement that was written for an audience.",
      ],
      "B",
    ),
    choice(
      "c2-l2",
      "purpose",
      "Why does the speaker value unfinished notes?",
      [
        "A historian can reconstruct them more easily than a newspaper.",
        "They show what was nearly said, and what it cost to give it up.",
        "They prove the archive is a faithful sample of what once mattered.",
        "They matter less than the polished statement, but they are simpler to quote.",
      ],
      "B",
    ),
    choice(
      "c2-l3",
      "inference",
      "What does the speaker suggest we may still be missing?",
      [
        "The pause before a decision, which the headlines already preserve.",
        "The announcement of the position people finally chose.",
        "The thought that never reached the public.",
        "A full run of newspapers, so the debate can be mapped.",
      ],
      "C",
    ),
  ],
);

const c2Verification = reading(
  "c2-inherited-problems",
  "C2",
  "verification",
  [
    "The cure, if there is one, is not more competence. It is the rarer habit of declining a problem because it does not deserve the talent it would consume. That refusal looks, to the busy, like laziness. It is usually the opposite.",
    "A person who can solve almost anything is most in danger of being asked to solve everything. The discipline is to keep a little talent unused, so that it remains available for a problem that is actually worth the cost.",
  ],
  [
    choice(
      "c2-v1",
      "inference",
      "What does the writer mean by declining a problem?",
      [
        "Stepping back because the skill is not there yet.",
        "Refusing a problem that would spend talent it has not earned.",
        "Letting busier people decide which refusals count as laziness.",
        "Solving it faster so that less talent is used up.",
      ],
      "B",
    ),
    choice(
      "c2-v2",
      "attitude",
      "How does the writer view people who call that refusal laziness?",
      [
        "They confuse a deliberate refusal with idleness.",
        "They are right that unused talent is a form of laziness.",
        "They see the refusal more clearly than the person who makes it.",
        "They should keep a little of their own talent unused as well.",
      ],
      "A",
    ),
    choice(
      "c2-v3",
      "inference",
      "What danger does the writer see in being able to solve almost anything?",
      [
        "Other people will treat that ability as laziness.",
        "Every problem will be offered, including ones that should be declined.",
        "Leaving any talent unused will make the calendar look empty.",
        "Competence itself will become impossible to keep.",
      ],
      "B",
    ),
  ],
);

export const readingLevelContent: ReadingLevelContent[] = [
  {
    level: "A1",
    primaryPassages: [a1Reading, a1Listening, a1ListeningTwo],
    verificationPassages: [a1Verification],
  },
  {
    level: "A2",
    primaryPassages: [a2Reading, a2Listening, a2ListeningTwo],
    verificationPassages: [a2Verification],
  },
  {
    level: "B1",
    primaryPassages: [b1Reading, b1Listening],
    verificationPassages: [b1Verification],
  },
  {
    level: "B2",
    primaryPassages: [b2Reading, b2Listening],
    verificationPassages: [b2Verification],
  },
  {
    level: "C1",
    primaryPassages: [c1Reading, c1Listening],
    verificationPassages: [c1Verification],
  },
  {
    level: "C2",
    primaryPassages: [c2Reading, c2Listening],
    verificationPassages: [c2Verification],
  },
];

const contentByLevel = new Map(
  readingLevelContent.map((entry) => [entry.level, entry]),
);

export function getLevelContent(level: CefrLevel) {
  return contentByLevel.get(level);
}

export function getStepsForLevel(
  level: CefrLevel,
  kind: ReadingPassage["kind"] = "primary",
): ReadingPassage[] {
  const entry = contentByLevel.get(level);
  if (!entry) return [];
  return kind === "verification"
    ? entry.verificationPassages
    : entry.primaryPassages;
}

export function getPassagesForLevel(level: CefrLevel): ReadingPassage[] {
  const entry = contentByLevel.get(level);
  return entry ? [...entry.primaryPassages, ...entry.verificationPassages] : [];
}

function combineSteps(
  level: CefrLevel,
  kind: ReadingPassage["kind"],
  steps: ReadingPassage[],
) {
  if (!steps.length) return undefined;
  if (steps.length === 1) return steps[0];
  return {
    id: `${level}-${kind}-combined`,
    level,
    kind,
    format: "reading" as const,
    paragraphs: steps.flatMap((step) =>
      step.format === "listening"
        ? (step.listeningScript ?? [])
        : step.paragraphs,
    ),
    listeningScript: steps.flatMap((step) => step.listeningScript ?? []),
    questions: steps.flatMap((step) => step.questions),
  };
}

export function getPassageForLevel(
  level: CefrLevel,
  kind: ReadingPassage["kind"] = "primary",
) {
  return combineSteps(level, kind, getStepsForLevel(level, kind));
}

export type ReadingTestListeningScript = {
  id: string;
  level: CefrLevel;
  fileName: string;
  script: string[];
};

export function getReadingTestListeningScripts(): ReadingTestListeningScript[] {
  return readingLevelContent.flatMap((entry) =>
    entry.primaryPassages.flatMap((passage) =>
      passage.format === "listening" && passage.listeningScript?.length
        ? [
            {
              id: passage.id,
              level: passage.level,
              fileName: `${passage.id}.mp3`,
              script: passage.listeningScript,
            },
          ]
        : [],
    ),
  );
}
