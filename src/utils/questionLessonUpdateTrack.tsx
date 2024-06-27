import { QuestionUpdateTrack } from '../pages/AdminLessonEditPage';

// Utility function to update question and lesson state
export const questionLessonUpdateTrack = (
	questionId: string,
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>> | undefined,
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>> | undefined
) => {
	if (setIsLessonUpdated) {
		setIsLessonUpdated(true);
	}

	if (setIsQuestionUpdated) {
		setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => {
			return prevData?.map((data) => {
				if (data.questionId === questionId) {
					return {
						...data,
						isUpdated: true,
					};
				}
				return data;
			});
		});
	}
};
