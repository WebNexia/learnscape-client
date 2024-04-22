import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { ReactNode, createContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { SentimentVeryDissatisfied } from '@mui/icons-material';
import theme from '../themes';
import { Lesson } from '../interfaces/lessons';

interface LessonsContextTypes {
	data: Lesson[];
	sortedData: Lesson[];
	sortData: (property: keyof Lesson, order: 'asc' | 'desc') => void;
	setSortedData: React.Dispatch<React.SetStateAction<Lesson[]>>;
	addNewLesson: (newLesson: any) => void;
	updateLessonPublishing: (id: string) => void;
	removeLesson: (id: string) => void;
	updateLesson: (singleLesson: Lesson) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface LessonsContextProviderProps {
	children: ReactNode;
}

export const LessonsContext = createContext<LessonsContextTypes>({
	data: [],
	sortedData: [],
	sortData: () => {},
	setSortedData: () => {},
	addNewLesson: () => {},
	updateLessonPublishing: () => {},
	removeLesson: () => {},
	updateLesson: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
});

const LessonsContextProvider = (props: LessonsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [sortedData, setSortedData] = useState<Lesson[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const { data, isLoading, isError } = useQuery(
		['allLessons', { page: pageNumber }], //include query parameter in this format
		async () => {
			const response = await axios.get(`${base_url}/lessons?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Lesson, b: Lesson) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedData(sortedDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		}
	);

	// Function to handle sorting
	const sortData = (property: keyof Lesson, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedData].sort((a: Lesson, b: Lesson) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedData(sortedDataCopy);
	};
	// Function to update sortedData with new lesson data
	const addNewLesson = (newLesson: any) => {
		setSortedData((prevSortedData) => [newLesson, ...prevSortedData]);
	};

	const updateLessonPublishing = (id: string) => {
		const updatedLessonList = sortedData?.map((lesson) => {
			if (lesson._id === id) {
				return { ...lesson, isActive: !lesson.isActive };
			}
			return lesson;
		});
		setSortedData(updatedLessonList);
	};

	const updateLesson = (singleLesson: Lesson) => {
		const updatedLessonList = sortedData?.map((lesson) => {
			if (singleLesson._id === lesson._id) {
				return singleLesson;
			}
			return lesson;
		});
		setSortedData(updatedLessonList);
	};

	const removeLesson = (id: string) => {
		setSortedData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	useEffect(() => {}, [sortedData]);

	if (isLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.bgColor?.secondary,
					height: '100vh',
				}}>
				<CircularProgress />
				<Typography
					sx={{
						margin: '2rem',
						fontSize: '2rem',
						fontFamily: 'Poppins',
						fontWeight: 500,
						color: '#01435A',
					}}>
					Loading...
				</Typography>
				<Typography
					sx={{
						fontSize: '3rem',
						fontFamily: 'Permanent Marker, cursive',
						color: '#01435A',
					}}>
					KAIZEN
				</Typography>
			</Box>
		);
	}

	if (isError) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.bgColor?.secondary,
					height: '100vh',
				}}>
				<Typography
					sx={{
						margin: '2rem',
						fontSize: '2rem',
						fontFamily: 'Poppins',
						fontWeight: 500,
						color: '#01435A',
					}}>
					Ooops, something went wrong!
				</Typography>
				<SentimentVeryDissatisfied fontSize='large' color='error' />
			</Box>
		);
	}

	return (
		<LessonsContext.Provider
			value={{
				data,
				sortedData,
				sortData,
				setSortedData,
				addNewLesson,
				removeLesson,
				updateLessonPublishing,
				updateLesson,
				numberOfPages,
				pageNumber,
				setPageNumber,
			}}>
			{props.children}
		</LessonsContext.Provider>
	);
};

export default LessonsContextProvider;
