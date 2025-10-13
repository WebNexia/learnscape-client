import { useContext, useState, useEffect } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Document } from '../interfaces/document';
import { Lesson } from '../interfaces/lessons';
import { QuestionInterface } from '../interfaces/question';
import axios from '@utils/axiosInstance';

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
	const [usageInfo, setUsageInfo] = useState<UsageInfo>({ courses: [], lessons: [] });
	const [loading, setLoading] = useState<boolean>(false);

	const fetchMissingLessons = async (lessonIds: string[]): Promise<{ id: string; title: string }[]> => {
		const base_url = import.meta.env.VITE_SERVER_BASE_URL;
		const results: { id: string; title: string }[] = [];

		for (const lessonId of lessonIds) {
			try {
				const response = await axios.get(`${base_url}/lessons/${lessonId}`);
				if (response.data && response.data.title) {
					results.push({ id: lessonId, title: response.data.title });
				}
			} catch (error) {
				console.warn(`Failed to fetch lesson ${lessonId}:`, error);
				// Don't add fallback entries for missing lessons - filter them out
				// This prevents showing non-existent lessons in the dropdown
			}
		}

		return results;
	};

	const fetchMissingCourses = async (courseIds: string[]): Promise<{ id: string; title: string }[]> => {
		const base_url = import.meta.env.VITE_SERVER_BASE_URL;
		const results: { id: string; title: string }[] = [];

		for (const courseId of courseIds) {
			try {
				const response = await axios.get(`${base_url}/courses/${courseId}`);
				if (response.data && response.data.title) {
					results.push({ id: courseId, title: response.data.title });
				}
			} catch (error) {
				console.warn(`Failed to fetch course ${courseId}:`, error);
				// Don't add fallback entries for missing courses - filter them out
				// This prevents showing non-existent courses in the dropdown
			}
		}

		return results;
	};

	const getUsageInfo = async (): Promise<UsageInfo> => {
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
			const missingCourseIds: string[] = [];
			docResource.usedInCourses?.forEach((courseId: string) => {
				if (!coursesSet.has(courseId)) {
					coursesSet.add(courseId);
					const course = courses?.find((c) => c._id === courseId);
					if (course) {
						usageInfo.courses.push({ id: course._id, title: course.title });
					} else {
						missingCourseIds.push(courseId);
					}
				}
			});

			// Find lessons that use this document
			const missingLessonIds: string[] = [];
			docResource.usedInLessons?.forEach((lessonId: string) => {
				if (!lessonsSet.has(lessonId)) {
					lessonsSet.add(lessonId);
					const lesson = lessons?.find((l) => l._id === lessonId);
					if (lesson) {
						usageInfo.lessons.push({ id: lesson._id, title: lesson.title });
					} else {
						missingLessonIds.push(lessonId);
					}
				}
			});

			// Fetch missing courses and lessons
			if (missingCourseIds.length > 0) {
				const missingCourses = await fetchMissingCourses(missingCourseIds);
				usageInfo.courses.push(...missingCourses);
			}

			if (missingLessonIds.length > 0) {
				const missingLessons = await fetchMissingLessons(missingLessonIds);
				usageInfo.lessons.push(...missingLessons);
			}
		}

		// Handle Lesson usage
		if ('usedInCourses' in resource && !('usedInLessons' in resource)) {
			const lessonResource = resource as ResourceWithCourses;
			const missingCourseIds: string[] = [];

			lessonResource.usedInCourses?.forEach((courseId: string) => {
				if (!coursesSet.has(courseId)) {
					coursesSet.add(courseId);
					const course = courses?.find((c) => c._id === courseId);
					if (course) {
						usageInfo.courses.push({ id: course._id, title: course.title });
					} else {
						missingCourseIds.push(courseId);
					}
				}
			});

			// Fetch missing courses
			if (missingCourseIds.length > 0) {
				const missingCourses = await fetchMissingCourses(missingCourseIds);
				usageInfo.courses.push(...missingCourses);
			}
		}

		// Handle Question usage
		if ('usedInLessons' in resource && !('usedInCourses' in resource)) {
			const questionResource = resource as ResourceWithLessons;
			const missingLessonIds: string[] = [];

			questionResource.usedInLessons?.forEach((lessonId: string) => {
				if (!lessonsSet.has(lessonId)) {
					lessonsSet.add(lessonId);
					const lesson = lessons?.find((l) => l._id === lessonId);
					if (lesson) {
						usageInfo.lessons.push({ id: lesson._id, title: lesson.title });
					} else {
						missingLessonIds.push(lessonId);
					}
				}
			});

			// Fetch missing lessons
			if (missingLessonIds.length > 0) {
				const missingLessons = await fetchMissingLessons(missingLessonIds);
				usageInfo.lessons.push(...missingLessons);
			}
		}

		return usageInfo;
	};

	useEffect(() => {
		const loadUsageInfo = async () => {
			setLoading(true);
			try {
				const info = await getUsageInfo();
				setUsageInfo(info);

				// Optional: Log a warning if some lessons/courses were not found
				const totalReferenced = (resource as any).usedInLessons?.length || 0;
				const totalFound = info.lessons.length;
				if (totalReferenced > totalFound) {
					console.warn(`Found ${totalFound} out of ${totalReferenced} referenced lessons. Some lessons may have been deleted.`);
				}
			} catch (error) {
				console.error('Error loading usage info:', error);
			} finally {
				setLoading(false);
			}
		};

		loadUsageInfo();
	}, [resource, courses, lessons]);

	return {
		usageInfo,
		loading,
	};
};
