import type {
	AnswerOptionId,
	CefrLevel,
	ReadingLevelContent,
	ReadingPassage,
	ReadingQuestion,
	ReadingQuestionType,
} from './types';

export const READING_TEST_CONTENT_VERSION = '2026-09-listen-order';
export const QUESTIONS_PER_PASSAGE = 4;
export const QUESTIONS_PER_VERIFICATION_PASSAGE = 2;
export const QUESTIONS_PER_UPPER_PASSAGE = 6;
export const QUESTIONS_PER_A1_PASSAGE = 8;
export const QUESTIONS_PER_UPPER_VERIFICATION_PASSAGE = 3;

export function isUpperReadingLevel(level: CefrLevel) {
	return level === 'B2' || level === 'C1' || level === 'C2';
}

export function questionsPerPrimaryPassage(level: CefrLevel) {
	if (level === 'A1') return QUESTIONS_PER_A1_PASSAGE;
	if (level === 'A2' || level === 'B1' || isUpperReadingLevel(level)) return QUESTIONS_PER_UPPER_PASSAGE;
	return QUESTIONS_PER_PASSAGE;
}

export function questionsPerVerificationPassage(level: CefrLevel) {
	return level === 'B1' || isUpperReadingLevel(level)
		? QUESTIONS_PER_UPPER_VERIFICATION_PASSAGE
		: QUESTIONS_PER_VERIFICATION_PASSAGE;
}

const optionIds: AnswerOptionId[] = ['A', 'B', 'C', 'D'];

function choice(
	id: string,
	type: ReadingQuestionType,
	prompt: string,
	options: [string, string, string, string],
	correctAnswer: AnswerOptionId
): ReadingQuestion {
	return {
		id,
		type,
		prompt,
		options: options.map((text, index) => ({ id: optionIds[index], text })),
		correctAnswer,
	};
}

function gap(id: string, prompt: string, correctAnswer: string, acceptedAnswers: string[]): ReadingQuestion {
	return { id, type: 'gap_fill', format: 'gap_fill', prompt, options: [], correctAnswer, acceptedAnswers };
}

function reading(
	id: string,
	level: CefrLevel,
	kind: ReadingPassage['kind'],
	paragraphs: string[],
	questions: ReadingQuestion[]
): ReadingPassage {
	return { id, level, kind, format: 'reading', paragraphs, questions };
}

function listening(id: string, level: CefrLevel, script: string[], questions: ReadingQuestion[]): ReadingPassage {
	return {
		id,
		level,
		kind: 'primary',
		format: 'listening',
		paragraphs: [],
		listeningScript: script,
		questions,
	};
}

const a1Reading = reading('a1-tom-bicycle', 'A1', 'primary', [
	'Tom has a bicycle. Every day he goes to work by bicycle. The ride is twenty minutes. Tom likes his bicycle.',
], [
	choice('a1-r1', 'explicit_detail', 'How does Tom go to work?', ['By bus.', 'By bicycle.', 'By car.', 'On foot.'], 'B'),
	gap('a1-r2', 'The ride is ______ minutes.', 'twenty', ['twenty', '20']),
]);

const a1Listening = listening('a1-anna-dog', 'A1', [
	'Hi, my name is Anna. I have a small dog. Every morning I walk with my dog in the park. Today it is sunny, so we will stay a little longer.',
], [
	choice('a1-l1', 'explicit_detail', 'Where does Anna walk with her dog?', ['In the park.', 'In her office.', 'At the bus stop.', 'In a shop.'], 'A'),
	choice('a1-l2', 'inference', 'Why will Anna stay longer today?', ['Because her dog is tired.', 'Because it is raining.', 'Because the weather is sunny.', 'Because the park is closed.'], 'C'),
	gap('a1-l5', 'Today it is ______.', 'sunny', ['sunny']),
]);

const a1ListeningTwo = listening('a1-sam-shop', 'A1', [
	'Hello. My name is Sam. I am in a small shop. I need bread and milk. After I pay, I will walk home.',
], [
	choice('a1-l3', 'explicit_detail', 'Where is Sam?', ['In a small shop.', 'In the park.', 'At the office.', 'On the bus.'], 'A'),
	gap('a1-l6', 'Sam needs bread and ______.', 'milk', ['milk']),
	choice('a1-l4', 'explicit_detail', 'What will Sam do after he pays?', ['He will take the bus.', 'He will walk home.', 'He will stay in the shop.', 'He will call Anna.'], 'B'),
]);

const a1Verification = reading('a1-ben-shop', 'A1', 'verification', [
	"Ben likes Tom's bicycle. Next week they will go to a shop near the office and look at bicycles for Ben.",
], [
	choice('a1-v1', 'explicit_detail', 'What will Tom and Ben do next week?', ['They will take the bus.', 'They will look at bicycles for Ben.', 'They will stay at home.', 'They will go to the park.'], 'B'),
	choice('a1-v2', 'inference', 'What can we understand about Ben?', ['He already has a bicycle.', 'He works at the bicycle shop.', 'He does not have a bicycle now.', 'He does not like Tom.'], 'C'),
]);

const a2Reading = reading('a2-sara-market', 'A2', 'primary', [
	'Sara used to buy all her food at the supermarket because it was quick. Then she found a street market nearby. The fruit there was fresher and cheaper. Now she goes every Saturday. She still uses the supermarket, but only for pasta and cleaning products.',
], [
	choice('a2-r1', 'main_idea', 'What is the text mainly about?', ['Why supermarkets are always cheaper.', "How Sara's Saturday shopping changed.", "A new café next to Sara's flat.", "Sara's job at the market."], 'B'),
	gap('a2-r2', 'Sara still buys pasta and cleaning products at the ______.', 'supermarket', ['supermarket', 'the supermarket']),
]);

const a2Listening = listening('a2-mark-train', 'A2', [
	'Last Friday, Mark missed his usual train after work. The next one was forty minutes later, so he waited in a small café near the station. He called his sister and told her he would be late for dinner. When he finally arrived, the food was still warm, and nobody was angry.',
], [
	choice('a2-l1', 'explicit_detail', 'Why did Mark wait in a café?', ['He wanted to buy fruit.', 'His next train was much later.', 'His sister works there.', 'The station was closed.'], 'B'),
	choice('a2-l2', 'inference', "How did Mark's family react when he arrived?", ['They were still waiting outside.', 'They had already left.', 'They were not angry with him.', 'They asked him to cook dinner.'], 'C'),
]);

const a2ListeningTwo = listening('a2-emma-walk', 'A2', [
	"Hi, this is Emma. I'm calling about Saturday. The walking group will start at ten, not nine. Please bring a bottle of water. If it rains, we will meet in the museum café instead.",
], [
	choice('a2-l3', 'explicit_detail', 'What time will the walking group start?', ['At nine.', 'At ten.', 'At forty minutes past nine.', 'After dinner.'], 'B'),
	choice('a2-l4', 'explicit_detail', 'What will they do if it rains?', ['They will cancel the day.', 'They will wait at the station.', 'They will meet in the museum café.', 'They will go to the supermarket.'], 'C'),
]);

const a2Verification = reading('a2-maria-tea', 'A2', 'verification', [
	"Sara's neighbour Maria sometimes comes to the market with her. After shopping, they usually drink tea at a small café and talk. For Sara, Saturday is now the best part of the week.",
], [
	choice('a2-v1', 'explicit_detail', 'What do Sara and Maria often do after shopping?', ['They go back to the supermarket.', 'They drink tea and talk.', 'They take the train home.', 'They clean the café.'], 'B'),
	choice('a2-v2', 'inference', 'How does Sara feel about Saturday now?', ['She thinks it is the best part of her week.', 'She wants to stop going to the market.', 'She prefers to stay at home.', 'She is bored of shopping.'], 'A'),
]);

const b1Reading = reading('b1-office-change', 'B1', 'primary', [
	"When Lena's company asked staff to work from home two days a week, she expected to feel more relaxed. Instead, she found it harder to switch off. Emails arrived late in the evening, and she often kept working after dinner. After a month she made a rule: the laptop closes at seven. The work is still there the next morning, but her evenings feel like evenings again.",
], [
	choice('b1-r1', 'main_idea', 'What is the text mainly about?', ["Why Lena's company closed its office.", 'How Lena learned to protect her evenings at home.', "A new dinner restaurant near Lena's house.", 'Why emails are faster than meetings.'], 'B'),
	gap('b1-r2', 'Lena now closes her laptop at ______.', 'seven', ['seven', '7', "7 o'clock", "seven o'clock"]),
	choice('b1-r3', 'explicit_detail', 'Why did Lena make a rule about her laptop?', ['Her company asked her to work later.', 'She found it hard to stop working at home.', 'She wanted more evening emails.', 'The office closed at seven.'], 'B'),
]);

const b1Listening = listening('b1-city-library', 'B1', [
	'The city library used to be quiet only in the mornings. These days, students arrive after school and stay until closing time. The staff added extra tables, but the real change was a simple booking system for study rooms. People still talk, but they do it in the café downstairs. For many students, the library is now the one place where they can actually finish their work.',
], [
	choice('b1-l1', 'explicit_detail', 'What change did the library make?', ['It closed in the mornings.', 'It removed the café.', 'It added a booking system for study rooms.', 'It stopped students from staying late.'], 'C'),
	choice('b1-l3', 'explicit_detail', 'Where do people talk now?', ['In the study rooms only.', 'In the café downstairs.', 'Outside the library.', 'In the street.'], 'B'),
	choice('b1-l2', 'inference', 'Why do many students value the library now?', ['It is the only café in the city.', 'It helps them finish their work.', 'It is empty all day.', 'It no longer allows talking anywhere.'], 'B'),
]);

const b1Verification = reading('b1-lena-rule', 'B1', 'verification', [
	"Lena told a colleague about her seven o'clock rule. The colleague laughed at first, then tried it too. Both of them still answer urgent messages, but ordinary emails wait until morning.",
], [
	choice('b1-v1', 'explicit_detail', "What still happens after seven o'clock?", ['They answer only urgent messages.', 'They start a second job.', 'They close the office.', 'They ignore every message.'], 'A'),
	choice('b1-v2', 'inference', 'How did the colleague react in the end?', ['He asked Lena to stop the rule.', 'He also tried the same rule.', 'He moved to another company.', 'He worked later than before.'], 'B'),
	choice('b1-v3', 'explicit_detail', 'What happens to ordinary emails?', ['They wait until morning.', 'They are deleted at seven.', 'They go to another company.', 'They are answered at once.'], 'A'),
]);

const b2Reading = reading('b2-remote-meetings', 'B2', 'primary', [
	'Remote meetings were supposed to save time. In practice, many teams now spend longer talking than they did in the office, because it is easier to add one more person than to decide who is actually needed. The meetings feel inclusive, but the work often starts only after they end.',
	'A few managers have begun asking a sharper question: would this conversation still happen if everyone had to travel across town for it? The point is not to make work less friendly. It is to notice that convenience can hide a cost. When a meeting is cheap to call, people call it even when a short written update would have been enough.',
], [
	choice('b2-r1', 'main_idea', "What is the writer's main point?", ['Remote meetings often expand because they are too easy to fill.', 'Offices should close permanently.', 'Travel always improves discussion.', 'Managers should ban all meetings.'], 'A'),
	gap('b2-r2', 'According to the text, the work often starts only after the meetings ______.', 'end', ['end', 'finish', 'are over']),
	choice('b2-r3', 'inference', 'What does the writer suggest about cheap, easy meetings?', ['They are always more useful than emails.', 'They can replace the need for any written update.', 'Their convenience can hide the time they waste.', 'Managers call them only after a long train journey.'], 'C'),
]);

const b2Listening = listening('b2-neighbour-garden', 'B2', [
	'When the city offered residents a small grant to turn unused roof space into gardens, most people imagined vegetables. What actually appeared were chairs, lights, and evening conversations. A few pots of herbs survived the first summer, but the real change was social rather than agricultural.',
	"The food was limited, but the roofs became places where neighbours finally learned one another's names. The grant was meant to support local food. It may have done something more useful: it made the building feel shared. Several residents now say they would keep the chairs even if the money never came again.",
], [
	choice('b2-l1', 'explicit_detail', 'What did most people expect the roofs to be used for?', ['Parking.', 'Growing vegetables.', "Children's sports.", 'Office meetings.'], 'B'),
	choice('b2-l2', 'inference', 'What unexpected benefit does the speaker mention?', ['The grant paid for new apartments.', 'Neighbours started to know one another.', 'The roofs produced enough food for the city.', 'People stopped using the streets.'], 'B'),
	choice('b2-l3', 'explicit_detail', 'What do several residents say they would keep even without more money?', ['The chairs.', 'The city grant office.', 'A new apartment block.', 'A vegetable market.'], 'A'),
]);

const b2Verification = reading('b2-meeting-test', 'B2', 'verification', [
	'One manager now uses a simple test before sending a calendar invite: if the same conversation would not justify a train journey, it becomes a written note instead. The team still meets, but less often, and the remaining meetings usually have a decision attached.',
	'At first some people felt left out. After a month, though, most of them said they had more time to finish their own work, and they still heard about the important choices in a short summary afterwards.',
], [
	choice('b2-v1', 'purpose', 'Why does the manager use the train-journey test?', ['To cancel all written notes.', 'To decide which conversations really need a meeting.', 'To make staff travel more.', 'To measure the speed of trains.'], 'B'),
	choice('b2-v2', 'inference', "What is true of the team's remaining meetings?", ['They usually aim at a decision.', 'They last the whole afternoon.', 'They have no agenda.', 'They replaced all emails.'], 'A'),
	choice('b2-v3', 'explicit_detail', 'How did most people feel after a month?', ['They had more time and still learned the important choices.', 'They asked to travel across town every day.', 'They stopped reading the written summaries.', 'They wanted longer meetings than before.'], 'A'),
]);

const c1Reading = reading('c1-attention-economy', 'C1', 'primary', [
	"We talk about attention as if it were a personal failing: people cannot focus, therefore they must try harder. That story is convenient, because it leaves the design of our tools unexamined. Many platforms are not merely available; they are arranged to interrupt. A notification is rarely an accident. It is a small claim on the next few seconds of somebody's day.",
	'Recovering concentration, then, is less a matter of willpower than of refusing environments that treat interruption as a feature. The people who last longest in deep work are not always the strongest-willed. They are often the ones who have made it slightly harder for a machine to reach them.',
], [
	choice('c1-r1', 'main_idea', 'What is the writer arguing?', ['People should simply try harder to focus.', 'Poor concentration is mainly a design problem, not a private weakness.', 'All digital tools should be banned.', 'Willpower is the only reliable solution.'], 'B'),
	gap('c1-r2', 'According to the writer, many platforms treat interruption as a ______.', 'feature', ['feature']),
	choice('c1-r3', 'inference', 'Who, according to the writer, tends to last longest in deep work?', ['The people who answer every notification at once.', 'The people who have made it harder for machines to interrupt them.', 'Only those with unusually strong willpower.', 'Anyone who uses more platforms than before.'], 'B'),
]);

const c1Listening = listening('c1-museum-silence', 'C1', [
	"The museum's newest room is, at first glance, almost an absence: a bench, a window, and none of the labels that usually tell you what you are supposed to notice. Visitors linger there longer than they do in the galleries crowded with objects, and a few photograph the emptiness as if they needed proof that they were permitted to stop.",
	'The curator insists the point is not vacancy for its own sake. It is to offer a place where looking is not immediately converted into information — where the eye is not hurried toward a caption. Some guests leave restless, as though the building had withheld its usual service. Others say it is the first time the museum has allowed them to think. The institution has decided to keep the room for a year, even if the comments remain divided.',
], [
	choice('c1-l1', 'explicit_detail', 'What is unusual about the new room?', ['It has no labels and very few objects.', 'It is closed to visitors.', "It contains the museum's oldest paintings.", 'It is used only for school groups.'], 'A'),
	choice('c1-l2', 'attitude', 'How do visitors respond to the room?', ['Everyone immediately likes it.', 'Reactions are mixed: some feel restless, others feel able to think.', 'They ask for more labels on every wall.', 'They refuse to sit down.'], 'B'),
	choice('c1-l3', 'explicit_detail', 'What has the museum decided to do?', ['Close the room if any visitor complains.', 'Fill the room with labels next week.', 'Keep the room for a year even if opinions stay divided.', 'Move the bench into the busiest gallery.'], 'C'),
]);

const c1Verification = reading('c1-tool-design', 'C1', 'verification', [
	'If a tool can wait five minutes without calling you back, it is probably designed for your work. If it cannot, it is designed for its own metrics. The difference is easy to feel and surprisingly hard to explain to the people who built it.',
	'They often reply that users asked for more alerts. What they rarely ask is whether those same users later regretted the noise. A quieter product can look like a weaker one in a weekly report, even when it is the one people actually finish their work with.',
], [
	choice('c1-v1', 'inference', 'What does the writer suggest about impatient tools?', ['They are usually built to serve their own measurements.', 'They always help people finish work faster.', 'They are more honest than quiet tools.', 'They should be used all evening.'], 'A'),
	choice('c1-v2', 'vocabulary_in_context', 'In this text, "calling you back" is closest in meaning to:', ['telephoning your family.', 'pulling your attention again.', 'ending the project.', 'saving your work automatically.'], 'B'),
	choice('c1-v3', 'inference', 'Why can a quieter product look weaker in a weekly report?', ['Because it produces fewer alerts to count.', 'Because nobody ever finishes work with it.', 'Because users never asked for alerts.', 'Because it waits more than five hours.'], 'A'),
]);

const c2Reading = reading('c2-competence-trap', 'C2', 'primary', [
	'There is a particular trap that waits for the highly competent: they become so good at meeting the standard in front of them that they stop asking whether the standard is worth meeting. Their days fill with elegant solutions to inherited problems. Praise arrives on time. The calendar stays full. Nothing in the usual measures of success suggests that anything is wrong.',
	'From the outside this looks like mastery. From the inside it can feel like motion without destination — a kind of professional restlessness that no extra hour of work will cure. The uncomfortable question is not “How can I do this better?” It is “Why is this the problem I am so busy solving?”',
], [
	choice('c2-r1', 'main_idea', 'What trap does the writer describe?', ['Competent people may keep solving the wrong problems with great skill.', 'Only inexperienced people feel restless at work.', 'Mastery always produces happiness.', 'Standards should never be questioned.'], 'A'),
	gap('c2-r2', 'The writer says this restlessness is a kind of motion without ______.', 'destination', ['destination', 'a destination']),
	choice('c2-r3', 'inference', 'Which question does the writer think the competent person should ask?', ['How can I fill the calendar even more?', 'Why is this the problem I am so busy solving?', 'How can I earn praise more quickly?', 'Which inherited problem should I solve first tomorrow?'], 'B'),
]);

const c2Listening = listening('c2-archive-letters', 'C2', [
	'What survives in an archive is rarely a faithful sample of what once mattered. The letters that remain are not, as a rule, the decisive ones. They are the ones somebody could not quite bring themselves to throw away — the awkward remainder of a private hesitation. A historian can reconstruct a public argument from newspapers with almost mechanical ease; the moment of doubt that preceded it is far harder to recover. Entire debates can be mapped from headlines, and still that pause is missing.',
	'This is why the unfinished note, the crossed-out sentence, is often more revealing than the polished statement that followed it. The official record tells us what people claimed once they had chosen a position. The discarded draft tells us what they almost said, and at what cost they abandoned it. If we want to understand a decision rather than merely its announcement, we may need the version of the thought that never reached the public.',
], [
	choice('c2-l1', 'explicit_detail', 'According to the speaker, which documents often survive?', ['Only the most important official reports.', 'The ones somebody could not quite throw away.', 'Every newspaper from the period.', 'Only letters that were never opened.'], 'B'),
	choice('c2-l2', 'purpose', 'Why does the speaker value unfinished notes?', ['They are easier to read than newspapers.', 'They show what people nearly said, not only what they claimed.', 'They prove that archives are complete.', 'They replace the need for public records.'], 'B'),
	choice('c2-l3', 'inference', 'What does the speaker suggest we may need in order to understand a decision?', ['Only the headlines from that week.', 'A complete list of every official report.', 'The version of the thought that never reached the public.', 'A letter that was never written at all.'], 'C'),
]);

const c2Verification = reading('c2-inherited-problems', 'C2', 'verification', [
	'The cure, if there is one, is not more competence. It is the rarer habit of declining a problem because it does not deserve the talent it would consume. That refusal looks, to the busy, like laziness. It is usually the opposite.',
	'A person who can solve almost anything is most in danger of being asked to solve everything. The discipline is to keep a little talent unused, so that it remains available for a problem that is actually worth the cost.',
], [
	choice('c2-v1', 'inference', 'What does the writer mean by declining a problem?', ['Avoiding work because one is unskilled.', 'Refusing tasks that are not worth the ability they would use.', 'Asking other people to become more competent.', 'Working longer hours on every request.'], 'B'),
	choice('c2-v2', 'attitude', 'How does the writer view people who call that refusal laziness?', ['As usually mistaken.', 'As the best judges of talent.', 'As more honest than the writer.', 'As people who should rest more.'], 'A'),
	choice('c2-v3', 'inference', 'Why does the writer want some talent to remain unused?', ['So it stays available for a problem that is actually worth the cost.', 'So competent people can look lazy on purpose.', 'So every request can be answered on the same day.', 'So inherited problems never get solved.'], 'A'),
]);

export const readingLevelContent: ReadingLevelContent[] = [
	{ level: 'A1', primaryPassages: [a1Reading, a1Listening, a1ListeningTwo], verificationPassages: [a1Verification] },
	{ level: 'A2', primaryPassages: [a2Reading, a2Listening, a2ListeningTwo], verificationPassages: [a2Verification] },
	{ level: 'B1', primaryPassages: [b1Reading, b1Listening], verificationPassages: [b1Verification] },
	{ level: 'B2', primaryPassages: [b2Reading, b2Listening], verificationPassages: [b2Verification] },
	{ level: 'C1', primaryPassages: [c1Reading, c1Listening], verificationPassages: [c1Verification] },
	{ level: 'C2', primaryPassages: [c2Reading, c2Listening], verificationPassages: [c2Verification] },
];

const contentByLevel = new Map(readingLevelContent.map((entry) => [entry.level, entry]));

export function getLevelContent(level: CefrLevel) {
	return contentByLevel.get(level);
}

export function getStepsForLevel(level: CefrLevel, kind: ReadingPassage['kind'] = 'primary'): ReadingPassage[] {
	const entry = contentByLevel.get(level);
	if (!entry) return [];
	return kind === 'verification' ? entry.verificationPassages : entry.primaryPassages;
}

export function getPassagesForLevel(level: CefrLevel): ReadingPassage[] {
	const entry = contentByLevel.get(level);
	return entry ? [...entry.primaryPassages, ...entry.verificationPassages] : [];
}

function combineSteps(level: CefrLevel, kind: ReadingPassage['kind'], steps: ReadingPassage[]) {
	if (!steps.length) return undefined;
	if (steps.length === 1) return steps[0];
	return {
		id: `${level}-${kind}-combined`,
		level,
		kind,
		format: 'reading' as const,
		paragraphs: steps.flatMap((step) => (step.format === 'listening' ? step.listeningScript ?? [] : step.paragraphs)),
		listeningScript: steps.flatMap((step) => step.listeningScript ?? []),
		questions: steps.flatMap((step) => step.questions),
	};
}

export function getPassageForLevel(level: CefrLevel, kind: ReadingPassage['kind'] = 'primary') {
	return combineSteps(level, kind, getStepsForLevel(level, kind));
}

export type ReadingTestListeningScript = { id: string; level: CefrLevel; fileName: string; script: string[] };

export function getReadingTestListeningScripts(): ReadingTestListeningScript[] {
	return readingLevelContent.flatMap((entry) =>
		entry.primaryPassages.flatMap((passage) =>
			passage.format === 'listening' && passage.listeningScript?.length
				? [{ id: passage.id, level: passage.level, fileName: `${passage.id}.mp3`, script: passage.listeningScript }]
				: []
		)
	);
}
