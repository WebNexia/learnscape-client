import { useCallback } from 'react';
import axios from '@utils/axiosInstance';
import { decode } from 'html-entities';
import { UserBlankValuePairAnswers, UserMatchingPairAnswers, UserQuestion } from '../interfaces/userQuestion';

export interface UserQuestionData {
	userQuestionId: string;
	questionId: string;
	userAnswer: string;
	audioRecordUrl: string;
	videoRecordUrl: string;
	teacherFeedback: string;
	teacherAudioFeedbackUrl: string;
	userMatchingPairAnswers: UserMatchingPairAnswers[];
	userBlankValuePairAnswers: UserBlankValuePairAnswers[];
	pointsEarned?: number;
	pointsPossible?: number;
	isAutoGraded?: boolean;
	partialScores?: { [key: string]: number };
	/** Open-ended: number of AI feedback requests (max 2 first time + 1 practice again) */
	aiFeedbackRequestCount?: number;
	/** Open-ended: last AI feedback text */
	lastAiFeedback?: string;
}

export const useFetchUserQuestion = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchUserAnswersByLesson = useCallback(
		async (lessonId: string): Promise<UserQuestionData[]> => {
			try {
				const res = await axios.get(`${base_url}/userquestions/lesson/${lessonId}`);

				// Support response array in response, data, or top-level (different backends/proxies)
				const rawList = res.data?.response ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : null);
				if (!Array.isArray(rawList)) return [];
				return rawList.map((data: UserQuestion) => {
					// Backend may return questionId as raw id, populated object { _id }, or populated array [{ _id, ... }]
					let questionIdStr = '';
					if (Array.isArray(data.questionId) && data.questionId.length > 0) {
						const first = data.questionId[0];
						questionIdStr = typeof first === 'object' && first !== null && '_id' in first ? String((first as { _id: string })._id) : String(first);
					} else if (typeof data.questionId === 'object' && data.questionId !== null && '_id' in data.questionId) {
						questionIdStr = String((data.questionId as { _id: string })._id);
					} else {
						questionIdStr = String(data.questionId ?? '');
					}
					return {
						userQuestionId: data._id,
						questionId: questionIdStr,
						// Server escapes text on save (validator.escape); decode so ' & < > show as typed
						userAnswer: decode(data.userAnswer ?? ''),
						audioRecordUrl: data.audioRecordUrl,
						videoRecordUrl: data.videoRecordUrl,
						teacherFeedback: decode(data.teacherFeedback ?? ''),
						teacherAudioFeedbackUrl: data.teacherAudioFeedbackUrl,
						userMatchingPairAnswers: data.userMatchingPairAnswers,
						userBlankValuePairAnswers: data.userBlankValuePairAnswers,
						pointsEarned: data.pointsEarned,
						pointsPossible: data.pointsPossible,
						isAutoGraded: data.isAutoGraded,
						partialScores: data.partialScores,
						aiFeedbackRequestCount: data.aiFeedbackRequestCount,
						lastAiFeedback: data.lastAiFeedback,
					};
				});
			} catch (error) {
				console.log(error);
				return [];
			}
		},
		[base_url],
	);

	return {
		fetchUserAnswersByLesson,
	};
};
