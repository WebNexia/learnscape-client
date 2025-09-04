import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { SingleCourse } from '../interfaces/course';
import { useLocation } from 'react-router-dom';

interface LandingPageLatestCoursesContextTypes {
	latestCourses: SingleCourse[];
	loading: boolean;
	error: string | null;
}

interface LandingPageLatestCoursesContextProviderProps {
	children: ReactNode;
}

export const LandingPageLatestCoursesContext = createContext<LandingPageLatestCoursesContextTypes>({
	latestCourses: [],
	loading: false,
	error: null,
});

const LandingPageLatestCoursesContextProvider = (props: LandingPageLatestCoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	// Check if we're on the home page only (where latest courses are displayed)
	const isHomePage = location.pathname === '/';

	const fetchLatestCourses = async () => {
		if (!orgId) return [];

		try {
			// Fetch only 3 latest published courses for landing page
			const response = await axios.get(`${base_url}/courses/public/latest/${orgId}?limit=3`);
			return response.data.data || [];
		} catch (error: any) {
			console.error('Error fetching latest courses:', error);
			throw error;
		}
	};

	const {
		data: latestCoursesData,
		isLoading,
		isError,
	} = useQuery(['landingPageLatestCourses', orgId], fetchLatestCourses, {
		enabled: !!orgId && isHomePage,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	// Get latest courses data
	const latestCourses = latestCoursesData || [];
	const loading = isLoading;
	const error = isError ? 'Failed to fetch latest courses' : null;

	return (
		<LandingPageLatestCoursesContext.Provider
			value={{
				latestCourses,
				loading,
				error,
			}}>
			{props.children}
		</LandingPageLatestCoursesContext.Provider>
	);
};

export default LandingPageLatestCoursesContextProvider;
