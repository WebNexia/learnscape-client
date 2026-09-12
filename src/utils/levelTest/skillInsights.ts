import { getPassageForLevel } from './content';
import type { LevelResult } from './engine';
import { isAnswerCorrect } from './scoring';
import type { ReadingQuestionType } from './types';

export const READING_SKILL_IDS = ['main_idea', 'detail', 'vocabulary', 'inference'] as const;
export type ReadingSkillId = (typeof READING_SKILL_IDS)[number];
export type ReadingSkillInsight = {
	id: ReadingSkillId;
	label: string;
	correct: number;
	total: number;
	dots: number;
	status: 'strong' | 'good' | 'developing';
	statusLabel: string;
};

const skillByQuestionType: Record<ReadingQuestionType, ReadingSkillId> = {
	main_idea: 'main_idea',
	explicit_detail: 'detail',
	cause_and_effect: 'detail',
	vocabulary_in_context: 'vocabulary',
	inference: 'inference',
	purpose: 'inference',
	attitude: 'inference',
	gap_fill: 'vocabulary',
};
const skillLabels: Record<ReadingSkillId, string> = {
	main_idea: 'Ana fikri anlama',
	detail: 'Detayları yakalama',
	vocabulary: 'Bağlamdan anlam çıkarma',
	inference: 'Çıkarım yapma',
};

function statusForRatio(ratio: number): Pick<ReadingSkillInsight, 'status' | 'statusLabel' | 'dots'> {
	const dots = Math.max(1, Math.round(ratio * 5));
	if (ratio >= 0.9) return { status: 'strong', statusLabel: 'Güçlü', dots: 5 };
	if (ratio >= 0.7) return { status: 'good', statusLabel: 'İyi', dots };
	return { status: 'developing', statusLabel: 'Gelişiyor', dots };
}

export function buildSkillInsights(results: LevelResult[]): ReadingSkillInsight[] {
	const tallies: Record<ReadingSkillId, { correct: number; total: number }> = {
		main_idea: { correct: 0, total: 0 },
		detail: { correct: 0, total: 0 },
		vocabulary: { correct: 0, total: 0 },
		inference: { correct: 0, total: 0 },
	};
	for (const result of results) {
		const primary = getPassageForLevel(result.level, 'primary');
		if (primary) {
			for (const question of primary.questions) {
				const skill = skillByQuestionType[question.type];
				tallies[skill].total += 1;
				if (isAnswerCorrect(question, result.primary.answers[question.id])) tallies[skill].correct += 1;
			}
		}
		if (!result.verification.attempted) continue;
		const verification = getPassageForLevel(result.level, 'verification');
		if (!verification) continue;
		for (const question of verification.questions) {
			const skill = skillByQuestionType[question.type];
			tallies[skill].total += 1;
			if (isAnswerCorrect(question, result.verification.answers[question.id])) tallies[skill].correct += 1;
		}
	}
	return READING_SKILL_IDS.flatMap((id) => {
		const tally = tallies[id];
		return tally.total
			? [{ id, label: skillLabels[id], correct: tally.correct, total: tally.total, ...statusForRatio(tally.correct / tally.total) }]
			: [];
	});
}

export function summarizeAttempt(results: LevelResult[]) {
	return results.reduce(
		(summary, result) => {
			summary.correct += result.primary.correct;
			summary.total += result.primary.total;
			if (result.verification.attempted) {
				summary.correct += result.verification.correct;
				summary.total += result.verification.total;
			}
			return summary;
		},
		{ correct: 0, total: 0 }
	);
}

export function getHeadlineScore(results: LevelResult[]) {
	const attempt = summarizeAttempt(results);
	return attempt.total ? Math.round((attempt.correct / attempt.total) * 100) : 0;
}
