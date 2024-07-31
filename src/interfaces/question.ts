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
	createdAt: string;
	updatedAt: string;
}
