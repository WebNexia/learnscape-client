import { Course } from './course';
import { Lesson } from './lessons';
import { User } from './user';

interface BaseUserLesson {
	_id: string;
	courseId: Course[];
	userCourseId: string;
	currentQuestion: number;
	lessonOrder: number;
	isCompleted: boolean;
	isInProgress: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserLessonList extends BaseUserLesson {
	userId: string;
	lessonId: Lesson[];
}

export interface UserLessonsByUserId extends BaseUserLesson {
	userId: string;
	lessonId: Lesson;
}

export interface UserLessonsByLessonId extends BaseUserLesson {
	lessonId: string;
	userId: User;
}
