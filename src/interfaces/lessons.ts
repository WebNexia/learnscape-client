import { QuestionInterface } from './question';

interface BaseLesson {
	_id: string;
	title: string;
	type: string;
	imageUrl: string;
	videoUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	text: string;
	orgId: string;
}

export interface Lesson extends BaseLesson {
	questionIds: string[];
	questions: QuestionInterface[];
}

export interface LessonById extends BaseLesson {
	questions?: QuestionInterface[];
}
