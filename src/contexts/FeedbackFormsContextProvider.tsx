import { ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import { feedbackFormsService } from '../services/feedbackFormsService';
import { FeedbackForm } from '../interfaces/feedbackForm';
import { FeedbackFormTemplate } from '../interfaces/feedbackFormTemplate';
import { FeedbackFormSubmission } from '../interfaces/feedbackFormSubmission';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { Roles } from '../interfaces/enums';

interface FeedbackFormsContextTypes {
	// Forms
	forms: FeedbackForm[];
	formsLoading: boolean;
	formsError: string | null;
	fetchForms: (courseId?: string) => Promise<void>;
	fetchMoreForms: (startPage: number, endPage: number) => Promise<void>;
	formsPageNumber: number;
	setFormsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	enableFormsFetch: () => void;
	disableFormsFetch: () => void;
	createForm: (formData: Partial<FeedbackForm>) => Promise<FeedbackForm>;
	updateForm: (id: string, formData: Partial<FeedbackForm>) => Promise<FeedbackForm>;
	deleteForm: (id: string) => Promise<void>;
	publishForm: (id: string) => Promise<FeedbackForm>;
	unpublishForm: (id: string) => Promise<FeedbackForm>;
	duplicateForm: (id: string) => Promise<FeedbackForm>;

	// Templates
	templates: FeedbackFormTemplate[];
	templatesLoading: boolean;
	templatesError: string | null;
	fetchTemplates: (category?: string) => Promise<void>;
	createTemplate: (templateData: Partial<FeedbackFormTemplate>) => Promise<FeedbackFormTemplate>;
	updateTemplate: (id: string, templateData: Partial<FeedbackFormTemplate>) => Promise<FeedbackFormTemplate>;
	deleteTemplate: (id: string) => Promise<void>;
	createFormFromTemplate: (templateId: string, formData: any) => Promise<FeedbackForm>;

	// Submissions
	getFormSubmissions: (formId: string) => Promise<FeedbackFormSubmission[]>;
	getSubmissionById: (submissionId: string) => Promise<FeedbackFormSubmission>;
	deleteSubmission: (submissionId: string) => Promise<void>;
	exportSubmissions: (formId: string) => Promise<Blob>;
	getFormAnalytics: (formId: string) => Promise<any>;
}

interface FeedbackFormsContextProviderProps {
	children: ReactNode;
}

export const FeedbackFormsContext = createContext<FeedbackFormsContextTypes>({
	// Forms
	forms: [],
	formsLoading: false,
	formsError: null,
	fetchForms: async () => {},
	fetchMoreForms: async () => {},
	formsPageNumber: 1,
	setFormsPageNumber: () => {},
	totalItems: 0,
	loadedPages: [],
	enableFormsFetch: () => {},
	disableFormsFetch: () => {},
	createForm: async () => ({}) as FeedbackForm,
	updateForm: async () => ({}) as FeedbackForm,
	deleteForm: async () => {},
	publishForm: async () => ({}) as FeedbackForm,
	unpublishForm: async () => ({}) as FeedbackForm,
	duplicateForm: async () => ({}) as FeedbackForm,

	// Templates
	templates: [],
	templatesLoading: false,
	templatesError: null,
	fetchTemplates: async () => {},
	createTemplate: async () => ({}) as FeedbackFormTemplate,
	updateTemplate: async () => ({}) as FeedbackFormTemplate,
	deleteTemplate: async () => {},
	createFormFromTemplate: async () => ({}) as FeedbackForm,

	// Submissions
	getFormSubmissions: async () => [],
	getSubmissionById: async () => ({}) as FeedbackFormSubmission,
	deleteSubmission: async () => {},
	exportSubmissions: async () => new Blob(),
	getFormAnalytics: async () => ({}),
});

const FeedbackFormsContextProvider = ({ children }: FeedbackFormsContextProviderProps) => {
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();
	const queryClient = useQueryClient();
	const [currentCourseId, setCurrentCourseId] = useState<string | undefined>();
	const [isFormsEnabled, setIsFormsEnabled] = useState<boolean>(true);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	// Build base URL for forms - support both all forms and course-specific forms
	// Include orgId in baseUrl, courseId will be added if present
	// The hook will append page and limit query params
	const formsBaseUrl = useMemo(() => {
		if (!orgId) return `${base_url}/feedback-forms`;
		let url = `${base_url}/feedback-forms?orgId=${orgId}`;
		if (currentCourseId) {
			url += `&courseId=${currentCourseId}`;
		}
		return url;
	}, [orgId, currentCourseId, base_url]);

	// Forms Query using usePaginatedEntity (like CoursesContextProvider)
	const {
		data: forms = [],
		isLoading: formsLoading,
		isError: formsError,
		fetchEntities: fetchFormsEntities,
		fetchMoreEntities: fetchMoreForms,
		pageNumber: formsPageNumber,
		setPageNumber: setFormsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<FeedbackForm>({
		orgId,
		baseUrl: formsBaseUrl,
		entityKey: currentCourseId ? `feedbackForms-${currentCourseId}` : 'feedbackForms',
		enabled: isFormsEnabled && !!orgId && isAuthenticated && hasAdminAccess && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enableFormsFetch = () => setIsFormsEnabled(true);
	const disableFormsFetch = () => setIsFormsEnabled(false);

	// Refetch when currentCourseId changes (entityKey changes will trigger new query)
	useEffect(() => {
		if (isFormsEnabled && orgId && isAuthenticated && hasAdminAccess && !isLandingPageRoute) {
			// The query will automatically refetch when entityKey changes (which includes currentCourseId)
			// But we need to ensure the first page is fetched
			if (formsPageNumber === 1 && forms.length === 0) {
				fetchFormsEntities(1);
			}
		}
	}, [currentCourseId, orgId, isFormsEnabled, isAuthenticated, hasAdminAccess, isLandingPageRoute]);

	// Templates Query
	const {
		data: templates = [],
		isLoading: templatesLoading,
		isError: templatesError,
		refetch: refetchTemplates,
	} = useQuery({
		queryKey: ['feedbackFormTemplates', orgId],
		queryFn: () => feedbackFormsService.getAllTemplates(),
		enabled: !!orgId && isAuthenticated && hasAdminAccess && !isLandingPageRoute,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000, // 0 for admins/instructors (always fresh), 5 min for users
		cacheTime: 30 * 60 * 1000, // 30 minutes
		refetchOnWindowFocus: false, // Follow common practice - rely on staleTime and query invalidation
		refetchOnMount: false, // Follow common practice - rely on staleTime and query invalidation
	});

	// Create Form Mutation
	const createFormMutation = useMutation({
		mutationFn: (formData: Partial<FeedbackForm>) => feedbackFormsService.createFeedbackForm(formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackForms'] });
		},
	});

	// Update Form Mutation
	const updateFormMutation = useMutation({
		mutationFn: ({ id, formData }: { id: string; formData: Partial<FeedbackForm> }) => feedbackFormsService.updateFeedbackForm(id, formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackForms'] });
		},
	});

	// Delete Form Mutation
	const deleteFormMutation = useMutation({
		mutationFn: (id: string) => feedbackFormsService.deleteFeedbackForm(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackForms'] });
		},
	});

	// Publish Form Mutation
	const publishFormMutation = useMutation({
		mutationFn: (id: string) => feedbackFormsService.publishFeedbackForm(id),
		onSuccess: () => {
			// Invalidate all feedbackForms queries (both general and course-specific)
			// Using predicate to match any query key that starts with 'feedbackForms'
			queryClient.invalidateQueries({
				predicate: (query) => {
					const queryKey = query.queryKey[0];
					return typeof queryKey === 'string' && queryKey.startsWith('feedbackForms');
				},
			});
		},
	});

	// Unpublish Form Mutation
	const unpublishFormMutation = useMutation({
		mutationFn: (id: string) => feedbackFormsService.unpublishFeedbackForm(id),
		onSuccess: () => {
			// Invalidate all feedbackForms queries (both general and course-specific)
			// Using predicate to match any query key that starts with 'feedbackForms'
			queryClient.invalidateQueries({
				predicate: (query) => {
					const queryKey = query.queryKey[0];
					return typeof queryKey === 'string' && queryKey.startsWith('feedbackForms');
				},
			});
		},
	});

	// Duplicate Form Mutation
	const duplicateFormMutation = useMutation({
		mutationFn: (id: string) => feedbackFormsService.duplicateFeedbackForm(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackForms'] });
		},
	});

	// Create Template Mutation
	const createTemplateMutation = useMutation({
		mutationFn: (templateData: Partial<FeedbackFormTemplate>) => feedbackFormsService.createTemplate(templateData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackFormTemplates'] });
		},
	});

	// Update Template Mutation
	const updateTemplateMutation = useMutation({
		mutationFn: ({ id, templateData }: { id: string; templateData: Partial<FeedbackFormTemplate> }) =>
			feedbackFormsService.updateTemplate(id, templateData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackFormTemplates'] });
		},
	});

	// Delete Template Mutation
	const deleteTemplateMutation = useMutation({
		mutationFn: (id: string) => feedbackFormsService.deleteTemplate(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackFormTemplates'] });
		},
	});

	// Create Form From Template Mutation
	const createFormFromTemplateMutation = useMutation({
		mutationFn: ({ templateId, formData }: { templateId: string; formData: any }) =>
			feedbackFormsService.createFormFromTemplate(templateId, formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['feedbackForms'] });
		},
	});

	// Wrapper functions
	const fetchForms = async (courseId?: string) => {
		if (courseId !== currentCourseId) {
			setCurrentCourseId(courseId);
			// Query will automatically refetch when currentCourseId changes
		}
		// If no courseId provided, fetch all forms (currentCourseId will be undefined)
		if (!courseId && currentCourseId !== undefined) {
			setCurrentCourseId(undefined);
		}
	};

	const fetchTemplates = async (category?: string) => {
		// For now, we fetch all templates. Category filtering can be added later if needed.
		await refetchTemplates();
	};

	return (
		<FeedbackFormsContext.Provider
			value={{
				// Forms
				forms,
				formsLoading: formsLoading || (isFormsEnabled && !forms),
				formsError: formsError ? 'Failed to fetch forms' : null,
				fetchForms,
				fetchMoreForms,
				formsPageNumber,
				setFormsPageNumber,
				totalItems,
				loadedPages,
				enableFormsFetch,
				disableFormsFetch,
				createForm: createFormMutation.mutateAsync,
				updateForm: (id, formData) => updateFormMutation.mutateAsync({ id, formData }),
				deleteForm: deleteFormMutation.mutateAsync,
				publishForm: publishFormMutation.mutateAsync,
				unpublishForm: unpublishFormMutation.mutateAsync,
				duplicateForm: duplicateFormMutation.mutateAsync,

				// Templates
				templates,
				templatesLoading,
				templatesError: templatesError ? 'Failed to fetch templates' : null,
				fetchTemplates,
				createTemplate: createTemplateMutation.mutateAsync,
				updateTemplate: (id, templateData) => updateTemplateMutation.mutateAsync({ id, templateData }),
				deleteTemplate: deleteTemplateMutation.mutateAsync,
				createFormFromTemplate: (templateId, formData) => createFormFromTemplateMutation.mutateAsync({ templateId, formData }),

				// Submissions
				getFormSubmissions: feedbackFormsService.getFormSubmissions,
				getSubmissionById: feedbackFormsService.getSubmissionById,
				deleteSubmission: feedbackFormsService.deleteSubmission,
				exportSubmissions: feedbackFormsService.exportSubmissions,
				getFormAnalytics: feedbackFormsService.getFormAnalytics,
			}}>
			<DataFetchErrorBoundary context='Feedback Forms'>{children}</DataFetchErrorBoundary>
		</FeedbackFormsContext.Provider>
	);
};

export default FeedbackFormsContextProvider;
