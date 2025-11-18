import { createContext, ReactNode, useEffect, useState, useRef } from 'react';
import { useQueryClient, useQuery } from 'react-query';
import axios from '@utils/axiosInstance';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';
import { useNavigate } from 'react-router-dom';
import { UserCoursesIdsWithCourseIds } from './UserCourseLessonDataContextProvider';

interface UserAuthContextTypes {
	user?: User | undefined;
	userId: string;
	firebaseUserId: string;
	setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
	fetchUserData: (userId: string, skipIfSignup?: boolean) => Promise<void>;
	signOut: () => Promise<void>;
	setSkipFetchDuringSignup: (skip: boolean) => void;
	userCourseData: UserCoursesIdsWithCourseIds[] | undefined;
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
	setSkipFetchDuringSignup: () => {},
	userCourseData: undefined,
});

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const [user, setUser] = useState<User>();
	const [userId, setUserId] = useState<string>('');
	const [firebaseUserId, setFirebaseUserId] = useState<string>('');
	const [userCourseData, setUserCourseData] = useState<UserCoursesIdsWithCourseIds[] | undefined>(undefined);
	const skipFetchDuringSignupRef = useRef<boolean>(false);
	const isFetchingUserDataRef = useRef<boolean>(false);
	const isLoginInProgressRef = useRef<boolean>(false);
	const lastAuthStateChangeRef = useRef<number>(0);
	const queryClient = useQueryClient();

	// Custom function to update ref
	const setSkipFetchDuringSignupWithRef = (skip: boolean) => {
		skipFetchDuringSignupRef.current = skip;
	};

	// Navigation logic - only redirect on initial login, not on page refresh
	useEffect(() => {
		// Only navigate if we're on the auth page or root (initial login)
		const currentPath = window.location.pathname;
		const isOnAuthPage = currentPath === '/auth' || currentPath === '/';

		if (!user || !isOnAuthPage) return;

		// Admin, owner, and super-admin all go to admin dashboard
		const hasAdminAccess = user.role === Roles.ADMIN || user.role === Roles.OWNER || user.role === Roles.SUPER_ADMIN;
		if (hasAdminAccess) {
			navigate('/admin/dashboard', { replace: true });
		} else if (user.role === Roles.USER) {
			navigate('/dashboard', { replace: true });
		} else if (user.role === Roles.INSTRUCTOR) {
			navigate('/instructor/dashboard', { replace: true });
		}
	}, [user, navigate]);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			const now = Date.now();
			const timeSinceLastChange = now - lastAuthStateChangeRef.current;

			// Debounce rapid-fire auth state changes (less than 200ms apart)
			if (timeSinceLastChange < 200) {
				return;
			}

			lastAuthStateChangeRef.current = now;

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
				isLoginInProgressRef.current = true;
				try {
					// Only fetch user data if we don't already have it for this Firebase user
					if (!user || user.firebaseUserId !== currentUser.uid) {
						await fetchUserData(currentUser.uid, skipFetchDuringSignupRef.current);
					}
				} catch (error) {
					console.error('Failed to fetch user data:', error);
				} finally {
					// Reset login in progress flag after a delay
					setTimeout(() => {
						isLoginInProgressRef.current = false;
					}, 500);
				}
			} else {
				// Only clear user state if we're not in the middle of a login process
				if (!isLoginInProgressRef.current && !isFetchingUserDataRef.current) {
					setUser(undefined);
					setUserId('');
					setFirebaseUserId('');
				}
			}
		});

		return () => unsubscribe();
	}, []); // Remove skipFetchDuringSignup from dependencies since we're using ref

	// React Query for userCourseData
	const { data: userCourseDataFromQuery } = useQuery<UserCoursesIdsWithCourseIds[]>(
		['userCourseData', userId],
		async () => {
			if (!userId) return [];
			const response = await axios.get(`${base_url}/usercourses/user/${userId}`);

			return response.data.response || [];
		},
		{
			enabled: !!userId && user?.role === Roles.USER,
			staleTime: 5 * 60 * 1000, // 5 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			refetchOnWindowFocus: false,
		}
	);

	// Update context state when React Query data changes
	useEffect(() => {
		if (userCourseDataFromQuery) {
			setUserCourseData(userCourseDataFromQuery);
		}
	}, [userCourseDataFromQuery]);

	const fetchUserData = async (firebaseUserId: string, skipIfSignup?: boolean) => {
		// Skip fetching if signup is in progress
		if (skipIfSignup || skipFetchDuringSignupRef.current) {
			return;
		}

		// Skip fetching if we're already fetching user data
		if (isFetchingUserDataRef.current) {
			return;
		}

		// Skip fetching if we already have the user data for this Firebase ID AND userId is set
		if (user && user.firebaseUserId === firebaseUserId && userId) {
			return;
		}

		// Set fetching flag to prevent duplicate calls
		isFetchingUserDataRef.current = true;

		try {
			const responseUserData = await axios.get(`${base_url}/users/${firebaseUserId}`);
			const userData = responseUserData.data.data[0];

			if (userData && userData._id) {
				setUser(userData);
				setUserId(userData._id);
				queryClient.setQueryData('userData', userData);

				// User lesson data now fetched per course using useUserLessonsForCourse hook
			} else {
				throw new Error('Invalid user data received');
			}
		} catch (error: any) {
			console.error('❌ Failed to fetch user data:', error);
			console.error('❌ Error response:', error.response?.data);
			console.error('❌ Error status:', error.response?.status);
			throw new Error('Failed to fetch user data');
		} finally {
			// Reset fetching flag
			isFetchingUserDataRef.current = false;
		}
	};

	const signOutUser = async () => {
		await signOut(auth);
		localStorage.removeItem('sessionTimestamp');
		sessionStorage.removeItem('activeChatId');
		setUser(undefined);
		setUserId('');
		setFirebaseUserId('');
		queryClient.clear();
	};

	return (
		<UserAuthContext.Provider
			value={{
				user,
				userId,
				firebaseUserId,
				setUser,
				setUserId,
				fetchUserData,
				signOut: signOutUser,
				setSkipFetchDuringSignup: setSkipFetchDuringSignupWithRef,
				userCourseData,
			}}>
			{props.children}
		</UserAuthContext.Provider>
	);
};

export default UserAuthContextProvider;
