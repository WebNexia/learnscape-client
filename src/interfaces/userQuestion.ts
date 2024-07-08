export interface UserQuestion {
	_id: string;
	courseId: string;
	isCompleted: boolean;
	isInProgress: boolean;
	lessonId: string;
	orgId: string;
	questionId: string;
	userAnswer: string;
	userLessonId: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
}
