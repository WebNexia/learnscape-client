import { User } from '../interfaces/user';
import { Roles, isLearnerRole } from '../interfaces/enums';
import { isSubscriptionsProductEnabled } from '../config/features';

/**
 * Learners with a paid platform course, subscription, or any active course enrollment
 * (including partner/external courses) can use calendar, community, messages, and resources.
 */
export function hasLearnerPlatformFeatureAccess(
	user: User | undefined,
	options?: { hasActiveCourseEnrollment?: boolean }
): boolean {
	if (!user) return false;
	if (!isLearnerRole(user.role)) return true;

	if (user.hasRegisteredCourse) return true;
	if (user.accessLevel === 'full' || user.accessLevel === 'subscription') return true;

	if (isSubscriptionsProductEnabled) {
		if (user.isSubscribed) return true;
		if (user.subscriptionValidUntil && new Date(user.subscriptionValidUntil) > new Date()) return true;
	}

	if (options?.hasActiveCourseEnrollment) return true;

	return false;
}

/** Client-side mirror of server enrollment access after course registration. */
export function getPostEnrollmentUserPatch(
	user: User | undefined,
	course: { courseManagement?: { isExternal?: boolean } } | undefined,
	options?: { isPaidPlatformCourse?: boolean }
): Partial<User> | null {
	if (!user || !course) return null;

	if (course.courseManagement?.isExternal) {
		return user.accessLevel === 'full' ? null : { accessLevel: 'full' };
	}

	if (options?.isPaidPlatformCourse && !user.hasRegisteredCourse) {
		return { hasRegisteredCourse: true };
	}

	return null;
}
