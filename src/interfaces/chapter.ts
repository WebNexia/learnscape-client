import { Lesson } from './lessons';

export interface BaseChapter {
	_id: string;
	title: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lessonIds: string[];
	lessons: Lesson[];
	orgId: string;
}

export interface ChapterProgress extends BaseChapter {
	isChapterCompleted: boolean;
	isChapterInProgress: boolean;
}
