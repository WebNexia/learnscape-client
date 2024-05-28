import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { Course, SingleCourse } from '../interfaces/course';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';

interface CoursesContextTypes {
	sortedCoursesData: SingleCourse[];
	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
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
	sortedCoursesData: [],
	sortCoursesData: () => {},
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

	const { orgId } = useContext(OrganisationContext);

	const [sortedCoursesData, setSortedCoursesData] = useState<SingleCourse[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const { data, isLoading, isError } = useQuery(
		['allCourses', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			try {
				const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${pageNumber}`);

				// Initial sorting when fetching data
				const sortedDataCopy = [...response.data.data].sort((a: Course, b: Course) => b.updatedAt.localeCompare(a.updatedAt));
				setSortedCoursesData(sortedDataCopy);
				setNumberOfPages(response.data.pages);
				setIsLoaded(true);
				return response.data.data;
			} catch (error) {
				setIsLoaded(true); // Set isLoading to false in case of an error
				throw error; // Rethrow the error to be handled by React Query
			}
		},
		{
			enabled: !!orgId && !isLoaded,
		}
	);

	// Function to handle sorting
	const sortCoursesData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedCoursesData].sort((a: SingleCourse, b: SingleCourse) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedCoursesData(sortedDataCopy);
	};
	// Function to update sortedCoursesData with new course data
	const addNewCourse = (newCourse: any) => {
		setSortedCoursesData((prevSortedData) => [newCourse, ...prevSortedData]);
	};

	const updateCoursePublishing = (id: string) => {
		const updatedCourseList = sortedCoursesData?.map((course) => {
			if (course._id === id) {
				return { ...course, isActive: !course.isActive };
			}
			return course;
		});
		setSortedCoursesData(updatedCourseList);
	};

	const updateCourse = (singleCourse: SingleCourse) => {
		const updatedCourseList = sortedCoursesData?.map((course) => {
			if (singleCourse._id === course._id) {
				return singleCourse;
			}
			return course;
		});
		setSortedCoursesData(updatedCourseList);
	};

	const removeCourse = (id: string) => {
		setSortedCoursesData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	// useEffect(() => {}, [sortedCoursesData]);

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<CoursesContext.Provider
			value={{
				sortedCoursesData,
				sortCoursesData,
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
