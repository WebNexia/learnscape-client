import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { SingleCourse } from '../interfaces/course';
import { useLocation } from 'react-router-dom';
import { isLpQaPreviewPath, withLpQaPreviewQuery } from '../utils/lpQaPreview';

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

	const isQaPreview = isLpQaPreviewPath(location.pathname);
	// Home + manual QA home only (provider is only mounted on those routes)
	const isHomePage = location.pathname === '/' || location.pathname === '/qa-test';

	const fetchLatestCourses = async () => {
		if (!orgId) return [];

		try {
			const qs = isQaPreview ? `?${withLpQaPreviewQuery({ limit: '3' })}` : '?limit=3';
			const response = await axios.get(`${base_url}/courses/public/latest/${orgId}${qs}`);
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
	} = useQuery(['landingPageLatestCourses', orgId, isQaPreview], fetchLatestCourses, {
		enabled: !!orgId && isHomePage,
		staleTime: 60 * 60 * 1000, // 1 hour - data stays fresh
		cacheTime: 60 * 60 * 1000, // 1 hour - data stays in cache
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
