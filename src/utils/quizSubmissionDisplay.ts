import { QuestionType } from '../interfaces/enums';

export const isFillInTheBlanksQuestionType = (questionType: string): boolean =>
	questionType === QuestionType.FITB_TYPING || questionType === QuestionType.FITB_DRAG_DROP;

/** Modal / feedback view title — FITB Typing/Drag-Drop shown as one label. */
export const getFeedbackModalQuestionTitle = (questionType: string): string => {
	if (isFillInTheBlanksQuestionType(questionType)) {
		return 'Question (Fill in the Blanks)';
	}
	return `Question (${questionType})`;
};
