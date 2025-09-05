import { ReactNode, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
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
});

const CoursesContextProvider = ({ children }: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const location = useLocation();

	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

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
		enabled: isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

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
			}}>
			{children}
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import { SingleCourse } from '../interfaces/course';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { useAuth } from '../hooks/useAuth';
// import { useLocation } from 'react-router-dom';
// import { UserAuthContext } from './UserAuthContextProvider';
// import { Roles } from '../interfaces/enums';

// interface CoursesContextTypes {
// 	courses: SingleCourse[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchCourses: (page?: number) => Promise<SingleCourse[]>;
// 	fetchMoreCourses: (startPage: number, endPage: number) => Promise<void>;

// 	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
// 	addNewCourse: (newCourse: any) => void;
// 	updateCoursePublishing: (id: string) => void;
// 	removeCourse: (id: string) => void;
// 	updateCourse: (singleCourse: SingleCourse) => void;
// 	coursesPageNumber: number;
// 	setCoursesPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	totalItems: number;
// 	loadedPages: number[];
// }

// interface CoursesContextProviderProps {
// 	children: ReactNode;
// }

// export const CoursesContext = createContext<CoursesContextTypes>({
// 	courses: [],
// 	loading: false,
// 	error: null,
// 	fetchCourses: async () => [],
// 	fetchMoreCourses: async () => {},

// 	sortCoursesData: () => {},
// 	addNewCourse: () => {},
// 	updateCoursePublishing: () => {},
// 	removeCourse: () => {},
// 	updateCourse: () => {},
// 	coursesPageNumber: 1,
// 	setCoursesPageNumber: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// });

// const CoursesContextProvider = (props: CoursesContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin, isLearner } = useAuth();
// 	const { user } = useContext(UserAuthContext);
// 	const location = useLocation();
// 	const queryClient = useQueryClient();
// 	const isLandingPageRoute =
// 		location.pathname === '/' ||
// 		location.pathname === '/landing-page-courses' ||
// 		location.pathname === '/resources' ||
// 		location.pathname === '/contact-us' ||
// 		location.pathname === '/about-us' ||
// 		location.pathname === '/auth' ||
// 		// Only consider course preview pages as landing pages, not enrolled course pages
// 		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

// 	const [coursesPageNumber, setCoursesPageNumber] = useState<number>(1);
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);

// 	const fetchCourses = async (page: number = 1) => {
// 		if (!orgId) return [];

// 		try {
// 			const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=200`);

// 			const coursesData = response.data.data;

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], coursesData);

// 			setTotalItems(response.data.totalItems);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, page])));

// 			return coursesData;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreCourses = async (startPage: number, endPage: number) => {
// 		if (!orgId) return;
// 		try {
// 			// Find which pages we need to fetch
// 			const pagesToFetch: number[] = [];
// 			for (let page = startPage; page <= endPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					pagesToFetch.push(page);
// 				}
// 			}

// 			if (pagesToFetch.length === 0) return; // Already loaded

// 			// Fetch missing pages
// 			let newCourses: SingleCourse[] = [];
// 			for (const page of pagesToFetch) {
// 				const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=200`);
// 				newCourses = [...newCourses, ...response.data.data];
// 			}

// 			// Combine with existing data, remove duplicates, and sort
// 			const existingData = queryClient.getQueryData<SingleCourse[]>(['allCourses', orgId, coursesPageNumber]) || [];
// 			const combinedData = [...existingData, ...newCourses];

// 			const uniqueData = combinedData.filter((course, index, self) => index === self.findIndex((c) => c._id === course._id));
// 			const sortedData = uniqueData.sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
// 			queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], sortedData);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, ...pagesToFetch])));
// 		} catch (error) {
// 			console.error('Error fetching more courses:', error);
// 		}
// 	};

// 	const {
// 		data: coursesData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allCourses', orgId, coursesPageNumber], () => fetchCourses(coursesPageNumber), {
// 		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
// 		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: user?.role !== Roles.USER ? true : false, // Refetch on component remount to get fresh data
// 	});

// 	// Progressive pagination için aradaki boşlukları doldur
// 	useEffect(() => {
// 		if (loadedPages.length > 0 && orgId) {
// 			const sortedPages = [...loadedPages].sort((a, b) => a - b);
// 			const maxPage = Math.max(...sortedPages);

// 			// Aradaki boşlukları bul ve yükle
// 			for (let page = 1; page <= maxPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					fetchCourses(page);
// 				}
// 			}
// 		}
// 	}, [loadedPages, orgId]);

// 	// Function to handle sorting
// 	const sortCoursesData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(coursesData || [])].sort((a: SingleCourse, b: SingleCourse) => {
// 			const aValue = a[property] ?? '';
// 			const bValue = b[property] ?? '';
// 			if (order === 'asc') {
// 				return aValue > bValue ? 1 : -1;
// 			} else {
// 				return aValue < bValue ? 1 : -1;
// 			}
// 		});
// 		// Local state'e set etme, sadece sort edilmiş data'yı return et
// 		return sortedDataCopy;
// 	};

// 	// Function to update courses with new course data
// 	const addNewCourse = (newCourse: SingleCourse) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: SingleCourse[] | undefined) => {
// 			return oldData ? [newCourse, ...oldData] : [newCourse];
// 		});
// 	};

// 	const updateCoursePublishing = (id: string) => {
// 		// Update cache for current page
// 		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: SingleCourse[] | undefined) => {
// 			return (
// 				oldData?.map((course: SingleCourse) => {
// 					if (course._id === id) {
// 						return { ...course, isActive: !course.isActive };
// 					}
// 					return course;
// 				}) || []
// 			);
// 		});

// 		// Update cache for all other loaded pages
// 		loadedPages.forEach((page) => {
// 			if (page !== coursesPageNumber) {
// 				queryClient.setQueryData(['allCourses', orgId, page], (oldData: SingleCourse[] | undefined) => {
// 					return (
// 						oldData?.map((course: SingleCourse) => {
// 							if (course._id === id) {
// 								return { ...course, isActive: !course.isActive };
// 							}
// 							return course;
// 						}) || []
// 					);
// 				});
// 			}
// 		});

// 		// Invalidate all course queries for this organization
// 		queryClient.invalidateQueries(['allCourses', orgId]);

// 		// Force a complete refresh of all course data
// 		setTimeout(() => {
// 			queryClient.invalidateQueries(['allCourses', orgId]);
// 		}, 100);

// 		// Also refresh the current page data immediately
// 		queryClient.refetchQueries(['allCourses', orgId, coursesPageNumber]);
// 	};

// 	const updateCourse = (singleCourse: SingleCourse) => {
// 		// OPTIMISTIC UPDATE: Update UI immediately for instant feedback

// 		// Update current page cache immediately
// 		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: SingleCourse[] | undefined) => {
// 			return (
// 				oldData?.map((course: SingleCourse) => {
// 					if (course._id === singleCourse._id) {
// 						return singleCourse; // Show updated course immediately
// 					}
// 					return course;
// 				}) || []
// 			);
// 		});

// 		// Update all other loaded pages cache immediately
// 		loadedPages.forEach((page) => {
// 			if (page !== coursesPageNumber) {
// 				queryClient.setQueryData(['allCourses', orgId, page], (oldData: SingleCourse[] | undefined) => {
// 					return (
// 						oldData?.map((course: SingleCourse) => {
// 							if (course._id === singleCourse._id) {
// 								return singleCourse; // Show updated course immediately
// 							}
// 							return course;
// 						}) || []
// 					);
// 				});
// 			}
// 		});

// 		// Background sync: Invalidate queries to ensure server data is fresh
// 		// This happens in the background without blocking the UI
// 		setTimeout(() => {
// 			queryClient.invalidateQueries(['allCourses', orgId]);
// 		}, 100);
// 	};

// 	const removeCourse = (id: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allCourses', orgId, coursesPageNumber], (oldData: SingleCourse[] | undefined) => {
// 			return oldData?.filter((data: SingleCourse) => data._id !== id) || [];
// 		});
// 	};

// 	// useEffect ile coursesData değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (coursesData) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(coursesData.length); // ❌ This breaks pagination

// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [coursesData]);

// 	if (isLoading && isAuthenticated) {
// 		return <Loading />;
// 	}

// 	if (isError && isAuthenticated) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<CoursesContext.Provider
// 			value={{
// 				courses: coursesData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Failed to fetch courses' : null,
// 				fetchCourses,
// 				fetchMoreCourses,

// 				sortCoursesData,
// 				addNewCourse,
// 				removeCourse,
// 				updateCoursePublishing,
// 				updateCourse,
// 				coursesPageNumber,
// 				setCoursesPageNumber,
// 				totalItems,
// 				loadedPages,
// 			}}>
// 			{props.children}
// 		</CoursesContext.Provider>
// 	);
// };

// export default CoursesContextProvider;
