import { Lesson } from '../interfaces/lessons';

/**
 * Lightweight total score calculator that uses only `questionScores`.
 * This is suitable for course-level listings where we don't have full question data.
 */
export const calculateQuizTotalScoreFromScores = (lesson: Partial<Lesson> | { questionScores?: any }): number => {
	if (!lesson || !lesson.questionScores) {
		return 0;
	}

	const questionScores = lesson.questionScores as Record<string, number | { total?: number }>;
	let total = 0;

	Object.values(questionScores).forEach((score) => {
		if (score == null) return;

		if (typeof score === 'number') {
			total += score;
		} else if (typeof score === 'object' && 'total' in score && score.total != null) {
			total += Number(score.total) || 0;
		}
	});

	return total;
};
