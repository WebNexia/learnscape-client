import { useContext } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { Roles } from '../interfaces/enums';

export const useAuth = () => {
	const { user } = useContext(UserAuthContext);

	const isAuthenticated = !!user;
	const isAdmin = user?.role === Roles.ADMIN;
	const isLearner = user?.role === Roles.USER;

	return {
		isAuthenticated,
		isAdmin,
		isLearner,
		user,
	};
};
