import { useState, useEffect, useContext } from 'react';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';

export const useCourseCompletion = (courseId?: string, userCourseId?: string) => {
	const { userCoursesData } = useContext(UserCourseLessonDataContext);
	const [isCompleted, setIsCompleted] = useState(false);

	useEffect(() => {
		if (!courseId || !userCoursesData) {
			setIsCompleted(false);
			return;
		}

		const enrollment = userCoursesData.find((uc) => uc.courseId === courseId || uc.userCourseId === userCourseId);
		setIsCompleted(enrollment?.isCourseCompleted || false);
	}, [courseId, userCourseId, userCoursesData]);

	return { isCompleted };
};
