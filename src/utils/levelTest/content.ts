import type {
  AnswerOptionId,
  CefrLevel,
  ReadingLevelContent,
  ReadingPassage,
  ReadingQuestion,
  ReadingQuestionType,
} from "./types";

export const READING_TEST_CONTENT_VERSION = "2026-10-12-item-standards";
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
      "How does Tom get to work?",
      [
        "He uses his bicycle.",
        "He walks for twenty minutes.",
        "He goes by car.",
        "He takes the bus.",
      ],
      "A",
    ),
    gap(
      "a1-r2",
      "How long is Tom's ride to work? ______ minutes.",
      "twenty",
      ["twenty", "20"],
    ),
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
      "What does Anna do every morning?",
      [
        "She takes her dog to a shop.",
        "She goes to work by bus.",
        "She walks her dog in the park.",
        "She stays at home in the sun.",
      ],
      "C",
    ),
    choice(
      "a1-l2",
      "cause_and_effect",
      "Why will they stay longer today?",
      [
        "Because the dog is small.",
        "Because the weather is sunny.",
        "Because they walk every morning.",
        "Because Anna likes the park.",
      ],
      "B",
    ),
    gap("a1-l5", "What kind of dog does Anna have? A ______ one.", "small", [
      "small",
    ]),
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
      "Where is Sam now?",
      ["On the way home.", "At a café.", "At his office.", "In a shop."],
      "D",
    ),
    gap("a1-l6", "Sam needs bread. He also needs ______.", "milk", ["milk"]),
    choice(
      "a1-l4",
      "explicit_detail",
      "Sam will pay, and then what?",
      [
        "He will walk home.",
        "He will buy more food.",
        "He will take the bus.",
        "He will stay in the shop.",
      ],
      "A",
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
      "What will they look at in the shop?",
      [
        "Cars for Tom.",
        "Food for the office.",
        "Bicycles for Ben.",
        "The bicycle Tom already rides.",
      ],
      "C",
    ),
    choice(
      "a1-v2",
      "explicit_detail",
      "When will they go to the shop?",
      ["This morning.", "Every day.", "On Saturday.", "Next week."],
      "D",
    ),
    choice(
      "a1-v3",
      "explicit_detail",
      "Where is the shop?",
      ["Near the park.", "Near the office.", "At Ben's house.", "Near the station."],
      "B",
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
      "Sara's shopping is not the same as before. What changed?",
      [
        "She buys all her fruit at the supermarket because it is fresher there.",
        "She has stopped buying fruit and now shops only on Saturday.",
        "She has a new Saturday job selling fruit at the market.",
        "She buys fruit at the market and only some things at the supermarket.",
      ],
      "D",
    ),
    choice(
      "a2-r2",
      "explicit_detail",
      "What does Sara still buy at the supermarket?",
      [
        "Pasta and cleaning products.",
        "Fresher fruit, because that shop is quick.",
        "All of her food, as she used to.",
        "Pasta from the street market.",
      ],
      "A",
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
      "cause_and_effect",
      "Why did Mark wait in a café?",
      [
        "He wanted to eat his dinner there.",
        "His sister works in that café.",
        "His next train was still some time away.",
        "There were no more trains that evening.",
      ],
      "C",
    ),
    choice(
      "a2-l2",
      "explicit_detail",
      "What was the food like when Mark arrived?",
      [
        "The food had gone cold.",
        "The food was still at the café.",
        "The food was not ready yet.",
        "The food was still warm.",
      ],
      "D",
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
      "When will the walking group start?",
      ["At nine.", "At ten.", "At nine if it rains.", "After the museum closes."],
      "B",
    ),
    choice(
      "a2-l4",
      "explicit_detail",
      "If it rains, where will the group meet?",
      [
        "In the café at the museum.",
        "Outside at nine o'clock.",
        "In the shop at the museum.",
        "At Emma's house instead.",
      ],
      "A",
    ),
  ],
);

const a2Verification = reading(
  "a2-maria-tea",
  "A2",
  "verification",
  [
    "Sara's neighbour Maria sometimes comes to the market with her. Maria works in a shop on weekdays, so she does not work on Saturday. After shopping, they usually drink tea at a small café and talk. The café is often busy, but they stay and talk. For Sara, that talk is now the best part of the week.",
  ],
  [
    choice(
      "a2-v1",
      "explicit_detail",
      "What do Sara and Maria usually do after shopping?",
      [
        "They work together in Maria's shop.",
        "They leave the café because it is busy.",
        "They have tea together and talk.",
        "They go round the market again.",
      ],
      "C",
    ),
    choice(
      "a2-v2",
      "attitude",
      "What does Sara enjoy most about Saturday now?",
      [
        "How busy the café gets.",
        "The talk after shopping.",
        "Maria's job on weekdays.",
        "The market on its own.",
      ],
      "B",
    ),
    choice(
      "a2-v3",
      "vocabulary_in_context",
      "How does Maria know Sara?",
      [
        "They work in the same shop.",
        "Maria owns the café.",
        "They met because the café was busy.",
        "Maria lives near Sara.",
      ],
      "D",
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
        "Why Lena's company closed the office.",
        "Why Lena now prefers to answer emails at night.",
        "How Lena stopped work from taking over her evenings.",
        "How working from home made Lena feel relaxed.",
      ],
      "C",
    ),
    choice(
      "b1-r2",
      "explicit_detail",
      "What did Lena's company ask the staff to do?",
      [
        "To work from home on two days a week.",
        "To close the office on those two days.",
        "To answer emails only late at night.",
        "To stop all of their work at seven.",
      ],
      "A",
    ),
    choice(
      "b1-r3",
      "explicit_detail",
      "What was still true the morning after Lena's rule?",
      [
        "The emails had stopped coming.",
        "The work had not gone away.",
        "She had returned to the office full time.",
        "She had worked later than seven.",
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
      "What was the real change at the library?",
      [
        "It is quiet only in the mornings now.",
        "The extra tables ended the noise.",
        "Students must leave when school ends.",
        "Students can reserve a room for study.",
      ],
      "D",
    ),
    choice(
      "b1-l3",
      "explicit_detail",
      "Where do people talk now?",
      [
        "In the café one floor below.",
        "In the rooms they have booked.",
        "In the street after closing time.",
        "Only during the quiet morning.",
      ],
      "A",
    ),
    choice(
      "b1-l2",
      "explicit_detail",
      "Why is the library useful for many students now?",
      [
        "It is the only café open in the city.",
        "It is where many of them can finish their work.",
        "It stays empty through the whole afternoon.",
        "Talking is not allowed in any of its rooms.",
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
    "Lena told a colleague about her seven o'clock rule. He laughed at first, because he thought the rule was unnecessary. Later he tried it too. Both of them still answer urgent messages after seven, but ordinary emails wait until the next morning.",
  ],
  [
    choice(
      "b1-v1",
      "explicit_detail",
      "The colleague laughed at the rule. What did he do after that?",
      [
        "He answered every email at once.",
        "He closed the office for the night.",
        "He ignored urgent messages until Monday.",
        "He tried the same rule.",
      ],
      "D",
    ),
    choice(
      "b1-v2",
      "inference",
      "What does the colleague's later action suggest?",
      [
        "Laughing showed he would never use the rule.",
        "He left the company a short time later.",
        "He no longer saw the rule as unnecessary.",
        "He wanted Lena to work later than seven.",
      ],
      "C",
    ),
    choice(
      "b1-v3",
      "explicit_detail",
      "What happens to ordinary emails?",
      [
        "They are deleted at seven.",
        "They are left until the next day.",
        "They are treated as urgent.",
        "They are answered at night, with the urgent ones.",
      ],
      "B",
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
      "Remote meetings were meant to save time. What does the writer say they do instead?",
      [
        "They give teams a reason to move back to the office.",
        "They happen only after everyone has travelled.",
        "They take up more talking time than office meetings did.",
        "Written updates have already taken their place.",
      ],
      "C",
    ),
    choice(
      "b2-r2",
      "vocabulary_in_context",
      "The writer says convenience can hide a cost. What is that hidden cost?",
      [
        "Time used up without people quite noticing.",
        "The money spent travelling across town.",
        "Teams growing less friendly with each other.",
        "The effort of writing a short update.",
      ],
      "A",
    ),
    choice(
      "b2-r3",
      "purpose",
      "Why ask whether people would still cross the town for this conversation?",
      [
        "To find out whether they enjoy the journey.",
        "To see whether the talk is worth meeting for.",
        "To decide whether the office should close.",
        "To compare travel costs with a video call.",
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
      "What did most people expect to see on the roofs?",
      [
        "Chairs and conversations in the evening.",
        "A bigger payment than the city offered.",
        "Gardens at street level, not on the roof.",
        "Food being grown up there.",
      ],
      "D",
    ),
    choice(
      "b2-l2",
      "inference",
      "What does the speaker think the grant really achieved?",
      [
        "A few herbs lasted through the summer.",
        "A larger payment from the city later on.",
        "The building came to feel like a shared place.",
        "The gardens moved from the roof to the street.",
      ],
      "C",
    ),
    choice(
      "b2-l3",
      "explicit_detail",
      "What do several residents say about the chairs?",
      [
        "They would keep the chairs without more money.",
        "The herbs matter more to them than the chairs.",
        "The chairs matter only while the grant lasts.",
        "They would give the chairs away if the herbs died.",
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
      "explicit_detail",
      "What happens to a conversation that is not worth the train journey?",
      [
        "It is dropped and never mentioned again.",
        "It is replaced by a longer meeting.",
        "The team travels there and meets anyway.",
        "It becomes a note rather than a meeting.",
      ],
      "D",
    ),
    choice(
      "b2-v2",
      "explicit_detail",
      "What is true of the meetings the team still holds?",
      [
        "They usually fill the whole afternoon.",
        "They happen more often than they used to.",
        "They are usually there to settle a decision.",
        "They have replaced the written summaries.",
      ],
      "C",
    ),
    choice(
      "b2-v3",
      "inference",
      "After a month, what had most people gained?",
      [
        "The old feeling of being left out of the team.",
        "Time to finish their work, and the important news.",
        "An end to the short summaries sent afterwards.",
        "A trip across town for every remaining meeting.",
      ],
      "B",
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
      "attitude",
      "What is the writer's main argument?",
      [
        "Tools, not only the user, explain why focus fails.",
        "People who cannot focus just need more willpower.",
        "Willpower matters more than how the tools are designed.",
        "Alerts are accidents, so the tools should stay as they are.",
      ],
      "A",
    ),
    choice(
      "c1-r2",
      "vocabulary_in_context",
      'What does "arranged to interrupt" suggest?',
      [
        "The tools sit there until you choose to open them.",
        "The breaks in attention are put there on purpose.",
        "The screens are neatly laid out for the user.",
        "A fault stops the user, though nobody meant it to.",
      ],
      "B",
    ),
    choice(
      "c1-r3",
      "explicit_detail",
      "Who lasts longest in deep work, according to the writer?",
      [
        "People who can answer every demand by willpower.",
        "People who deal with each alert as soon as it comes.",
        "People who treat each interruption as an accident.",
        "People who make it harder for devices to reach them.",
      ],
      "D",
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
      "What does the new room leave out?",
      [
        "Somewhere for visitors to sit down.",
        "Any chance for visitors to take photographs.",
        "Signs that tell visitors what they ought to notice.",
        "Space, compared with the crowded galleries.",
      ],
      "C",
    ),
    choice(
      "c1-l2",
      "inference",
      "What do the divided reactions show?",
      [
        "Some miss the usual guidance; others like the time to think.",
        "The visitors all agree that the empty room has failed.",
        "People stay on only because they want the labels back.",
        "The labels have already been returned to the walls.",
      ],
      "A",
    ),
    choice(
      "c1-l3",
      "purpose",
      "What is the curator's aim?",
      [
        "To prize emptiness for its own sake.",
        "To prove that galleries full of objects no longer work.",
        "To make guests feel the museum is holding back a service.",
        "To let people look without being pushed straight to a caption.",
      ],
      "D",
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
      "explicit_detail",
      "A tool that cannot wait five minutes is built for what, in the writer's view?",
      [
        "The numbers the product itself is judged by.",
        "Finishing the user's task more quickly.",
        "An explanation the builders will find easy to give.",
        "The work the user is trying to complete.",
      ],
      "A",
    ),
    choice(
      "c1-v2",
      "vocabulary_in_context",
      'In this text, what does "calling you back" mean?',
      [
        "Phoning a member of the user's family.",
        "Waiting quietly until the user comes back.",
        "Claiming the user's attention once more.",
        "Measuring how long the user stays away.",
      ],
      "C",
    ),
    choice(
      "c1-v3",
      "explicit_detail",
      "What do the builders rarely ask?",
      [
        "Whether users requested more alerts.",
        "Whether those users later wished the alerts had stayed quiet.",
        "Whether a weekly report can make a product look weak.",
        "Whether people finish their work with a quieter product.",
      ],
      "B",
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
      "The praise arrives and the calendar is full. Why does the writer still call this a trap?",
      [
        "Ability is spent on a standard that may not deserve it.",
        "The person is failing the standard in front of them.",
        "Praise is the part of the story that arrives too late.",
        "A full calendar shows the standard was the right one.",
      ],
      "A",
    ),
    choice(
      "c2-r2",
      "inference",
      "The usual signs of success show nothing wrong. What follows from that, in the writer's view?",
      [
        "The person is failing the standard after all.",
        "The restlessness is visible in the calendar, so more hours will cure it.",
        "On-time praise means the inherited problems are the right ones.",
        "The measures that look like success keep the real question out of sight.",
      ],
      "D",
    ),
    choice(
      "c2-r3",
      "explicit_detail",
      'The writer puts aside "How can I do this better?" What should be asked instead?',
      [
        "How can I meet this standard more elegantly?",
        "Is this problem worth the ability I am spending on it?",
        "How can I make the praise arrive sooner?",
        "Which of tomorrow's inherited problems should come first?",
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
      "Which papers does the speaker say are most likely to remain?",
      [
        "The ones that settled a public argument.",
        "The ones a historian can rebuild with least effort.",
        "The ones someone could not quite bear to discard.",
        "The polished versions prepared for an audience.",
      ],
      "C",
    ),
    choice(
      "c2-l2",
      "explicit_detail",
      "The polished statement shows the chosen position. What extra thing does the discarded draft show?",
      [
        "A story easier to rebuild than the newspaper account.",
        "That an archive keeps a fair sample of what mattered.",
        "A line that is easier to quote than the final statement.",
        "What was almost said, and the cost of letting it go.",
      ],
      "D",
    ),
    choice(
      "c2-l3",
      "explicit_detail",
      "When a debate is rebuilt from headlines, what does the speaker say is still absent?",
      [
        "The moment of doubt before a position was chosen.",
        "The public announcement of the position they settled on.",
        "Enough newspapers to map the debate.",
        "The headlines that carried the argument.",
      ],
      "A",
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
      "vocabulary_in_context",
      "What does the writer mean by declining a problem?",
      [
        "Saying the skill for it is not there yet.",
        "Saying no, because it has not earned the talent.",
        "Letting others decide what should count as lazy.",
        "Solving it more quickly so less talent is used.",
      ],
      "B",
    ),
    choice(
      "c2-v2",
      "attitude",
      "Busy people call that refusal laziness. What have they misunderstood?",
      [
        "Unused talent really is a form of laziness.",
        "They read the refusal more clearly than the writer.",
        "The writer agrees that such a refusal is lazy.",
        "Refusing the problem is the opposite of laziness.",
      ],
      "D",
    ),
    choice(
      "c2-v3",
      "explicit_detail",
      "Someone who can solve almost anything is in a particular danger. What is it?",
      [
        "People will treat that wide ability as laziness.",
        "Unused talent will leave the calendar empty.",
        "They will be asked to solve nearly every problem.",
        "The ability itself will be impossible to keep.",
      ],
      "C",
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
