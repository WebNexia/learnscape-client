import { Lesson } from './lessons';

export interface BaseChapter {
	_id: string;
	title: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lessonIds: string[];
	lessons: Lesson[];
}
