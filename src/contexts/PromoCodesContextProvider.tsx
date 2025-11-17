import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { PromoCode } from '../interfaces/promoCode';
import { Roles } from '../interfaces/enums';

interface PromoCodesContextTypes {
	promoCodes: PromoCode[];
	loading: boolean;
	error: string | null;
	sortPromoCodesData: (property: keyof PromoCode, order: 'asc' | 'desc') => PromoCode[];
	addNewPromoCode: (newPromoCode: PromoCode) => void;
	removePromoCode: (id: string) => void;
	updatePromoCode: (promoCode: PromoCode) => void;
	totalItems: number;
	loadedPages: number[];
	promoCodesPageNumber: number;
	setPromoCodesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPromoCodes: (page?: number) => Promise<PromoCode[]>;
	fetchMorePromoCodes: (startPage: number, endPage: number) => Promise<void>;
	enablePromoCodesFetch: () => void;
	disablePromoCodesFetch: () => void;
}

interface PromoCodesContextProviderProps {
	children: ReactNode;
}

export const PromoCodesContext = createContext<PromoCodesContextTypes>({} as PromoCodesContextTypes);

const PromoCodesContextProvider = ({ children }: PromoCodesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, canAccessPayments } = useAuth();

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const {
		data: promoCodes,
		isLoading,
		isError,
		sortEntities: sortPromoCodesData,
		addEntity: addNewPromoCode,
		updateEntity: updatePromoCode,
		removeEntity: removePromoCode,
		pageNumber: promoCodesPageNumber,
		setPageNumber: setPromoCodesPageNumber,
		totalItems,
		loadedPages,
		fetchEntities: fetchPromoCodes,
		fetchMoreEntities: fetchMorePromoCodes,
	} = usePaginatedEntity<PromoCode>({
		orgId,
		baseUrl: `${base_url}/promocodes/organisation/${orgId}`,
		entityKey: 'promoCodes',
		enabled: isEnabled && isAuthenticated && canAccessPayments && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enablePromoCodesFetch = () => setIsEnabled(true);
	const disablePromoCodesFetch = () => setIsEnabled(false);

	return (
		<PromoCodesContext.Provider
			value={{
				promoCodes,
				loading: isLoading || (isEnabled && !promoCodes),
				error: isError ? 'Failed to fetch promo codes' : null,
				sortPromoCodesData,
				addNewPromoCode,
				updatePromoCode,
				removePromoCode,
				totalItems,
				loadedPages,
				promoCodesPageNumber,
				setPromoCodesPageNumber,
				fetchPromoCodes,
				fetchMorePromoCodes,
				enablePromoCodesFetch,
				disablePromoCodesFetch,
			}}>
			<DataFetchErrorBoundary context='PromoCodes'>{children}</DataFetchErrorBoundary>
		</PromoCodesContext.Provider>
	);
};

export default PromoCodesContextProvider;
