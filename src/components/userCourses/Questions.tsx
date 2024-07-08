import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import Question from './Question';
import { useState } from 'react';
import { useUserCourseLessonData } from '../../hooks/useUserCourseLessonData';
import { UserQuestionData } from '../../hooks/useFetchUserQuestion';

interface QuestionsProps {
	questions: QuestionInterface[];
	lessonType?: string;
	userAnswers: UserQuestionData[];
}

const Questions = ({ questions, lessonType, userAnswers }: QuestionsProps) => {
	const { getLastQuestion } = useUserCourseLessonData();
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(getLastQuestion);
	const numberOfQuestions = questions.length;
	return (
		<Box>
			{questions &&
				questions.map((question, index) => {
					const userAnswerCurrentQuestionOpenEnded: string = userAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';

					return (
						<Question
							key={question._id}
							question={question}
							questionNumber={index + 1}
							numberOfQuestions={numberOfQuestions}
							displayedQuestionNumber={displayedQuestionNumber}
							setDisplayedQuestionNumber={setDisplayedQuestionNumber}
							lessonType={lessonType}
							userAnswerCurrentQuestionOpenEnded={userAnswerCurrentQuestionOpenEnded}
							userAnswers={userAnswers}
						/>
					);
				})}
		</Box>
	);
};

export default Questions;
