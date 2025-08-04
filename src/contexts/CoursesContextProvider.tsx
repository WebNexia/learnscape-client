import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { SingleCourse } from '../interfaces/course';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface CoursesContextTypes {
	courses: SingleCourse[];
	sortedPublicCoursesData: SingleCourse[];
	loading: boolean;
	error: string | null;
	fetchCourses: (page: number) => Promise<void>;
	fetchMoreCourses: (startPage: number, endPage: number) => Promise<void>;
	refreshData: () => void;
	sortCoursesData: (property: keyof SingleCourse, order: 'asc' | 'desc') => void;
	addNewCourse: (newCourse: any) => void;
	updateCoursePublishing: (id: string) => void;
	removeCourse: (id: string) => void;
	updateCourse: (singleCourse: SingleCourse) => void;
	numberOfPages: number;
	coursesPageNumber: number;
	setCoursesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
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
	courses: [],
	sortedPublicCoursesData: [],
	loading: false,
	error: null,
	fetchCourses: async () => {},
	fetchMoreCourses: async () => {},
	refreshData: () => {},
	sortCoursesData: () => {},
	addNewCourse: () => {},
	updateCoursePublishing: () => {},
	removeCourse: () => {},
	updateCourse: () => {},
	numberOfPages: 1,
	coursesPageNumber: 1,
	setCoursesPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
	fetchPublicCourses: () => {},
	totalNumberOfEnrolledLearners: 1,
	totalCourses: 1,
	coursesSummary: [],
});

const CoursesContextProvider = (props: CoursesContextProviderProps) => {
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

	const [courses, setCourses] = useState<SingleCourse[]>([]);
	const [sortedPublicCoursesData, setSortedPublicCoursesData] = useState<SingleCourse[]>([]);

	const [totalNumberOfEnrolledLearners, setTotalNumberOfEnrolledLearners] = useState<number>(1);
	const [totalCourses, setTotalCourses] = useState<number>(1);
	const [coursesSummary, setCoursesSummary] = useState<CourseSummary[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [coursesPageNumber, setCoursesPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const fetchCourses = async (page: number = 1) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=150`);

			const coursesData = response.data.data;
			setCourses(coursesData);
			setTotalItems(response.data.pagination.totalItems);
			setNumberOfPages(response.data.pagination.totalPages);
			setLoadedPages([page]);
			setIsLoaded(true);
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreCourses = async (startPage: number, endPage: number) => {
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
			let newCourses: SingleCourse[] = [];
			for (const page of pagesToFetch) {
				const response = await axios.get(`${base_url}/courses/organisation/${orgId}?page=${page}&limit=150`);
				newCourses = [...newCourses, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...courses, ...newCourses];
			const uniqueData = combinedData.filter((course, index, self) => index === self.findIndex((c) => c._id === course._id));
			const sortedData = uniqueData.sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
			setCourses(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more courses:', error);
		}
	};

	const { isLoading, isError } = useQuery(['allCourses', orgId, coursesPageNumber], () => fetchCourses(coursesPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLoaded && !isLandingPageRoute,
	});

	const fetchPublicCourses = async () => {
		try {
			const response = await axios.get(`${base_url}/courses/public`);
			const sortedDataCopy = [...response.data.data].sort((a: SingleCourse, b: SingleCourse) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedPublicCoursesData(sortedDataCopy);
			return response.data.data;
		} catch (error) {
			throw error;
		}
	};

	const { data: publicCourses } = useQuery(['allPublicCourses'], fetchPublicCourses, {
		enabled: isLandingPageRoute,
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
	} = useQuery(['coursesSummary', orgId], () => fetchCoursesDashboardSummary(), {
		enabled: !!orgId && !isLoaded && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortCoursesData = (property: keyof SingleCourse, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...courses].sort((a: SingleCourse, b: SingleCourse) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setCourses(sortedDataCopy);
	};
	// Function to update courses with new course data
	const addNewCourse = (newCourse: any) => {
		setCourses((prevCourses) => [newCourse, ...prevCourses]);
	};

	const updateCoursePublishing = (id: string) => {
		const updatedCourseList = courses?.map((course) => {
			if (course._id === id) {
				return { ...course, isActive: !course.isActive };
			}
			return course;
		});
		setCourses(updatedCourseList);
	};

	const updateCourse = (singleCourse: SingleCourse) => {
		const updatedCourseList = courses?.map((course) => {
			if (singleCourse._id === course._id) {
				return singleCourse;
			}
			return course;
		});
		setCourses(updatedCourseList);
	};

	const removeCourse = (id: string) => {
		setCourses((prevCourses) => prevCourses?.filter((data) => data._id !== id));
	};

	const refreshData = () => {
		setIsLoaded(false);
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
				courses,
				sortedPublicCoursesData,
				loading: isLoading,
				error: isError ? 'Failed to fetch courses' : null,
				fetchCourses,
				fetchMoreCourses,
				refreshData,
				sortCoursesData,
				addNewCourse,
				removeCourse,
				updateCoursePublishing,
				updateCourse,
				numberOfPages,
				coursesPageNumber,
				setCoursesPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
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
