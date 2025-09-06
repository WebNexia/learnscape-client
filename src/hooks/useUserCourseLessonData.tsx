import { useCallback, useContext, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useLocalStorageData } from './useLocalStorageData';
import axios from '@utils/axiosInstance';
import { UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { useAuth } from './useAuth';

export const useUserCourseLessonData = () => {
	const { lessonId, courseId, userCourseId } = useParams<{ lessonId: string; courseId: string; userCourseId: string }>();

	const { orgId } = useContext(OrganisationContext);
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonId = searchParams.get('next');
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { setLocalStorageData, parsedUserCourseData, parsedUserLessonData } = useLocalStorageData();

	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(() => {
		const isCompleted = searchParams.get('isCompleted');
		return isCompleted ? JSON.parse(isCompleted) : false;
	});

	// State for current userLessonId
	const [userLessonId, setUserLessonId] = useState<string | undefined>(() => {
		const currentUserLessonData = parsedUserLessonData?.find?.((data) => data.lessonId === lessonId && data.courseId === courseId);
		return currentUserLessonData?.userLessonId;
	});

	// State for course completion status
	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(() => {
		const currentUserCourseData = parsedUserCourseData?.find?.((data) => data.userCourseId === userCourseId);
		return currentUserCourseData ? currentUserCourseData.isCourseCompleted || false : false;
	});

	// Function to update last question index
	const updateLastQuestion = useCallback(
		(questionIndex: number) => {
			const currentUserLessonIndex = parsedUserLessonData.findIndex((data) => data.userLessonId === userLessonId);

			if (currentUserLessonIndex !== -1 && !parsedUserLessonData[currentUserLessonIndex].isCompleted) {
				const updatedUserLessonData = [...parsedUserLessonData];
				updatedUserLessonData[currentUserLessonIndex].currentQuestion = questionIndex;
				localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));
			}
		},
		[userLessonId, parsedUserLessonData]
	);

	// Function to get last question index
	const getLastQuestion = useCallback((): number => {
		const currentUserLessonData = parsedUserLessonData?.find?.((data) => data.userLessonId === userLessonId);
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
				const existingLesson = existingLessonResponse.data[0];
				const newUserLessonData: UserLessonDataStorage = {
					lessonId: nextLessonId,
					userLessonId: existingLesson._id,
					courseId: courseId,
					currentQuestion: existingLesson.currentQuestion || 1,
					isCompleted: existingLesson.isCompleted || false,
					isInProgress: existingLesson.isInProgress || true,
					teacherFeedback: existingLesson.teacherFeedback || '',
					isFeedbackGiven: existingLesson.isFeedbackGiven || false,
					updatedAt: existingLesson.updatedAt,
				};

				const updatedUserLessonData = [...parsedUserLessonData, newUserLessonData];
				localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));

				// Force a refresh of the lesson data to ensure UI updates
				setTimeout(() => {
					const refreshedData = JSON.parse(localStorage.getItem('userLessonData') || '[]');
					setLocalStorageData((prev) => ({ ...prev, userLessonData: refreshedData }));
				}, 100);
			}
		} catch (fallbackError) {
			console.error('Fallback also failed:', fallbackError);
		}
	}, [nextLessonId, user?._id, courseId, userCourseId, orgId, parsedUserLessonData, base_url, setLocalStorageData]);

	// Function to handle moving to the next lesson
	const handleNextLesson = useCallback(async () => {
		try {
			const currentUserLessonIndex = parsedUserLessonData.findIndex((data) => data.userLessonId === userLessonId);

			if (currentUserLessonIndex !== -1 && !parsedUserLessonData[currentUserLessonIndex].isCompleted) {
				const updatedUserLessonData = [...parsedUserLessonData];
				updatedUserLessonData[currentUserLessonIndex].isCompleted = true;
				updatedUserLessonData[currentUserLessonIndex].isInProgress = false;
				updatedUserLessonData[currentUserLessonIndex].currentQuestion = 1;
				localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));

				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
					currentQuestion: 1,
				});
			}

			if (nextLessonId) {
				const existingNextLesson = parsedUserLessonData?.find?.((data) => data.lessonId === nextLessonId && data.courseId === courseId);

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
							const newUserLessonData: UserLessonDataStorage = {
								lessonId: nextLessonId,
								userLessonId: responseUserLesson.data._id,
								courseId: courseId || '',
								currentQuestion: 1,
								isCompleted: false,
								isInProgress: true,
								teacherFeedback: '',
								isFeedbackGiven: false,
								updatedAt: responseUserLesson.data.updatedAt,
							};

							const updatedUserLessonData = [...parsedUserLessonData, newUserLessonData];
							localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
							setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));

							// Force a refresh of the lesson data to ensure UI updates
							setTimeout(() => {
								const refreshedData = JSON.parse(localStorage.getItem('userLessonData') || '[]');
								setLocalStorageData((prev) => ({ ...prev, userLessonData: refreshedData }));
							}, 100);
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

				const userCourseIndexToUpdate = parsedUserCourseData.findIndex((item) => item.userCourseId === userCourseId);
				const updatedUserCourseData = [...parsedUserCourseData];
				updatedUserCourseData[userCourseIndexToUpdate].isCourseCompleted = true;
				updatedUserCourseData[userCourseIndexToUpdate].isCourseInProgress = false;
				localStorage.setItem('userCourseData', JSON.stringify(updatedUserCourseData));
				setLocalStorageData((prev) => ({ ...prev, userCourseData: updatedUserCourseData }));

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
		navigate,
		parsedUserLessonData,
		parsedUserCourseData,
		base_url,
		setIsLessonCompleted,
	]);

	// Function to update in-progress lessons
	const updateInProgressLessons = useCallback(async () => {
		const updatedParsedUserLessonData = JSON.parse(localStorage.getItem('userLessonData') || '[]');
		const inProgressLessons = updatedParsedUserLessonData?.filter?.((lesson: UserLessonDataStorage) => lesson.isInProgress) || [];
		try {
			for (const lesson of inProgressLessons) {
				const localStorageLesson = updatedParsedUserLessonData?.find?.((data: UserLessonDataStorage) => data.userLessonId === lesson.userLessonId);
				if (localStorageLesson) {
					const currentQuestion = localStorageLesson.currentQuestion;
					await axios.patch(`${base_url}/userlessons/${lesson.userLessonId}`, {
						currentQuestion,
					});
				}
			}
		} catch (error) {
			console.error('Failed to update in-progress lessons', error);
		}
	}, [base_url]);

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
