export interface MatchingPair {
	id: string;
	question: string;
	answer: string;
}

export interface QuestionInterface {
	_id: string;
	questionType: string;
	question: string;
	options: string[];
	correctAnswer: string;
	videoUrl: string;
	imageUrl: string;
	orgId: string;
	isActive: boolean;
	audio: boolean;
	video: boolean;
	matchingPairs: MatchingPair[];
	createdAt: string;
	updatedAt: string;
}
