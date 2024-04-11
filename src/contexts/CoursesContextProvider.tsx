import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { ReactNode, createContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { SentimentVeryDissatisfied } from '@mui/icons-material';
import theme from '../themes';
import { Course, SingleCourse } from '../interfaces/course';

interface CoursesContextTypes {
	data: SingleCourse[];
	sortedData: SingleCourse[];
	sortData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
	setSortedData: React.Dispatch<React.SetStateAction<SingleCourse[]>>;
	addNewCourse: (newCourse: any) => void;
	updateCoursePublishing: (id: string) => void;
	removeCourse: (id: string) => void;
	updateCourse: (singleCourse: SingleCourse) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface CoursesContextProviderProps {
	children: ReactNode;
}

export const CoursesContext = createContext<CoursesContextTypes>({
	data: [],
	sortedData: [],
	sortData: () => {},
	setSortedData: () => {},
	addNewCourse: () => {},
	updateCoursePublishing: () => {},
	removeCourse: () => {},
	updateCourse: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
});

const CoursesContextProvider = (props: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [sortedData, setSortedData] = useState<SingleCourse[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const { data, isLoading, isError } = useQuery(
		['allCourses', { page: pageNumber }],
		async () => {
			const response = await axios.get(`${base_url}/courses?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Course, b: Course) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedData(sortedDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		}
	);

	// Function to handle sorting
	const sortData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedData].sort((a: SingleCourse, b: SingleCourse) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedData(sortedDataCopy);
	};
	// Function to update sortedData with new course data
	const addNewCourse = (newCourse: any) => {
		setSortedData((prevSortedData) => [newCourse, ...prevSortedData]);
	};

	const updateCoursePublishing = (id: string) => {
		const updatedCourseList = sortedData?.map((course) => {
			if (course._id === id) {
				return { ...course, isActive: !course.isActive };
			}
			return course;
		});
		setSortedData(updatedCourseList);
	};

	const updateCourse = (singleCourse: SingleCourse) => {
		const updatedCourseList = sortedData?.map((course) => {
			if (singleCourse._id === course._id) {
				return singleCourse;
			}
			return course;
		});
		setSortedData(updatedCourseList);
	};

	const removeCourse = (id: string) => {
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
		<CoursesContext.Provider
			value={{
				data,
				sortedData,
				sortData,
				setSortedData,
				addNewCourse,
				removeCourse,
				updateCoursePublishing,
				updateCourse,
				numberOfPages,
				pageNumber,
				setPageNumber,
			}}>
			{props.children}
		</CoursesContext.Provider>
	);
};

export default CoursesContextProvider;
