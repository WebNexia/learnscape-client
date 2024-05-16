import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { Lesson } from '../interfaces/lessons';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';

interface LessonsContextTypes {
	sortedLessonsData: Lesson[];
	sortLessonsData: (property: keyof Lesson, order: 'asc' | 'desc') => void;
	addNewLesson: (newLesson: any) => void;
	updateLessonPublishing: (id: string) => void;
	removeLesson: (id: string) => void;
	updateLessons: (singleLesson: Lesson) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
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
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
});

const LessonsContextProvider = (props: LessonsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedLessonsData, setSortedLessonsData] = useState<Lesson[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const { data, isLoading, isError } = useQuery(
		['allLessons', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedLessonsDataCopy = [...response.data.data].sort((a: Lesson, b: Lesson) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedLessonsData(sortedLessonsDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		},
		{
			enabled: !!orgId,
		}
		// {
		// 	enabled: !!orgId, // Enable the query only when orgId is available
		// keepPreviousData: true, // Keep previous data while fetching new data
		// }
	);

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
		setSortedLessonsData((prevSortedData) => [newLesson, ...prevSortedData]);
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
				numberOfPages,
				pageNumber,
				setPageNumber,
			}}>
			{props.children}
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;
