import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface OwnerRouteGuardProps {
	children: React.ReactNode;
}

const OwnerRouteGuard: React.FC<OwnerRouteGuardProps> = ({ children }) => {
	const { user, isAuthReady } = useContext(UserAuthContext);

	if (!isAuthReady) {
		return <Loading />;
	}

	if (!user) {
		return <Navigate to='/auth' replace />;
	}

	if (user.role !== Roles.OWNER) {
		return <Navigate to='/admin/dashboard' replace />;
	}

	return <>{children}</>;
};

export default OwnerRouteGuard;
