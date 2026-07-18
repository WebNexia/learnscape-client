/**
 * Admin / owner / super-admin / instructor routes that need the org courses list
 * (`GET /courses/organisation/:orgId` or `/instructor` variant).
 * Dashboard and other pages should not trigger this fetch on mount.
 */
export function shouldFetchStaffCoursesList(pathname: string): boolean {
	if (pathname === '/admin/courses' || pathname.startsWith('/admin/courses/')) {
		return true;
	}
	if (pathname === '/admin/submissions' || pathname.startsWith('/admin/submissions/')) {
		return true;
	}
	if (pathname === '/admin/payments' || pathname.startsWith('/admin/payments/')) {
		return true;
	}
	if (pathname === '/admin/calendar' || pathname.startsWith('/admin/calendar/')) {
		return true;
	}
	if (pathname.startsWith('/admin/course-roster/')) {
		return true;
	}
	if (pathname === '/admin/lessons' || pathname.startsWith('/admin/lesson-edit/')) {
		return true;
	}
	if (pathname === '/admin/questions' || pathname.startsWith('/admin/questions/')) {
		return true;
	}
	if (pathname === '/admin/documents' || pathname.startsWith('/admin/documents/')) {
		return true;
	}

	if (pathname === '/instructor/courses' || pathname.startsWith('/instructor/courses/')) {
		return true;
	}
	if (pathname === '/instructor/submissions' || pathname.startsWith('/instructor/submissions/')) {
		return true;
	}
	if (pathname === '/instructor/calendar' || pathname.startsWith('/instructor/calendar/')) {
		return true;
	}
	if (pathname.startsWith('/instructor/course-roster/')) {
		return true;
	}
	if (pathname === '/instructor/lessons' || pathname.startsWith('/instructor/lesson-edit/')) {
		return true;
	}
	if (pathname === '/instructor/questions' || pathname.startsWith('/instructor/questions/')) {
		return true;
	}
	if (pathname === '/instructor/documents' || pathname.startsWith('/instructor/documents/')) {
		return true;
	}

	return false;
}
