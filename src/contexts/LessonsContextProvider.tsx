import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { Lesson } from '../interfaces/lessons';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface LessonsContextTypes {
	lessons: Lesson[];
	loading: boolean;
	error: string | null;
	fetchLessons: (page?: number) => Promise<Lesson[]>;
	fetchMoreLessons: (startPage: number, endPage: number) => Promise<void>;
	sortLessonsData: (property: keyof Lesson, order: 'asc' | 'desc') => Lesson[];
	addNewLesson: (newLesson: Lesson) => void;
	updateLessonPublishing: (id: string) => void;
	removeLesson: (id: string) => void;
	updateLesson: (singleLesson: Lesson) => void;
	lessonsPageNumber: number;
	setLessonsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	lessonTypes: string[];
	enableLessonsFetch: () => void; // 👈 New function to enable fetching
	disableLessonsFetch: () => void; // 👈 New function to disable fetching
}

interface LessonsContextProviderProps {
	children: ReactNode;
}

export const LessonsContext = createContext<LessonsContextTypes>({} as LessonsContextTypes);

const LessonsContextProvider = ({ children }: LessonsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);

	// Role-based endpoint detection - separate routes for clarity
	const isInstructor = user?.role === Roles.INSTRUCTOR;
	const baseEndpoint = isInstructor ? `/lessons/organisation/${orgId}/instructor` : `/lessons/organisation/${orgId}`;

	const {
		data: lessons,
		isLoading,
		isError,
		fetchEntities: fetchLessons,
		fetchMoreEntities: fetchMoreLessons,
		addEntity: addNewLesson,
		updateEntity: updateLesson,
		toggleEntityActive: updateLessonPublishing,
		removeEntity: removeLesson,
		sortEntities: sortLessonsData,
		pageNumber: lessonsPageNumber,
		setPageNumber: setLessonsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Lesson>({
		orgId,
		baseUrl: `${base_url}${baseEndpoint}`,
		entityKey: isInstructor ? 'instructorLessons' : 'allLessons',
		enabled: isEnabled && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

	// 👈 Functions to control fetching
	const enableLessonsFetch = () => setIsEnabled(true);
	const disableLessonsFetch = () => setIsEnabled(false);

	return (
		<LessonsContext.Provider
			value={{
				lessons,
				loading: isLoading || (isEnabled && !lessons),
				error: isError ? 'Failed to fetch lessons' : null,
				fetchLessons,
				fetchMoreLessons,
				sortLessonsData,
				addNewLesson,
				removeLesson,
				updateLessonPublishing,
				updateLesson,
				lessonsPageNumber,
				setLessonsPageNumber,
				totalItems,
				loadedPages,
				lessonTypes,
				enableLessonsFetch,
				disableLessonsFetch,
			}}>
			<DataFetchErrorBoundary context='Lessons'>{children}</DataFetchErrorBoundary>
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;
