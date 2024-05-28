import { createContext, ReactNode, useState } from 'react';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { User } from '../interfaces/user';
import { jwtDecode } from 'jwt-decode';

interface UserAuthContextTypes {
	user?: User;
	userId: string;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
	fetchUserData: (userId: string) => Promise<void>;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const UserAuthContext = createContext<UserAuthContextTypes>({
	user: undefined,
	userId: '',
	setUserId: () => {},
	fetchUserData: async () => {},
});

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const token = localStorage.getItem('user_token');
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [user, setUser] = useState<User>();
	const queryClient = useQueryClient();

	const [userId, setUserId] = useState<string>(() => {
		if (token) {
			const decodedToken = jwtDecode<any>(token);
			return decodedToken.userId;
		} else {
			return '';
		}
	});

	const fetchUserData = async (userId: string) => {
		try {
			const responseUserData = await axios.get(`${base_url}/users/${userId}`);
			setUser(responseUserData.data.data[0]);
			setIsLoaded(true);
			// Store data in React Query cache
			queryClient.setQueryData('userData', responseUserData.data.data[0]);
		} catch (error) {
			throw new Error('Failed to fetch user data');
		}
	};

	const userQuery = useQuery('userData', () => fetchUserData(userId), {
		enabled: !!userId && !isLoaded,
	});

	if (userQuery.isLoading) {
		return <Loading />;
	}

	if (userQuery.isError) {
		return <LoadingError />;
	}

	return <UserAuthContext.Provider value={{ setUserId, user, fetchUserData, userId }}>{props.children}</UserAuthContext.Provider>;
};

export default UserAuthContextProvider;
