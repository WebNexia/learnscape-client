export interface UserMatchingPairAnswers {
	id: string;
	answer: string;
}

export interface UserBlankValuePairAnswers {
	id: string;
	value: string;
}

export interface UserQuestion {
	_id: string;
	courseId: string;
	userId: string;
	userLessonId: string;
	lessonId: string;
	orgId: string;
	questionId: string;
	isCompleted: boolean;
	isInProgress: boolean;
	userAnswer: string;
	userMatchingPairAnswers: UserMatchingPairAnswers[];
	userBlankValuePairAnswers: UserBlankValuePairAnswers[];
	audioRecordUrl: string;
	videoRecordUrl: string;
	teacherFeedback: string;
	teacherAudioFeedbackUrl: string;
	createdAt: string;
	updatedAt: string;
}
