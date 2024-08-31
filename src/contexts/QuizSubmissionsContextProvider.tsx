import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useParams } from 'react-router-dom';

interface QuizSubmissionsContextTypes {
	sortedQuizSubmissionsData: QuizSubmission[];
	sortedUserQuizSubmissionsData: QuizSubmission[]; // New state for user-specific submissions
	sortQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	sortUserQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	addNewQuizSubmission: (newQuizSubmission: any) => void;
	updateQuizSubmissionPublishing: (id: string) => void;
	removeQuizSubmission: (id: string) => void;
	updateQuizSubmissions: (singleQuizSubmission: QuizSubmission) => void;
	numberOfPages: number;
	userNumberOfPages: number; // New state for user-specific pagination
	quizSubmissionsPageNumber: number;
	userQuizSubmissionsPageNumber: number; // New state for user-specific page number
	setQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setUserQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>; // New state setter for user-specific page number
	fetchQuizSubmissions: (page: number) => void;
	fetchQuizSubmissionsByUserId: (userId: string, page: number) => void;
}

interface QuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const QuizSubmissionsContext = createContext<QuizSubmissionsContextTypes>({
	sortedQuizSubmissionsData: [],
	sortedUserQuizSubmissionsData: [],
	sortQuizSubmissionsData: () => {},
	sortUserQuizSubmissionsData: () => {},
	addNewQuizSubmission: () => {},
	updateQuizSubmissionPublishing: () => {},
	removeQuizSubmission: () => {},
	updateQuizSubmissions: () => {},
	numberOfPages: 1,
	userNumberOfPages: 1,
	quizSubmissionsPageNumber: 1,
	userQuizSubmissionsPageNumber: 1,
	setQuizSubmissionsPageNumber: () => {},
	setUserQuizSubmissionsPageNumber: () => {},
	fetchQuizSubmissions: () => {},
	fetchQuizSubmissionsByUserId: () => {},
});

const QuizSubmissionsContextProvider = (props: QuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { userId } = useParams<{ userId: string }>();

	const [sortedQuizSubmissionsData, setSortedQuizSubmissionsData] = useState<QuizSubmission[]>([]);
	const [sortedUserQuizSubmissionsData, setSortedUserQuizSubmissionsData] = useState<QuizSubmission[]>([]); // New state for user-specific submissions
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [userNumberOfPages, setUserNumberOfPages] = useState<number>(1); // New state for user-specific pagination
	const [quizSubmissionsPageNumber, setQuizSubmissionsPageNumber] = useState<number>(1);
	const [userQuizSubmissionsPageNumber, setUserQuizSubmissionsPageNumber] = useState<number>(1); // New state for user-specific page number

	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false); // New state for user-specific loading

	const fetchQuizSubmissions = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=100`);
			const sortedQuizSubmissionsDataCopy = [...response.data.data].sort((a: QuizSubmission, b: QuizSubmission) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchQuizSubmissionsByUserId = async (userId: string, page: number): Promise<void> => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/user/${userId}?page=${page}&limit=100`);

			const sortedQuizSubmissionsDataCopy = [...response.data.data].sort((a: QuizSubmission, b: QuizSubmission) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedUserQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
			setUserNumberOfPages(response.data.pages);
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
			enabled: !!orgId && !isLoaded,
		}
	);

	// Use useQuery to fetch quiz submissions by userId
	const {
		data: userData,
		isLoading: isUserLoading,
		isError: isUserError,
	} = useQuery(
		['userQuizSubmissions', orgId, userQuizSubmissionsPageNumber],
		() => fetchQuizSubmissionsByUserId(userId!, userQuizSubmissionsPageNumber), // Pass userId here
		{
			enabled: !!orgId && !!userId && !isUserLoaded, // Ensure userId exists
		}
	);

	const sortQuizSubmissionsData = (property: keyof QuizSubmission, order: 'asc' | 'desc') => {
		const sortedQuizSubmissionsDataCopy = [...sortedQuizSubmissionsData].sort((a: QuizSubmission, b: QuizSubmission) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
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
		setSortedQuizSubmissionsData((prevSortedData) => [newQuizSubmission, ...prevSortedData]);
	};

	const updateQuizSubmissionPublishing = (id: string) => {
		const updatedQuizSubmissionList = sortedQuizSubmissionsData?.map((submission) => {
			if (submission._id === id) {
				return { ...submission, isChecked: !submission.isChecked };
			}
			return submission;
		});
		setSortedQuizSubmissionsData(updatedQuizSubmissionList);
	};

	const updateQuizSubmissions = (singleQuizSubmission: QuizSubmission) => {
		const updatedQuizSubmissionList = sortedQuizSubmissionsData?.map((submission) => {
			if (singleQuizSubmission._id === submission._id) {
				return singleQuizSubmission;
			}
			return submission;
		});
		setSortedQuizSubmissionsData(updatedQuizSubmissionList);
	};

	const removeQuizSubmission = (id: string) => {
		setSortedQuizSubmissionsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
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
				sortedQuizSubmissionsData,
				sortedUserQuizSubmissionsData,
				sortQuizSubmissionsData,
				sortUserQuizSubmissionsData,
				addNewQuizSubmission,
				removeQuizSubmission,
				updateQuizSubmissionPublishing,
				updateQuizSubmissions,
				numberOfPages,
				userNumberOfPages,
				quizSubmissionsPageNumber,
				userQuizSubmissionsPageNumber,
				setQuizSubmissionsPageNumber,
				setUserQuizSubmissionsPageNumber,
				fetchQuizSubmissions,
				fetchQuizSubmissionsByUserId,
			}}>
			{props.children}
		</QuizSubmissionsContext.Provider>
	);
};

export default QuizSubmissionsContextProvider;
