import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { Course, SingleCourse } from '../interfaces/course';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';

interface CoursesContextTypes {
	sortedCoursesData: SingleCourse[];
	sortedPublicCoursesData: SingleCourse[];
	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
	addNewCourse: (newCourse: any) => void;
	updateCoursePublishing: (id: string) => void;
	removeCourse: (id: string) => void;
	updateCourse: (singleCourse: SingleCourse) => void;
	// coursesNumberOfPages: number;
	// coursesPageNumber: number;
	// setCoursesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchCourses: () => void;
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
	sortedCoursesData: [],
	sortedPublicCoursesData: [],
	sortCoursesData: () => {},
	addNewCourse: () => {},
	updateCoursePublishing: () => {},
	removeCourse: () => {},
	updateCourse: () => {},
	// coursesNumberOfPages: 1,
	// coursesPageNumber: 1,
	// setCoursesPageNumber: () => {},
	fetchCourses: () => {},
	fetchPublicCourses: () => {},
	totalNumberOfEnrolledLearners: 1,
	totalCourses: 1,
	coursesSummary: [],
});

const CoursesContextProvider = (props: CoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();

	const [sortedCoursesData, setSortedCoursesData] = useState<SingleCourse[]>([]);
	const [sortedPublicCoursesData, setSortedPublicCoursesData] = useState<SingleCourse[]>([]);

	const [totalNumberOfEnrolledLearners, setTotalNumberOfEnrolledLearners] = useState<number>(1);
	const [totalCourses, setTotalCourses] = useState<number>(1);
	const [coursesSummary, setCoursesSummary] = useState<CourseSummary[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchCourses = async () => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/courses/organisation/${orgId}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Course, b: Course) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedCoursesData(sortedDataCopy);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const { data, isLoading, isError } = useQuery(['allCourses', orgId], () => fetchCourses(), {
		enabled: !!orgId && !isLoaded && isAuthenticated && (isAdmin || isLearner),
	});

	const fetchPublicCourses = async () => {
		try {
			const response = await axios.get(`${base_url}/courses/public`);
			const sortedDataCopy = [...response.data.data].sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedPublicCoursesData(sortedDataCopy);
			console.log(response.data.data);
			return response.data.data;
		} catch (error) {
			throw error;
		}
	};

	const { data: publicCourses } = useQuery(['allPublicCourses'], fetchPublicCourses, {
		enabled: !isAuthenticated,
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
		data: summaryData,
		isLoading: summaryDataLoading,
		isError: summaryDataError,
	} = useQuery(['allCourses', orgId], () => fetchCoursesDashboardSummary(), {
		enabled: !!orgId && !isLoaded && isAuthenticated && (isAdmin || isLearner),
	});

	// Function to handle sorting
	const sortCoursesData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedCoursesData].sort((a: SingleCourse, b: SingleCourse) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
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

	if ((isLoading || summaryDataLoading) && isAuthenticated) {
		return <Loading />;
	}

	if ((isError || summaryDataError) && isAuthenticated) {
		return <LoadingError />;
	}

	return (
		<CoursesContext.Provider
			value={{
				sortedCoursesData,
				sortedPublicCoursesData,
				sortCoursesData,
				addNewCourse,
				removeCourse,
				updateCoursePublishing,
				updateCourse,
				fetchCourses,
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
