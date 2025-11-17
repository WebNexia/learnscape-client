import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface PaymentsRouteGuardProps {
	children: React.ReactNode;
}

const PaymentsRouteGuard: React.FC<PaymentsRouteGuardProps> = ({ children }) => {
	const { user, firebaseUserId } = useContext(UserAuthContext);

	// Show loading while user data is being fetched
	if (firebaseUserId && !user) {
		return <Loading />;
	}

	// Redirect to auth if no user (not logged in)
	if (!user) {
		return <Navigate to='/auth' replace />;
	}

	// Only owner and super-admin can access payments, not admin
	if (user.role !== Roles.OWNER && user.role !== Roles.SUPER_ADMIN) {
		return <Navigate to='/admin/dashboard' replace />;
	}

	// Render the protected payments component
	return <>{children}</>;
};

export default PaymentsRouteGuard;
