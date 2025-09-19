import { createContext, ReactNode, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

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
	enableUsersFetch: () => void;
	disableUsersFetch: () => void;
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
	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(false);

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
		enabled: isEnabled && isAuthenticated && isAdmin && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	const enableUsersFetch = () => setIsEnabled(true);
	const disableUsersFetch = () => setIsEnabled(false);

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
				enableUsersFetch,
				disableUsersFetch,
			}}>
			<DataFetchErrorBoundary context='Users'>{children}</DataFetchErrorBoundary>
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
