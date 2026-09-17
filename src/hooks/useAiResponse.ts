import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export interface QuestionPrompt {
	question: string;
	type: string;
	options?: string[];
	correctAnswer?: string;
	userInput?: string;
	/** Lesson content (plain text) for open-ended AI context */
	lessonText?: string;
	/** Chapter name for open-ended AI context */
	chapterName?: string;
}

const useAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);

	const handleInitialSubmit = async (userPrompt: QuestionPrompt) => {
		setIsLoadingAiResponse(true);

		try {
			const body: Record<string, unknown> = {
				question: userPrompt.question,
				type: userPrompt.type,
				options: userPrompt.options,
				correctAnswer: userPrompt.correctAnswer,
				userInput: userPrompt.userInput,
			};
			if (userPrompt.lessonText != null) body.lessonText = userPrompt.lessonText;
			if (userPrompt.chapterName != null) body.chapterName = userPrompt.chapterName;
			const response = await axiosInstance.post('/ai/feedback', body);
			const responseText = response.data?.data ?? '';
			setAiResponse(responseText);
			return responseText;
		} catch (error: unknown) {
			console.error('Error fetching AI response:', error);
			const status = (error as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
			const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
			if (status === 429) {
				throw new Error('AI şu an yoğun. Lütfen 1–2 dakika bekleyip tekrar deneyin.');
			}
			if (status === 503) {
				throw new Error(message || 'AI feedback service is not configured.');
			}
			throw new Error(message || 'Failed to get AI feedback');
		} finally {
			setIsLoadingAiResponse(false);
		}
	};

	return {
		aiResponse,
		isLoadingAiResponse,
		handleInitialSubmit,
	};
};

export default useAiResponse;
