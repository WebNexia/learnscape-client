import { ReactNode, createContext, useContext, useState } from 'react';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

import { Roles } from '../interfaces/enums';

interface LearnerQuizSubmissionsContextTypes {
	userQuizSubmissions: QuizSubmission[];
	sortedUserQuizSubmissionsData: QuizSubmission[];
	sortUserQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => QuizSubmission[];
	totalItems: number;
	loadedPages: number[];
	userSubmissionsPageNumber: number;
	setUserSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchUserQuizSubmissions: (page: number) => Promise<QuizSubmission[]>;
	fetchMoreUserQuizSubmissions: (startBatch: number, endBatch: number) => Promise<void>;
	loading: boolean;
	enableLearnerQuizSubmissionsFetch: () => void; // 👈 New function to enable fetching
	disableLearnerQuizSubmissionsFetch: () => void; // 👈 New function to disable fetching
}

export const LearnerQuizSubmissionsContext = createContext<LearnerQuizSubmissionsContextTypes>({} as LearnerQuizSubmissionsContextTypes);

const LearnerQuizSubmissionsContextProvider = ({ children }: { children: ReactNode }) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, user } = useAuth();
	const location = useLocation();
	const isLearnerRoute = !location.pathname.startsWith('/admin');
	const [userSubmissionsPageNumber, setUserSubmissionsPageNumber] = useState(1);
	const [isEnabled, setIsEnabled] = useState<boolean>(true);

	// 🔹 Use shared paginated entity hook
	const {
		data: userQuizSubmissions,
		isLoading,
		fetchEntities: fetchUserQuizSubmissions,
		fetchMoreEntities: fetchMoreUserQuizSubmissions,
		sortEntities: sortUserQuizSubmissionsData,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<QuizSubmission>({
		orgId,
		baseUrl: `${base_url}/quizsubmissions/user/${user?._id}`,
		entityKey: 'learnerQuizSubmissions',
		enabled: isEnabled && !!orgId && !!user?._id && isAuthenticated && isLearnerRoute,
		role: user?.role as Roles,
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
		limit: 150,
		disableAutoGapFill: true,
	});

	const enableLearnerQuizSubmissionsFetch = () => setIsEnabled(true);
	const disableLearnerQuizSubmissionsFetch = () => setIsEnabled(false);

	return (
		<LearnerQuizSubmissionsContext.Provider
			value={{
				userQuizSubmissions,
				sortedUserQuizSubmissionsData: userQuizSubmissions, // sorted copy on-demand
				sortUserQuizSubmissionsData,
				totalItems,
				loadedPages,
				userSubmissionsPageNumber,
				setUserSubmissionsPageNumber,
				fetchUserQuizSubmissions,
				fetchMoreUserQuizSubmissions,
				loading: isLoading,
				enableLearnerQuizSubmissionsFetch,
				disableLearnerQuizSubmissionsFetch,
			}}>
			{children}
		</LearnerQuizSubmissionsContext.Provider>
	);
};

export default LearnerQuizSubmissionsContextProvider;
