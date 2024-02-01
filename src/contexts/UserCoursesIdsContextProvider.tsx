import axios from 'axios';
import { ReactNode, createContext } from 'react';

interface UserCoursesIdsContextTypes {
	fetchCourseIds: (userId: string) => void;
}

interface UserCoursesIdsContextProviderProps {
	children: ReactNode;
}

export const UserCoursesIdsContext = createContext<UserCoursesIdsContextTypes>({
	fetchCourseIds: () => {},
});

const UserCoursesIdsContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchCourseIds = async (userId: string) => {
		try {
			const response = await axios.get(`${base_url}/usercourses/user/${userId}`);

			console.log(response);

			const courseIds: string[] = response.data.response.reduce((acc: string[], value: any) => {
				if (value.courseId && value.courseId._id) {
					acc.push(value.courseId._id);
				}
				return acc;
			}, []);

			console.log(courseIds);

			localStorage.setItem('userCoursesIds', JSON.stringify(courseIds));
		} catch (error) {
			console.log(error);
		}
	};

	return <UserCoursesIdsContext.Provider value={{ fetchCourseIds }}>{props.children}</UserCoursesIdsContext.Provider>;
};

export default UserCoursesIdsContextProvider;
