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

/**
 * Course total possible score: graded quiz points plus points for each non-quiz lesson.
 * Quizzes keep their question scores and do not receive the per-lesson points.
 * Matches server `getCourseScoreStructure`.
 */
export const calculateCourseTotalPossibleScore = (
	chapters: Array<{ lessons?: Array<(Partial<Lesson> & { isArchived?: boolean }) | null> | null }> | null | undefined,
	lessonCompletionPoints?: number | null,
): number => {
	const pointsPerLesson = Math.max(0, Math.floor(Number(lessonCompletionPoints) || 0));
	let quizPossible = 0;
	const nonQuizLessonIds = new Set<string>();

	chapters?.forEach((chapter) => {
		chapter?.lessons?.forEach((lesson) => {
			if (!lesson || lesson.isArchived) return;
			if (lesson.type === 'Quiz') {
				if (lesson.isGraded) quizPossible += calculateQuizTotalScoreFromScores(lesson);
				return;
			}
			if (lesson._id) nonQuizLessonIds.add(lesson._id);
		});
	});

	return quizPossible + nonQuizLessonIds.size * pointsPerLesson;
};
