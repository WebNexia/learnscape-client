import { UserCourseByUserId } from './course';

interface BaseUserCourse {
	_id: string;
	userId: string;
	isInProgress: boolean;
	isCompleted: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserCoursesByUserId extends BaseUserCourse {
	courseId: UserCourseByUserId;
}

export interface UserCourseList extends BaseUserCourse {
	courseId: string;
}
