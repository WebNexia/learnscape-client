import { createContext, ReactNode, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { UserSubscription } from '../interfaces/subscription';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { UserAuthContext } from './UserAuthContextProvider';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface SubscriptionsContextTypes {
	subscriptions: UserSubscription[];
	loading: boolean;
	error: string | null;
	sortSubscriptions: (property: keyof UserSubscription, order: 'asc' | 'desc') => UserSubscription[];
	totalItems: number;
	loadedPages: number[];
	subscriptionsPageNumber: number;
	setSubscriptionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchSubscriptions: (page?: number) => Promise<UserSubscription[]>;
	fetchMoreSubscriptions: (startPage: number, endPage: number) => Promise<void>;
	removeSubscription: (id: string) => void;
	updateSubscription: (updatedSubscription: UserSubscription) => void;
	enableSubscriptionsFetch: () => void;
	disableSubscriptionsFetch: () => void;
}

interface SubscriptionsContextProviderProps {
	children: ReactNode;
}

export const SubscriptionsContext = createContext<SubscriptionsContextTypes>({} as SubscriptionsContextTypes);

const SubscriptionsContextProvider = ({ children }: SubscriptionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, canAccessPayments } = useAuth();
	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	// ✅ main hook for subscriptions
	const {
		data: subscriptions,
		isLoading,
		isError,
		sortEntities: sortSubscriptions,
		pageNumber: subscriptionsPageNumber,
		setPageNumber: setSubscriptionsPageNumber,
		totalItems,
		loadedPages,
		fetchEntities: fetchSubscriptions,
		fetchMoreEntities: fetchMoreSubscriptions,
		removeEntity: removeSubscription,
		updateEntity: updateSubscription,
	} = usePaginatedEntity<UserSubscription>({
		orgId,
		baseUrl: `${base_url}/subscriptions/organisation/${orgId}`,
		entityKey: 'allSubscriptions',
		enabled: isEnabled && isAuthenticated && canAccessPayments && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enableSubscriptionsFetch = () => setIsEnabled(true);
	const disableSubscriptionsFetch = () => setIsEnabled(false);

	return (
		<SubscriptionsContext.Provider
			value={{
				subscriptions,
				loading: isLoading || (isEnabled && !subscriptions),
				error: isError ? 'Failed to fetch subscriptions' : null,
				sortSubscriptions,
				totalItems,
				loadedPages,
				subscriptionsPageNumber,
				setSubscriptionsPageNumber,
				fetchSubscriptions,
				fetchMoreSubscriptions,
				removeSubscription,
				updateSubscription,
				enableSubscriptionsFetch,
				disableSubscriptionsFetch,
			}}>
			<DataFetchErrorBoundary context='Subscriptions'>{children}</DataFetchErrorBoundary>
		</SubscriptionsContext.Provider>
	);
};

export default SubscriptionsContextProvider;
