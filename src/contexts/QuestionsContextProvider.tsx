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
	questionsPageNumber: number;
	setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	questionTypes: QuestionType[];
	fetchQuestions: (page: number) => void;
	fetchQuestionTypeName: (question: QuestionInterface) => string;
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
	questionsPageNumber: 1,
	setQuestionsPageNumber: () => {},
	questionTypes: [],
	fetchQuestions: () => {},
	fetchQuestionTypeName: () => '',
});

const QuestionsContextProvider = (props: QuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedQuestionsData, setSortedQuestionsData] = useState<QuestionInterface[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [questionsPageNumber, setQuestionsPageNumber] = useState<number>(1);
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchQuestions = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${page}&limit=100`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: QuestionInterface, b: QuestionInterface) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedQuestionsData(sortedDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const {
		data: allQuestionsData,
		isLoading: allQuestionsLoading,
		isError: allQuestionsError,
	} = useQuery(['allQuestions', orgId, questionsPageNumber], () => fetchQuestions(questionsPageNumber), {
		enabled: !!orgId && !isLoaded,
	});

	const fetchQuestionTypes = async () => {
		if (!orgId) return;
		try {
			const questionTypeResponse = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);

			setQuestionTypes(questionTypeResponse.data.data);
		} catch (error) {
			throw error;
		}
	};

	const fetchQuestionTypeName = (question: QuestionInterface): string => {
		const filteredQuestionType = questionTypes.filter((type) => {
			if (question !== null) {
				return type._id === question?.questionType || type.name === question?.questionType;
			}
		});
		let questionTypeName: string = '';
		if (filteredQuestionType.length !== 0) {
			questionTypeName = filteredQuestionType[0].name;
		}
		return questionTypeName;
	};

	const {
		data: allQuestionTypesData,
		isLoading: allQuestionTypesLoading,
		isError: allQuestionTypesError,
	} = useQuery('allQuestionTypes', () => fetchQuestionTypes(), {
		enabled: !!orgId && !isLoaded,
	});

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

	if (allQuestionsLoading || allQuestionTypesLoading) {
		return <Loading />;
	}

	if (allQuestionsError || allQuestionTypesError) {
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
				questionsPageNumber,
				setQuestionsPageNumber,
				questionTypes,
				fetchQuestions,
				fetchQuestionTypeName,
			}}>
			{props.children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
