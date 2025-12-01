import { Lesson } from './lessons';

export interface ChecklistGroup {
	groupTitle: string;
	items: string[];
	_id?: string;
}

export interface BaseChapter {
	_id: string;
	title: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lessonIds: string[];
	lessons: Lesson[];
	orgId: string;
	evaluationChecklistItems?: ChecklistGroup[];
	askForFeedback?: boolean;
}

export interface ChapterProgress extends BaseChapter {
	isChapterCompleted: boolean;
	isChapterInProgress: boolean;
}
