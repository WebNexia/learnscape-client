import { QuestionType } from '../interfaces/questionTypes';

export const questionTypeNameFinder = (questionTypeId: string, questionTypes: QuestionType[]) => {
	const questionType = questionTypes.find((type: QuestionType) => type._id === questionTypeId);
	return questionType?.name;
};
