/** FITB typing accepts any capitalization. Drag-and-drop stays an exact match. */
export const blankAnswersMatch = (correct: string | null | undefined, given: string | null | undefined): boolean =>
	String(correct ?? '')
		.trim()
		.toLowerCase() ===
	String(given ?? '')
		.trim()
		.toLowerCase();
