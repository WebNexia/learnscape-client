import { ReactNode, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { SingleCourse } from '../interfaces/course';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { shouldFetchStaffCoursesList } from '../utils/staffCoursesDataRoutes';

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
	hasMore: false,
	loadMore: async () => {},
});

export const STAFF_COURSES_LIST_STALE_MS = 2 * 60 * 1000;
export const LEARNER_COURSES_LIST_STALE_MS = 5 * 60 * 1000;

const CoursesContextProvider = ({ children }: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { pathname } = useLocation();
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();

	// Role-based endpoint detection - separate routes for clarity
	const isInstructor = user?.role === Roles.INSTRUCTOR;
	const isStaff = hasAdminAccess || isInstructor;

	// Learners: only load the org catalogue on the browse page (not on dashboard login, calendar, etc.).
	// Exclude utility routes under /courses/ (e.g. /courses/certificates/verify/:id) from triggering the catalogue fetch.
	const isLearnerCatalogRoute =
		isLearner &&
		(pathname === '/courses' || pathname.startsWith('/courses/')) &&
		!pathname.startsWith('/courses/certificates');

	// Admin / instructor: defer full courses list until routes that need it (not dashboard, messages, etc.).
	const isStaffCoursesRoute = isStaff && shouldFetchStaffCoursesList(pathname);

	const fetchEnabled =
		!!orgId && isAuthenticated && !isLandingPageRoute && (isStaffCoursesRoute || (isLearner && isLearnerCatalogRoute));
	const baseEndpoint = isInstructor ? `/courses/organisation/${orgId}/instructor` : `/courses/organisation/${orgId}`;
	const isStaffCoursesList = isStaff && isStaffCoursesRoute;

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
		enabled: fetchEnabled,
		role: user?.role as Roles,
		staleTime: isStaffCoursesList ? STAFF_COURSES_LIST_STALE_MS : LEARNER_COURSES_LIST_STALE_MS,
		limit: 100,
		cacheTime: 30 * 60 * 1000,
		disableAutoGapFill: true,
		refetchOnMount: isStaffCoursesList ? false : true,
	});

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
				loading: fetchEnabled && isLoading,
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
				hasMore,
				loadMore,
			}}>
			<DataFetchErrorBoundary context='Courses'>{children}</DataFetchErrorBoundary>
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;
