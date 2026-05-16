/**
 * Learner routes that need the enrollment list (`GET /usercourses/user/:userId`).
 * Extend when new learner pages read `userCourseData` / `userCoursesData` from context.
 */
export function shouldFetchLearnerEnrollmentList(pathname: string): boolean {
	if (pathname.startsWith('/course/')) {
		return true;
	}
	if (pathname === '/submissions' || pathname.startsWith('/submissions/')) {
		return true;
	}
	return (
		pathname === '/courses' || (pathname.startsWith('/courses/') && !pathname.startsWith('/courses/certificates'))
	);
}
