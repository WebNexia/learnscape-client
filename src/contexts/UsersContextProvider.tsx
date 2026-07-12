import { createContext, ReactNode, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { User } from '../interfaces/user';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { shouldFetchStaffUsersList } from '../utils/staffUsersDataRoutes';

interface UsersContextTypes {
	users: User[];
	loading: boolean;
	error: string | null;
	fetchUsers: (page?: number) => Promise<User[]>;
	fetchMoreUsers: (startPage: number, endPage: number) => Promise<void>;
	sortUsersData: (property: keyof User, order: 'asc' | 'desc') => User[];
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

export const USERS_LIST_STALE_MS = 2 * 60 * 1000;

const UsersContextProvider = ({ children }: UsersContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { pathname } = useLocation();
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess } = useAuth();
	const { user } = useContext(UserAuthContext);
	const isLandingPageRoute = useIsLandingPageRoute();

	const isStaffUsersRoute = hasAdminAccess && shouldFetchStaffUsersList(pathname);

	const {
		data: users,
		isLoading,
		isError,
		fetchEntities: fetchUsers,
		fetchMoreEntities: fetchMoreUsers,
		updateEntity: updateUser,
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
		enabled: isAuthenticated && hasAdminAccess && !isLandingPageRoute && isStaffUsersRoute,
		role: user?.role as Roles,
		staleTime: USERS_LIST_STALE_MS,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
		refetchOnMount: false,
	});

	return (
		<UsersContext.Provider
			value={{
				users,
				loading: isStaffUsersRoute && (isLoading || !users),
				error: isError ? 'Failed to fetch users' : null,
				fetchUsers,
				fetchMoreUsers,
				sortUsersData,
				removeUser,
				updateUser,
				usersPageNumber,
				setUsersPageNumber,
				totalItems,
				loadedPages,
			}}>
			<DataFetchErrorBoundary context='Users'>{children}</DataFetchErrorBoundary>
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
