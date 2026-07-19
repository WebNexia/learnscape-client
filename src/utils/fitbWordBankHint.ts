export type WordBankHint = {
	en: string;
	tr: string;
};

export const getWordBankHint = (blankCount: number): WordBankHint => {
	if (blankCount === 1) {
		return {
			en: 'One of these words/expressions is the correct answer',
			tr: 'Bu kelime/ifadelerden biri doğru cevaptır',
		};
	}

	return {
		en: 'Some of these words/expressions are correct answers',
		tr: 'Bu kelime/ifadelerden bazıları doğru cevaplardır',
	};
};
