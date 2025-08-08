import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface QuizSubmissionsContextTypes {
	quizSubmissions: QuizSubmission[];
	sortedUserQuizSubmissionsData: QuizSubmission[]; // New state for user-specific submissions
	sortQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	sortUserQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	addNewQuizSubmission: (newQuizSubmission: any) => void;
	updateQuizSubmissionPublishing: (id: string) => void;
	removeQuizSubmission: (id: string) => void;
	updateQuizSubmissions: (singleQuizSubmission: QuizSubmission) => void;
	isUserLoaded: boolean;
	totalItems: number;
	loadedPages: number[];
	quizSubmissionsPageNumber: number;
	setQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchQuizSubmissions: (page: number) => void;
	fetchMoreQuizSubmissions: (startBatch: number, endBatch: number) => void;
	fetchQuizSubmissionsByUserId: (userId: string) => void;
}

interface QuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const QuizSubmissionsContext = createContext<QuizSubmissionsContextTypes>({
	quizSubmissions: [],
	sortedUserQuizSubmissionsData: [],
	sortQuizSubmissionsData: () => {},
	sortUserQuizSubmissionsData: () => {},
	addNewQuizSubmission: () => {},
	updateQuizSubmissionPublishing: () => {},
	removeQuizSubmission: () => {},
	updateQuizSubmissions: () => {},
	isUserLoaded: false,
	totalItems: 0,
	loadedPages: [],
	quizSubmissionsPageNumber: 1,
	setQuizSubmissionsPageNumber: () => {},
	fetchQuizSubmissions: () => {},
	fetchMoreQuizSubmissions: () => {},
	fetchQuizSubmissionsByUserId: () => {},
});

const QuizSubmissionsContextProvider = (props: QuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, user } = useAuth();

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

	const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
	const [sortedUserQuizSubmissionsData, setSortedUserQuizSubmissionsData] = useState<QuizSubmission[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [quizSubmissionsPageNumber, setQuizSubmissionsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);

	const fetchQuizSubmissions = async (page: number = 1) => {
		if (!orgId) return;

		setIsLoaded(false);

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=150`);

			if (page === 1) {
				// First page - replace all data
				setQuizSubmissions(response.data.data);
				setLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setQuizSubmissions((prev) => [...prev, ...response.data.data]);
				setLoadedPages((prev) => [...prev, page]);
			}

			setTotalItems(response.data.totalItems);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreQuizSubmissions = async (startBatch: number, endBatch: number) => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=150`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			setQuizSubmissions((prev) => [...prev, ...allData]);
			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
		} catch (error) {
			console.error('Error fetching more quiz submissions:', error);
			throw error;
		}
	};

	const fetchQuizSubmissionsByUserId = async (): Promise<void> => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/user/${user?._id}`);

			const sortedQuizSubmissionsDataCopy = [...response.data.data].sort((a: QuizSubmission, b: QuizSubmission) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedUserQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
			setIsUserLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsUserLoaded(true);
			throw error;
		}
	};

	// Use useQuery to fetch quiz submissions by orgId (existing functionality)
	const { data, isLoading, isError } = useQuery(
		['allQuizSubmissions', orgId, quizSubmissionsPageNumber],
		() => fetchQuizSubmissions(quizSubmissionsPageNumber),
		{
			enabled: !!orgId && isAuthenticated && !isLoaded && !isLandingPageRoute,
		}
	);

	// Use useQuery to fetch quiz submissions by userId
	const {
		data: userData,
		isLoading: isUserLoading,
		isError: isUserError,
	} = useQuery(
		['userQuizSubmissions', orgId],
		() => fetchQuizSubmissionsByUserId(), // Pass userId here
		{
			enabled: !!orgId && !!user?._id && !isUserLoaded, // Ensure userId exists
		}
	);

	const sortQuizSubmissionsData = (property: keyof QuizSubmission, order: 'asc' | 'desc') => {
		const sortedQuizSubmissionsDataCopy = [...quizSubmissions].sort((a: QuizSubmission, b: QuizSubmission) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setQuizSubmissions(sortedQuizSubmissionsDataCopy);
	};

	const sortUserQuizSubmissionsData = (property: keyof QuizSubmission, order: 'asc' | 'desc') => {
		const sortedQuizSubmissionsDataCopy = [...sortedUserQuizSubmissionsData].sort((a: QuizSubmission, b: QuizSubmission) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedUserQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
	};

	const addNewQuizSubmission = (newQuizSubmission: any) => {
		setQuizSubmissions((prevSortedData) => [newQuizSubmission, ...prevSortedData]);
		setTotalItems((prev) => prev + 1);
	};

	const updateQuizSubmissionPublishing = (id: string) => {
		const updatedQuizSubmissionList = quizSubmissions?.map((submission) => {
			if (submission._id === id) {
				return { ...submission, isChecked: !submission.isChecked };
			}
			return submission;
		});
		setQuizSubmissions(updatedQuizSubmissionList);
	};

	const updateQuizSubmissions = (singleQuizSubmission: QuizSubmission) => {
		const updatedQuizSubmissionList = quizSubmissions?.map((submission) => {
			if (singleQuizSubmission._id === submission._id) {
				return singleQuizSubmission;
			}
			return submission;
		});
		setQuizSubmissions(updatedQuizSubmissionList);
	};

	const removeQuizSubmission = (id: string) => {
		setQuizSubmissions((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	if (isLoading || isUserLoading) {
		return <Loading />;
	}

	if (isError || isUserError) {
		return <LoadingError />;
	}

	return (
		<QuizSubmissionsContext.Provider
			value={{
				quizSubmissions,
				sortedUserQuizSubmissionsData,
				sortQuizSubmissionsData,
				sortUserQuizSubmissionsData,
				addNewQuizSubmission,
				removeQuizSubmission,
				updateQuizSubmissionPublishing,
				updateQuizSubmissions,
				isUserLoaded,
				totalItems,
				loadedPages,
				quizSubmissionsPageNumber,
				setQuizSubmissionsPageNumber,
				fetchQuizSubmissions,
				fetchMoreQuizSubmissions,
				fetchQuizSubmissionsByUserId,
			}}>
			{props.children}
		</QuizSubmissionsContext.Provider>
	);
};

export default QuizSubmissionsContextProvider;
