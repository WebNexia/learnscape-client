import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';

interface QuizSubmissionsContextTypes {
	sortedQuizSubmissionsData: QuizSubmission[];
	sortQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	addNewQuizSubmission: (newQuizSubmission: any) => void;
	updateQuizSubmissionPublishing: (id: string) => void;
	removeQuizSubmission: (id: string) => void;
	updateQuizSubmissions: (singleQuizSubmission: QuizSubmission) => void;
	numberOfPages: number;
	quizSubmissionsPageNumber: number;
	setQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchQuizSubmissions: (page: number) => void;
}

interface QuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const QuizSubmissionsContext = createContext<QuizSubmissionsContextTypes>({
	sortedQuizSubmissionsData: [],
	sortQuizSubmissionsData: () => {},
	addNewQuizSubmission: () => {},
	updateQuizSubmissionPublishing: () => {},
	removeQuizSubmission: () => {},
	updateQuizSubmissions: () => {},
	numberOfPages: 1,
	quizSubmissionsPageNumber: 1,
	setQuizSubmissionsPageNumber: () => {},
	fetchQuizSubmissions: () => {},
});

const QuizSubmissionsContextProvider = (props: QuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedQuizSubmissionsData, setSortedQuizSubmissionsData] = useState<QuizSubmission[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [quizSubmissionsPageNumber, setQuizSubmissionsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchQuizSubmissions = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=100`);

			// Initial sorting when fetching data
			const sortedQuizSubmissionsDataCopy = [...response.data.data].sort((a: QuizSubmission, b: QuizSubmission) =>
				b.updatedAt.localeCompare(a.updatedAt)
			);
			setSortedQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(
		['allQuizSubmissions', orgId, quizSubmissionsPageNumber],
		() => fetchQuizSubmissions(quizSubmissionsPageNumber),
		{
			enabled: !!orgId && !isLoaded,
		}
	);

	// Function to handle sorting
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
	// Function to update sortedQuizSubmissionsData with new submission data
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

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<QuizSubmissionsContext.Provider
			value={{
				sortedQuizSubmissionsData,
				sortQuizSubmissionsData,
				addNewQuizSubmission,
				removeQuizSubmission,
				updateQuizSubmissionPublishing,
				updateQuizSubmissions,
				numberOfPages,
				quizSubmissionsPageNumber,
				setQuizSubmissionsPageNumber,
				fetchQuizSubmissions,
			}}>
			{props.children}
		</QuizSubmissionsContext.Provider>
	);
};

export default QuizSubmissionsContextProvider;
