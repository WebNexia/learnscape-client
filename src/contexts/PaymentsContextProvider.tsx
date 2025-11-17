import { createContext, ReactNode, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { Payment } from '../interfaces/payment';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { UserAuthContext } from './UserAuthContextProvider';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface PaymentsContextTypes {
	payments: Payment[];
	loading: boolean;
	error: string | null;
	sortPayments: (property: keyof Payment, order: 'asc' | 'desc') => Payment[];
	totalItems: number;
	loadedPages: number[];
	paymentsPageNumber: number;
	setPaymentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPayments: (page?: number) => Promise<Payment[]>;
	fetchMorePayments: (startPage: number, endPage: number) => Promise<void>;
	enablePaymentsFetch: () => void;
	disablePaymentsFetch: () => void;
}

interface PaymentsContextProviderProps {
	children: ReactNode;
}

export const PaymentsContext = createContext<PaymentsContextTypes>({} as PaymentsContextTypes);

const PaymentsContextProvider = ({ children }: PaymentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, canAccessPayments } = useAuth();
	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	// ✅ main hook for payments
	const {
		data: payments,
		isLoading,
		isError,
		sortEntities: sortPayments,
		pageNumber: paymentsPageNumber,
		setPageNumber: setPaymentsPageNumber,
		totalItems,
		loadedPages,
		fetchEntities: fetchPayments,
		fetchMoreEntities: fetchMorePayments,
	} = usePaginatedEntity<Payment>({
		orgId,
		baseUrl: `${base_url}/payments/organisation/${orgId}`,
		entityKey: 'allPayments',
		enabled: isEnabled && isAuthenticated && canAccessPayments && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enablePaymentsFetch = () => setIsEnabled(true);
	const disablePaymentsFetch = () => setIsEnabled(false);

	return (
		<PaymentsContext.Provider
			value={{
				payments,
				loading: isLoading || (isEnabled && !payments),
				error: isError ? 'Failed to fetch payments' : null,
				sortPayments,
				totalItems,
				loadedPages,
				paymentsPageNumber,
				setPaymentsPageNumber,
				fetchPayments,
				fetchMorePayments,
				enablePaymentsFetch,
				disablePaymentsFetch,
			}}>
			<DataFetchErrorBoundary context='Payments'>{children}</DataFetchErrorBoundary>
		</PaymentsContext.Provider>
	);
};

export default PaymentsContextProvider;
