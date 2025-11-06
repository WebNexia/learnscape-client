import { UserCourseByUserId } from './course';

interface BaseUserCourse {
	_id: string;
	userId: string;
	isInProgress: boolean;
	isCompleted: boolean;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
	validUntil: string;
	completedChapterChecklistIds?: string[];
}

export interface UserCoursesByUserId extends BaseUserCourse {
	courseId: UserCourseByUserId;
}

export interface UserCourseList extends BaseUserCourse {
	courseId: string;
}
