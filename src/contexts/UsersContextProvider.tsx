import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { User } from '../interfaces/user';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface UserContextTypes {
	users: User[];
	loading: boolean;
	error: string | null;
	fetchUsers: (page: number) => Promise<void>;
	fetchMoreUsers: (startPage: number, endPage: number) => Promise<void>;
	refreshData: () => void;
	sortUsersData: (property: keyof User, order: 'asc' | 'desc') => void;
	addNewUser: (newCourse: any) => void;
	activateUser: (id: string) => void;
	removeUser: (id: string) => void;
	updateUser: (user: User) => void;
	numberOfPages: number;
	usersPageNumber: number;
	setUsersPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface UserContextProviderProps {
	children: ReactNode;
}

export const UsersContext = createContext<UserContextTypes>({
	users: [],
	loading: false,
	error: null,
	fetchUsers: async () => {},
	fetchMoreUsers: async () => {},
	refreshData: () => {},
	sortUsersData: () => {},
	addNewUser: () => {},
	activateUser: () => {},
	removeUser: () => {},
	updateUser: () => {},
	numberOfPages: 1,
	usersPageNumber: 1,
	setUsersPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
});

const UsersContextProvider = (props: UserContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const [users, setUsers] = useState<User[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [usersPageNumber, setUsersPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const location = useLocation();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const fetchUsers = async (page: number) => {
		if (!orgId) return;
		try {
			// Fetch initial 1000 records
			const url = `${base_url}/users/organisation/${orgId}?page=${page}&limit=300`;
			const response = await axios.get(url);
			const sortedDataCopy = [...response.data.data].sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));
			setUsers(sortedDataCopy);
			setTotalItems(response.data.pagination.totalItems);
			setNumberOfPages(Math.ceil(response.data.pagination.totalItems / 100)); // 100 per page display
			setLoadedPages([1]);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreUsers = async (startPage: number, endPage: number) => {
		if (!orgId) return;
		try {
			// Calculate which pages we need to fetch
			const pagesToFetch = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) return; // Already loaded

			// Fetch missing pages
			let newUsers: User[] = [];
			for (const page of pagesToFetch) {
				const url = `${base_url}/users/organisation/${orgId}?page=${page}&limit=300`;

				const response = await axios.get(url);
				newUsers = [...newUsers, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...users, ...newUsers];
			const uniqueData = combinedData.filter((user, index, self) => index === self.findIndex((u) => u._id === user._id));
			const sortedData = uniqueData.sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));
			setUsers(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more users:', error);
		}
	};

	const { isLoading, isError } = useQuery(['users', orgId, usersPageNumber], () => fetchUsers(usersPageNumber), {
		enabled: !!orgId && isAuthenticated && isAdmin && !isLoaded && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortUsersData = (property: keyof User, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...users].sort((a: User, b: User) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setUsers(sortedDataCopy);
	};

	const refreshData = () => {
		setIsLoaded(false);
	};

	// Function to update users with new user data
	const addNewUser = (newUser: any) => {
		setUsers((prevUsers) => [newUser, ...prevUsers]);
	};

	const activateUser = (id: string) => {
		const updatedUserList = users?.map((user) => {
			if (user._id === id) {
				return { ...user, isActive: !user.isActive };
			}
			return user;
		});
		setUsers(updatedUserList);
	};

	const updateUser = (updatedUser: User) => {
		const updatedUserList = users?.map((user) => {
			if (updatedUser._id === user._id) {
				return updatedUser;
			}
			return user;
		});
		setUsers(updatedUserList);
	};

	const removeUser = (id: string) => {
		setUsers((prevUsers) => prevUsers?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<UsersContext.Provider
			value={{
				users,
				loading: isLoading,
				error: isError ? 'Failed to fetch users' : null,
				fetchUsers,
				fetchMoreUsers,
				refreshData,
				sortUsersData,
				addNewUser,
				removeUser,
				activateUser,
				updateUser,
				numberOfPages,
				usersPageNumber,
				setUsersPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
			}}>
			{props.children}
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
