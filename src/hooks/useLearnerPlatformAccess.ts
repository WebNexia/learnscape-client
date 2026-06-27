import { useContext, useMemo } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import { hasLearnerPlatformFeatureAccess } from '../utils/learnerPlatformAccess';

export function useLearnerPlatformAccess(): boolean {
	const { user } = useContext(UserAuthContext);
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	const hasActiveCourseEnrollment = (userCoursesData?.length ?? 0) > 0;

	return useMemo(
		() => hasLearnerPlatformFeatureAccess(user, { hasActiveCourseEnrollment }),
		[user, hasActiveCourseEnrollment]
	);
}
