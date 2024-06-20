import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { User } from '../interfaces/user';
import { OrganisationContext } from './OrganisationContextProvider';

interface UserContextTypes {
	sortedUsersData: User[];
	sortUsersData: (property: keyof User, order: 'asc' | 'desc') => void;
	addNewUser: (newCourse: any) => void;
	activateUser: (id: string) => void;
	removeUser: (id: string) => void;
	updateUser: (user: User) => void;
	usersNumberOfPages: number;
	usersPageNumber: number;
	setUsersPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchUsers: (page: number) => void;
}

interface UserContextProviderProps {
	children: ReactNode;
}

export const UsersContext = createContext<UserContextTypes>({
	sortedUsersData: [],
	sortUsersData: () => {},
	addNewUser: () => {},
	activateUser: () => {},
	removeUser: () => {},
	updateUser: () => {},
	usersNumberOfPages: 1,
	usersPageNumber: 1,
	setUsersPageNumber: () => {},
	fetchUsers: () => {},
});

const UsersContextProvider = (props: UserContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedUsersData, setSortedUsersData] = useState<User[]>([]);
	const [usersNumberOfPages, setUsersNumberOfPages] = useState<number>(1);
	const [usersPageNumber, setUsersPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchUsers = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/users/organisation/${orgId}?page=${page}&limit=50`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedUsersData(sortedDataCopy);
			setUsersNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allUsers', orgId, usersPageNumber], () => fetchUsers(usersPageNumber), {
		enabled: !!orgId && !isLoaded,
	});

	// Function to handle sorting
	const sortUsersData = (property: keyof User, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedUsersData].sort((a: User, b: User) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedUsersData(sortedDataCopy);
	};
	// Function to update sortedUserData with new user data
	const addNewUser = (newUser: any) => {
		setSortedUsersData((prevSortedData) => [newUser, ...prevSortedData]);
	};

	const activateUser = (id: string) => {
		const updatedCourseList = sortedUsersData?.map((user) => {
			if (user._id === id) {
				return { ...user, isActive: !user.isActive };
			}
			return user;
		});
		setSortedUsersData(updatedCourseList);
	};

	const updateUser = (updatedUser: User) => {
		const updatedUserList = sortedUsersData?.map((user) => {
			if (updatedUser._id === user._id) {
				return updatedUser;
			}
			return user;
		});
		setSortedUsersData(updatedUserList);
	};

	const removeUser = (id: string) => {
		setSortedUsersData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
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
				sortedUsersData,
				sortUsersData,
				addNewUser,
				removeUser,
				activateUser,
				updateUser,
				usersNumberOfPages,
				usersPageNumber,
				setUsersPageNumber,
				fetchUsers,
			}}>
			{props.children}
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
