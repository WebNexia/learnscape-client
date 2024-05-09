import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
import { QuestionInterface } from '../interfaces/question';
import { OrganisationContext } from './OrganisationContextProvider';

interface QuestionsContextTypes {
	data: QuestionInterface[];
	sortedQuestionData: QuestionInterface[];
	sortQuestionData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => void;
	setSortedQuestionData: React.Dispatch<React.SetStateAction<QuestionInterface[]>>;
	addNewQuestion: (newQuestion: any) => void;
	removeQuestion: (id: string) => void;
	updateQuestion: (question: QuestionInterface) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface QuestionContextProviderProps {
	children: ReactNode;
}

export const QuestionsContext = createContext<QuestionsContextTypes>({
	data: [],
	sortedQuestionData: [],
	sortQuestionData: () => {},
	setSortedQuestionData: () => {},
	addNewQuestion: () => {},
	removeQuestion: () => {},
	updateQuestion: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
});

const QuestionsContextProvider = (props: QuestionContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedQuestionData, setSortedQuestionData] = useState<QuestionInterface[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const { data, isLoading, isError } = useQuery(
		['allQuestions', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: QuestionInterface, b: QuestionInterface) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedQuestionData(sortedDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		},
		{
			enabled: !!orgId, // Enable the query only when orgId is available
			// keepPreviousData: true, // Keep previous data while fetching new data
		}
	);

	// Function to handle sorting
	const sortQuestionData = (property: keyof QuestionInterface, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedQuestionData].sort((a: QuestionInterface, b: QuestionInterface) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedQuestionData(sortedDataCopy);
	};
	// Function to update sortedQuestionData with new course data
	const addNewQuestion = (newUser: any) => {
		setSortedQuestionData((prevSortedData) => [newUser, ...prevSortedData]);
	};

	const updateQuestion = (updatedQuestion: QuestionInterface) => {
		const updatedUserList = sortedQuestionData?.map((question) => {
			if (updatedQuestion._id === question._id) {
				return updatedQuestion;
			}
			return question;
		});
		setSortedQuestionData(updatedUserList);
	};

	const removeQuestion = (id: string) => {
		setSortedQuestionData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<QuestionsContext.Provider
			value={{
				data,
				sortedQuestionData,
				sortQuestionData,
				setSortedQuestionData,
				addNewQuestion,
				removeQuestion,
				updateQuestion,
				numberOfPages,
				pageNumber,
				setPageNumber,
			}}>
			{props.children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
