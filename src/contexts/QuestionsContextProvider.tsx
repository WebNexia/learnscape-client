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
	fetchQuestionTypes: () => void;
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
	fetchQuestionTypes: () => {},
	questionTypes: [],
});

const QuestionsContextProvider = (props: QuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedQuestionsData, setSortedQuestionsData] = useState<QuestionInterface[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

	const { data, isLoading, isError } = useQuery(
		['allQuestions', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: QuestionInterface, b: QuestionInterface) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedQuestionsData(sortedDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		},
		{
			enabled: !!orgId,
			// refetchOnMount: false,
			// refetchOnWindowFocus: false,
		}
		// {
		// 	enabled: !!orgId, // Enable the query only when orgId is available
		// keepPreviousData: true, // Keep previous data while fetching new data
		// }
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

	const fetchQuestionTypes = async (): Promise<void> => {
		try {
			const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
			setQuestionTypes(response.data.data);
		} catch (error) {
			console.log(error);
		}
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
				fetchQuestionTypes,
				questionTypes,
			}}>
			{props.children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
