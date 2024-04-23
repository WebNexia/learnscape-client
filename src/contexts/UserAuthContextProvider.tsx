import { createContext, ReactNode, useState } from 'react';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
import { useQuery } from 'react-query';
import axios from 'axios';
import { User } from '../interfaces/user';

interface UserAuthContextTypes {
	user?: User;
	userId: string;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
	setUserRole: React.Dispatch<React.SetStateAction<string>>;
}

export const UserAuthContext = createContext<UserAuthContextTypes>({ userId: '', setUserId: () => {}, user: undefined });

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [userId, setUserId] = useState<string>('');

	const { data, isLoading, isError } = useQuery(['userData', { userId }], async () => {
		const response = await axios.get(`${base_url}/users/${userId}`);
		props.setUserRole(response.data.data[0].role);
		return response.data.data[0];
	});

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}
	return <UserAuthContext.Provider value={{ userId, setUserId, user: data }}>{props.children}</UserAuthContext.Provider>;
};

export default UserAuthContextProvider;
