import { createContext, ReactNode, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import axios from '@utils/axiosInstance';
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

	const [user, setUser] = useState<User>();
	const [userId, setUserId] = useState<string>('');
	const [firebaseUserId, setFirebaseUserId] = useState<string>('');
	const queryClient = useQueryClient();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				let sessionTimestamp = localStorage.getItem('sessionTimestamp');
				const currentTime = Date.now();
				const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

				// If no timestamp, set it now (first login or after clearing storage)
				if (!sessionTimestamp) {
					localStorage.setItem('sessionTimestamp', currentTime.toString());
					sessionTimestamp = currentTime.toString();
				}

				// Now check expiry
				if (currentTime - parseInt(sessionTimestamp) > SESSION_DURATION) {
					await signOut(auth);
					localStorage.removeItem('sessionTimestamp');
					console.warn('Session expired');
					window.location.href = '/auth';
					return;
				}

				setFirebaseUserId(currentUser.uid);
				try {
					await fetchUserData(currentUser.uid);
				} catch (error) {
					console.error('Failed to fetch user data:', error);
				}
			} else {
				setUser(undefined);
				setUserId('');
				setFirebaseUserId('');
			}
		});

		return () => unsubscribe();
	}, []);

	const fetchUserData = async (firebaseUserId: string) => {
		try {
			const responseUserData = await axios.get(`${base_url}/users/${firebaseUserId}`);
			setUser(responseUserData.data.data[0]);
			setUserId(responseUserData.data.data[0]._id);
			queryClient.setQueryData('userData', responseUserData.data.data[0]);
		} catch (error) {
			console.error('Failed to fetch user data:', error);
			throw new Error('Failed to fetch user data');
		}
	};

	const signOutUser = async () => {
		await signOut(auth);
		localStorage.removeItem('sessionTimestamp');
		localStorage.removeItem('userCourseData');
		localStorage.removeItem('userLessonData');
		localStorage.removeItem('activeChatId');
		localStorage.removeItem('chatList');
		localStorage.removeItem('participantCache');
		localStorage.removeItem('totalUnreadMessages');
		setUser(undefined);
		setUserId('');
		setFirebaseUserId('');
		queryClient.clear();
	};

	return (
		<UserAuthContext.Provider value={{ user, userId, firebaseUserId, setUser, setUserId, fetchUserData, signOut: signOutUser }}>
			{props.children}
		</UserAuthContext.Provider>
	);
};

export default UserAuthContextProvider;
