export interface Feedback {
	_id: string;
	chapterId: string | { _id: string; title: string };
	courseId: string | { _id: string; title: string };
	userId: string | { _id: string; firstName: string; lastName: string; username?: string; email?: string; imageUrl?: string };
	userCourseId: string;
	orgId: string | { _id: string; name: string };
	feedback: string;
	createdAt: string;
	updatedAt: string;
}
