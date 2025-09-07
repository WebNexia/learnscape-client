import { QuestionInterface } from '../interfaces/question';
import { QuestionType } from '../interfaces/enums';

export const getQuestionResult = (response: any, fetchQuestionTypeName: (question: QuestionInterface) => string) => {
	const questionType = fetchQuestionTypeName(response.questionId);

	if (questionType === QuestionType.TRUE_FALSE || questionType === QuestionType.MULTIPLE_CHOICE) {
		return response.userAnswer === response.questionId.correctAnswer ? true : false;
	}

	if (questionType === QuestionType.FITB_DRAG_DROP) {
		if (!response.userBlankValuePairAnswers || response.userBlankValuePairAnswers?.length === 0) {
			return false;
		}

		const isAllCorrect =
			response.userBlankValuePairAnswers?.every(
				(userAnswer: any) =>
					response.questionId.blankValuePairs?.some(
						(correctPair: any) => correctPair.id === userAnswer.id && correctPair.value === userAnswer.value
					) || false
			) || false;
		return isAllCorrect ? true : false;
	}

	if (questionType === QuestionType.FITB_TYPING) {
		if (!response.userBlankValuePairAnswers || response.userBlankValuePairAnswers?.length === 0) {
			return false;
		}

		const isAllCorrect =
			response.userBlankValuePairAnswers?.every(
				(userAnswer: any) =>
					response.questionId.blankValuePairs?.some(
						(correctPair: any) => correctPair.id === userAnswer.id && correctPair.value === userAnswer.value
					) || false
			) || false;
		return isAllCorrect ? true : false;
	}

	if (questionType === QuestionType.MATCHING) {
		if (!response.userMatchingPairAnswers || response.userMatchingPairAnswers?.length === 0) {
			return false;
		}

		const isAllCorrect =
			response.userMatchingPairAnswers?.every(
				(userAnswer: any) =>
					response.questionId.matchingPairs?.some(
						(correctPair: any) => correctPair.id === userAnswer.id && correctPair.answer === userAnswer.answer
					) || false
			) || false;
		return isAllCorrect ? true : false;
	}

	return undefined;
};
