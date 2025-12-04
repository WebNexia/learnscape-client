/**
 * Calculates the percentage score from earned and possible points
 * @param earned - Points earned by the user
 * @param possible - Total possible points
 * @returns Percentage as a number (0-100), or null if calculation is not possible
 */
export const calculateScorePercentage = (earned: number | undefined | null, possible: number | undefined | null): number | null => {
	if (earned === undefined || earned === null || possible === undefined || possible === null || possible === 0) {
		return null;
	}
	return Math.round((earned / possible) * 100);
};
