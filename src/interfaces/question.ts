export interface QuestionInterface {
	_id: string;
	questionType: string;
	question: string;
	options: string[];
	correctAnswer: string;
	videoUrl: string;
	imageUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}
