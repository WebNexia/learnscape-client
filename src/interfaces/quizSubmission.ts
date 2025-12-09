import { QuestionInterface } from './question';

export interface QuizSubmission {
	_id: string;
	lessonName: string;
	courseName: string;
	userName: string;
	lessonId: string;
	courseId: string;
	userLessonId: string;
	orgId: string;
	userId: string;
	isChecked: boolean;
	createdAt: string;
	updatedAt: string;

	// Existing summary / helper fields
	totalEarned?: number;
	lessonIsGraded?: boolean;
	lessonType?: string;
	lessonQuestionScores?: { [questionId: string]: number | { total: number; perBlank?: number; perMatch?: number } };
	lessonQuestions?: QuestionInterface[];

	// Assessment metadata (for future pre/post reporting)
	assessmentType?: 'pre' | 'post' | 'none';
	assessmentGroupId?: string | null;

	// Optional score summary for reporting
	scoreRaw?: number;
	scoreMax?: number;
	scorePercent?: number;
}
