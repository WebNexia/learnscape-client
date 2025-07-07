import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import Loading from '../layouts/loading/Loading';

interface AuthRouteGuardProps {
	children: React.ReactNode;
}

const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({ children }) => {
	const { user } = useContext(UserAuthContext);

	// Show loading while user data is being fetched
	if (!user) {
		return <Loading />;
	}

	// Redirect to auth if user is not authenticated
	if (!user._id) {
		return <Navigate to='/auth' replace />;
	}

	// Render the protected component
	return <>{children}</>;
};

export default AuthRouteGuard;
