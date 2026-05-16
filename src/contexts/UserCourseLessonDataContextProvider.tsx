import { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { SingleCourse } from '../interfaces/course';
import { UserAuthContext } from './UserAuthContextProvider';
import { useQueryClient } from 'react-query';

import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import {
	fetchLearnerCourseShell,
	learnerCourseShellQueryKey,
	LEARNER_COURSE_SHELL_STALE_MS,
	useLearnerCourseShell,
} from '../hooks/useLearnerCourseShell';

interface UserCourseLessonDataContextTypes {
	fetchSingleCourseDataUser: (courseId: string) => Promise<void>;
	singleCourse: SingleCourse | null;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | null>>;
	singleCourseUser: SingleCourse | null;
	isCourseShellLoading: boolean;
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
	groupName?: string | null;
	groupDescription?: string | null;
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
	setSingleCourse: () => { },
	singleCourseUser: null,
	isCourseShellLoading: false,
	fetchSingleCourseDataUser: async () => { },
	enableUserCourseLessonDataFetch: () => { },
	disableUserCourseLessonDataFetch: () => { },
	userCoursesData: [],
});

const UserCourseLessonDataContextProvider = (props: UserCoursesIdsContextProviderProps) => {
	const queryClient = useQueryClient();
	const { userId, userCourseData } = useContext(UserAuthContext);
	const { isAuthenticated, isLearner } = useAuth();

	const { courseId: routeCourseId } = useParams();

	const isLandingPageRoute = useIsLandingPageRoute();

	const [isEnabled, setIsEnabled] = useState<boolean>(true);

	const [singleCourse, setSingleCourse] = useState<SingleCourse | null>(null);

	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;

	const shellQueryEnabled =
		isEnabled && !!routeCourseId && !!userId && isAuthenticated && isLearner && !isLandingPageRoute;

	const { data: singleCourseUser = null, isLoading: isCourseShellLoading } = useLearnerCourseShell(routeCourseId || '', {
		enabled: shellQueryEnabled,
	});

	const fetchSingleCourseDataUser = useCallback(
		async (targetCourseId: string): Promise<void> => {
			if (!targetCourseId) return;

			await queryClient.fetchQuery(
				learnerCourseShellQueryKey(targetCourseId),
				() => fetchLearnerCourseShell(targetCourseId, baseUrl),
				{ staleTime: LEARNER_COURSE_SHELL_STALE_MS }
			);

			if (userId) {
				void queryClient.invalidateQueries(['userLessonsForCourse', targetCourseId, userId]);
			}
		},
		[baseUrl, queryClient, userId]
	);

	// Use userCourseData from UserAuthContext (no duplicate API call)
	const userCoursesData = userCourseData || [];

	const enableUserCourseLessonDataFetch = () => setIsEnabled(true);
	const disableUserCourseLessonDataFetch = () => setIsEnabled(false);

	return (
		<UserCourseLessonDataContext.Provider
			value={{
				fetchSingleCourseDataUser,
				singleCourse,
				setSingleCourse,
				singleCourseUser,
				isCourseShellLoading,
				enableUserCourseLessonDataFetch,
				disableUserCourseLessonDataFetch,
				userCoursesData: userCoursesData || [],
			}}>
			{props.children}
		</UserCourseLessonDataContext.Provider>
	);
};

export default UserCourseLessonDataContextProvider;
