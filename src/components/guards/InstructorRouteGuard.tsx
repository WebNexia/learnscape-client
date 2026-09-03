import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles, isLearnerRole } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface InstructorRouteGuardProps {
	children: React.ReactNode;
}

const InstructorRouteGuard: React.FC<InstructorRouteGuardProps> = ({ children }) => {
	const { user, isAuthReady } = useContext(UserAuthContext);

	if (!isAuthReady) {
		return <Loading />;
	}

	if (!user) {
		return <Navigate to='/auth' replace />;
	}

	if (user.role === Roles.ADMIN || user.role === Roles.OWNER || user.role === Roles.SUPER_ADMIN) {
		return <Navigate to='/admin/dashboard' replace />;
	}

	if (isLearnerRole(user.role)) {
		return <Navigate to='/dashboard' replace />;
	}

	if (user.role !== Roles.INSTRUCTOR) {
		return <Navigate to='/auth' replace />;
	}

	return <>{children}</>;
};

export default InstructorRouteGuard;
