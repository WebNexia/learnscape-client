import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { QuestionInterface } from '../interfaces/question';
import { QuestionType } from '../interfaces/questionTypes';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import axios from '@utils/axiosInstance';
import { useQuery } from 'react-query';

interface QuestionsContextTypes {
	questions: QuestionInterface[];
	loading: boolean;
	error: string | null;
	fetchQuestions: (page?: number) => Promise<QuestionInterface[]>;
	fetchMoreQuestions: (startPage: number, endPage: number) => Promise<void>;
	sortQuestionsData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => QuestionInterface[];
	addNewQuestion: (newQuestion: QuestionInterface) => void;
	updateQuestion: (question: QuestionInterface) => void;
	removeQuestion: (id: string) => void;
	questionsPageNumber: number;
	setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	questionTypes: QuestionType[];
	fetchQuestionTypeName: (question: QuestionInterface) => string;
	enableQuestionsFetch: () => void;
	disableQuestionsFetch: () => void;
}

interface QuestionsContextProviderProps {
	children: ReactNode;
}

export const QuestionsContext = createContext<QuestionsContextTypes>({} as QuestionsContextTypes);

const QuestionsContextProvider = ({ children }: QuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	// ✅ hook for paginated questions
	const {
		data: questions,
		isLoading,
		isError,
		fetchEntities: fetchQuestions,
		fetchMoreEntities: fetchMoreQuestions,
		addEntity: addNewQuestion,
		updateEntity: updateQuestion,
		removeEntity: removeQuestion,
		sortEntities: sortQuestionsData,
		pageNumber: questionsPageNumber,
		setPageNumber: setQuestionsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<QuestionInterface>({
		orgId,
		baseUrl: isInstructor ? `${base_url}/questions/organisation/${orgId}/instructor` : `${base_url}/questions/organisation/${orgId}`,
		entityKey: isInstructor ? 'instructorQuestions' : 'allQuestions',
		enabled: isEnabled && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	// ✅ fetch question types separately
	const fetchQuestionTypes = async (): Promise<QuestionType[]> => {
		if (!orgId) return [];
		const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
		return response.data.data;
	};

	const { data: questionTypesData } = useQuery(['allQuestionTypes', orgId], fetchQuestionTypes, {
		enabled: !!orgId && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute && isEnabled,
		staleTime: 60 * 60 * 1000,
		cacheTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const fetchQuestionTypeName = (question: QuestionInterface): string => {
		const filteredQuestionType = questionTypesData?.filter((type: any) => {
			if (question !== null) {
				return type._id === question?.questionType || type.name === question?.questionType;
			}
		});
		let questionTypeName: string = '';
		if (filteredQuestionType && filteredQuestionType && filteredQuestionType.length !== 0) {
			questionTypeName = filteredQuestionType[0].name;
		}
		return questionTypeName;
	};

	const enableQuestionsFetch = () => setIsEnabled(true);
	const disableQuestionsFetch = () => setIsEnabled(false);

	return (
		<QuestionsContext.Provider
			value={{
				questions,
				loading: isLoading || (isEnabled && !questions),
				error: isError ? 'Failed to fetch questions' : null,
				fetchQuestions,
				fetchMoreQuestions,
				addNewQuestion,
				updateQuestion,
				removeQuestion,
				sortQuestionsData,
				questionsPageNumber,
				setQuestionsPageNumber,
				totalItems,
				loadedPages,
				questionTypes: questionTypesData || [],
				fetchQuestionTypeName,
				enableQuestionsFetch,
				disableQuestionsFetch,
			}}>
			<DataFetchErrorBoundary context='Questions'>{children}</DataFetchErrorBoundary>
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;
