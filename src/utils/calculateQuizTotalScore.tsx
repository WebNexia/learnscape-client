import { Lesson } from '../interfaces/lessons';
import { QuestionType, LessonType } from '../interfaces/enums';

interface CalculateTotalScoreParams {
	lesson: Lesson;
	fetchQuestionTypeName: (question: any) => string;
}

export const calculateQuizTotalScore = ({ lesson, fetchQuestionTypeName }: CalculateTotalScoreParams): number => {
	if (!lesson.isGraded || lesson.type !== LessonType.QUIZ) {
		return 0;
	}

	const questions = lesson.questions?.filter((q) => q !== null && q !== undefined) || [];
	const questionScores = lesson.questionScores || {};
	let total = 0;

	questions.forEach((question) => {
		const questionId = question._id;
		if (!questionId) return;

		const score = questionScores[questionId];
		const questionType = fetchQuestionTypeName(question);

		if (questionType === QuestionType.FITB_TYPING || questionType === QuestionType.FITB_DRAG_DROP || questionType === QuestionType.MATCHING) {
			// For FITB and Matching, get total from score object
			if (score && typeof score === 'object' && score !== null) {
				const scoreObj = score as { total?: number };
				if (scoreObj.total !== undefined && scoreObj.total !== null) {
					total += scoreObj.total;
				}
			}
		} else {
			// For simple questions, get the number directly
			if (score !== undefined && score !== null && typeof score === 'number') {
				total += score;
			}
		}
	});

	return total;
};
