// UsersContextProvider.tsx
import { createContext, ReactNode, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { User } from '../interfaces/user';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';

interface UsersContextTypes {
	users: User[];
	loading: boolean;
	error: string | null;
	fetchUsers: (page?: number) => Promise<User[]>;
	fetchMoreUsers: (startPage: number, endPage: number) => Promise<void>;
	sortUsersData: (property: keyof User, order: 'asc' | 'desc') => User[];
	addNewUser: (newUser: User) => void;
	activateUser: (id: string) => void;
	removeUser: (id: string) => void;
	updateUser: (user: User) => void;
	usersPageNumber: number;
	setUsersPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface UsersContextProviderProps {
	children: ReactNode;
}

export const UsersContext = createContext<UsersContextTypes>({} as UsersContextTypes);

const UsersContextProvider = ({ children }: UsersContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const { user } = useContext(UserAuthContext);
	const location = useLocation();

	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

	const {
		data: users,
		isLoading,
		isError,
		fetchEntities: fetchUsers,
		fetchMoreEntities: fetchMoreUsers,
		addEntity: addNewUser,
		updateEntity: updateUser,
		toggleEntityActive: activateUser,
		removeEntity: removeUser,
		sortEntities: sortUsersData,
		pageNumber: usersPageNumber,
		setPageNumber: setUsersPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<User>({
		orgId,
		baseUrl: `${base_url}/users/organisation/${orgId}`,
		entityKey: 'users',
		enabled: isAuthenticated && isAdmin && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	return (
		<UsersContext.Provider
			value={{
				users,
				loading: isLoading,
				error: isError ? 'Failed to fetch users' : null,
				fetchUsers,
				fetchMoreUsers,
				sortUsersData,
				addNewUser,
				activateUser,
				removeUser,
				updateUser,
				usersPageNumber,
				setUsersPageNumber,
				totalItems,
				loadedPages,
			}}>
			{children}
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { User } from '../interfaces/user';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { useAuth } from '../hooks/useAuth';
// import { useLocation } from 'react-router-dom';

// interface UserContextTypes {
// 	users: User[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchUsers: (page: number) => Promise<User[]>;
// 	fetchMoreUsers: (startPage: number, endPage: number) => Promise<void>;

// 	sortUsersData: (property: keyof User, order: 'asc' | 'desc') => void;
// 	addNewUser: (newCourse: any) => void;
// 	activateUser: (id: string) => void;
// 	removeUser: (id: string) => void;
// 	updateUser: (user: User) => void;
// 	numberOfPages: number;
// 	usersPageNumber: number;
// 	setUsersPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
// 	totalItems: number;
// 	loadedPages: number[];
// }

// interface UserContextProviderProps {
// 	children: ReactNode;
// }

// export const UsersContext = createContext<UserContextTypes>({
// 	users: [],
// 	loading: false,
// 	error: null,
// 	fetchUsers: async () => [],
// 	fetchMoreUsers: async () => {},

// 	sortUsersData: () => {},
// 	addNewUser: () => {},
// 	activateUser: () => {},
// 	removeUser: () => {},
// 	updateUser: () => {},
// 	numberOfPages: 1,
// 	usersPageNumber: 1,
// 	setUsersPageNumber: () => {},
// 	setNumberOfPages: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// });

// const UsersContextProvider = (props: UserContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin } = useAuth();
// 	const queryClient = useQueryClient();

// 	const [numberOfPages, setNumberOfPages] = useState<number>(1);
// 	const [usersPageNumber, setUsersPageNumber] = useState<number>(1);
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const location = useLocation();
// 	const isLandingPageRoute =
// 		location.pathname === '/' ||
// 		location.pathname === '/landing-page-courses' ||
// 		location.pathname === '/resources' ||
// 		location.pathname === '/contact-us' ||
// 		location.pathname === '/about-us' ||
// 		location.pathname === '/auth' ||
// 		// Only consider course preview pages as landing pages, not enrolled course pages
// 		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

// 	const fetchUsers = async (page: number) => {
// 		if (!orgId) return [];
// 		try {
// 			// Fetch initial 500 records
// 			const url = `${base_url}/users/organisation/${orgId}?page=${page}&limit=300`;
// 			const response = await axios.get(url);
// 			const sortedData = [...response.data.data].sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['users', orgId, usersPageNumber], sortedData);

// 			setTotalItems(response.data.totalItems);
// 			setNumberOfPages(Math.ceil(response.data.totalItems / 50)); // 50 per page display
// 			setLoadedPages([1]);

// 			return sortedData;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreUsers = async (startPage: number, endPage: number) => {
// 		if (!orgId) return;
// 		try {
// 			// Calculate which pages we need to fetch
// 			const pagesToFetch = [];
// 			for (let page = startPage; page <= endPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					pagesToFetch.push(page);
// 				}
// 			}

// 			if (pagesToFetch.length === 0) return; // Already loaded

// 			// Fetch missing pages
// 			let newUsers: User[] = [];
// 			for (const page of pagesToFetch) {
// 				const url = `${base_url}/users/organisation/${orgId}?page=${page}&limit=300`;

// 				const response = await axios.get(url);
// 				newUsers = [...newUsers, ...response.data.data];
// 			}

// 			// Combine with existing data, remove duplicates, and sort
// 			const combinedData = [...(usersData || []), ...newUsers];
// 			const uniqueData = combinedData.filter((user, index, self) => index === self.findIndex((u) => u._id === user._id));
// 			const sortedData = uniqueData.sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));
// 			queryClient.setQueryData(['users', orgId, usersPageNumber], sortedData);
// 			setLoadedPages([...loadedPages, ...pagesToFetch]);
// 		} catch (error) {
// 			console.error('Error fetching more users:', error);
// 		}
// 	};

// 	const {
// 		data: usersData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['users', orgId, usersPageNumber], () => fetchUsers(usersPageNumber), {
// 		enabled: !!orgId && isAuthenticated && isAdmin && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	// useEffect ile usersData değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (usersData) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(usersData.length); // ❌ This breaks pagination

// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [usersData]);

// 	// Function to handle sorting
// 	const sortUsersData = (property: keyof User, order: 'asc' | 'desc') => {
// 		const sortedDataCopy = [...(usersData || [])].sort((a: User, b: User) => {
// 			const aValue = a[property];
// 			const bValue = b[property];

// 			if (aValue === undefined || bValue === undefined) return 0;

// 			if (order === 'asc') {
// 				return aValue > bValue ? 1 : -1;
// 			} else {
// 				return aValue < bValue ? 1 : -1;
// 			}
// 		});
// 		queryClient.setQueryData(['users', orgId, usersPageNumber], sortedDataCopy);
// 	};

// 	// Function to update users with new user data
// 	const addNewUser = (newUser: any) => {
// 		queryClient.setQueryData(['users', orgId, usersPageNumber], (oldData: any) => {
// 			return [newUser, ...(oldData || [])];
// 		});
// 		setTotalItems((prev) => prev + 1);
// 	};

// 	const activateUser = (id: string) => {
// 		queryClient.setQueryData(['users', orgId, usersPageNumber], (oldData: any) => {
// 			return oldData?.map((user: User) => {
// 				if (user._id === id) {
// 					return { ...user, isActive: !user.isActive };
// 				}
// 				return user;
// 			});
// 		});
// 	};

// 	const updateUser = (updatedUser: User) => {
// 		queryClient.setQueryData(['users', orgId, usersPageNumber], (oldData: any) => {
// 			return oldData?.map((user: User) => {
// 				if (updatedUser._id === user._id) {
// 					return updatedUser;
// 				}
// 				return user;
// 			});
// 		});
// 	};

// 	const removeUser = (id: string) => {
// 		queryClient.setQueryData(['users', orgId, usersPageNumber], (oldData: any) => {
// 			return oldData?.filter((data: User) => data._id !== id);
// 		});
// 		setTotalItems((prev) => Math.max(0, prev - 1));
// 	};

// 	if (isLoading) {
// 		return <Loading />;
// 	}

// 	if (isError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<UsersContext.Provider
// 			value={{
// 				users: usersData || [],
// 				loading: isLoading,
// 				error: isError ? 'Failed to fetch users' : null,
// 				fetchUsers,
// 				fetchMoreUsers,

// 				sortUsersData,
// 				addNewUser,
// 				removeUser,
// 				activateUser,
// 				updateUser,
// 				numberOfPages,
// 				usersPageNumber,
// 				setUsersPageNumber,
// 				setNumberOfPages,
// 				totalItems,
// 				loadedPages,
// 			}}>
// 			{props.children}
// 		</UsersContext.Provider>
// 	);
// };

// export default UsersContextProvider;
