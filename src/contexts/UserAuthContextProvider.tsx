import { createContext, ReactNode, useState } from 'react';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
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
	userId: '',
	setUserId: () => {},
	user: undefined,
	fetchUserData: async () => {},
});

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const token = localStorage.getItem('user_token');

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
		} catch (error) {
			throw new Error('Failed to fetch user data');
		}
	};

	const userQuery = useQuery('userData', () => fetchUserData(userId), {
		enabled: !!userId, // Only enable the query if userId is available
		initialData: () => {
			// Check if data is already available in the cache
			const cachedData = queryClient.getQueryData<User | undefined>('userData');
			if (cachedData) {
				setUser(cachedData);
			} else {
				// If data is not available in the cache, fetch it
				if (user) {
					fetchUserData(user._id);
				}
			}
		},
		onSuccess: (data) => {
			// Store data in React Query cache
			queryClient.setQueryData('userData', data);
		},
	});

	// const { data, isLoading, isError } = useQuery(['userData', { userId }], async () => {
	// 	const response = await axios.get(`${base_url}/users/${userId}`);
	// 	return response.data.data[0];
	// });

	if (userQuery.isLoading) {
		return <Loading />;
	}

	if (userQuery.isError) {
		return <LoadingError />;
	}

	return <UserAuthContext.Provider value={{ userId, setUserId, user, fetchUserData }}>{props.children}</UserAuthContext.Provider>;
};

export default UserAuthContextProvider;
