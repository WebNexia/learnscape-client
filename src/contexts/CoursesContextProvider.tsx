import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { SingleCourse } from '../interfaces/course';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface CoursesContextTypes {
	courses: SingleCourse[];
	sortedPublicCoursesData: SingleCourse[];
	loading: boolean;
	error: string | null;
	fetchCourses: (page: number) => Promise<SingleCourse[]>;
	fetchMoreCourses: (startPage: number, endPage: number) => Promise<void>;

	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
	addNewCourse: (newCourse: any) => void;
	updateCoursePublishing: (id: string) => void;
	removeCourse: (id: string) => void;
	updateCourse: (singleCourse: SingleCourse) => void;
	numberOfPages: number;
	coursesPageNumber: number;
	setCoursesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	fetchPublicCourses: () => void;

	totalNumberOfEnrolledLearners: number;
	totalCourses: number;
	coursesSummary: CourseSummary[];
}

interface CoursesContextProviderProps {
	children: ReactNode;
}

export interface CourseSummary {
	title: string;
	enrolledUsersCount: number;
}

export const CoursesContext = createContext<CoursesContextTypes>({
	courses: [],
	sortedPublicCoursesData: [],
	loading: false,
	error: null,
	fetchCourses: async () => [],
	fetchMoreCourses: async () => {},

	sortCoursesData: () => {},
	addNewCourse: () => {},
	updateCoursePublishing: () => {},
	removeCourse: () => {},
	updateCourse: () => {},
	numberOfPages: 1,
	coursesPageNumber: 1,
	setCoursesPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
	fetchPublicCourses: () => {},
	totalNumberOfEnrolledLearners: 1,
	totalCourses: 1,
	coursesSummary: [],
});

const CoursesContextProvider = (props: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const location = useLocation();
	const queryClient = useQueryClient();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [sortedPublicCoursesData, setSortedPublicCoursesData] = useState<SingleCourse[]>([]);

	const [totalNumberOfEnrolledLearners, setTotalNumberOfEnrolledLearners] = useState<number>(1);
	const [totalCourses, setTotalCourses] = useState<number>(1);
	const [coursesSummary, setCoursesSummary] = useState<CourseSummary[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [coursesPageNumber, setCoursesPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const fetchCourses = async (page: number = 1) => {
		if (!orgId) return [];
		try {
			const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=200`);

			const coursesData = response.data.data;

			// React Query cache'i güncelle
			queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], coursesData);

			setTotalItems(response.data.totalItems);
			setNumberOfPages(Math.ceil(response.data.totalItems / 50)); // 50 per page display
			setLoadedPages([page]);
			setIsLoaded(true);

			return coursesData;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreCourses = async (startPage: number, endPage: number) => {
		if (!orgId) return;
		try {
			// Find which pages we need to fetch
			const pagesToFetch = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) return; // Already loaded

			// Fetch missing pages
			let newCourses: SingleCourse[] = [];
			for (const page of pagesToFetch) {
				const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=200`);
				newCourses = [...newCourses, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...(coursesData || []), ...newCourses];
			const uniqueData = combinedData.filter((course, index, self) => index === self.findIndex((c) => c._id === course._id));
			const sortedData = uniqueData.sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
			queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more courses:', error);
		}
	};

	const {
		data: coursesData,
		isLoading,
		isError,
	} = useQuery(['allCourses', orgId, coursesPageNumber], () => fetchCourses(coursesPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	const fetchPublicCourses = async () => {
		try {
			const response = await axios.get(`${base_url}/courses/public`);
			const sortedDataCopy = [...response.data.data].sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedPublicCoursesData(sortedDataCopy);
			return response.data.data;
		} catch (error) {
			throw error;
		}
	};

	useQuery(['allPublicCourses'], fetchPublicCourses, {
		enabled: isLandingPageRoute,
	});

	const fetchCoursesDashboardSummary = async () => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/courses/organisation/${orgId}/summary`);
			const summary = response.data;

			setTotalCourses(summary.totalCourses);
			setTotalNumberOfEnrolledLearners(summary.totalUniqueUsers);
			setCoursesSummary(summary.courses);
		} catch (error) {
			console.error('Error fetching dashboard summary:', error);
		}
	};

	const {
		// data: summaryData,
		isLoading: summaryDataLoading,
		isError: summaryDataError,
	} = useQuery(['coursesSummary', orgId], () => fetchCoursesDashboardSummary(), {
		enabled: !!orgId && !isLoaded && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortCoursesData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
		// React Query data'yı sort et, local state'e set etme
		const sortedDataCopy = [...(coursesData || [])].sort((a: SingleCourse, b: SingleCourse) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		// Local state'e set etme, sadece sort edilmiş data'yı return et
		return sortedDataCopy;
	};

	// Function to update courses with new course data
	const addNewCourse = (newCourse: any) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: any) => {
			return oldData ? [newCourse, ...oldData] : [newCourse];
		});
	};

	const updateCoursePublishing = (id: string) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: any) => {
			return oldData?.map((course: SingleCourse) => {
				if (course._id === id) {
					return { ...course, isActive: !course.isActive };
				}
				return course;
			});
		});
	};

	const updateCourse = (singleCourse: SingleCourse) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: any) => {
			return oldData?.map((course: SingleCourse) => {
				if (singleCourse._id === course._id) {
					return singleCourse;
				}
				return course;
			});
		});
	};

	const removeCourse = (id: string) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: any) => {
			return oldData?.filter((data: SingleCourse) => data._id !== id);
		});
	};

	// useEffect ile coursesData değiştiğinde local state'i güncelle
	useEffect(() => {
		if (coursesData) {
			// Don't override totalItems from server - only set loadedPages
			// setTotalItems(coursesData.length); // ❌ This breaks pagination

			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
		}
	}, [coursesData]);

	if ((isLoading || summaryDataLoading) && isAuthenticated) {
		return <Loading />;
	}

	if ((isError || summaryDataError) && isAuthenticated) {
		return <LoadingError />;
	}

	return (
		<CoursesContext.Provider
			value={{
				courses: coursesData || [], // React Query data kullan
				sortedPublicCoursesData,
				loading: isLoading,
				error: isError ? 'Failed to fetch courses' : null,
				fetchCourses,
				fetchMoreCourses,

				sortCoursesData,
				addNewCourse,
				removeCourse,
				updateCoursePublishing,
				updateCourse,
				numberOfPages,
				coursesPageNumber,
				setCoursesPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
				fetchPublicCourses,
				totalNumberOfEnrolledLearners,
				totalCourses,
				coursesSummary,
			}}>
			{props.children}
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;
