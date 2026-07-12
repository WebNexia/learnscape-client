/**
 * Routes that need daily upload limit stats (`GET /users/upload-counts`).
 * Dashboard and other read-only pages should not trigger this fetch on mount.
 */
export function shouldFetchUploadCounts(pathname: string): boolean {
	if (pathname === '/messages' || pathname.startsWith('/messages/')) {
		return true;
	}
	if (pathname === '/admin/messages' || pathname.startsWith('/admin/messages/')) {
		return true;
	}
	if (pathname === '/instructor/messages' || pathname.startsWith('/instructor/messages/')) {
		return true;
	}

	if (pathname === '/community' || pathname.startsWith('/community/')) {
		return true;
	}
	if (pathname === '/admin/community' || pathname.startsWith('/admin/community/')) {
		return true;
	}
	if (pathname === '/instructor/community' || pathname.startsWith('/instructor/community/')) {
		return true;
	}

	if (pathname.startsWith('/courses/') && pathname.includes('/lesson/')) {
		return true;
	}
	if (pathname.startsWith('/admin/lesson-edit/')) {
		return true;
	}
	if (pathname.startsWith('/instructor/lesson-edit/')) {
		return true;
	}

	return false;
}
