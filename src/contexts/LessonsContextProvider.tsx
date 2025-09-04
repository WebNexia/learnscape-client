import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Lesson } from '../interfaces/lessons';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface LessonsContextTypes {
	lessons: Lesson[];
	loading: boolean;
	error: string | null;
	fetchLessons: (page: number) => Promise<Lesson[]>;
	fetchMoreLessons: (startPage: number, endPage: number) => Promise<void>;
	sortLessonsData: (property: keyof Lesson, order: 'asc' | 'desc') => void;
	addNewLesson: (newLesson: any) => void;
	updateLessonPublishing: (id: string) => void;
	removeLesson: (id: string) => void;
	updateLessons: (singleLesson: Lesson) => void;
	numberOfPages: number;
	lessonsPageNumber: number;
	setLessonsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	lessonTypes: string[];
}

interface LessonsContextProviderProps {
	children: ReactNode;
}

export const LessonsContext = createContext<LessonsContextTypes>({
	lessons: [],
	loading: false,
	error: null,
	fetchLessons: async () => [],
	fetchMoreLessons: async () => {},
	sortLessonsData: () => {},
	addNewLesson: () => {},
	updateLessonPublishing: () => {},
	removeLesson: () => {},
	updateLessons: () => {},
	numberOfPages: 1,
	lessonsPageNumber: 1,
	setLessonsPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
	lessonTypes: [],
});

const LessonsContextProvider = (props: LessonsContextProviderProps) => {
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

	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

	const fetchLessons = async (page: number = 1) => {
		if (!orgId) return [];
		try {
			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${page}&limit=300`);

			const lessonsData = response.data.data;

			// React Query cache'i güncelle
			queryClient.setQueryData(['allLessons', orgId], lessonsData);

			setTotalItems(response.data.totalItems);
			setNumberOfPages(Math.ceil(response.data.totalItems / 50)); // 50 per page display
			setLoadedPages([page]);

			return lessonsData;
		} catch (error) {
			throw error;
		}
	};

	const fetchMoreLessons = async (startPage: number, endPage: number) => {
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
			let newLessons: Lesson[] = [];
			for (const page of pagesToFetch) {
				const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${page}&limit=300`);
				newLessons = [...newLessons, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...(lessonsData || []), ...newLessons];
			const uniqueData = combinedData.filter((lesson, index, self) => index === self.findIndex((l) => l._id === lesson._id));
			const sortedData = uniqueData.sort((a: Lesson, b: Lesson) => b.updatedAt.localeCompare(a.updatedAt));
			queryClient.setQueryData(['allLessons', orgId], sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more lessons:', error);
		}
	};

	const {
		data: lessonsData,
		isLoading,
		isError,
	} = useQuery(['allLessons', orgId], () => fetchLessons(lessonsPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	// Function to handle sorting
	const sortLessonsData = (property: keyof Lesson, order: 'asc' | 'desc') => {
		// React Query data'yı sort et, local state'e set etme
		const sortedDataCopy = [...(lessonsData || [])].sort((a: Lesson, b: Lesson) => {
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

	// Function to update lessons with new lesson data
	const addNewLesson = (newLesson: any) => {
		// React Query cache'i güncelle - tüm sayfalar için
		queryClient.setQueryData(['allLessons', orgId], (oldData: any) => {
			const newData = oldData ? [newLesson, ...oldData] : [newLesson];

			return newData;
		});

		// Ayrıca totalItems'ı güncelle
		setTotalItems((prev) => prev + 1);
	};

	const updateLessonPublishing = (id: string) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allLessons', orgId], (oldData: any) => {
			return oldData?.map((lesson: Lesson) => {
				if (lesson._id === id) {
					return { ...lesson, isActive: !lesson.isActive };
				}
				return lesson;
			});
		});
	};

	const updateLessons = (singleLesson: Lesson) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allLessons', orgId], (oldData: any) => {
			return oldData?.map((lesson: Lesson) => {
				if (singleLesson._id === lesson._id) {
					return singleLesson;
				}
				return lesson;
			});
		});
	};

	const removeLesson = (id: string) => {
		// React Query cache'i güncelle
		queryClient.setQueryData(['allLessons', orgId], (oldData: any) => {
			return oldData?.filter((data: Lesson) => data._id !== id);
		});
	};

	// useEffect ile lessonsData değiştiğinde local state'i güncelle
	useEffect(() => {
		if (lessonsData) {
			// Don't override totalItems from server - only set loadedPages
			// setTotalItems(lessonsData.length); // ❌ This breaks pagination

			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
		}
	}, [lessonsData]);

	if (isLoading && isAuthenticated) {
		return <Loading />;
	}

	if (isError && isAuthenticated) {
		return <LoadingError />;
	}

	return (
		<LessonsContext.Provider
			value={{
				lessons: lessonsData || [], // React Query data kullan
				loading: isLoading,
				error: isError ? 'Failed to fetch lessons' : null,
				fetchLessons,
				fetchMoreLessons,
				sortLessonsData,
				addNewLesson,
				removeLesson,
				updateLessonPublishing,
				updateLessons,
				numberOfPages,
				lessonsPageNumber,
				setLessonsPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
				lessonTypes,
			}}>
			{props.children}
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;
