import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { QuestionInterface } from '../interfaces/question';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuestionType } from '../interfaces/questionTypes';

interface QuestionsContextTypes {
	sortedQuestionsData: QuestionInterface[];
	sortQuestionsData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => void;
	addNewQuestion: (newQuestion: any) => void;
	removeQuestion: (id: string) => void;
	updateQuestion: (question: QuestionInterface) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	questionTypes: QuestionType[];
}

interface QuestionsContextProviderProps {
	children: ReactNode;
}

export const QuestionsContext = createContext<QuestionsContextTypes>({
	sortedQuestionsData: [],
	sortQuestionsData: () => {},
	addNewQuestion: () => {},
	removeQuestion: () => {},
	updateQuestion: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
	questionTypes: [],
});

const QuestionsContextProvider = (props: QuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedQuestionsData, setSortedQuestionsData] = useState<QuestionInterface[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const { data, isLoading, isError } = useQuery(
		['allQuestions', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			try {
				const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${pageNumber}`);

				const questionTypeResponse = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);

				setQuestionTypes(questionTypeResponse.data.data);

				// Initial sorting when fetching data
				const sortedDataCopy = [...response.data.data].sort((a: QuestionInterface, b: QuestionInterface) => b.updatedAt.localeCompare(a.updatedAt));
				setSortedQuestionsData(sortedDataCopy);
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
	const sortQuestionsData = (property: keyof QuestionInterface, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedQuestionsData].sort((a: QuestionInterface, b: QuestionInterface) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedQuestionsData(sortedDataCopy);
	};
	// Function to update sortedQuestionsData with new course data
	const addNewQuestion = (newQuestion: any) => {
		setSortedQuestionsData((prevSortedData) => [newQuestion, ...prevSortedData]);
	};

	const updateQuestion = (updatedQuestion: QuestionInterface) => {
		const updatedUserList = sortedQuestionsData?.map((question) => {
			if (updatedQuestion._id === question._id) {
				return updatedQuestion;
			}
			return question;
		});
		setSortedQuestionsData(updatedUserList);
	};

	const removeQuestion = (id: string) => {
		setSortedQuestionsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
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
				sortedQuestionsData,
				sortQuestionsData,
				addNewQuestion,
				removeQuestion,
				updateQuestion,
				numberOfPages,
				pageNumber,
				setPageNumber,
				questionTypes,
			}}>
			{props.children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
