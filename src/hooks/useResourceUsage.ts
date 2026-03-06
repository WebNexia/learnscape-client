import { useContext, useState, useEffect } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Document } from '../interfaces/document';
import { Lesson } from '../interfaces/lessons';
import { QuestionInterface } from '../interfaces/question';
import axios from '@utils/axiosInstance';

export interface CourseUsageItem {
	id: string;
	title: string;
	chapters?: { id: string; title: string }[];
}

interface UsageInfo {
	courses: CourseUsageItem[];
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

	const fetchMissingCourses = async (courseIds: string[]): Promise<CourseUsageItem[]> => {
		const base_url = import.meta.env.VITE_SERVER_BASE_URL;
		const results: CourseUsageItem[] = [];

		for (const courseId of courseIds) {
			try {
				const response = await axios.get(`${base_url}/courses/${courseId}`);
				const courseData = response.data?.data ?? response.data;
				if (courseData && courseData.title) {
					results.push({ id: courseId, title: courseData.title });
				}
			} catch (error) {
				console.warn(`Failed to fetch course ${courseId}:`, error);
				// Don't add fallback entries for missing courses - filter them out
				// This prevents showing non-existent courses in the dropdown
			}
		}

		return results;
	};

	/** Fetches courses with chapters that contain the given lesson (for Lesson usage only). */
	const fetchCoursesWithChapters = async (
		courseIds: string[],
		lessonId: string
	): Promise<CourseUsageItem[]> => {
		const base_url = import.meta.env.VITE_SERVER_BASE_URL;
		const results: CourseUsageItem[] = [];
		const lessonIdStr = String(lessonId);

		for (const courseId of courseIds) {
			try {
				const response = await axios.get(`${base_url}/courses/${courseId}`);
				const data = response.data?.data ?? response.data;
				if (!data || !data.title) continue;

				const chapters = Array.isArray(data.chapters) ? data.chapters : [];
				const chaptersContainingLesson = chapters
					.filter(
						(ch: { _id?: string; title?: string; lessonIds?: unknown[] }) =>
							Array.isArray(ch.lessonIds) &&
							ch.lessonIds.some((id: unknown) => String(id) === lessonIdStr)
					)
					.map((ch: { _id: string; title?: string }) => ({
						id: String(ch._id),
						title: ch.title ?? '',
					}));

				results.push({
					id: courseId,
					title: data.title,
					chapters: chaptersContainingLesson.length > 0 ? chaptersContainingLesson : undefined,
				});
			} catch (error) {
				console.warn(`Failed to fetch course ${courseId}:`, error);
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

		const isDocumentResource = 'usedInLessons' in resource && 'usedInCourses' in resource;
		const isLessonResource = 'usedInCourses' in resource && !isDocumentResource;

		// Handle Lesson usage: fetch courses with chapters so we can show chapter names
		if (isLessonResource) {
			const lessonResource = resource as ResourceWithCourses & { _id?: string; id?: string };
			const lessonId = lessonResource._id ?? lessonResource.id;
			let courseIds = [...new Set((lessonResource.usedInCourses ?? []).map((id: unknown) => String(id)))].filter(Boolean);

			// Some list responses can omit usedInCourses, so fetch the single lesson as fallback.
			if (courseIds.length === 0 && lessonId) {
				try {
					const base_url = import.meta.env.VITE_SERVER_BASE_URL;
					const lessonResponse = await axios.get(`${base_url}/lessons/${lessonId}`);
					const lessonUsedInCourses = lessonResponse.data?.usedInCourses;
					if (Array.isArray(lessonUsedInCourses)) {
						courseIds = [...new Set(lessonUsedInCourses.map((id: unknown) => String(id)))].filter(Boolean);
					}
				} catch (error) {
					console.warn(`Failed to fetch lesson ${lessonId} for usedInCourses fallback:`, error);
				}
			}

			if (courseIds.length > 0) {
				if (lessonId) {
					const coursesWithChapters = await fetchCoursesWithChapters(courseIds, String(lessonId));
					usageInfo.courses.push(...coursesWithChapters);
				} else {
					const fallbackCourses = await fetchMissingCourses(courseIds);
					usageInfo.courses.push(...fallbackCourses);
				}
			}
		}

		// Handle Document usage
		if (!isLessonResource && isDocumentResource) {
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
