import { createContext, ReactNode, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';

import { Event } from '../interfaces/event';
import { useAuth } from '../hooks/useAuth';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { Roles } from '../interfaces/enums';

interface AdminPublicEventsContextTypes {
	publicEvents: Event[];
	loading: boolean;
	error: string | null;
	fetchPublicEvents: (page?: number) => Promise<Event[]>;
	fetchMorePublicEvents: (startPage: number, endPage: number) => Promise<void>;
	sortPublicEventsData: (property: keyof Event, order: 'asc' | 'desc') => Event[];
	totalItems: number;
	loadedPages: number[];
	publicEventsPageNumber: number;
	setPublicEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	enableAdminPublicEventsFetch: () => void;
	disableAdminPublicEventsFetch: () => void;
}

interface AdminPublicEventsContextProviderProps {
	children: ReactNode;
}

export const AdminPublicEventsContext = createContext<AdminPublicEventsContextTypes>({} as AdminPublicEventsContextTypes);

const AdminPublicEventsContextProvider = ({ children }: AdminPublicEventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();
	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	const {
		data: publicEvents,
		isLoading,
		isError,
		fetchEntities: fetchPublicEvents,
		fetchMoreEntities: fetchMorePublicEvents,
		sortEntities: sortPublicEventsData,
		pageNumber: publicEventsPageNumber,
		setPageNumber: setPublicEventsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Event>({
		orgId,
		baseUrl: `${base_url}/events/public/${orgId}?upcomingOnly=false`,
		entityKey: 'allPublicEvents',
		enabled: isEnabled && isAuthenticated && hasAdminAccess && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enableAdminPublicEventsFetch = () => setIsEnabled(true);
	const disableAdminPublicEventsFetch = () => setIsEnabled(false);

	return (
		<AdminPublicEventsContext.Provider
			value={{
				publicEvents,
				loading: isLoading || (isEnabled && !publicEvents),
				error: isError ? 'Error loading public events' : null,
				fetchPublicEvents,
				fetchMorePublicEvents,
				sortPublicEventsData,
				totalItems,
				loadedPages,
				publicEventsPageNumber,
				setPublicEventsPageNumber,
				enableAdminPublicEventsFetch,
				disableAdminPublicEventsFetch,
			}}>
			<DataFetchErrorBoundary context='AdminPublicEvents'>{children}</DataFetchErrorBoundary>
		</AdminPublicEventsContext.Provider>
	);
};

export default AdminPublicEventsContextProvider;
