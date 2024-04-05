import { QuestionInterface } from './question';

interface BaseLesson {
	_id: string;
	title?: string;
	type?: string;
	imageUrl?: string;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface Lesson extends BaseLesson {
	questionIds?: string[];
}

export interface LessonById extends BaseLesson {
	questions?: QuestionInterface[];
}
