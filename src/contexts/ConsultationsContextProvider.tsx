import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { Consultation } from '../interfaces/consultation';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface ConsultationsContextTypes {
	consultations: Consultation[];
	loading: boolean;
	error: string | null;
	fetchConsultations: (page?: number) => Promise<Consultation[]>;
	fetchMoreConsultations: (startPage: number, endPage: number) => Promise<void>;
	sortConsultationsData: (property: keyof Consultation, order: 'asc' | 'desc') => Consultation[];
	addNewConsultation: (newConsultation: Consultation) => void;
	updateConsultationActive: (id: string) => void;
	removeConsultation: (id: string) => void;
	updateConsultation: (consultation: Consultation) => void;
	consultationsPageNumber: number;
	setConsultationsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	enableConsultationsFetch: () => void;
	disableConsultationsFetch: () => void;
	hasMore: boolean;
	loadMore: () => Promise<void>;
}

interface ConsultationsContextProviderProps {
	children: ReactNode;
}

export const ConsultationsContext = createContext<ConsultationsContextTypes>({
	consultations: [],
	loading: true,
	error: null,
	fetchConsultations: async () => [],
	fetchMoreConsultations: async () => {},
	sortConsultationsData: () => [],
	addNewConsultation: () => {},
	updateConsultationActive: () => {},
	removeConsultation: () => {},
	updateConsultation: () => {},
	consultationsPageNumber: 1,
	setConsultationsPageNumber: () => {},
	totalItems: 0,
	loadedPages: [],
	enableConsultationsFetch: () => {},
	disableConsultationsFetch: () => {},
	hasMore: false,
	loadMore: async () => {},
});

const ConsultationsContextProvider = ({ children }: ConsultationsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();
	// Lazy: edit, slots and appointments routes fetch their specific consultation directly.
	const [isEnabled, setIsEnabled] = useState<boolean>(false);

	const baseEndpoint = `/consultations/organisation/${orgId}`;

	const {
		data: consultations,
		isLoading,
		isError,
		fetchEntities: fetchConsultations,
		fetchMoreEntities: fetchMoreConsultations,
		addEntity: addNewConsultation,
		updateEntity,
		toggleEntityActive,
		removeEntity: removeConsultation,
		sortEntities: sortConsultationsData,
		pageNumber: consultationsPageNumber,
		setPageNumber: setConsultationsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Consultation>({
		orgId,
		baseUrl: `${base_url}${baseEndpoint}`,
		entityKey: 'allConsultations',
		enabled: isEnabled && isAuthenticated && hasAdminAccess && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: 0,
		limit: 100,
		cacheTime: 30 * 60 * 1000,
		disableAutoGapFill: true,
	});

	const enableConsultationsFetch = useCallback(() => setIsEnabled(true), []);
	const disableConsultationsFetch = useCallback(() => setIsEnabled(false), []);

	// Calculate if there are more consultations to load
	const hasMore = consultations && totalItems > consultations.length;

	// Load more consultations function
	const loadMore = async () => {
		if (!hasMore || isLoading) return;

		const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
		const nextPage = currentLoadedPages + 1;

		await fetchMoreConsultations(nextPage, nextPage);
	};

	return (
		<ConsultationsContext.Provider
			value={{
				consultations,
				loading: isLoading || (isEnabled && !consultations),
				error: isError ? 'Failed to fetch consultations' : null,
				fetchConsultations,
				fetchMoreConsultations,
				sortConsultationsData,
				addNewConsultation,
				removeConsultation,
				updateConsultationActive: toggleEntityActive,
				updateConsultation: updateEntity,
				consultationsPageNumber,
				setConsultationsPageNumber,
				totalItems,
				loadedPages,
				enableConsultationsFetch,
				disableConsultationsFetch,
				hasMore,
				loadMore,
			}}>
			<DataFetchErrorBoundary context='Consultations'>{children}</DataFetchErrorBoundary>
		</ConsultationsContext.Provider>
	);
};

export default ConsultationsContextProvider;
