import { useState, useEffect } from 'react';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';

function useCourseCompletion(userCourseId: string): boolean {
	const [isCourseCompleted, setIsCourseCompleted] = useState<boolean>(false);

	useEffect(() => {
		const handleStorageChange = () => {
			const userCourseData = localStorage.getItem('userCourseData');
			let parsedUserCourseData: UserCoursesIdsWithCourseIds[] = [];
			if (userCourseData !== null) {
				parsedUserCourseData = JSON.parse(userCourseData);
			}

			const currentUserCourseData: UserCoursesIdsWithCourseIds | undefined =
				parsedUserCourseData.find(
					(data: UserCoursesIdsWithCourseIds) => data.userCourseId === userCourseId
				);

			if (currentUserCourseData) {
				setIsCourseCompleted(currentUserCourseData.isCourseCompleted || false);
			} else {
				setIsCourseCompleted(false);
			}
		};

		handleStorageChange(); // Call the function once to initialize state

		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [userCourseId]);

	return isCourseCompleted;
}

export default useCourseCompletion;
