import { useState, useMemo } from 'react';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';

export const useLocalStorageData = () => {
	// Function to get data from localStorage
	const getLocalStorageData = (key: string): any[] => {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : [];
	};

	const [localStorageData, setLocalStorageData] = useState<{
		userCourseData: UserCoursesIdsWithCourseIds[];
		userLessonData: UserLessonDataStorage[];
	}>({
		userCourseData: getLocalStorageData('userCourseData'),
		userLessonData: getLocalStorageData('userLessonData'),
	});

	const parsedUserCourseData = useMemo(() => localStorageData.userCourseData, [localStorageData.userCourseData]);
	const parsedUserLessonData = useMemo(() => localStorageData.userLessonData, [localStorageData.userLessonData]);

	return {
		localStorageData,
		setLocalStorageData,
		parsedUserCourseData,
		parsedUserLessonData,
	};
};
