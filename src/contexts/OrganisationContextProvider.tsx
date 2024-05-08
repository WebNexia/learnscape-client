import { createContext, ReactNode, useContext, useState } from 'react';
import { Organisation } from '../interfaces/organisation';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
import { UserAuthContext } from './UserAuthContextProvider';

interface OrganisationContextTypes {
	organisation?: Organisation;
	setOrganisation: React.Dispatch<React.SetStateAction<Organisation | undefined>>;
	fetchOrganisationData: (orgId: string) => Promise<void>;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const OrganisationContext = createContext<OrganisationContextTypes>({
	setOrganisation: () => {},
	organisation: undefined,
	fetchOrganisationData: async () => {},
});

const OrganisationContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [organisation, setOrganisation] = useState<Organisation>();
	const queryClient = useQueryClient();

	const { user } = useContext(UserAuthContext);

	const fetchOrganisationData = async (orgId: string) => {
		try {
			const responseOrgData = await axios.get(`${base_url}/organisations/${orgId}`);
			setOrganisation(responseOrgData.data.data[0]);
		} catch (error) {
			throw new Error('Failed to fetch organization data');
		}
	};

	const organisationQuery = useQuery('organisation', () => fetchOrganisationData(''), {
		enabled: false, // Disable the query by default
		initialData: () => {
			// Check if data is already available in the cache
			const cachedData = queryClient.getQueryData<Organisation | undefined>('organisation');
			if (cachedData) {
				setOrganisation(cachedData);
			} else {
				// If data is not available in the cache, fetch it
				if (user?.orgId) {
					fetchOrganisationData(user?.orgId);
				}
			}
		},
		onSuccess: (data) => {
			// Store data in React Query cache
			queryClient.setQueryData('organisation', data);
		},
	});
	if (organisationQuery.isLoading) {
		return <Loading />;
	}

	if (organisationQuery.isError) {
		return <LoadingError />;
	}

	return (
		<OrganisationContext.Provider value={{ setOrganisation, organisation, fetchOrganisationData }}>{props.children}</OrganisationContext.Provider>
	);
};

export default OrganisationContextProvider;
