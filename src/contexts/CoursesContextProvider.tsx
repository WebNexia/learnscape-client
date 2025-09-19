import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';

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
}

interface CoursesContextProviderProps {
	children: ReactNode;
}

export const CoursesContext = createContext<CoursesContextTypes>({
	courses: [],
	loading: false,
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
});

const CoursesContextProvider = ({ children }: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
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
		baseUrl: `${base_url}/courses/organisation/${orgId}`,
		entityKey: 'allCourses',
		enabled: isEnabled && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	const enableCoursesFetch = () => setIsEnabled(true);
	const disableCoursesFetch = () => setIsEnabled(false);

	return (
		<CoursesContext.Provider
			value={{
				courses,
				loading: isLoading,
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
			}}>
			{children}
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;
