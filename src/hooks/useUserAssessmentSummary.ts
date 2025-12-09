import { useQuery } from 'react-query';
import { assessmentService, AssessmentSummary } from '../services/assessmentService';

/**
 * Fetches pre/post assessment summary for a given user and assessment group.
 * Does not render anything by itself; intended to be used by student/admin/instructor report UIs.
 */
export const useUserAssessmentSummary = (userId: string | undefined, groupId: string | undefined) => {
	const enabled = Boolean(userId && groupId);

	return useQuery<AssessmentSummary, Error>(
		['assessmentSummary', userId, groupId],
		() => assessmentService.getUserAssessmentSummary(userId as string, groupId as string),
		{
			enabled,
		}
	);
};


