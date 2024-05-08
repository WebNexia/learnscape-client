import { createContext, ReactNode, useState } from 'react';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
import { useQuery } from 'react-query';
import axios from 'axios';
import { User } from '../interfaces/user';
import { jwtDecode } from 'jwt-decode';

interface UserAuthContextTypes {
	user?: User;
	userId: string;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const UserAuthContext = createContext<UserAuthContextTypes>({ userId: '', setUserId: () => {}, user: undefined });

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const token = localStorage.getItem('user_token');

	const [userId, setUserId] = useState<string>(() => {
		if (token) {
			const decodedToken = jwtDecode<any>(token);
			return decodedToken.userId;
		} else {
			return '';
		}
	});

	const { data, isLoading, isError } = useQuery(['userData', { userId }], async () => {
		if (!userId) {
			console.log('not signed in');
			return null; // Return null if userId is not available
		}

		const response = await axios.get(`${base_url}/users/${userId}`);
		return response.data.data[0];
	});

	if (!userId || isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return <UserAuthContext.Provider value={{ userId, setUserId, user: data }}>{props.children}</UserAuthContext.Provider>;
};

export default UserAuthContextProvider;
