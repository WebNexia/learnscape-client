import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { SingleCourse } from '../interfaces/course';
import { useLocation } from 'react-router-dom';

interface AllPublicCoursesContextTypes {
	courses: SingleCourse[];
	loading: boolean;
	error: string | null;
	total: number;
	hasMore: boolean;
	loadMore: () => void;
}

interface AllPublicCoursesContextProviderProps {
	children: ReactNode;
}

export const AllPublicCoursesContext = createContext<AllPublicCoursesContextTypes>({
	courses: [],
	loading: false,
	error: null,
	total: 0,
	hasMore: false,
	loadMore: () => {},
});

const AllPublicCoursesContextProvider = (props: AllPublicCoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	// Check if we're on any landing page route (courses page or individual course page)
	// Exclude logged-in user course routes that contain '/userCourseId/'
	const isLandingPageRoute =
		location.pathname === '/landing-page-courses' || (location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

	// State for pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [allCourses, setAllCourses] = useState<SingleCourse[]>([]);

	const fetchCourses = async () => {
		if (!orgId) return { data: [], total: 0 };

		try {
			const response = await axios.get(`${base_url}/courses/public/${orgId}?page=${currentPage}&limit=20`);
			return response.data;
		} catch (error: any) {
			console.error('Error fetching courses:', error);
			throw error;
		}
	};

	const {
		data: coursesData,
		isLoading,
		isError,
	} = useQuery(['landingPageCourses', orgId, currentPage], fetchCourses, {
		enabled: !!orgId && isLandingPageRoute,
		staleTime: 5 * 60 * 1000, // 5 minutes
		cacheTime: 30 * 60 * 1000, // 30 minutes
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Update allCourses when coursesData changes
	useEffect(() => {
		if (coursesData) {
			if (currentPage === 1) {
				// First page - replace all courses
				setAllCourses(coursesData.data || []);
			} else {
				// Subsequent pages - append courses
				setAllCourses((prev) => [...prev, ...(coursesData.data || [])]);
			}
		}
	}, [coursesData, currentPage]);

	const loadMore = () => {
		if (coursesData && allCourses.length < coursesData.total) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	// Calculate if there are more courses to load
	const hasMore = coursesData ? allCourses.length < coursesData.total : false;
	const total = coursesData?.total || 0;

	return (
		<AllPublicCoursesContext.Provider
			value={{
				courses: allCourses,
				loading: isLoading,
				error: isError ? 'Failed to fetch courses' : null,
				total,
				hasMore,
				loadMore,
			}}>
			{props.children}
		</AllPublicCoursesContext.Provider>
	);
};

export default AllPublicCoursesContextProvider;
