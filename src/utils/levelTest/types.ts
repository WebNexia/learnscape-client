export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const READING_QUESTION_TYPES = [
	'main_idea',
	'explicit_detail',
	'vocabulary_in_context',
	'inference',
	'purpose',
	'attitude',
	'cause_and_effect',
	'gap_fill',
] as const;

export type ReadingQuestionType = (typeof READING_QUESTION_TYPES)[number];

export const ANSWER_OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

export type AnswerOptionId = (typeof ANSWER_OPTION_IDS)[number];

export type ReadingQuestionOption = {
	id: AnswerOptionId;
	text: string;
};

export type ReadingQuestionFormat = 'choice' | 'gap_fill';

export type ReadingQuestion = {
	id: string;
	type: ReadingQuestionType;
	format?: ReadingQuestionFormat;
	sourceType?: string;
	prompt: string;
	options: ReadingQuestionOption[];
	correctAnswer: AnswerOptionId | string;
	acceptedAnswers?: string[];
};

export const READING_PASSAGE_KINDS = ['primary', 'verification'] as const;

export type ReadingPassageKind = (typeof READING_PASSAGE_KINDS)[number];
export type ReadingPassageFormat = 'reading' | 'listening';

export type ReadingPassage = {
	id: string;
	level: CefrLevel;
	kind: ReadingPassageKind;
	format?: ReadingPassageFormat;
	paragraphs: string[];
	listeningScript?: string[];
	audioSrc?: string;
	questions: ReadingQuestion[];
};

export type ReadingLevelContent = {
	level: CefrLevel;
	primaryPassages: ReadingPassage[];
	verificationPassages: ReadingPassage[];
};

export type AnswerSelection = Partial<Record<string, string>>;
