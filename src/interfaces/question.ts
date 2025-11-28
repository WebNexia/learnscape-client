export interface MatchingPair {
	id: string;
	question: string;
	answer: string;
}

export interface BlankValuePair {
	id: string;
	blank: number;
	value: string;
}

export interface TranslatePair {
	id: string;
	originalText: string;
	translation: string;
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
	isAiGenerated: boolean;
	matchingPairs: MatchingPair[];
	blankValuePairs: BlankValuePair[];
	translatePairs: TranslatePair[];
	createdAt: string;
	updatedAt: string;
	clonedFromId: string;
	clonedFromQuestion: string;
	usedInLessons: string[];
	createdBy: string;
	updatedBy: string;
	createdByName: string;
	updatedByName: string;
	createdByImageUrl: string;
	updatedByImageUrl: string;
	createdByRole: string;
	updatedByRole: string;
}

export interface ArchivedQuestion extends QuestionInterface {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
	questionTypeName?: string;
}
