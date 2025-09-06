import { useState } from 'react';
import { QuestionType } from '../interfaces/enums';
import { MatchingPair, BlankValuePair } from '../interfaces/question';

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

	const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

	const generateQuestions = async (questionPrompt: QuestionPrompt): Promise<GeneratedQuestion[]> => {
		// Rate limiting: prevent requests more frequent than every 1 second
		const now = Date.now();
		const timeSinceLastRequest = now - lastRequestTime;

		if (timeSinceLastRequest < 1000) {
			throw new Error('Please wait 1 second before generating another question.');
		}

		setIsLoadingAiResponse(true);
		setLastRequestTime(now);

		let promptMessage = '';
		let systemMessage = '';

		switch (questionPrompt.questionType) {
			case QuestionType.MULTIPLE_CHOICE:
				systemMessage =
					'You are an expert educational content creator. Generate multiple choice questions in JSON format. Each question must have exactly 4 options and 1 correct answer, and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} multiple choice question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Each question must have exactly 4 options (A, B, C, D)
					- Provide 1 correct answer
					- Make questions engaging and appropriate for the specified level
					- Ensure all options are plausible but only one is correct
					- Optionally include imageUrl or videoUrl if they would enhance the question
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "What is the main function of photosynthesis?",
							"options": ["To produce oxygen", "To create glucose", "To absorb water", "To release carbon dioxide"],
							"correctAnswer": "To create glucose",
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant, set the field to an empty string or omit it.
				`;
				break;

			case QuestionType.TRUE_FALSE:
				systemMessage =
					'You are an expert educational content creator. Generate true/false questions in JSON format. Each question must have a correct answer of either "True" or "False", and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} true/false question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Each question must have a correct answer of either "True" or "False"
					- Make questions clear and unambiguous
					- Ensure questions are appropriate for the specified level
					- Optionally include imageUrl or videoUrl if they would enhance the question
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "Photosynthesis occurs only during the day.",
							"correctAnswer": "True",
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant, set the field to an empty string or omit it.
				`;
				break;

			case QuestionType.OPEN_ENDED:
				systemMessage =
					'You are an expert educational content creator. Generate open-ended questions in JSON format. These questions should encourage detailed responses and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} open-ended question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Questions should encourage detailed, thoughtful responses
					- Make questions engaging and appropriate for the specified level
					- Questions should be open-ended, not yes/no
					- Optionally include imageUrl or videoUrl if they would enhance the question
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "Explain how photosynthesis contributes to the carbon cycle and why it's important for life on Earth.",
							"correctAnswer": "This is an open-ended question that encourages detailed explanation.",
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant, set the field to an empty string or omit it.
				`;
				break;

			case QuestionType.MATCHING:
				systemMessage =
					'You are an expert educational content creator. Generate matching questions in JSON format. Each question must have 4-6 matching pairs, and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} matching question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Each question must have 4-6 matching pairs
					- Provide clear questions and corresponding answers
					- Make pairs logical and educational
					- Optionally include imageUrl or videoUrl if they would enhance the question
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "Match the following terms with their definitions:",
							"matchingPairs": [
								{"id": "1", "question": "Photosynthesis", "answer": "Process of making food from sunlight"},
								{"id": "2", "question": "Chlorophyll", "answer": "Green pigment in plants"},
								{"id": "3", "question": "Glucose", "answer": "Sugar produced during photosynthesis"},
								{"id": "4", "question": "Stomata", "answer": "Tiny openings in leaves"}
							],
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant, set the field to an empty string or omit it.
				`;
				break;

			case QuestionType.FITB_TYPING:
			case QuestionType.FITB_DRAG_DROP:
				systemMessage =
					'You are an expert educational content creator. Generate fill-in-the-blank questions in JSON format. Each question must have 3-5 blanks with corresponding values, and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} fill-in-the-blank question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Each question must have 3-5 blanks marked as (___1___), (___2___), etc.
					- Provide the correct values for each blank
					- Make the text flow naturally with the blanks
					- Optionally include imageUrl or videoUrl if they would enhance the question
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "During photosynthesis, plants use (___1___) and (___2___) to produce (___3___) and oxygen.",
							"blankValuePairs": [
								{"id": "1", "blank": 1, "value": "sunlight"},
								{"id": "2", "blank": 2, "value": "carbon dioxide"},
								{"id": "3", "blank": 3, "value": "glucose"}
							],
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant, set the field to an empty string or omit it.
				`;
				break;

			case QuestionType.FLIP_CARD:
				systemMessage =
					'You are an expert educational content creator. Generate flip card questions in JSON format. Each flip card has a front (question) and back (answer) side, and may include relevant image or video URLs.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} flip card question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Each flip card has a front side (question) and back side (answer)
					- Front side should be a clear question or term
					- Back side should be the corresponding answer or definition
					- Optionally include imageUrl or videoUrl that would be relevant to the question
					- Make content engaging and educational
					- For imageUrl/videoUrl, use relevant educational content from Unsplash or similar free services
					
					Return the response in this exact JSON format:
					[
						{
							"question": "What is the main function of chlorophyll?",
							"correctAnswer": "Chlorophyll absorbs sunlight and converts it into chemical energy during photosynthesis.",
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": ""
						}
					]
					
					Note: If an image or video is not relevant or needed for the question, you can omit the field or set it to an empty string.
				`;
				break;

			case QuestionType.AUDIO_VIDEO:
				systemMessage =
					'You are an expert educational content creator. Generate audio/video questions in JSON format. These questions provide instructions for students to upload audio or video responses with specific time limits.';
				promptMessage = `
					Create ${questionPrompt.numberOfQuestions} audio/video question(s) based on the following requirements:
					
					Topic: ${questionPrompt.topic}
					Level: ${questionPrompt.level}
					Additional Instructions: ${questionPrompt.description}
					
					Requirements:
					- Questions should provide clear instructions for students to record and upload audio or video
					- Can include optional imageUrl or videoUrl for students to reference or discuss
					- Instructions should be engaging and educational
					- Focus on speaking, presentation, or demonstration skills
					- Make instructions appropriate for the topic and level
					- Always specify time limits: maximum 60 seconds for audio, maximum 30 seconds for video
					- Choose appropriate time limits based on the complexity of the task and student level
					- Set audio/video flags based on the instruction type:
					  * If instruction mentions "record audio" or "speak about", set audio: true, video: false
					  * If instruction mentions "record video" or "demonstrate", set audio: false, video: true
					  * If instruction allows both, set audio: true, video: true
					
					Time Limit Guidelines:
					- Audio recordings: maximum 60 seconds
					- Video recordings: maximum 30 seconds
					- Simple explanations: 15-30 seconds
					- Detailed explanations: 30-60 seconds (audio only)
					- Demonstrations: 15-30 seconds (video only)
					
					Return the response in this exact JSON format:
					[
						{
							"question": "Record a 30-second video explaining the process of photosynthesis. Describe each stage in detail and use the provided diagram as a reference.",
							"imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
							"videoUrl": "",
							"audio": false,
							"video": true
						}
					]
					
					Note: 
					- imageUrl and videoUrl are optional - include them if they would help students with their response
					- If no image or video is needed, set the field to an empty string or omit it
					- Focus on creating clear, actionable instructions for students
					- Always include specific time limits in the instructions
					- The audio and video boolean flags control which recording options are available to students
					- Set these flags based on the type of response you want students to provide
				`;
				break;

			default:
				throw new Error('Unsupported question type');
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo-16k',
					messages: [
						{ role: 'system', content: systemMessage },
						{ role: 'user', content: promptMessage },
					],
					temperature: 0.7,
					max_tokens: 4000,
				}),
			});

			const data = await response.json();

			if (response.status === 429) {
				throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
			}

			if (!response.ok) {
				if (response.status === 429) {
					throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
				}
				throw new Error(data.error?.message || `API Error: ${response.status}`);
			}

			if (data.error) {
				throw new Error(data.error.message);
			}

			const aiResponse = data.choices[0].message.content;

			// Parse the JSON response
			let parsedQuestions: GeneratedQuestion[];
			try {
				parsedQuestions = JSON.parse(aiResponse);
			} catch (parseError) {
				throw new Error('Failed to parse AI response. Please try again.');
			}

			// Validate the parsed questions
			if (!Array.isArray(parsedQuestions)) {
				throw new Error('Invalid response format. Please try again.');
			}

			setAiResponse(parsedQuestions);
			return parsedQuestions;
		} catch (error) {
			console.error('Error generating questions:', error);

			// Provide specific error messages
			if (error instanceof Error) {
				if (error.message?.includes('Please wait 1 second')) {
					// This is our local rate limiting
					throw error;
				} else if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
					throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
				} else if (error.message?.includes('API key')) {
					throw new Error('API key error. Please check your configuration.');
				} else {
					throw new Error(`Failed to generate questions: ${error.message}`);
				}
			}

			throw new Error('Failed to generate questions. Please try again.');
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
