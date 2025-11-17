import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface InstructorRouteGuardProps {
	children: React.ReactNode;
}

const InstructorRouteGuard: React.FC<InstructorRouteGuardProps> = ({ children }) => {
	const { user, firebaseUserId } = useContext(UserAuthContext);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// If we have a Firebase user but no user data yet, wait for it
		if (firebaseUserId && !user) {
			// Set a timeout to prevent infinite loading
			const timer = setTimeout(() => {
				setIsLoading(false);
			}, 3000); // Wait up to 3 seconds for user data
			return () => clearTimeout(timer);
		} else if (!firebaseUserId) {
			const timer = setTimeout(() => {
				setIsLoading(false);
			}, 500); // Wait 500ms for context to update
			return () => clearTimeout(timer);
		} else {
			setIsLoading(false);
		}
	}, [user, firebaseUserId]);

	// Show loading while user data is being fetched
	if (isLoading) {
		return <Loading />;
	}

	// Redirect to auth if no user (not logged in)
	if (!user) {
		if (firebaseUserId) {
			return <Loading />;
		}
		return <Navigate to='/auth' replace />;
	}

	// Redirect to appropriate dashboard based on role
	if (user.role === Roles.ADMIN || user.role === Roles.OWNER || user.role === Roles.SUPER_ADMIN) {
		return <Navigate to='/admin/dashboard' replace />;
	}

	if (user.role === Roles.USER) {
		return <Navigate to='/dashboard' replace />;
	}

	// Only allow instructor role
	if (user.role !== Roles.INSTRUCTOR) {
		return <Navigate to='/auth' replace />;
	}

	// Render the protected instructor component
	return <>{children}</>;
};

export default InstructorRouteGuard;
