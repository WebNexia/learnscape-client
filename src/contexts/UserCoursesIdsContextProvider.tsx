import axios from 'axios';
import { ReactNode, createContext } from 'react';

interface UserCoursesIdsContextTypes {
	fetchUserCourseIds: (userId: string) => void;
}

interface UserCoursesIdsContextProviderProps {
	children: ReactNode;
}

export interface UserCoursesIdsWithCourseIds {
	courseId: string;
	userCourseId: string;
}

export const UserCoursesIdsContext = createContext<UserCoursesIdsContextTypes>({
	fetchUserCourseIds: () => {},
});

const UserCoursesIdsContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchUserCourseIds = async (userId: string) => {
		try {
			const response = await axios.get(`${base_url}/usercourses/user/${userId}`);

			const userCourseIds: UserCoursesIdsWithCourseIds[] = response.data.response.reduce(
				(acc: UserCoursesIdsWithCourseIds[], value: any) => {
					if (value.courseId && value.courseId._id) {
						acc.push({ courseId: value.courseId._id, userCourseId: value._id });
					}
					return acc;
				},
				[]
			);

			const responseUserLessonIdsData = await axios.get(`${base_url}/userlessons/user/${userId}`);

			console.log(responseUserLessonIdsData.data.response.map((userLesson: any) => userLesson.lessonId._id));

			const currentUserLessonIdsList = responseUserLessonIdsData.data.response.map(
				(userLesson: any) => userLesson.lessonId._id
			);

			if (!localStorage.getItem('userCoursesIds')) {
				localStorage.setItem('userLessonIds', JSON.stringify(currentUserLessonIdsList));
			}

			localStorage.setItem('userCoursesIds', JSON.stringify(userCourseIds));
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<UserCoursesIdsContext.Provider value={{ fetchUserCourseIds }}>{props.children}</UserCoursesIdsContext.Provider>
	);
};

export default UserCoursesIdsContextProvider;
