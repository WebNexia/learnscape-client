import { createContext, ReactNode, useState } from 'react';
import { Organisation } from '../interfaces/organisation';
import axios from '@utils/axiosInstance';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { AdminUser } from '../interfaces/user';

interface OrganisationContextTypes {
	organisation?: Organisation;
	fetchOrganisationData: (orgId: string) => Promise<void>;
	setOrgId: React.Dispatch<React.SetStateAction<string>>;
	orgId: string;
	adminUsers: AdminUser[];
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const OrganisationContext = createContext<OrganisationContextTypes>({
	orgId: '',
	organisation: undefined,
	fetchOrganisationData: async () => {},
	setOrgId: () => {},
	adminUsers: [],
});

const OrganisationContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const DEFAULT_ORG_ID = import.meta.env.VITE_ORG_ID;

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [organisation, setOrganisation] = useState<Organisation>();
	const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
	const [orgId, setOrgId] = useState<string>(DEFAULT_ORG_ID);
	const queryClient = useQueryClient();

	const fetchOrganisationData = async (orgId: string) => {
		try {
			const resolvedOrgId = orgId || DEFAULT_ORG_ID;

			const responseOrgData = await axios.get(`${base_url}/organisations/${resolvedOrgId}`);
			setOrganisation(responseOrgData.data.data[0]);

			setAdminUsers(responseOrgData.data.data[0].admins);

			setIsLoaded(true);
			// Store data in React Query cache
			queryClient.setQueryData('organisation', responseOrgData.data.data[0]);
		} catch (error: any) {
			// Don't throw error for rate limit - let the axios interceptor handle it
			if (error.response?.status === 429) {
				return;
			}
			throw new Error('Failed to fetch organization data');
		}
	};

	const organisationQuery = useQuery('organisation', () => fetchOrganisationData(orgId), {
		enabled: !!orgId && !isLoaded,
		retry: (failureCount, error: any) => {
			// Don't retry on rate limit errors
			if (error.response?.status === 429) {
				return false;
			}
			return failureCount < 3;
		},
	});

	if (organisationQuery.isLoading) {
		return <Loading />;
	}

	if (organisationQuery.isError) {
		// Don't show error for rate limit - let the axios interceptor handle it
		const error: any = organisationQuery.error;
		if (error.response?.status === 429) {
			return <Loading />;
		}
		return <LoadingError />;
	}

	return (
		<OrganisationContext.Provider value={{ organisation, fetchOrganisationData, setOrgId, orgId, adminUsers }}>
			{props.children}
		</OrganisationContext.Provider>
	);
};

export default OrganisationContextProvider;
