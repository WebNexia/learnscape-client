import { useContext } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Document } from '../interfaces/document';
import { Lesson } from '../interfaces/lessons';
import { QuestionInterface } from '../interfaces/question';

interface UsageInfo {
	courses: { id: string; title: string }[];
	lessons: { id: string; title: string }[];
}

type ResourceWithCourses = {
	usedInCourses?: string[];
};

type ResourceWithLessons = {
	usedInLessons?: string[];
};

export const useResourceUsage = (resource: Document | Lesson | QuestionInterface) => {
	const { courses } = useContext(CoursesContext);
	const { lessons } = useContext(LessonsContext);

	const getUsageInfo = (): UsageInfo => {
		const coursesSet = new Set<string>();
		const lessonsSet = new Set<string>();
		const usageInfo: UsageInfo = {
			courses: [],
			lessons: [],
		};

		// Handle Document usage
		if ('usedInLessons' in resource && 'usedInCourses' in resource) {
			const docResource = resource as ResourceWithCourses & ResourceWithLessons;
			// Find courses that use this document
			docResource.usedInCourses?.forEach?.((courseId: string) => {
				if (!coursesSet.has(courseId)) {
					coursesSet.add(courseId);
					const course = courses?.find?.((c) => c._id === courseId);
					if (course) {
						usageInfo.courses.push({ id: course._id, title: course.title });
					}
				}
			});

			// Find lessons that use this document
			docResource.usedInLessons?.forEach?.((lessonId: string) => {
				if (!lessonsSet.has(lessonId)) {
					lessonsSet.add(lessonId);
					const lesson = lessons?.find?.((l) => l._id === lessonId);
					if (lesson) {
						usageInfo.lessons.push({ id: lesson._id, title: lesson.title });
					}
				}
			});
		}

		// Handle Lesson usage
		if ('usedInCourses' in resource) {
			const lessonResource = resource as ResourceWithCourses;
			lessonResource.usedInCourses?.forEach?.((courseId: string) => {
				if (!coursesSet.has(courseId)) {
					coursesSet.add(courseId);
					const course = courses?.find?.((c) => c._id === courseId);
					if (course) {
						usageInfo.courses.push({ id: course._id, title: course.title });
					}
				}
			});
		}

		// Handle Question usage
		if ('usedInLessons' in resource) {
			const questionResource = resource as ResourceWithLessons;
			questionResource.usedInLessons?.forEach?.((lessonId: string) => {
				if (!lessonsSet.has(lessonId)) {
					lessonsSet.add(lessonId);
					const lesson = lessons?.find?.((l) => l._id === lessonId);
					if (lesson) {
						usageInfo.lessons.push({ id: lesson._id, title: lesson.title });
					}
				}
			});
		}

		return usageInfo;
	};

	return {
		usageInfo: getUsageInfo(),
	};
};
