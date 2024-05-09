import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/Loading/Loading';
import LoadingError from '../components/layouts/Loading/LoadingError';
import { User } from '../interfaces/user';
import { OrganisationContext } from './OrganisationContextProvider';

interface UserContextTypes {
	data: User[];
	sortedUserData: User[];
	sortUserData: (property: keyof User, order: 'asc' | 'desc') => void;
	setSortedUserData: React.Dispatch<React.SetStateAction<User[]>>;
	addNewUser: (newCourse: any) => void;
	activateUser: (id: string) => void;
	removeUser: (id: string) => void;
	updateUser: (user: User) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface UserContextProviderProps {
	children: ReactNode;
}

export const UsersContext = createContext<UserContextTypes>({
	data: [],
	sortedUserData: [],
	sortUserData: () => {},
	setSortedUserData: () => {},
	addNewUser: () => {},
	activateUser: () => {},
	removeUser: () => {},
	updateUser: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
});

const UsersContextProvider = (props: UserContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedUserData, setSortedUserData] = useState<User[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const { data, isLoading, isError } = useQuery(
		['allUsers', { page: pageNumber }],
		async () => {
			if (!orgId) return;

			const response = await axios.get(`${base_url}/users/organisation/${orgId}?page=${pageNumber}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: User, b: User) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedUserData(sortedDataCopy);
			setNumberOfPages(response.data.pages);

			return response.data.data;
		},
		{
			enabled: !!orgId, // Enable the query only when orgId is available
			// keepPreviousData: true, // Keep previous data while fetching new data
		}
	);

	// Function to handle sorting
	const sortUserData = (property: keyof User, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedUserData].sort((a: User, b: User) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedUserData(sortedDataCopy);
	};
	// Function to update sortedUserData with new user data
	const addNewUser = (newUser: any) => {
		setSortedUserData((prevSortedData) => [newUser, ...prevSortedData]);
	};

	const activateUser = (id: string) => {
		const updatedCourseList = sortedUserData?.map((user) => {
			if (user._id === id) {
				return { ...user, isActive: !user.isActive };
			}
			return user;
		});
		setSortedUserData(updatedCourseList);
	};

	const updateUser = (updatedUser: User) => {
		const updatedUserList = sortedUserData?.map((user) => {
			if (updatedUser._id === user._id) {
				return updatedUser;
			}
			return user;
		});
		setSortedUserData(updatedUserList);
	};

	const removeUser = (id: string) => {
		setSortedUserData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	// useEffect(() => {}, [sortedUserData]);

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<UsersContext.Provider
			value={{
				data,
				sortedUserData,
				sortUserData,
				setSortedUserData,
				addNewUser,
				removeUser,
				activateUser,
				updateUser,
				numberOfPages,
				pageNumber,
				setPageNumber,
			}}>
			{props.children}
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
