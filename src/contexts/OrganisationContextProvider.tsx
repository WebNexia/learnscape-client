import { createContext, ReactNode, useState } from 'react';
import { Organisation } from '../interfaces/organisation';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';

interface OrganisationContextTypes {
	organisation?: Organisation;
	fetchOrganisationData: (orgId: string) => Promise<void>;
	setOrgId: React.Dispatch<React.SetStateAction<string>>;
	orgId: string;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const OrganisationContext = createContext<OrganisationContextTypes>({
	orgId: '',
	organisation: undefined,
	fetchOrganisationData: async () => {},
	setOrgId: () => {},
});

const OrganisationContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const token = localStorage.getItem('orgId')?.slice(5, -5);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [organisation, setOrganisation] = useState<Organisation>();
	const [orgId, setOrgId] = useState<string>(() => {
		if (token) {
			return token;
		}
		return '';
	});
	const queryClient = useQueryClient();

	const fetchOrganisationData = async (orgId: string) => {
		try {
			const responseOrgData = await axios.get(`${base_url}/organisations/${orgId}`);
			setOrganisation(responseOrgData.data.data[0]);

			setIsLoaded(true);
			// Store data in React Query cache
			queryClient.setQueryData('organisation', responseOrgData.data.data[0]);
		} catch (error) {
			throw new Error('Failed to fetch organization data');
		}
	};

	const organisationQuery = useQuery('organisation', () => fetchOrganisationData(orgId), {
		enabled: !!orgId && !isLoaded,
	});

	if (organisationQuery.isLoading) {
		return <Loading />;
	}

	if (organisationQuery.isError) {
		return <LoadingError />;
	}

	return (
		<OrganisationContext.Provider value={{ organisation, fetchOrganisationData, setOrgId, orgId }}>{props.children}</OrganisationContext.Provider>
	);
};

export default OrganisationContextProvider;
