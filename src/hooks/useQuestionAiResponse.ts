import { useState } from 'react';
import { MatchingPair, BlankValuePair } from '../interfaces/question';
import axiosInstance from '../utils/axiosInstance';

export interface QuestionPrompt {
	topic: string;
	level: string;
	numberOfQuestions: string;
	questionType: string;
	description: string;
}

export interface GeneratedQuestion {
	question: string;
	options?: string[];
	correctAnswer: string;
	matchingPairs?: MatchingPair[];
	blankValuePairs?: BlankValuePair[];
}

const useQuestionAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<GeneratedQuestion[]>([]);
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
	const [lastRequestTime, setLastRequestTime] = useState<number>(0);

	const generateQuestions = async (questionPrompt: QuestionPrompt): Promise<GeneratedQuestion[]> => {
		// Rate limiting: prevent requests more frequent than every 1 second
		const now = Date.now();
		const timeSinceLastRequest = now - lastRequestTime;

		if (timeSinceLastRequest < 1000) {
			throw new Error('Please wait 1 second before generating another question.');
		}

		setIsLoadingAiResponse(true);
		setLastRequestTime(now);

		try {
			const response = await axiosInstance.post('/ai/generate-questions', {
				topic: questionPrompt.topic,
				level: questionPrompt.level,
				numberOfQuestions: questionPrompt.numberOfQuestions,
				questionType: questionPrompt.questionType,
				description: questionPrompt.description,
			});

			const parsedQuestions = response.data?.data ?? [];

			if (!Array.isArray(parsedQuestions)) {
				throw new Error('Invalid response format. Please try again.');
			}

			setAiResponse(parsedQuestions);
			return parsedQuestions;
		} catch (error: unknown) {
			console.error('Error generating questions:', error);

			if (error instanceof Error && error.message?.includes('Please wait 1 second')) {
				throw error;
			}
			const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
			if (err.response?.status === 429) {
				throw new Error('AI rate limit exceeded. Please wait 1-2 minutes before trying again.');
			}
			const msg = err.response?.data?.message ?? err.message ?? 'Failed to generate questions. Please try again.';
			throw new Error(msg);
		} finally {
			setIsLoadingAiResponse(false);
		}
	};

	return {
		aiResponse,
		isLoadingAiResponse,
		generateQuestions,
	};
};

export default useQuestionAiResponse;
