export type SpeakingQuestion = {
	_id: string;
	prompt: string;
	imageUrl: string;
	videoUrl: string;
	askAudio: boolean;
	askVideo: boolean;
};

export type SpeakingQuestionInput = {
	prompt: string;
	imageUrl: string;
	videoUrl: string;
	askAudio: boolean;
	askVideo: boolean;
};

export type SpeakingAnswerDraft = {
	questionId: string;
	audioUrl: string;
	videoUrl: string;
};
