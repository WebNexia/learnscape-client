import { useContext } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { isLearnerRole, Roles } from '../interfaces/enums';

export const useAuth = () => {
	const { user } = useContext(UserAuthContext);

	const isAuthenticated = !!user;
	const isAdmin = user?.role === Roles.ADMIN;
	const isLearner = isLearnerRole(user?.role);
	const isInstructor = user?.role === Roles.INSTRUCTOR;
	const isOwner = user?.role === Roles.OWNER;
	const isSuperAdmin = user?.role === Roles.SUPER_ADMIN;
	// Admin-level access (admin, owner, super-admin can all access admin pages)
	const hasAdminAccess = isAdmin || isOwner || isSuperAdmin;
	// Payments access (only owner and super-admin, not admin)
	const canAccessPayments = isOwner || isSuperAdmin;

	return {
		isAuthenticated,
		isAdmin,
		isLearner,
		isInstructor,
		isOwner,
		isSuperAdmin,
		hasAdminAccess,
		canAccessPayments,
		user,
	};
};
