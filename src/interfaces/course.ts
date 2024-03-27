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
	startingDate: string;
	format: string;
	durationWeeks: string;
	durationHours: string;
	priceCurrency: string;
}

export interface FilteredCourse extends BaseCourse {
	chapterIds: any;
}

export interface UserCourseByUserId extends BaseCourse {
	chapterIds: string[];
}

export interface SingleCourse extends BaseCourse {
	startingDate: string;
	format: string;
	durationWeeks: string;
	durationHours: string;
	priceCurrency: string;
	chapters: Chapter[];
}

interface Chapter {
	_id: string;
	title: string;
	lessonIds: string[];
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lessons: Lesson[];
}

interface Lesson {
	_id: string;
	title: string;
	imageUrl: string;
	order: number;
}
