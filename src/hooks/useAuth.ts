import { useContext } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { Roles } from '../interfaces/enums';

export const useAuth = () => {
	const { user } = useContext(UserAuthContext);

	const isAuthenticated = !!user;
	const isAdmin = user?.role === Roles.ADMIN;
	const isLearner = user?.role === Roles.USER;
	const isInstructor = user?.role === Roles.INSTRUCTOR;

	return {
		isAuthenticated,
		isAdmin,
		isLearner,
		isInstructor,
		user,
	};
};
