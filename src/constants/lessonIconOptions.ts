/** Must stay aligned with `learnscape-server-qa/utils/lessonIconKeys.js` */
export const LESSON_ICON_KEYS = [
	'none',
	'vocabulary',
	'conversation',
	'true_false',
	'fill_blanks',
	'chunk_practice',
	'translate',
	'slang_idioms',
	'speaking',
	'writing',
	'song',
	'video_suggestion',
] as const;

export type LessonIconKey = (typeof LESSON_ICON_KEYS)[number];

export const LESSON_ICON_SELECT_OPTIONS: { value: LessonIconKey; label: string }[] = [
	{ value: 'none', label: 'Default / none' },
	{ value: 'vocabulary', label: 'Vocabulary' },
	{ value: 'conversation', label: 'Conversation' },
	{ value: 'true_false', label: 'True or false' },
	{ value: 'fill_blanks', label: 'Fill in the blanks' },
	{ value: 'chunk_practice', label: 'Chunk practice' },
	{ value: 'translate', label: 'Translate' },
	{ value: 'slang_idioms', label: 'Slang & idioms' },
	{ value: 'speaking', label: 'Speaking prompts' },
	{ value: 'writing', label: 'Writing' },
	{ value: 'song', label: 'Song suggestion' },
	{ value: 'video_suggestion', label: 'Video suggestion' },
];

export function isLessonIconKey(value: string): value is LessonIconKey {
	return (LESSON_ICON_KEYS as readonly string[]).includes(value);
}
