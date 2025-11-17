import { createContext, ReactNode, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useAuth } from '../hooks/useAuth';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { Roles } from '../interfaces/enums';
import { UserAuthContext } from './UserAuthContextProvider';

interface AdminQuizSubmissionsContextTypes {
	quizSubmissions: QuizSubmission[];
	loading: boolean;
	error: string | null;
	sortQuizSubmissions: (property: keyof QuizSubmission, order: 'asc' | 'desc') => QuizSubmission[];
	addNewQuizSubmission: (newQuizSubmission: QuizSubmission) => void;
	updateQuizSubmissionPublishing: (id: string) => void;
	updateQuizSubmissions: (singleQuizSubmission: QuizSubmission) => void;
	removeQuizSubmission: (id: string) => void;
	totalItems: number;
	loadedPages: number[];
	quizSubmissionsPageNumber: number;
	setQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchQuizSubmissions: (page?: number) => Promise<QuizSubmission[]>;
	fetchMoreQuizSubmissions: (startPage: number, endPage: number) => Promise<void>;
	enableAdminQuizSubmissionsFetch: () => void;
	disableAdminQuizSubmissionsFetch: () => void;
}

interface AdminQuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const AdminQuizSubmissionsContext = createContext<AdminQuizSubmissionsContextTypes>({} as AdminQuizSubmissionsContextTypes);

const AdminQuizSubmissionsContextProvider = ({ children }: AdminQuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();
	const { user } = useContext(UserAuthContext);
	const location = useLocation();

	const isAdminRoute = location.pathname.startsWith('/admin');
	const isInstructorRoute = location.pathname.startsWith('/instructor');
	const isInstructor = user?.role === 'instructor';

	// Lazy loading state
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	// Determine the correct API endpoint based on user role
	const getApiEndpoint = () => {
		if (isInstructor) {
			return `${base_url}/quizsubmissions/instructor/organisation/${orgId}`;
		}
		return `${base_url}/quizsubmissions/organisation/${orgId}`;
	};

	const {
		data: quizSubmissions,
		isLoading,
		isError,
		sortEntities: sortQuizSubmissions,
		addEntity: addNewQuizSubmission,
		updateEntity: updateQuizSubmissions,
		removeEntity: removeQuizSubmission,
		pageNumber: quizSubmissionsPageNumber,
		setPageNumber: setQuizSubmissionsPageNumber,
		totalItems,
		loadedPages,
		fetchEntities: fetchQuizSubmissions,
		fetchMoreEntities: fetchMoreQuizSubmissions,
	} = usePaginatedEntity<QuizSubmission>({
		orgId,
		baseUrl: getApiEndpoint(),
		entityKey: 'allAdminQuizSubmissions',
		enabled: isEnabled && isAuthenticated && (hasAdminAccess || isInstructor) && (isAdminRoute || isInstructorRoute),
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const updateQuizSubmissionPublishing = (id: string) => {
		const submission = quizSubmissions?.find((s: QuizSubmission) => s._id === id);
		if (submission) {
			updateQuizSubmissions({
				...submission,
				isChecked: !submission.isChecked,
			});
		}
	};

	const enableAdminQuizSubmissionsFetch = () => setIsEnabled(true);
	const disableAdminQuizSubmissionsFetch = () => setIsEnabled(false);

	return (
		<AdminQuizSubmissionsContext.Provider
			value={{
				quizSubmissions,
				loading: isLoading || (isEnabled && !quizSubmissions),
				error: isError ? 'Failed to fetch quiz submissions' : null,
				sortQuizSubmissions,
				addNewQuizSubmission,
				updateQuizSubmissionPublishing,
				updateQuizSubmissions,
				removeQuizSubmission,
				totalItems,
				loadedPages,
				quizSubmissionsPageNumber,
				setQuizSubmissionsPageNumber,
				fetchQuizSubmissions,
				fetchMoreQuizSubmissions,
				enableAdminQuizSubmissionsFetch,
				disableAdminQuizSubmissionsFetch,
			}}>
			{children}
		</AdminQuizSubmissionsContext.Provider>
	);
};

export default AdminQuizSubmissionsContextProvider;
