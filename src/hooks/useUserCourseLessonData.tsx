import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';

export const useUserCourseLessonData = () => {
	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonId = searchParams.get('next');
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(() => {
		const isCompleted = searchParams.get('isCompleted');
		return isCompleted !== null ? JSON.parse(isCompleted) : false;
	});

	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(() => {
		const userCourseData = localStorage.getItem('userCourseData');
		if (userCourseData !== null) {
			const parsedUserCourseData: UserCoursesIdsWithCourseIds[] = JSON.parse(userCourseData);
			const currentUserCourseData = parsedUserCourseData.find((data) => data.userCourseId === userCourseId);
			return currentUserCourseData ? currentUserCourseData.isCourseCompleted || false : false;
		}
		return false;
	});

	const [userLessonId, setUserLessonId] = useState<string | undefined>(() => {
		const userLessonData = localStorage.getItem('userLessonData');
		if (userLessonData !== null) {
			const parsedUserLessonData: UserLessonDataStorage[] = JSON.parse(userLessonData);
			const currentUserLessonData = parsedUserLessonData.find((data) => data.lessonId === lessonId && data.courseId === courseId);
			return currentUserLessonData?.userLessonId;
		}
		return undefined;
	});

	const handleNextLesson = async () => {
		try {
			const userLessonData = localStorage.getItem('userLessonData');
			let parsedUserLessonData: UserLessonDataStorage[] = [];
			if (userLessonData !== null) {
				parsedUserLessonData = JSON.parse(userLessonData);
			}

			const userCourseData = localStorage.getItem('userCourseData');
			let parsedUserCourseData: UserCoursesIdsWithCourseIds[] = [];
			if (userCourseData !== null) {
				parsedUserCourseData = JSON.parse(userCourseData);
			}

			// Mark the current lesson as completed
			const currentUserLessonIndex = parsedUserLessonData.findIndex((data) => data.userLessonId === userLessonId);
			if (currentUserLessonIndex !== -1 && parsedUserLessonData[currentUserLessonIndex].isCompleted !== true) {
				parsedUserLessonData[currentUserLessonIndex].isCompleted = true;
				parsedUserLessonData[currentUserLessonIndex].isInProgress = false;
				localStorage.setItem('userLessonData', JSON.stringify(parsedUserLessonData));

				await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
				});
			}

			if (nextLessonId !== null) {
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
						isCompleted: false,
						isInProgress: true,
					};
					parsedUserLessonData.push(newUserLessonData);
					localStorage.setItem('userLessonData', JSON.stringify(parsedUserLessonData));
				}

				navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
			} else if (nextLessonId === null) {
				await axios.patch(`${base_url}/usercourses/${userCourseId}`, {
					isCompleted: true,
					isInProgress: false,
				});

				setIsCourseCompleted(true);

				const userCourseIndexToUpdate = parsedUserCourseData.findIndex((item) => item.userCourseId === userCourseId);
				parsedUserCourseData[userCourseIndexToUpdate].isCourseCompleted = true;
				parsedUserCourseData[userCourseIndexToUpdate].isCourseInProgress = false;
				localStorage.setItem('userCourseData', JSON.stringify(parsedUserCourseData));

				navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			console.error(error);
		}
	};

	return {
		isLessonCompleted,
		setIsLessonCompleted,
		isCourseCompleted,
		setIsCourseCompleted,
		userLessonId,
		handleNextLesson,
		nextLessonId,
	};
};
