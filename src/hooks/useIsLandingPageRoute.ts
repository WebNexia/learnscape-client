import { useLocation } from 'react-router-dom';

/**
 * Custom hook to determine if the current route is a landing page route
 * Landing page routes don't need to fetch admin/user data to improve performance
 *
 * @returns {boolean} true if current route is a landing page route
 */
export const useIsLandingPageRoute = (): boolean => {
	const location = useLocation();

	// Handle case where location might be null (outside Router context)
	if (!location) {
		return false;
	}

	return (
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		(location.pathname?.startsWith('/course/') && !location.pathname?.includes('/userCourseId/'))
	);
};
