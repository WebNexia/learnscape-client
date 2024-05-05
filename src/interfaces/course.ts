import { ChapterLessonData } from '../pages/AdminCourseEditPage';

export interface BaseCourse {
	_id: string;
	title: string;
	description: string;
	price: string;
	imageUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Course extends BaseCourse {
	lessonCount: number;
	startingDate: Date;
	format: string;
	durationWeeks: number;
	durationHours: number;
	priceCurrency: string;
}

export interface FilteredCourse extends BaseCourse {
	chapterIds: any;
}

export interface UserCourseByUserId extends BaseCourse {
	chapterIds: string[];
}

export interface SingleCourse extends BaseCourse {
	startingDate: Date;
	format: string;
	durationWeeks: number;
	durationHours: number;
	priceCurrency: string;
	chapterIds: string[];
	chapters: ChapterLessonData[];
}
