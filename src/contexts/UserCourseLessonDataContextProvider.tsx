import axios from 'axios';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { SingleCourse } from '../interfaces/course';
import { UserAuthContext } from './UserAuthContextProvider';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { useParams } from 'react-router-dom';

interface UserCourseLessonDataContextTypes {
	fetchSingleCourseDataAdmin: (courseId: string) => void;
	fetchSingleCourseDataUser: (courseId: string) => void;
	singleCourse: SingleCourse | null;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | null>>;
	singleCourseUser: SingleCourse | null;
	setSingleCourseUser: React.Dispatch<React.SetStateAction<SingleCourse | null>>;
}

interface UserCoursesIdsContextProviderProps {
	children: ReactNode;
}

export interface UserCoursesIdsWithCourseIds {
	courseId: string;
	userCourseId: string;
	isCourseCompleted: boolean;
	isCourseInProgress: boolean;
}

export interface UserLessonDataStorage {
	lessonId: string;
	userLessonId: string;
	courseId: string;
	currentQuestion: number;
	isCompleted: boolean;
	isInProgress: boolean;
}

export const UserCourseLessonDataContext = createContext<UserCourseLessonDataContextTypes>({
	fetchSingleCourseDataAdmin: () => {},
	singleCourse: null,
	setSingleCourse: () => {},
	singleCourseUser: null,
	setSingleCourseUser: () => {},
	fetchSingleCourseDataUser: () => {},
});

const UserCourseLessonDataContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);

	const { courseId } = useParams();

	const role = localStorage.getItem('role');

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [singleCourse, setSingleCourse] = useState<SingleCourse | null>(null);

	const [singleCourseUser, setSingleCourseUser] = useState<SingleCourse | null>(null);

	const fetchSingleCourseDataAdmin = async (courseId: string | undefined): Promise<void> => {
		try {
			if (courseId) {
				const response = await axios.get(`${base_url}/courses/${courseId}`);
				setSingleCourse(response.data.data || null);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const fetchSingleCourseDataUser = async (courseId: string | undefined): Promise<void> => {
		if (courseId) {
			const res = await axios.get(`${base_url}/courses/activelessons/${courseId}`);

			setSingleCourseUser(res.data.data || null);
		}
	};

	const {
		data: singleCourseDataAdmin,
		isLoading: singleCourseDataAdminLoading,
		error: singleCourseDataAdminError,
	} = useQuery(['singleCourseData', orgId], () => fetchSingleCourseDataAdmin(courseId), {
		enabled: !!userId && !!orgId,
	});

	const {
		data: singleCourseDataUser,
		isLoading: singleCourseDataUserLoading,
		error: singleCourseDataUserError,
	} = useQuery(['singleCourseData', orgId], () => fetchSingleCourseDataAdmin(courseId), {
		enabled: !!userId && !!orgId,
	});

	const {
		isLoading,
		error,
		data: userCoursesData,
	} = useQuery<UserCoursesIdsWithCourseIds[]>(
		['userCoursesData', userId, orgId, role],
		async () => {
			const userCourseData: UserCoursesIdsWithCourseIds[] = JSON.parse(localStorage.getItem('userCourseData') || '[]');
			return userCourseData;
		},
		{
			enabled: !!userId && !!orgId,
		}
	);

	const {
		isLoading: userLessonsLoading,
		error: userLessonsError,
		data: userLessonData,
	} = useQuery<UserLessonDataStorage[]>(
		['userLessonData', userId, orgId, role],
		async () => {
			const userLessonData: UserLessonDataStorage[] = JSON.parse(localStorage.getItem('userLessonData') || '[]');
			return userLessonData;
		},
		{
			enabled: !!userId && !!orgId,
		}
	);

	useEffect(() => {
		if (userCoursesData && userLessonData) {
			setIsLoaded(true);
		}
	}, [userCoursesData, userLessonData]);

	if (isLoading || userLessonsLoading || singleCourseDataAdminLoading || singleCourseDataUserLoading) {
		return <Loading />;
	}

	if (error || userLessonsError || singleCourseDataAdminError || singleCourseDataUserError) {
		return <LoadingError />;
	}

	return (
		<UserCourseLessonDataContext.Provider
			value={{
				fetchSingleCourseDataAdmin,
				fetchSingleCourseDataUser,
				singleCourse,
				setSingleCourse,
				singleCourseUser,
				setSingleCourseUser,
			}}>
			{props.children}
		</UserCourseLessonDataContext.Provider>
	);
};

export default UserCourseLessonDataContextProvider;
