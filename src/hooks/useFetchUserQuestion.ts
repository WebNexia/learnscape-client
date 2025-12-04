import { useCallback } from 'react';
import axios from '@utils/axiosInstance';
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
}

export const useFetchUserQuestion = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchUserAnswersByLesson = useCallback(
		async (lessonId: string): Promise<UserQuestionData[]> => {
			try {
				const res = await axios.get(`${base_url}/userquestions/lesson/${lessonId}`);
				return (
					res.data.response?.map((data: UserQuestion) => ({
						userQuestionId: data._id,
						questionId: data.questionId,
						userAnswer: data.userAnswer,
						audioRecordUrl: data.audioRecordUrl,
						videoRecordUrl: data.videoRecordUrl,
						teacherFeedback: data.teacherFeedback,
						teacherAudioFeedbackUrl: data.teacherAudioFeedbackUrl,
						userMatchingPairAnswers: data.userMatchingPairAnswers,
						userBlankValuePairAnswers: data.userBlankValuePairAnswers,
						pointsEarned: data.pointsEarned,
						pointsPossible: data.pointsPossible,
						isAutoGraded: data.isAutoGraded,
						partialScores: data.partialScores,
					})) || []
				);
			} catch (error) {
				console.log(error);
				return [];
			}
		},
		[base_url]
	);

	return {
		fetchUserAnswersByLesson,
	};
};
