import { useState, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';

export const useUserCourseLessonData = () => {
	const { userId, lessonId, courseId, userCourseId } = useParams<{ userId: string; lessonId: string; courseId: string; userCourseId: string }>();
	const { orgId } = useContext(OrganisationContext);
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonId = searchParams.get('next');
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	// Function to get data from localStorage
	const getLocalStorageData = (key: string): any[] => {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : [];
	};

	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(() => {
		const isCompleted = searchParams.get('isCompleted');
		return isCompleted ? JSON.parse(isCompleted) : false;
	});

	// State to manage localStorage data
	const [localStorageData, setLocalStorageData] = useState<{
		userCourseData: UserCoursesIdsWithCourseIds[];
		userLessonData: UserLessonDataStorage[];
	}>({
		userCourseData: getLocalStorageData('userCourseData'),
		userLessonData: getLocalStorageData('userLessonData'),
	});

	// Memoized values for parsed data
	const parsedUserCourseData = useMemo(() => localStorageData.userCourseData, [localStorageData.userCourseData]);
	const parsedUserLessonData = useMemo(() => localStorageData.userLessonData, [localStorageData.userLessonData]);

	// State for current userLessonId
	const [userLessonId, setUserLessonId] = useState<string | undefined>(() => {
		const currentUserLessonData = parsedUserLessonData.find((data) => data.lessonId === lessonId && data.courseId === courseId);
		return currentUserLessonData?.userLessonId;
	});

	// State for course completion status
	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(() => {
		const currentUserCourseData = parsedUserCourseData.find((data) => data.userCourseId === userCourseId);
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
		const currentUserLessonData = parsedUserLessonData.find((data) => data.userLessonId === userLessonId);
		return currentUserLessonData ? currentUserLessonData.currentQuestion : 1;
	}, [userLessonId, parsedUserLessonData]);

	// Function to handle moving to the next lesson
	const handleNextLesson = useCallback(async () => {
		try {
			const currentUserLessonIndex = parsedUserLessonData.findIndex((data) => data.userLessonId === userLessonId);

			if (currentUserLessonIndex !== -1 && !parsedUserLessonData[currentUserLessonIndex].isCompleted) {
				const updatedUserLessonData = [...parsedUserLessonData];
				updatedUserLessonData[currentUserLessonIndex].isCompleted = true;
				updatedUserLessonData[currentUserLessonIndex].isInProgress = false;
				localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));

				await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
					currentQuestion: 1,
				});
			}

			if (nextLessonId) {
				const existingNextLesson = parsedUserLessonData.find((data) => data.lessonId === nextLessonId && data.courseId === courseId);

				if (!existingNextLesson) {
					const responseUserLesson = await axios.post(`${base_url}/userLessons`, {
						lessonId: nextLessonId,
						userId,
						courseId,
						userCourseId,
						currentQuestion: 1,
						isCompleted: false,
						isInProgress: true,
						orgId,
					});

					const newUserLessonData: UserLessonDataStorage = {
						lessonId: nextLessonId,
						userLessonId: responseUserLesson.data._id,
						courseId: courseId || '',
						currentQuestion: 1,
						isCompleted: false,
						isInProgress: true,
					};

					const updatedUserLessonData = [...parsedUserLessonData, newUserLessonData];
					localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
					setLocalStorageData((prev) => ({ ...prev, userLessonData: updatedUserLessonData }));
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

				navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			console.error(error);
		}
	}, [
		userLessonId,
		nextLessonId,
		userId,
		courseId,
		userCourseId,
		orgId,
		navigate,
		parsedUserLessonData,
		parsedUserCourseData,
		base_url,
		setIsLessonCompleted,
	]);

	// Return the necessary data and functions from the hook
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
	};
};
