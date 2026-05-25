import { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import { UserCourseLessonDataContext, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { useAuth } from './useAuth';
import { useDashboardSync, dashboardSyncHelpers } from '../utils/dashboardSync';
import { useUserLessonsForCourse } from './useUserLessonsForCourse';
import { learnerLessonQueryKey } from './useLearnerLesson';
import { learnerUserAnswersByLessonQueryKey } from './useLearnerUserAnswersByLesson';

const getChapterIdFromChapter = (chapter: { _id?: string; chapterId?: string } | null | undefined) =>
	String(chapter?._id ?? chapter?.chapterId ?? '');

export const useUserCourseLessonData = () => {
	const { lessonId, courseId, userCourseId } = useParams<{ lessonId: string; courseId: string; userCourseId: string }>();

	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();
	const { user } = useAuth();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonIdFromUrl = searchParams.get('next');
	const chapterIdFromUrl = searchParams.get('chapterId') || '';
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { userCoursesData, singleCourseUser } = useContext(UserCourseLessonDataContext);
	const queryClient = useQueryClient();

	// Resolve next lesson: from URL or derive from course structure (so "Next Lesson" shows even without ?next= in URL)
	const nextLessonId = useMemo(() => {
		if (nextLessonIdFromUrl) return nextLessonIdFromUrl;
		if (!singleCourseUser?.chapters?.length || !lessonId) return null;

		const chapters = chapterIdFromUrl
			? singleCourseUser.chapters.filter(
					(ch) => getChapterIdFromChapter(ch as { _id?: string; chapterId?: string }) === chapterIdFromUrl
				)
			: singleCourseUser.chapters;

		for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
			const chapter = chapters[chapterIndex];
			if (!chapter?.lessons?.length) continue;
			const validLessons = chapter.lessons.filter((l) => l && l._id);
			const currentIndex = validLessons.findIndex((l) => l && l._id === lessonId);
			if (currentIndex === -1) continue;
			if (currentIndex < validLessons.length - 1) return validLessons[currentIndex + 1]._id;
			if (chapterIdFromUrl) return null;
			for (let j = chapterIndex + 1; j < singleCourseUser.chapters.length; j++) {
				const first = singleCourseUser.chapters[j]?.lessons?.find((l) => l && l._id);
				if (first?._id) return first._id;
			}
			return null;
		}
		return null;
	}, [nextLessonIdFromUrl, chapterIdFromUrl, singleCourseUser?.chapters, lessonId]);

	// Use context data for userCourseData, use hook for userLessonData
	const parsedUserCourseData = useMemo(() => {
		return userCoursesData || [];
	}, [userCoursesData]);

	// Fetch user lessons for current course using the new hook
	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');

	// Memoize parsedUserLessonData to prevent unnecessary re-renders
	const parsedUserLessonData = useMemo(() => {
		return userLessonsData || [];
	}, [userLessonsData]);

	// Dashboard sync for real-time updates
	const { refreshDashboard } = useDashboardSync();

	const invalidateLearnerLessonPageCaches = useCallback(async () => {
		if (!lessonId) return;
		await queryClient.invalidateQueries(learnerUserAnswersByLessonQueryKey(lessonId));
		await queryClient.invalidateQueries(learnerLessonQueryKey(lessonId, courseId));
	}, [queryClient, lessonId, courseId]);

	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(() => {
		const isCompleted = searchParams.get('isCompleted');
		return isCompleted ? JSON.parse(isCompleted) : false;
	});

	// State for current userLessonId
	const [userLessonId, setUserLessonId] = useState<string | undefined>(() => {
		const currentUserLessonData = parsedUserLessonData?.find((data) => data.lessonId === lessonId && data.courseId === courseId);
		return currentUserLessonData?.userLessonId;
	});

	// Update userLessonId when data loads
	useEffect(() => {
		const currentUserLessonData = parsedUserLessonData?.find((data) => data.lessonId === lessonId && data.courseId === courseId);
		setUserLessonId(currentUserLessonData?.userLessonId);
	}, [parsedUserLessonData, lessonId, courseId]);


	useEffect(() => {
		const current = parsedUserLessonData?.find((d) => d.lessonId === lessonId && d.courseId === courseId);
		if (current?.isCompleted) setIsLessonCompleted(true);
	}, [parsedUserLessonData, lessonId, courseId]);

	// State for course completion status
	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(() => {
		const currentUserCourseData = parsedUserCourseData?.find((data) => data.userCourseId === userCourseId);
		return currentUserCourseData ? currentUserCourseData.isCourseCompleted || false : false;
	});

	// Function to update last question index
	const updateLastQuestion = useCallback(
		async (questionIndex: number) => {
			if (!userLessonId) return;

			try {
				// Update on server
				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					currentQuestion: questionIndex,
				});

				// Invalidate cache to refresh data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user?._id]);
				await invalidateLearnerLessonPageCaches();
			} catch (error) {
				console.error('Failed to update question index:', error);
			}
		},
		[userLessonId, courseId, user?._id, base_url, queryClient, invalidateLearnerLessonPageCaches]
	);

	// Function to get last question index
	const getLastQuestion = useCallback((): number => {
		const currentUserLessonData = parsedUserLessonData?.find((data) => data.userLessonId === userLessonId);
		return currentUserLessonData ? currentUserLessonData.currentQuestion : 1;
	}, [userLessonId, parsedUserLessonData]);

	// Fallback function to handle next lesson creation failures
	const handleNextLessonFallback = useCallback(async () => {
		if (!nextLessonId || !user?._id || !courseId || !orgId) return;

		try {
			// Check if the lesson already exists on the server using checkEnrollment endpoint
			const existingLessonResponse = await axios.post(`${base_url}/userlessons/search`, {
				userId: user._id,
				lessonId: nextLessonId,
				courseId: courseId,
			});

			if (existingLessonResponse.data && existingLessonResponse.data.length > 0) {
				// Invalidate cache to refresh lesson data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user._id]);
				await invalidateLearnerLessonPageCaches();
			}
		} catch (fallbackError) {
			console.error('Fallback also failed:', fallbackError);
		}
	}, [nextLessonId, user?._id, courseId, orgId, base_url, queryClient, parsedUserCourseData, invalidateLearnerLessonPageCaches]);

	// Function to handle moving to the next lesson
	const handleNextLesson = useCallback(async () => {
		try {
			let resolvedNextLessonId: string | null = nextLessonId;

			// Fallback: derive next lesson from course structure when query param is missing
			if (!resolvedNextLessonId && singleCourseUser && lessonId) {
				const chapters = chapterIdFromUrl
					? singleCourseUser.chapters.filter(
							(ch) => getChapterIdFromChapter(ch as { _id?: string; chapterId?: string }) === chapterIdFromUrl
						)
					: singleCourseUser.chapters || [];

				for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
					const chapter = chapters[chapterIndex];
					if (!chapter?.lessons?.length) continue;

					// Use only valid lessons to avoid null placeholders breaking next-lesson resolution
					const validLessonsInChapter = chapter.lessons.filter((lesson) => lesson && lesson._id);
					const currentLessonIndex = validLessonsInChapter.findIndex((lesson) => lesson && lesson._id === lessonId);
					if (currentLessonIndex === -1) continue;

					// Next lesson in same chapter
					if (currentLessonIndex < validLessonsInChapter.length - 1) {
						const nextLessonInChapter = validLessonsInChapter[currentLessonIndex + 1];
						if (nextLessonInChapter?._id) {
							resolvedNextLessonId = nextLessonInChapter._id;
						}
					} else if (!chapterIdFromUrl) {
						// First lesson of next chapter that has lessons
						const allChapters = singleCourseUser.chapters || [];
						const currentChapterIndex = allChapters.indexOf(chapter);
						for (let nextChapterIndex = currentChapterIndex + 1; nextChapterIndex < allChapters.length; nextChapterIndex++) {
							const nextChapter = allChapters[nextChapterIndex];
							const firstValidLesson = nextChapter?.lessons?.find((lesson) => lesson && lesson._id);
							if (firstValidLesson?._id) {
								resolvedNextLessonId = firstValidLesson._id;
								break;
							}
						}
					}
					break;
				}
			}

			const currentUserLesson = parsedUserLessonData.find((data) => data.userLessonId === userLessonId);
			// Patch only when still in progress or not completed (skip redundant API calls when already done)
			const shouldMarkLessonCompleted =
				Boolean(userLessonId) &&
				(!currentUserLesson || currentUserLesson.isInProgress || !currentUserLesson.isCompleted);

			if (shouldMarkLessonCompleted) {
				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
					currentQuestion: 1,
				});

				setIsLessonCompleted(true);

				// Invalidate cache to refresh lesson data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user?._id]);
				await invalidateLearnerLessonPageCaches();

				// Trigger dashboard sync when lesson is completed
				dashboardSyncHelpers.onLessonCompleted(refreshDashboard);

				// Mark lesson completion for checklist auto-open (find which chapter this lesson belongs to)
				if (singleCourseUser && lessonId) {
					const chaptersToSearch = chapterIdFromUrl
						? singleCourseUser.chapters.filter(
								(ch) => getChapterIdFromChapter(ch as { _id?: string; chapterId?: string }) === chapterIdFromUrl
							)
						: singleCourseUser.chapters || [];

					for (const chapter of chaptersToSearch) {
						if (!chapter || !chapter.lessons) continue;
						const lessonInChapter = chapter.lessons.find((l) => l && l._id === lessonId);
						if (lessonInChapter) {
							const chapterId = getChapterIdFromChapter(chapter as { _id?: string; chapterId?: string });
							if (chapterId) {
								sessionStorage.setItem(`lesson-completed-${chapterId}`, 'true');
							}
							break;
						}
					}
				}
			}

			if (resolvedNextLessonId) {
				// Keep only one active expansion target to avoid stale key collisions
				for (let i = sessionStorage.length - 1; i >= 0; i--) {
					const key = sessionStorage.key(i);
					if (
						key &&
						(key.startsWith('expand-chapter-for-lesson-') || key.startsWith('expand-chapter-by-id-'))
					) {
						sessionStorage.removeItem(key);
					}
				}

				// Store next lesson ID to expand its chapter when navigating back
				sessionStorage.setItem(`expand-chapter-for-lesson-${resolvedNextLessonId}`, 'true');

				// Also store chapter ID for robust expansion fallback
				const targetChapter = singleCourseUser?.chapters?.find((chapter) =>
					chapter?.lessons?.some((lesson) => lesson && lesson._id === resolvedNextLessonId)
				);
				const targetChapterId = (targetChapter as any)?._id || (targetChapter as any)?.chapterId;
				if (targetChapterId) {
					sessionStorage.setItem(`expand-chapter-by-id-${targetChapterId}`, 'true');
				}

				const existingNextLesson = parsedUserLessonData?.find((data) => data.lessonId === resolvedNextLessonId && data.courseId === courseId);

				if (!existingNextLesson) {
					try {
						// Get valid userCourseId from context data instead of URL params (which might be "none")
						// This is critical for free courses where URL might have "none" as placeholder
						const validUserCourseData = parsedUserCourseData?.find((data) => data.courseId === courseId);
						const validUserCourseId = validUserCourseData?.userCourseId;

						// Validate that userCourseId is not "none" or invalid MongoDB ObjectId
						if (!validUserCourseId || validUserCourseId === 'none' || !validUserCourseId.match(/^[0-9a-fA-F]{24}$/)) {
							console.error(
								'Invalid userCourseId - cannot create next lesson. userCourseId:',
								validUserCourseId,
								'courseId:',
								courseId,
								'URL param userCourseId:',
								userCourseId
							);
							// Fallback: try to find existing lesson on server (which might already exist)
							await handleNextLessonFallback();
							return;
						}

						// Make sure the responseUserLesson API call is completed and returns valid data
						const responseUserLesson = await axios.post(`${base_url}/userlessons`, {
							lessonId: resolvedNextLessonId,
							userId: user?._id,
							courseId,
							userCourseId: validUserCourseId,
							currentQuestion: 1,
							isCompleted: false,
							isInProgress: true,
							orgId,
							notes: '',
							teacherFeedback: '',
							isFeedbackGiven: false,
						});

						if (responseUserLesson && responseUserLesson.data && responseUserLesson.data._id) {
							// Invalidate cache to refresh lesson data
							await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user?._id]);
							await invalidateLearnerLessonPageCaches();
						} else {
							console.error('Failed to get userLessonId from the response:', responseUserLesson);
							// Fallback: try to fetch existing lesson data from server
							await handleNextLessonFallback();
						}
					} catch (apiError) {
						console.error('Failed to create next lesson:', apiError);
						// Fallback: try to fetch existing lesson data from server
						await handleNextLessonFallback();
					}
				}
			} else {
				// Check if there are more lessons in the course before marking as completed
				let hasMoreLessons = false;
				if (singleCourseUser && lessonId) {
					// Find current lesson's position
					for (const chapter of singleCourseUser.chapters || []) {
						if (!chapter || !chapter.lessons) continue;
						for (let i = 0; i < chapter.lessons.length; i++) {
							const lesson = chapter.lessons[i];
							if (!lesson) continue;
							if (lesson._id === lessonId) {
								// Check if there are more lessons in current chapter
								if (i < chapter.lessons.length - 1) {
									hasMoreLessons = true;
									break;
								}
								// Check if there are more chapters with lessons
								const currentChapterIndex = singleCourseUser.chapters.indexOf(chapter);
								for (let j = currentChapterIndex + 1; j < singleCourseUser.chapters.length; j++) {
									const nextChapter = singleCourseUser.chapters[j];
									if (nextChapter && nextChapter.lessons && nextChapter.lessons.length > 0) {
										hasMoreLessons = true;
										break;
									}
								}
								break;
							}
						}
						if (hasMoreLessons) break;
					}
				}

				// Only mark course as completed if there are no more lessons
				if (!hasMoreLessons) {
					// Get valid userCourseId from context data instead of URL params
					const validUserCourseData = parsedUserCourseData?.find((data) => data.courseId === courseId);
					const validUserCourseId = validUserCourseData?.userCourseId || userCourseId;

					// Validate that userCourseId is not "none" or invalid
					if (validUserCourseId && validUserCourseId !== 'none' && validUserCourseId.match(/^[0-9a-fA-F]{24}$/)) {
						await axios.patch(`${base_url}/usercourses/${validUserCourseId}`, {
							isCompleted: true,
							isInProgress: false,
						});

						setIsCourseCompleted(true);
					} else {
						console.error('Invalid userCourseId for course completion:', validUserCourseId);
					}

					setIsCourseCompleted(true);

					// Invalidate React Query cache to refresh context data
					await queryClient.invalidateQueries(['userCourseData']);
				}

				// navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			console.error('Error in handleNextLesson:', error);
			throw error;
		}
	}, [
		userLessonId,
		nextLessonId,
		user?._id,
		courseId,
		userCourseId,
		orgId,
		parsedUserLessonData,
		base_url,
		queryClient,
		handleNextLessonFallback,
		refreshDashboard,
		singleCourseUser,
		lessonId,
		chapterIdFromUrl,
		invalidateLearnerLessonPageCaches,
	]);

	// Function to update in-progress lessons
	const updateInProgressLessons = useCallback(async () => {
		const inProgressLessons = parsedUserLessonData?.filter((lesson: UserLessonDataStorage) => lesson.isInProgress) || [];
		try {
			for (const lesson of inProgressLessons) {
				const currentQuestion = lesson.currentQuestion;
				await axios.patch(`${base_url}/userlessons/${lesson.userLessonId}`, {
					currentQuestion,
				});
			}
			// Invalidate cache to refresh lesson data
			await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user?._id]);
			if (lessonId) {
				await queryClient.invalidateQueries(learnerUserAnswersByLessonQueryKey(lessonId));
			}
		} catch (error) {
			console.error('Failed to update in-progress lessons', error);
		}
	}, [base_url, parsedUserLessonData, courseId, user?._id, queryClient, lessonId]);

	return {
		isLessonCompleted,
		setIsLessonCompleted,
		isCourseCompleted,
		setIsCourseCompleted,
		userLessonId,
		handleNextLesson,
		nextLessonId,
		updateLastQuestion,
		getLastQuestion,
		parsedUserLessonData,
		updateInProgressLessons,
	};
};
