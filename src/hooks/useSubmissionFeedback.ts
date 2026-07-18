import { useQuery, UseQueryResult } from 'react-query';
import axios from '@utils/axiosInstance';
import { decode } from 'html-entities';
import { useAuth } from './useAuth';

export interface SubmissionFeedbackUserQuestion {
	_id: string;
	questionId: Record<string, unknown>;
	userAnswer?: string;
	userMatchingPairAnswers?: Array<{ id: string; answer: string }>;
	userBlankValuePairAnswers?: Array<{ id: string; value: string }>;
	videoRecordUrl?: string;
	audioRecordUrl?: string;
	teacherFeedback?: string;
	teacherAudioFeedbackUrl?: string;
	pointsEarned?: number;
	pointsPossible?: number;
	isAutoGraded?: boolean;
	userId?: { username?: string; firebaseUserId?: string };
}

export interface SubmissionFeedbackData {
	response: SubmissionFeedbackUserQuestion[];
	student?: { username?: string; firebaseUserId?: string } | null;
	lessonName: string;
	courseName: string;
	chapterName: string;
	teacherFeedback: string;
	isFeedbackGiven: boolean;
	isChecked: boolean;
	totalPossible: number;
}

export const SUBMISSION_FEEDBACK_STALE_MS = 0;
export const SUBMISSION_FEEDBACK_CACHE_MS = 10 * 60 * 1000;

export const submissionFeedbackQueryKey = (
	userLessonId: string | undefined,
	submissionId: string | undefined
): [string, string | undefined, string | undefined] => ['submissionFeedback', userLessonId, submissionId];

export async function fetchSubmissionFeedback(
	userLessonId: string,
	submissionId: string | undefined,
	baseUrl: string
): Promise<SubmissionFeedbackData> {
	const res = await axios.get(`${baseUrl}/userQuestions/userlesson/${userLessonId}`, {
		params: submissionId ? { submissionId } : undefined,
	});
	const data = res.data;

	// Server escapes text on save (validator.escape); decode so ' & < > show as typed
	const response: SubmissionFeedbackUserQuestion[] = (data?.response || []).map((item: SubmissionFeedbackUserQuestion) => ({
		...item,
		userAnswer: item.userAnswer != null ? decode(item.userAnswer) : item.userAnswer,
		teacherFeedback: item.teacherFeedback != null ? decode(item.teacherFeedback) : item.teacherFeedback,
	}));

	return {
		response,
		student: data?.student ?? response[0]?.userId ?? null,
		lessonName: data?.lessonName ?? '',
		courseName: data?.courseName ?? '',
		chapterName: data?.chapterName ?? '',
		teacherFeedback: data?.teacherFeedback ?? '',
		isFeedbackGiven: Boolean(data?.isFeedbackGiven),
		isChecked: Boolean(data?.isChecked),
		totalPossible: data?.totalPossible ?? 0,
	};
}

type UseSubmissionFeedbackOptions = {
	enabled?: boolean;
};

export const useSubmissionFeedback = (
	userLessonId: string | undefined,
	submissionId: string | undefined,
	options: UseSubmissionFeedbackOptions = {}
): UseQueryResult<SubmissionFeedbackData, Error> => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useAuth();
	const { enabled = true } = options;

	return useQuery<SubmissionFeedbackData, Error>(
		submissionFeedbackQueryKey(userLessonId, submissionId),
		(): Promise<SubmissionFeedbackData> => fetchSubmissionFeedback(userLessonId!, submissionId, baseUrl),
		{
			enabled: enabled && !!userLessonId && !!user?._id,
			staleTime: SUBMISSION_FEEDBACK_STALE_MS,
			cacheTime: SUBMISSION_FEEDBACK_CACHE_MS,
			retry: 2,
			refetchOnWindowFocus: false,
		}
	);
};
