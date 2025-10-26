import { useCallback, useContext, useEffect, useState } from 'react';
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

	const { userCoursesData } = useContext(UserCourseLessonDataContext);
	const queryClient = useQueryClient();

	// Use context data for userCourseData, use hook for userLessonData
	const parsedUserCourseData = userCoursesData || [];

	// Fetch user lessons for current course using the new hook
	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessonData = userLessonsData || [];

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
		if (!nextLessonId || !user?._id || !courseId || !userCourseId || !orgId) return;

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
	}, [nextLessonId, user?._id, courseId, userCourseId, orgId, base_url, queryClient]);

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
			}

			if (nextLessonId) {
				const existingNextLesson = parsedUserLessonData?.find((data) => data.lessonId === nextLessonId && data.courseId === courseId);

				if (!existingNextLesson) {
					try {
						// Make sure the responseUserLesson API call is completed and returns valid data
						const responseUserLesson = await axios.post(`${base_url}/userlessons`, {
							lessonId: nextLessonId,
							userId: user?._id,
							courseId,
							userCourseId,
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
				await axios.patch(`${base_url}/usercourses/${userCourseId}`, {
					isCompleted: true,
					isInProgress: false,
				});

				setIsCourseCompleted(true);

				// Invalidate React Query cache to refresh context data
				await queryClient.invalidateQueries(['userCourseData']);

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
