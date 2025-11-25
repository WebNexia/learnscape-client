import { useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import { UserCourseLessonDataContext, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { useAuth } from './useAuth';
import { useDashboardSync, dashboardSyncHelpers } from '../utils/dashboardSync';
import { useUserLessonsForCourse } from './useUserLessonsForCourse';

export const useUserCourseLessonData = () => {
	const { lessonId, courseId, userCourseId } = useParams<{ lessonId: string; courseId: string; userCourseId: string }>();

	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();
	const { user } = useAuth();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonId = searchParams.get('next');
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { userCoursesData, singleCourseUser } = useContext(UserCourseLessonDataContext);
	const queryClient = useQueryClient();

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
			} catch (error) {
				console.error('Failed to update question index:', error);
			}
		},
		[userLessonId, courseId, user?._id, base_url, queryClient]
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
			}
		} catch (fallbackError) {
			console.error('Fallback also failed:', fallbackError);
		}
	}, [nextLessonId, user?._id, courseId, orgId, base_url, queryClient, parsedUserCourseData]);

	// Function to handle moving to the next lesson
	const handleNextLesson = useCallback(async () => {
		try {
			const currentUserLessonIndex = parsedUserLessonData.findIndex((data) => data.userLessonId === userLessonId);

			if (currentUserLessonIndex !== -1 && !parsedUserLessonData[currentUserLessonIndex].isCompleted) {
				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
					currentQuestion: 1,
				});

				// Invalidate cache to refresh lesson data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, user?._id]);

				// Trigger dashboard sync when lesson is completed
				dashboardSyncHelpers.onLessonCompleted(refreshDashboard);

				// Mark lesson completion for checklist auto-open (find which chapter this lesson belongs to)
				if (singleCourseUser && lessonId) {
					for (const chapter of singleCourseUser.chapters || []) {
						if (!chapter || !chapter.lessons) continue;
						const lessonInChapter = chapter.lessons.find((l) => l && l._id === lessonId);
						if (lessonInChapter) {
							// Standardize to use _id (backend format)
							const chapterId = (chapter as any)._id || (chapter as any).chapterId;
							if (chapterId) {
								sessionStorage.setItem(`lesson-completed-${chapterId}`, 'true');
							}
							break;
						}
					}
				}
			}

			if (nextLessonId) {
				const existingNextLesson = parsedUserLessonData?.find((data) => data.lessonId === nextLessonId && data.courseId === courseId);

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
							lessonId: nextLessonId,
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
		} catch (error) {
			console.error('Failed to update in-progress lessons', error);
		}
	}, [base_url, parsedUserLessonData, courseId, user?._id, queryClient]);

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
