import { createContext, ReactNode, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Inquiry } from '../interfaces/inquiry';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';

interface InquiriesContextTypes {
	inquiries: Inquiry[];
	loading: boolean;
	error: string | null;
	fetchInquiries: (page?: number) => Promise<Inquiry[]>;
	fetchMoreInquiries: (startPage: number, endPage: number) => Promise<void>;
	sortInquiries: (property: keyof Inquiry, order: 'asc' | 'desc') => Inquiry[];
	removeInquiry: (inquiryId: string) => void;
	inquiriesPageNumber: number;
	setInquiriesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	enableInquiriesFetch: () => void;
	disableInquiriesFetch: () => void;
}

interface InquiriesContextProviderProps {
	children: ReactNode;
}

export const InquiriesContext = createContext<InquiriesContextTypes>({} as InquiriesContextTypes);

const InquiriesContextProvider = ({ children }: InquiriesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();

	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const {
		data: inquiries,
		isLoading,
		isError,
		fetchEntities: fetchInquiries,
		fetchMoreEntities: fetchMoreInquiries,
		removeEntity: removeInquiry,
		sortEntities: sortInquiries,
		pageNumber: inquiriesPageNumber,
		setPageNumber: setInquiriesPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Inquiry>({
		orgId,
		baseUrl: `${base_url}/inquiries/organisation/${orgId}`,
		entityKey: 'allInquiries',
		enabled: isEnabled && isAuthenticated && hasAdminAccess && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true, // Disable auto gap-filling - useFilterSearch will handle gap-filling
	});

	const enableInquiriesFetch = () => setIsEnabled(true);
	const disableInquiriesFetch = () => setIsEnabled(false);

	return (
		<InquiriesContext.Provider
			value={{
				inquiries,
				loading: isLoading || (isEnabled && !inquiries),
				error: isError ? 'Failed to fetch inquiries' : null,
				fetchInquiries,
				fetchMoreInquiries,
				sortInquiries,
				removeInquiry,
				inquiriesPageNumber,
				setInquiriesPageNumber,
				totalItems,
				loadedPages,
				enableInquiriesFetch,
				disableInquiriesFetch,
			}}>
			<DataFetchErrorBoundary context='Inquiries'>{children}</DataFetchErrorBoundary>
		</InquiriesContext.Provider>
	);
};

export default InquiriesContextProvider;
