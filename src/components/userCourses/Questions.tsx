import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useEffect, useState } from 'react';
import { useUserCourseLessonData } from '../../hooks/useUserCourseLessonData';
import { UserQuestionData } from '../../hooks/useFetchUserQuestion';
import { LessonType } from '../../interfaces/enums';
import { QuizQuestionAnswer } from '../../pages/LessonPage';
import { useParams } from 'react-router-dom';
import PracticeQuestion from './PracticeQuestion';
import QuizQuestion from './QuizQuestion';

interface QuestionsProps {
	questions: QuestionInterface[];
	lessonType?: string;
	userAnswers: UserQuestionData[];
	setUserAnswers: React.Dispatch<React.SetStateAction<UserQuestionData[]>>;
	setIsQuizInProgress: React.Dispatch<React.SetStateAction<boolean>>;
	userQuizAnswers: QuizQuestionAnswer[];
	setUserQuizAnswers: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
}

const Questions = ({
	questions,
	lessonType,
	userAnswers,
	setUserAnswers,
	setIsQuizInProgress,
	userQuizAnswers,
	setUserQuizAnswers,
}: QuestionsProps) => {
	const { getLastQuestion, isLessonCompleted, setIsLessonCompleted } = useUserCourseLessonData();
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(getLastQuestion);
	const [showQuestionSelector, setShowQuestionSelector] = useState<boolean>(false);
	const numberOfQuestions = questions.length;
	const { lessonId } = useParams();

	useEffect(() => {
		if (lessonType === LessonType.QUIZ) {
			setUserQuizAnswers(() => {
				if (!localStorage.getItem(`UserQuizAnswers-${lessonId}`) || userQuizAnswers.length === 0) {
					return questions.map((question): QuizQuestionAnswer => {
						return { userAnswer: '', questionId: question._id };
					});
				} else {
					return userQuizAnswers;
				}
			});
		}
	}, [lessonType, questions]);

	return (
		<Box>
			{questions &&
				questions.map((question, index) => {
					if (lessonType === LessonType.PRACTICE_LESSON) {
						return (
							<PracticeQuestion
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
					} else if (lessonType === LessonType.QUIZ) {
						return (
							<QuizQuestion
								key={question._id}
								question={question}
								questionNumber={index + 1}
								numberOfQuestions={numberOfQuestions}
								displayedQuestionNumber={displayedQuestionNumber}
								setDisplayedQuestionNumber={setDisplayedQuestionNumber}
								lessonType={lessonType}
								isLessonCompleted={isLessonCompleted}
								setIsLessonCompleted={setIsLessonCompleted}
								userQuizAnswers={userQuizAnswers}
								setUserQuizAnswers={setUserQuizAnswers}
								setIsQuizInProgress={setIsQuizInProgress}
							/>
						);
					}
				})}
		</Box>
	);
};

export default Questions;
