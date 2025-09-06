import { BlankValuePair } from '../interfaces/question';

export const updateEditorContentAndBlankPairs = (
	editor: any,
	pair: BlankValuePair,
	blankValuePairs: BlankValuePair[],
	setBlankValuePairs: (pairs: BlankValuePair[]) => void
) => {
	let content = editor.getContent();

	// Replace the placeholder of the clicked blank with its value
	const placeholderRegex = new RegExp(`\\(___${pair.blank}___\\)`, 'g');
	content = content.replace(placeholderRegex, pair.value);

	// Remove the used pair from blankValuePairs
	const updatedBlankValuePairs = blankValuePairs
		?.filter((p) => p.id !== pair.id)
		?.map((p) => {
			return {
				...p,
				blank: p.blank > pair.blank ? p.blank - 1 : p.blank, // Adjust only the blanks that are after the removed blank
			};
		});

	// Update the content placeholders after adjusting the blank numbers
	updatedBlankValuePairs?.forEach((p) => {
		const oldPlaceholderRegex = new RegExp(`\\(___${p.blank + 1}___\\)`, 'g');
		content = content.replace(oldPlaceholderRegex, `(___${p.blank}___)`);
	});

	editor.setContent(content);

	if (JSON.stringify(blankValuePairs) !== JSON.stringify(updatedBlankValuePairs)) {
		setBlankValuePairs(updatedBlankValuePairs);
	}
};
