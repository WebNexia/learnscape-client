/**
 * Admin routes that need the org users list (`GET /users/organisation/:orgId`).
 * Calendar and community use dedicated search / event APIs instead.
 */
export function shouldFetchStaffUsersList(pathname: string): boolean {
	if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
		return true;
	}

	return false;
}
