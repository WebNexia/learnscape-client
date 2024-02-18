export interface Question {
	_id: string;
	questionType?: string;
	optionOne: string;
	optionTwo: string;
	optionThree: string;
	optionFour: string;
	correctAnswer: string;
	order: number;
	videoUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}
