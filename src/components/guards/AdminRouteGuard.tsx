import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface AdminRouteGuardProps {
	children: React.ReactNode;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
	const { user, isAuthReady } = useContext(UserAuthContext);

	if (!isAuthReady) {
		return <Loading />;
	}

	if (!user) {
		return <Navigate to='/auth' replace />;
	}

	if (user.role !== Roles.ADMIN && user.role !== Roles.OWNER && user.role !== Roles.SUPER_ADMIN) {
		return <Navigate to='/dashboard' replace />;
	}

	return <>{children}</>;
};

export default AdminRouteGuard;
