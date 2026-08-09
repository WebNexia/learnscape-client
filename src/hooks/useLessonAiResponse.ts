import { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../utils/axiosInstance';

export interface LessonPrompt {
	topic: string;
	level: string;
	description: string;
}

const useLessonAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
	const [lastRequestTime, setLastRequestTime] = useState<number>(0);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const generateLessonContent = async (lessonPrompt: LessonPrompt) => {
		// Rate limiting: prevent requests more frequent than every 1 second
		const now = Date.now();
		const timeSinceLastRequest = now - lastRequestTime;

		if (timeSinceLastRequest < 1000) {
			throw new Error('Please wait 1 second before generating another lesson.');
		}

		setIsLoadingAiResponse(true);
		setLastRequestTime(now);

		try {
			const response = await axiosInstance.post(`${base_url}/ai/generate-lesson`, {
				topic: lessonPrompt.topic,
				level: lessonPrompt.level,
				description: lessonPrompt.description,
			});

			const content = response.data?.data;
			if (!content) {
				throw new Error('Failed to generate lesson content. Please try again.');
			}

			setAiResponse(content);
			return content;
		} catch (error) {
			console.error('Error generating lesson content:', error);

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 429) {
					throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
				}
				throw new Error(error.response?.data?.message || 'Failed to generate lesson content. Please try again.');
			}

			if (error instanceof Error) {
				throw error;
			}

			throw new Error('Failed to generate lesson content. Please try again.');
		} finally {
			setIsLoadingAiResponse(false);
		}
	};

	return {
		aiResponse,
		isLoadingAiResponse,
		generateLessonContent,
	};
};

export default useLessonAiResponse;
