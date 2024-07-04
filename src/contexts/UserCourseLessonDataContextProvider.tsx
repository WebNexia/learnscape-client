import axios from 'axios';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { SingleCourse } from '../interfaces/course';
import { BaseChapter } from '../interfaces/chapter';
import { UserAuthContext } from './UserAuthContextProvider';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { useParams } from 'react-router-dom';

interface UserCourseLessonDataContextTypes {
	fetchSingleCourseData: (courseId: string) => void;
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
	fetchSingleCourseData: () => {},
	singleCourse: null,
	setSingleCourse: () => {},
	singleCourseUser: null,
	setSingleCourseUser: () => {},
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

	const fetchSingleCourseData = async (courseId: string | undefined): Promise<void> => {
		try {
			if (courseId) {
				const response = await axios.get(`${base_url}/courses/${courseId}`);
				setSingleCourse(response.data.data || null);

				setSingleCourseUser(() => {
					const filteredChapters: BaseChapter[] | undefined = response?.data?.data?.chapters?.filter(
						(chapter: BaseChapter) => chapter?.lessonIds?.length !== 0
					);

					return {
						...response.data.data,
						chapters: filteredChapters,
					};
				});
			}
		} catch (error) {
			console.log(error);
		}
	};

	const {
		data: singleCourseData,
		isLoading: singleCourseDataLoading,
		error: singleCourseDataError,
	} = useQuery(['singleCourseData', orgId], () => fetchSingleCourseData(courseId), {
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

	if (isLoading || userLessonsLoading || singleCourseDataLoading) {
		return <Loading />;
	}

	if (error || userLessonsError || singleCourseDataError) {
		return <LoadingError />;
	}

	return (
		<UserCourseLessonDataContext.Provider
			value={{
				fetchSingleCourseData,
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
