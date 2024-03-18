import axios from 'axios';
import { ReactNode, createContext } from 'react';
import { UserLessonsByUserId } from '../interfaces/userLesson';
import { UserCoursesByUserId } from '../interfaces/userCourses';

interface UserCourseLessonDataContextTypes {
	fetchUserCourseData: (userId: string) => void;
	fetchUserLessonData: (userId: string) => void;
}

interface UserCoursesIdsContextProviderProps {
	children: ReactNode;
}

export interface UserCoursesIdsWithCourseIds {
	courseId: string;
	userCourseId: string;
}

export interface UserLessonDataStorage {
	lessonId: string;
	isCompleted: boolean;
	isInProgress: boolean;
}

export const UserCourseLessonDataContext = createContext<UserCourseLessonDataContextTypes>({
	fetchUserCourseData: () => {},
	fetchUserLessonData: () => {},
});

const UserCourseLessonDataContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchUserCourseData = async (userId: string): Promise<void> => {
		try {
			const response = await axios.get(`${base_url}/usercourses/user/${userId}`);

			const userCourseIds: UserCoursesIdsWithCourseIds[] = response.data.response.reduce(
				(acc: UserCoursesIdsWithCourseIds[], value: UserCoursesByUserId) => {
					if (value.courseId && value.courseId._id) {
						acc.push({ courseId: value.courseId._id, userCourseId: value._id });
					}
					return acc;
				},
				[]
			);

			localStorage.setItem('userCoursesIds', JSON.stringify(userCourseIds));
		} catch (error) {
			console.log(error);
		}
	};

	const fetchUserLessonData = async (userId: string): Promise<void> => {
		const responseUserLessonIdsData = await axios.get(`${base_url}/userlessons/user/${userId}`);

		const currentUserLessonIdsList = responseUserLessonIdsData.data.response.map(
			(userLesson: UserLessonsByUserId) => {
				const userLessonData: UserLessonDataStorage = {
					lessonId: userLesson.lessonId._id,
					isCompleted: userLesson.isCompleted,
					isInProgress: userLesson.isInProgress,
				};

				return userLessonData;
			}
		);

		if (!localStorage.getItem('userLessonData')) {
			localStorage.setItem('userLessonData', JSON.stringify(currentUserLessonIdsList));
		}
	};

	return (
		<UserCourseLessonDataContext.Provider value={{ fetchUserCourseData, fetchUserLessonData }}>
			{props.children}
		</UserCourseLessonDataContext.Provider>
	);
};

export default UserCourseLessonDataContextProvider;
