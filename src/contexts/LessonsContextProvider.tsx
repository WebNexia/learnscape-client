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
	sortedLessonsData: Lesson[];
	sortLessonsData: (property: keyof Lesson, order: 'asc' | 'desc') => void;
	addNewLesson: (newLesson: any) => void;
	updateLessonPublishing: (id: string) => void;
	removeLesson: (id: string) => void;
	updateLessons: (singleLesson: Lesson) => void;
	// numberOfPages: number;
	// lessonsPageNumber: number;
	// setLessonsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchLessons: () => void;
	lessonTypes: string[];
}

interface LessonsContextProviderProps {
	children: ReactNode;
}

export const LessonsContext = createContext<LessonsContextTypes>({
	sortedLessonsData: [],
	sortLessonsData: () => {},
	addNewLesson: () => {},
	updateLessonPublishing: () => {},
	removeLesson: () => {},
	updateLessons: () => {},
	// numberOfPages: 1,
	// lessonsPageNumber: 1,
	// setLessonsPageNumber: () => {},
	fetchLessons: () => {},
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

	const [sortedLessonsData, setSortedLessonsData] = useState<Lesson[]>([]);
	// const [numberOfPages, setNumberOfPages] = useState<number>(1);
	// const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const lessonTypes: string[] = ['Instructional Lesson', 'Practice Lesson', 'Quiz'];

	const fetchLessons = async () => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}`);

			// Initial sorting when fetching data
			const sortedLessonsDataCopy = [...response.data.data].sort((a: Lesson, b: Lesson) => b.createdAt.localeCompare(a.createdAt));
			setSortedLessonsData(sortedLessonsDataCopy);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { isLoading, isError } = useQuery(['allLessons', orgId], () => fetchLessons(), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLoaded && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortLessonsData = (property: keyof Lesson, order: 'asc' | 'desc') => {
		const sortedLessonsDataCopy = [...sortedLessonsData].sort((a: Lesson, b: Lesson) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedLessonsData(sortedLessonsDataCopy);
	};
	// Function to update sortedLessonsData with new lesson data
	const addNewLesson = (newLesson: any) => {
		setSortedLessonsData((prevSortedData) => {
			// Check if lesson already exists
			const exists = prevSortedData.some((lesson) => lesson._id === newLesson._id);
			if (exists) {
				// If exists, update it
				const updatedData = prevSortedData.map((lesson) => (lesson._id === newLesson._id ? newLesson : lesson));
				return updatedData;
			}
			// If doesn't exist, add it to the beginning
			const newData = [newLesson, ...prevSortedData];
			return newData;
		});
	};

	const updateLessonPublishing = (id: string) => {
		const updatedLessonList = sortedLessonsData?.map((lesson) => {
			if (lesson._id === id) {
				return { ...lesson, isActive: !lesson.isActive };
			}
			return lesson;
		});
		setSortedLessonsData(updatedLessonList);
	};

	const updateLessons = (singleLesson: Lesson) => {
		const updatedLessonList = sortedLessonsData?.map((lesson) => {
			if (singleLesson._id === lesson._id) {
				return singleLesson;
			}
			return lesson;
		});
		setSortedLessonsData(updatedLessonList);
	};

	const removeLesson = (id: string) => {
		setSortedLessonsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<LessonsContext.Provider
			value={{
				sortedLessonsData,
				sortLessonsData,
				addNewLesson,
				removeLesson,
				updateLessonPublishing,
				updateLessons,
				// numberOfPages,
				// lessonsPageNumber,
				// setLessonsPageNumber,
				fetchLessons,
				lessonTypes,
			}}>
			{props.children}
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;
