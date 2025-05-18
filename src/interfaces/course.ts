import { ChapterLessonData } from '../pages/AdminCourseEditPage';
import { Document } from './document';

export interface BaseCourse {
	_id: string;
	title: string;
	description: string;
	prices: Price[];
	imageUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	isExpired: boolean;
	clonedFromId: string;
	versionNote: string;
	createdByName: string;
	createdByImageUrl: string;
	createdByRole: string;
	updatedByName: string;
	updatedByImageUrl: string;
	updatedByRole: string;
	publishedAt: string;
}

export interface Course extends BaseCourse {
	lessonCount: number;
	startingDate: Date;
	format: string;
	durationWeeks: number;
	durationHours: number;
}

export interface FilteredCourse extends BaseCourse {
	chapterIds: any;
}

export interface UserCourseByUserId extends BaseCourse {
	chapterIds: string[];
}

export interface SingleCourse extends BaseCourse {
	startingDate: Date | null;
	format: string;
	durationWeeks: number;
	durationHours: number;
	chapterIds: string[];
	chapters: ChapterLessonData[];
	orgId: string;
	documentIds: string[];
	documents: Document[];
	firstLessonId: string;
}

export interface Price {
	currency: 'gbp' | 'usd' | 'eur' | 'try';
	amount: string;
}
