import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { SingleCourse } from '../interfaces/course';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface CoursesContextTypes {
	courses: SingleCourse[];
	loading: boolean;
	error: string | null;
	fetchCourses: (page?: number) => Promise<SingleCourse[]>;
	fetchMoreCourses: (startPage: number, endPage: number) => Promise<void>;
	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => SingleCourse[];
	addNewCourse: (newCourse: SingleCourse) => void;
	updateCoursePublishing: (id: string) => void;
	removeCourse: (id: string) => void;
	updateCourse: (singleCourse: SingleCourse) => void;
	coursesPageNumber: number;
	setCoursesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	enableCoursesFetch: () => void;
	disableCoursesFetch: () => void;
	hasMore: boolean;
	loadMore: () => Promise<void>;
}

interface CoursesContextProviderProps {
	children: ReactNode;
}

export const CoursesContext = createContext<CoursesContextTypes>({
	courses: [],
	loading: true,
	error: null,
	fetchCourses: async () => [],
	fetchMoreCourses: async () => {},
	sortCoursesData: () => [],
	addNewCourse: () => {},
	updateCoursePublishing: () => {},
	removeCourse: () => {},
	updateCourse: () => {},
	coursesPageNumber: 1,
	setCoursesPageNumber: () => {},
	totalItems: 0,
	loadedPages: [],
	enableCoursesFetch: () => {},
	disableCoursesFetch: () => {},
	hasMore: false,
	loadMore: async () => {},
});

const CoursesContextProvider = ({ children }: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	// Role-based endpoint detection - separate routes for clarity
	const isInstructor = user?.role === Roles.INSTRUCTOR;
	const baseEndpoint = isInstructor ? `/courses/organisation/${orgId}/instructor` : `/courses/organisation/${orgId}`;

	const {
		data: courses,
		isLoading,
		isError,
		fetchEntities: fetchCourses,
		fetchMoreEntities: fetchMoreCourses,
		addEntity: addNewCourse,
		updateEntity,
		toggleEntityActive,
		removeEntity: removeCourse,
		sortEntities: sortCoursesData,
		pageNumber: coursesPageNumber,
		setPageNumber: setCoursesPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<SingleCourse>({
		orgId,
		baseUrl: `${base_url}${baseEndpoint}`,
		entityKey: isInstructor ? 'instructorCourses' : 'allCourses',
		enabled: isEnabled && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		limit: 100,
		cacheTime: 30 * 60 * 1000,
		disableAutoGapFill: true,
	});

	const enableCoursesFetch = () => setIsEnabled(true);
	const disableCoursesFetch = () => setIsEnabled(false);

	// Calculate if there are more courses to load
	const hasMore = courses && totalItems > courses.length;

	// Load more courses function
	const loadMore = async () => {
		if (!hasMore || isLoading) return;

		const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
		const nextPage = currentLoadedPages + 1;

		await fetchMoreCourses(nextPage, nextPage);
	};

	return (
		<CoursesContext.Provider
			value={{
				courses,
				loading: isLoading || (isEnabled && !courses),
				error: isError ? 'Failed to fetch courses' : null,
				fetchCourses,
				fetchMoreCourses,
				sortCoursesData,
				addNewCourse,
				removeCourse,
				updateCoursePublishing: toggleEntityActive,
				updateCourse: updateEntity,
				coursesPageNumber,
				setCoursesPageNumber,
				totalItems,
				loadedPages,
				enableCoursesFetch,
				disableCoursesFetch,
				hasMore,
				loadMore,
			}}>
			<DataFetchErrorBoundary context='Courses'>{children}</DataFetchErrorBoundary>
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;
