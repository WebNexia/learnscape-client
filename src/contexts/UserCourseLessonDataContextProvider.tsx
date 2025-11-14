import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { SingleCourse } from '../interfaces/course';
import { UserAuthContext } from './UserAuthContextProvider';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';

import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';

interface UserCourseLessonDataContextTypes {
	fetchSingleCourseDataUser: (courseId: string) => void;
	singleCourse: SingleCourse | null;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | null>>;
	singleCourseUser: SingleCourse | null;
	setSingleCourseUser: React.Dispatch<React.SetStateAction<SingleCourse | null>>;
	enableUserCourseLessonDataFetch: () => void;
	disableUserCourseLessonDataFetch: () => void;
	userCoursesData: UserCoursesIdsWithCourseIds[];
}

interface UserCoursesIdsContextProviderProps {
	children: ReactNode;
}

export interface UserCoursesIdsWithCourseIds {
	courseId: string;
	userCourseId: string;
	isCourseCompleted: boolean;
	isCourseInProgress: boolean;
	courseTitle: string;
	createdAt: string;
	isActive: boolean;
	validUntil: string;
	completedChapterChecklistIds?: string[];
}

export interface UserLessonDataStorage {
	lessonId: string;
	userLessonId: string;
	courseId: string;
	currentQuestion: number;
	isCompleted: boolean;
	isInProgress: boolean;
	teacherFeedback: string;
	isFeedbackGiven: boolean;
	updatedAt: string;
}

export const UserCourseLessonDataContext = createContext<UserCourseLessonDataContextTypes>({
	singleCourse: null,
	setSingleCourse: () => {},
	singleCourseUser: null,
	setSingleCourseUser: () => {},
	fetchSingleCourseDataUser: () => {},
	enableUserCourseLessonDataFetch: () => {},
	disableUserCourseLessonDataFetch: () => {},
	userCoursesData: [],
});

const UserCourseLessonDataContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId, userCourseData } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isLearner } = useAuth();

	const { courseId } = useParams();

	const isLandingPageRoute = useIsLandingPageRoute();

	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [isEnabled, setIsEnabled] = useState<boolean>(true);

	const [singleCourse, setSingleCourse] = useState<SingleCourse | null>(null);

	const [singleCourseUser, setSingleCourseUser] = useState<SingleCourse | null>(null);

	const fetchSingleCourseDataUser = async (courseId: string | undefined): Promise<void> => {
		if (courseId) {
			const res = await axios.get(`${base_url}/courses/activelessons/${courseId}`);

			setSingleCourseUser(res.data.data || null);
		}
	};

	const {
		// data: singleCourseDataUser,
		// isLoading: singleCourseDataUserLoading,
		// error: singleCourseDataUserError,
	} = useQuery(['singleCourseDataUser', orgId], () => fetchSingleCourseDataUser(courseId), {
		enabled: isEnabled && !!userId && !!orgId && isAuthenticated && isLearner && !isLoaded && !isLandingPageRoute && !!courseId,
	});

	// Use userCourseData from UserAuthContext (no duplicate API call)
	const userCoursesData = userCourseData || [];

	const enableUserCourseLessonDataFetch = () => setIsEnabled(true);
	const disableUserCourseLessonDataFetch = () => setIsEnabled(false);

	useEffect(() => {
		if (userCoursesData) {
			setIsLoaded(true);
		}
	}, [userCoursesData]);

	return (
		<UserCourseLessonDataContext.Provider
			value={{
				fetchSingleCourseDataUser,
				singleCourse,
				setSingleCourse,
				singleCourseUser,
				setSingleCourseUser,
				enableUserCourseLessonDataFetch,
				disableUserCourseLessonDataFetch,
				userCoursesData: userCoursesData || [],
			}}>
			{props.children}
		</UserCourseLessonDataContext.Provider>
	);
};

export default UserCourseLessonDataContextProvider;
