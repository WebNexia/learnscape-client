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
	setUserAnswers: React.Dispatch<React.SetStateAction<UserQuestionData[]>>;
}

const Questions = ({ questions, lessonType, userAnswers, setUserAnswers }: QuestionsProps) => {
	const { getLastQuestion, isLessonCompleted, setIsLessonCompleted } = useUserCourseLessonData();
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(getLastQuestion);
	const [showQuestionSelector, setShowQuestionSelector] = useState<boolean>(false);
	const numberOfQuestions = questions.length;

	return (
		<Box>
			{questions &&
				questions.map((question, index) => {
					return (
						<Question
							key={question._id}
							question={question}
							questionNumber={index + 1}
							numberOfQuestions={numberOfQuestions}
							displayedQuestionNumber={displayedQuestionNumber}
							setDisplayedQuestionNumber={setDisplayedQuestionNumber}
							lessonType={lessonType}
							isLessonCompleted={isLessonCompleted}
							setIsLessonCompleted={setIsLessonCompleted}
							showQuestionSelector={showQuestionSelector}
							setShowQuestionSelector={setShowQuestionSelector}
							userAnswers={userAnswers}
							setUserAnswers={setUserAnswers}
						/>
					);
				})}
		</Box>
	);
};

export default Questions;
