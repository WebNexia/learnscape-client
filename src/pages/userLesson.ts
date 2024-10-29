import { Course } from '../interfaces/course';
import { Lesson } from '../interfaces/lessons';
import { User } from '../interfaces/user';

interface BaseUserLesson {
	_id: string;
	userCourseId: string;
	currentQuestion: number;
	isCompleted: boolean;
	isInProgress: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserLessonList extends BaseUserLesson {
	userId: string;
	lessonId: Lesson[];
	courseId: Course[];
}

export interface UserLessonsByUserId extends BaseUserLesson {
	userId: string;
	lessonId: Lesson;
	courseId: string;
	teacherFeedback: string;
	isFeedbackGiven: boolean;
}

export interface UserLessonsByLessonId extends BaseUserLesson {
	lessonId: string;
	userId: User;
	courseId: string;
}
