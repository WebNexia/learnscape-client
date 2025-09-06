// LessonsContextProvider.tsx
import { ReactNode, createContext, useContext } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
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
}

interface LessonsContextProviderProps {
	children: ReactNode;
}

export const LessonsContext = createContext<LessonsContextTypes>({} as LessonsContextTypes);

const LessonsContextProvider = ({ children }: LessonsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
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
		baseUrl: `${base_url}/lessons/organisation/${orgId}`,
		entityKey: 'allLessons',
		enabled: isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

	return (
		<LessonsContext.Provider
			value={{
				lessons,
				loading: isLoading,
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
			}}>
			{children}
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import { Lesson } from '../interfaces/lessons';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { useAuth } from '../hooks/useAuth';
// import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
// import { UserAuthContext } from './UserAuthContextProvider';
// import { Roles } from '../interfaces/enums';

// interface LessonsContextTypes {
// 	lessons: Lesson[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchLessons: (page: number) => Promise<Lesson[]>;
// 	fetchMoreLessons: (startPage: number, endPage: number) => Promise<void>;
// 	sortLessonsData: (property: keyof Lesson, order: 'asc' | 'desc') => void;
// 	addNewLesson: (newLesson: any) => void;
// 	updateLessonPublishing: (id: string) => void;
// 	removeLesson: (id: string) => void;
// 	updateLessons: (singleLesson: Lesson) => void;
// 	lessonsPageNumber: number;
// 	setLessonsPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	totalItems: number;
// 	loadedPages: number[];
// 	lessonTypes: string[];
// }

// interface LessonsContextProviderProps {
// 	children: ReactNode;
// }

// export const LessonsContext = createContext<LessonsContextTypes>({
// 	lessons: [],
// 	loading: false,
// 	error: null,
// 	fetchLessons: async () => [],
// 	fetchMoreLessons: async () => {},
// 	sortLessonsData: () => {},
// 	addNewLesson: () => {},
// 	updateLessonPublishing: () => {},
// 	removeLesson: () => {},
// 	updateLessons: () => {},
// 	lessonsPageNumber: 1,
// 	setLessonsPageNumber: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// 	lessonTypes: [],
// });

// const LessonsContextProvider = (props: LessonsContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin, isLearner } = useAuth();
// 	const { user } = useContext(UserAuthContext);
// 	const location = useLocation();
// 	const queryClient = useQueryClient();
// 	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);

// 	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

// 	const fetchLessons = async (page: number = 1) => {
// 		if (!orgId) return [];

// 		try {
// 			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${page}&limit=200`);

// 			const lessonsData = response.data.data;

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], lessonsData);

// 			setTotalItems(response.data.totalItems);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, page])));

// 			return lessonsData;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreLessons = async (startPage: number, endPage: number) => {
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
// 			let newLessons: Lesson[] = [];
// 			for (const page of pagesToFetch) {
// 				const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${page}&limit=200`);
// 				newLessons = [...newLessons, ...response.data.data];
// 			}

// 			// Combine with existing data, remove duplicates, and sort
// 			const existingData = queryClient.getQueryData<Lesson[]>(['allLessons', orgId, lessonsPageNumber]) || [];
// 			const combinedData = [...existingData, ...newLessons];

// 			const uniqueData = combinedData.filter((lesson, index, self) => index === self.findIndex((l) => l._id === lesson._id));
// 			const sortedData = uniqueData.sort((a: Lesson, b: Lesson) => b.updatedAt.localeCompare(a.updatedAt));
// 			queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], sortedData);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, ...pagesToFetch])));
// 		} catch (error) {
// 			console.error('Error fetching more lessons:', error);
// 		}
// 	};

// 	const {
// 		data: lessonsData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allLessons', orgId, lessonsPageNumber], () => fetchLessons(lessonsPageNumber), {
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
// 					fetchLessons(page);
// 				}
// 			}
// 		}
// 	}, [loadedPages, orgId]);

// 	// Function to handle sorting
// 	const sortLessonsData = (property: keyof Lesson, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(lessonsData || [])].sort((a: Lesson, b: Lesson) => {
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

// 	// Function to update lessons with new lesson data
// 	const addNewLesson = (newLesson: Lesson) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], (oldData: Lesson[] | undefined) => {
// 			return oldData ? [newLesson, ...oldData] : [newLesson];
// 		});
// 	};

// 	const updateLessonPublishing = (id: string) => {
// 		// Update cache for current page
// 		queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], (oldData: Lesson[] | undefined) => {
// 			return (
// 				oldData?.map((lesson: Lesson) => {
// 					if (lesson._id === id) {
// 						return { ...lesson, isActive: !lesson.isActive };
// 					}
// 					return lesson;
// 				}) || []
// 			);
// 		});

// 		// Update cache for all other loaded pages
// 		loadedPages.forEach((page) => {
// 			if (page !== lessonsPageNumber) {
// 				queryClient.setQueryData(['allLessons', orgId, page], (oldData: Lesson[] | undefined) => {
// 					return (
// 						oldData?.map((lesson: Lesson) => {
// 							if (lesson._id === id) {
// 								return { ...lesson, isActive: !lesson.isActive };
// 							}
// 							return lesson;
// 						}) || []
// 					);
// 				});
// 			}
// 		});

// 		// Invalidate all lesson queries for this organization
// 		queryClient.invalidateQueries(['allLessons', orgId]);

// 		// Force a complete refresh of all lesson data
// 		setTimeout(() => {
// 			queryClient.invalidateQueries(['allLessons', orgId]);
// 		}, 100);

// 		// Also refresh the current page data immediately
// 		queryClient.refetchQueries(['allLessons', orgId, lessonsPageNumber]);
// 	};

// 	const updateLessons = (singleLesson: Lesson) => {
// 		// OPTIMISTIC UPDATE: Update UI immediately for instant feedback

// 		// Update current page cache immediately
// 		queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], (oldData: Lesson[] | undefined) => {
// 			return (
// 				oldData?.map((lesson: Lesson) => {
// 					if (lesson._id === singleLesson._id) {
// 						return singleLesson; // Show updated lesson immediately
// 					}
// 					return lesson;
// 				}) || []
// 			);
// 		});

// 		// Update all other loaded pages cache immediately
// 		loadedPages.forEach((page) => {
// 			if (page !== lessonsPageNumber) {
// 				queryClient.setQueryData(['allLessons', orgId, page], (oldData: Lesson[] | undefined) => {
// 					return (
// 						oldData?.map((lesson: Lesson) => {
// 							if (lesson._id === singleLesson._id) {
// 								return singleLesson; // Show updated lesson immediately
// 							}
// 							return lesson;
// 						}) || []
// 					);
// 				});
// 			}
// 		});

// 		// Background sync: Invalidate queries to ensure server data is fresh
// 		// This happens in the background without blocking the UI
// 		setTimeout(() => {
// 			queryClient.invalidateQueries(['allLessons', orgId]);
// 		}, 100);
// 	};

// 	const removeLesson = (id: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allLessons', orgId, lessonsPageNumber], (oldData: Lesson[] | undefined) => {
// 			return oldData?.filter((data: Lesson) => data._id !== id) || [];
// 		});
// 	};

// 	// useEffect ile lessonsData değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (lessonsData) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(lessonsData.length); // ❌ This breaks pagination

// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [lessonsData]);

// 	if (isLoading && isAuthenticated) {
// 		return <Loading />;
// 	}

// 	if (isError && isAuthenticated) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<LessonsContext.Provider
// 			value={{
// 				lessons: lessonsData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Failed to fetch lessons' : null,
// 				fetchLessons,
// 				fetchMoreLessons,
// 				sortLessonsData,
// 				addNewLesson,
// 				removeLesson,
// 				updateLessonPublishing,
// 				updateLessons,
// 				lessonsPageNumber,
// 				setLessonsPageNumber,
// 				totalItems,
// 				loadedPages,
// 				lessonTypes,
// 			}}>
// 			{props.children}
// 		</LessonsContext.Provider>
// 	);
// };

// export default LessonsContextProvider;
