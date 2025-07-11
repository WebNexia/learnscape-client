import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import Loading from '../layouts/loading/Loading';

interface LearnerRouteGuardProps {
	children: React.ReactNode;
}

const LearnerRouteGuard: React.FC<LearnerRouteGuardProps> = ({ children }) => {
	const { user, firebaseUserId } = useContext(UserAuthContext);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// If we have a Firebase user but no user data yet, wait for it
		if (firebaseUserId && !user) {
			return;
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
		// Check if we're still in the initial loading state
		// If user is null after a reasonable time, redirect to auth
		return <Navigate to='/auth' replace />;
	}

	// Redirect to admin dashboard if user is admin, or to auth if not authenticated
	if (user.role === Roles.ADMIN) {
		return <Navigate to='/admin/dashboard' replace />;
	}

	if (user.role !== Roles.USER) {
		return <Navigate to='/auth' replace />;
	}

	// Render the protected learner component
	return <>{children}</>;
};

export default LearnerRouteGuard;
