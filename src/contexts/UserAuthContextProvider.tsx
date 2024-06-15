import { createContext, ReactNode, useEffect, useState } from 'react';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../interfaces/user';

interface UserAuthContextTypes {
	user?: User | undefined;
	userId: string;
	firebaseUserId: string;
	setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
	fetchUserData: (userId: string) => Promise<void>;
	signOut: () => Promise<void>;
}

export interface UserAuthContextProviderProps {
	children: ReactNode;
}

export const UserAuthContext = createContext<UserAuthContextTypes>({
	user: undefined,
	userId: '',
	firebaseUserId: '',
	setUser: () => {},
	setUserId: () => {},
	fetchUserData: async () => {},
	signOut: async () => {},
});

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [user, setUser] = useState<User>();
	const [userId, setUserId] = useState<string>('');
	const [firebaseUserId, setFirebaseUserId] = useState<string>('');
	const queryClient = useQueryClient();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				setFirebaseUserId(currentUser.uid);
			} else {
				setUser(() => undefined);
				setUserId('');
			}
			setIsLoaded(true);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (firebaseUserId) {
			fetchUserData(firebaseUserId);
		}
	}, [firebaseUserId]);

	const fetchUserData = async (firebaseUserId: string) => {
		try {
			const responseUserData = await axios.get(`${base_url}/users/${firebaseUserId}`);
			localStorage.setItem('role', responseUserData.data.data[0].role);
			setUser(responseUserData.data.data[0]);
			setUserId(responseUserData.data.data[0]._id);
			queryClient.setQueryData('userData', responseUserData.data.data[0]);
		} catch (error) {
			throw new Error('Failed to fetch user data');
		}
	};

	const signOutUser = async () => {
		await signOut(auth);
		setUser(() => undefined);
		setUserId('');
		queryClient.clear();
	};

	const userQuery = useQuery('userData', () => fetchUserData(firebaseUserId), {
		enabled: !!userId && !isLoaded,
	});

	if (userQuery.isLoading) {
		return <Loading />;
	}

	if (userQuery.isError) {
		return <LoadingError />;
	}

	return (
		<UserAuthContext.Provider value={{ user, userId, firebaseUserId, setUser, setUserId, fetchUserData, signOut: signOutUser }}>
			{props.children}
		</UserAuthContext.Provider>
	);
};

export default UserAuthContextProvider;
