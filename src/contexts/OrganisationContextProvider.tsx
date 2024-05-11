import { createContext, ReactNode, useState } from 'react';
import { Organisation } from '../interfaces/organisation';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading2/Loading';
import LoadingError from '../components/layouts/loading2/LoadingError';
import { jwtDecode } from 'jwt-decode';

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
	const token = localStorage.getItem('user_token');

	const [organisation, setOrganisation] = useState<Organisation>();
	const [orgId, setOrgId] = useState<string>(() => {
		if (token) {
			const decodedToken = jwtDecode<any>(token);
			return decodedToken.orgId;
		} else {
			return '';
		}
	});
	const queryClient = useQueryClient();

	const fetchOrganisationData = async (orgId: string) => {
		try {
			const responseOrgData = await axios.get(`${base_url}/organisations/${orgId}`);
			setOrganisation(responseOrgData.data.data[0]);
			// Store data in React Query cache
			queryClient.setQueryData('organisation', responseOrgData.data.data[0]);
		} catch (error) {
			throw new Error('Failed to fetch organization data');
		}
	};

	const organisationQuery = useQuery('organisation', () => fetchOrganisationData(orgId), {
		enabled: !!orgId,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
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
