import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
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
	fetchLessons: (page: number) => Promise<void>;
	fetchMoreLessons: (startPage: number, endPage: number) => Promise<void>;
	refreshData: () => void;
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
	fetchLessons: async () => {},
	fetchMoreLessons: async () => {},
	refreshData: () => {},
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
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

	const fetchLessons = async (page: number = 1) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${page}&limit=300`);

			const lessonsData = response.data.data;
			setLessons(lessonsData);
			setTotalItems(response.data.totalItems);
			setNumberOfPages(Math.ceil(response.data.totalItems / 50)); // 50 per page display
			setLoadedPages([page]);
			setIsLoaded(true);
		} catch (error) {
			setIsLoaded(true);
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
			const combinedData = [...lessons, ...newLessons];
			const uniqueData = combinedData.filter((lesson, index, self) => index === self.findIndex((l) => l._id === lesson._id));
			const sortedData = uniqueData.sort((a: Lesson, b: Lesson) => b.updatedAt.localeCompare(a.updatedAt));
			setLessons(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more lessons:', error);
		}
	};

	const { isLoading, isError } = useQuery(['allLessons', orgId, lessonsPageNumber], () => fetchLessons(lessonsPageNumber), {
		enabled: !!orgId && !isLoaded && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortLessonsData = (property: keyof Lesson, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...lessons].sort((a: Lesson, b: Lesson) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setLessons(sortedDataCopy);
	};
	// Function to update lessons with new lesson data
	const addNewLesson = (newLesson: any) => {
		setLessons((prevLessons) => [newLesson, ...prevLessons]);
		setTotalItems((prev) => prev + 1);
	};

	const updateLessonPublishing = (id: string) => {
		const updatedLessonList = lessons?.map((lesson) => {
			if (lesson._id === id) {
				return { ...lesson, isActive: !lesson.isActive };
			}
			return lesson;
		});
		setLessons(updatedLessonList);
	};

	const updateLessons = (singleLesson: Lesson) => {
		const updatedLessonList = lessons?.map((lesson) => {
			if (singleLesson._id === lesson._id) {
				return singleLesson;
			}
			return lesson;
		});
		setLessons(updatedLessonList);
	};

	const removeLesson = (id: string) => {
		setLessons((prevLessons) => prevLessons?.filter((data) => data._id !== id));
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	const refreshData = () => {
		setIsLoaded(false);
	};

	if (isLoading && isAuthenticated) {
		return <Loading />;
	}

	if (isError && isAuthenticated) {
		return <LoadingError />;
	}

	return (
		<LessonsContext.Provider
			value={{
				lessons,
				loading: isLoading,
				error: isError ? 'Failed to fetch lessons' : null,
				fetchLessons,
				fetchMoreLessons,
				refreshData,
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
