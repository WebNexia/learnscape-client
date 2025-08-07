import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { QuestionInterface } from '../interfaces/question';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuestionType } from '../interfaces/questionTypes';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface QuestionsContextTypes {
	questions: QuestionInterface[];
	loading: boolean;
	error: string | null;
	fetchQuestions: (page?: number) => void;
	fetchMoreQuestions: (startBatch: number, endBatch: number) => void;
	addNewQuestion: (newQuestion: any) => void;
	removeQuestion: (id: string) => void;
	updateQuestion: (question: QuestionInterface) => void;
	sortQuestionsData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => void;
	totalItems: number;
	loadedPages: number[];
	questionsPageNumber: number;
	setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	questionTypes: QuestionType[];
	fetchQuestionTypeName: (question: QuestionInterface) => string;
}

interface QuestionsContextProviderProps {
	children: ReactNode;
}

export const QuestionsContext = createContext<QuestionsContextTypes>({
	questions: [],
	loading: false,
	error: null,
	fetchQuestions: () => {},
	fetchMoreQuestions: () => {},
	addNewQuestion: () => {},
	removeQuestion: () => {},
	updateQuestion: () => {},
	sortQuestionsData: () => {},
	totalItems: 0,
	loadedPages: [],
	questionsPageNumber: 1,
	setQuestionsPageNumber: () => {},
	questionTypes: [],
	fetchQuestionTypeName: () => '',
});

const QuestionsContextProvider = (props: QuestionsContextProviderProps) => {
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

	const [questions, setQuestions] = useState<QuestionInterface[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [questionsPageNumber, setQuestionsPageNumber] = useState<number>(1);
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

	const fetchQuestions = async (page: number = 1) => {
		if (!orgId) return;

		setLoading(true);
		setError(null);

		try {
			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${page}&limit=500`);

			setQuestions(response.data.data);
			setTotalItems(response.data.totalItems);
			setLoadedPages((prev) => [...prev, page]);
			return response.data.data;
		} catch (error) {
			setError('Failed to fetch questions');
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const fetchMoreQuestions = async (startBatch: number, endBatch: number) => {
		if (!orgId) return;

		setLoading(true);
		setError(null);

		try {
			// Fetch all batches from startBatch to endBatch
			const promises = [];
			for (let batch = startBatch; batch <= endBatch; batch++) {
				promises.push(axios.get(`${base_url}/questions/organisation/${orgId}?page=${batch}&limit=500`));
			}

			const responses = await Promise.all(promises);
			let allQuestions: QuestionInterface[] = [];
			let totalItemsCount = 0;

			responses.forEach((response, index) => {
				allQuestions.push(...response.data.data);
				if (index === 0) {
					totalItemsCount = response.data.totalItems || response.data.data.length;
				}
			});

			setQuestions((prevQuestions) => [...prevQuestions, ...allQuestions]);
			setTotalItems(totalItemsCount);
			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
			return allQuestions;
		} catch (error) {
			setError('Failed to fetch more questions');
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const { isLoading, isError } = useQuery(['allQuestions', orgId], () => fetchQuestions(1), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
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
		const filteredQuestionType = questionTypes?.filter((type) => {
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
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortQuestionsData = (property: keyof QuestionInterface, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...questions].sort((a: QuestionInterface, b: QuestionInterface) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setQuestions(sortedDataCopy);
	};

	// Function to update sortedQuestionsData with new course data
	const addNewQuestion = (newQuestion: any) => {
		setQuestions((prevQuestions) => [newQuestion, ...prevQuestions]);
		setTotalItems((prev) => prev + 1);
	};

	const updateQuestion = (updatedQuestion: QuestionInterface) => {
		const updatedUserList = questions?.map((question) => {
			if (updatedQuestion._id === question._id) {
				return updatedQuestion;
			}
			return question;
		});
		setQuestions(updatedUserList);
	};

	const removeQuestion = (id: string) => {
		setQuestions((prevQuestions) => prevQuestions?.filter((data) => data._id !== id));
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	if (isLoading || allQuestionTypesLoading) {
		return <Loading />;
	}

	if (isError || allQuestionTypesError) {
		return <LoadingError />;
	}

	return (
		<QuestionsContext.Provider
			value={{
				questions,
				loading,
				error,
				fetchQuestions,
				fetchMoreQuestions,
				addNewQuestion,
				removeQuestion,
				updateQuestion,
				sortQuestionsData,
				totalItems,
				loadedPages,
				questionsPageNumber,
				setQuestionsPageNumber,
				questionTypes,
				fetchQuestionTypeName,
			}}>
			{props.children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
