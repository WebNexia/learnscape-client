import { SingleCourse } from '../interfaces/course';
import { UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';

export interface CourseProgress {
	completed: number;
	total: number;
	percentage: number;
}

export type CourseProgressSource = Pick<SingleCourse, 'chapters'> & { lessonCount?: number };

export const getCourseLessonCount = (course: CourseProgressSource | null | undefined): number => {
	if (course?.lessonCount != null && course.lessonCount > 0) {
		return course.lessonCount;
	}
	if (!course?.chapters?.length) return 0;

	return course.chapters.reduce((sum, chapter) => {
		if (chapter.lessons?.length) {
			return sum + chapter.lessons.filter((lesson) => lesson != null).length;
		}
		return sum + (chapter.lessonIds?.length ?? 0);
	}, 0);
};

/** Same formula as CoursePageBanner — completed userLessons / total lessons in course outline */
export const getCourseProgress = (
	course: CourseProgressSource | null | undefined,
	userLessons: UserLessonDataStorage[] | undefined
): CourseProgress => {
	const total = getCourseLessonCount(course);
	const completed = userLessons?.filter((ul) => ul.isCompleted).length ?? 0;
	const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

	return { completed, total, percentage };
};
