import { createContext, ReactNode, useEffect, useState, useRef } from 'react';
import { useQueryClient } from 'react-query';
import axios from '@utils/axiosInstance';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';
import { useNavigate } from 'react-router-dom';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from './UserCourseLessonDataContextProvider';

interface UserAuthContextTypes {
	user?: User | undefined;
	userId: string;
	firebaseUserId: string;
	setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
	setUserId: React.Dispatch<React.SetStateAction<string>>;
	fetchUserData: (userId: string, skipIfSignup?: boolean) => Promise<void>;
	signOut: () => Promise<void>;
	setSkipFetchDuringSignup: (skip: boolean) => void;
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
});

const UserAuthContextProvider = (props: UserAuthContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const [user, setUser] = useState<User>();
	const [userId, setUserId] = useState<string>('');
	const [firebaseUserId, setFirebaseUserId] = useState<string>('');
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

		if (isOnAuthPage && user?.role === Roles.ADMIN) {
			navigate('/admin/dashboard', { replace: true });
		} else if (isOnAuthPage && user?.role === Roles.USER) {
			navigate('/dashboard', { replace: true });
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

				// Load user course and lesson data for non-admin users
				if (userData.role !== Roles.ADMIN) {
					try {
						// Load user course data
						const userCourseResponse = await axios.get(`${base_url}/usercourses/user/${userData._id}`);

						const userCourseData: UserCoursesIdsWithCourseIds[] = userCourseResponse.data.response?.reduce(
							(acc: UserCoursesIdsWithCourseIds[], value: any) => {
								if (value.courseId && value.courseId._id) {
									acc.push({
										courseId: value.courseId._id,
										userCourseId: value._id,
										isCourseCompleted: value.isCompleted,
										isCourseInProgress: value.isInProgress,
										courseTitle: value.courseId.title,
										createdAt: value.createdAt,
										isActive: value.isActive,
										validUntil: value.validUntil,
									});
								}
								return acc;
							},
							[]
						);
						localStorage.setItem('userCourseData', JSON.stringify(userCourseData));

						// Load user lesson data
						const userLessonResponse = await axios.get(`${base_url}/userlessons/user/${userData._id}`);

						const userLessonData: UserLessonDataStorage[] = userLessonResponse?.data.response?.map((userLesson: any) => ({
							lessonId: userLesson?.lessonId?._id,
							userLessonId: userLesson?._id,
							courseId: userLesson?.courseId,
							isCompleted: userLesson?.isCompleted,
							isInProgress: userLesson?.isInProgress,
							currentQuestion: userLesson?.currentQuestion,
							teacherFeedback: userLesson?.teacherFeedback,
							isFeedbackGiven: userLesson?.isFeedbackGiven,
							updatedAt: userLesson?.updatedAt,
						}));
						localStorage.setItem('userLessonData', JSON.stringify(userLessonData));
					} catch (error) {
						console.error('❌ Failed to load user course and lesson data:', error);
					}
				}
			} else {
				console.error('❌ Invalid user data received:', userData);
				throw new Error('Invalid user data received');
			}
		} catch (error) {
			console.error('Failed to fetch user data:', error);
			throw new Error('Failed to fetch user data');
		} finally {
			// Reset fetching flag
			isFetchingUserDataRef.current = false;
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
			}}>
			{props.children}
		</UserAuthContext.Provider>
	);
};

export default UserAuthContextProvider;
