export const getWordBankHint = (blankCount: number): string => {
	if (blankCount === 1) {
		return 'One of these words is the correct answer';
	}

	return 'Some of these words are correct answers';
};
