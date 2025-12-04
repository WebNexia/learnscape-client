import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
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
	lessonName: string;
	userAnswers: UserQuestionData[];
	setUserAnswers: React.Dispatch<React.SetStateAction<UserQuestionData[]>>;
	setIsQuizInProgress: React.Dispatch<React.SetStateAction<boolean>>;
	userQuizAnswers: QuizQuestionAnswer[];
	setUserQuizAnswers: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	isSoundMuted?: boolean;
	onQuestionChange?: (questionNumber: number) => void;
}

const Questions: React.FC<QuestionsProps> = ({
	questions,
	lessonType,
	lessonName,
	userAnswers,
	setUserAnswers,
	setIsQuizInProgress,
	userQuizAnswers,
	setUserQuizAnswers,
	isSoundMuted = false,
	onQuestionChange,
}) => {
	const { getLastQuestion, isLessonCompleted, setIsLessonCompleted } = useUserCourseLessonData();
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(getLastQuestion);
	const [showQuestionSelector, setShowQuestionSelector] = useState<boolean>(false);
	const numberOfQuestions = questions?.length;
	const { lessonId } = useParams();

	// Notify parent component when displayed question changes
	useEffect(() => {
		if (onQuestionChange) {
			onQuestionChange(displayedQuestionNumber);
		}
	}, [displayedQuestionNumber, onQuestionChange]);

	// State for each question's AI response drawer and icon toggle
	const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean[]>(Array(numberOfQuestions).fill(false));
	const [isAiActive, setIsAiActive] = useState<boolean[]>(Array(numberOfQuestions).fill(false));

	const isQuiz: boolean = lessonType === LessonType.QUIZ;
	const isPracticeLesson: boolean = lessonType === LessonType.PRACTICE_LESSON;

	useEffect(() => {
		if (isQuiz) {
			setUserQuizAnswers(() => {
				if (isLessonCompleted) {
					return userQuizAnswers;
				} else if (!localStorage.getItem(`UserQuizAnswers-${lessonId}`) || (userQuizAnswers && userQuizAnswers.length === 0)) {
					return questions
						?.filter((question) => question !== null)
						?.map(
							(question): QuizQuestionAnswer => ({
								userAnswer: '',
								questionId: question._id,
								audioRecordUrl: '',
								videoRecordUrl: '',
								teacherFeedback: '',
								teacherAudioFeedbackUrl: '',
								userMatchingPairAnswers: [],
								userBlankValuePairAnswers: [],
							})
						);
				} else {
					return userQuizAnswers;
				}
			});
		}
	}, [lessonType, questions]);

	const openAiResponseDrawer = (index: number) => {
		const newAiDrawerOpen = [...aiDrawerOpen];
		newAiDrawerOpen[index] = true;
		setAiDrawerOpen(newAiDrawerOpen);
	};

	const closeAiResponseDrawer = (index: number) => {
		const newAiDrawerOpen = [...aiDrawerOpen];
		newAiDrawerOpen[index] = false;
		setAiDrawerOpen(newAiDrawerOpen);
	};

	const toggleAiIcon = (index: number) => {
		const newIsAiActive = [...isAiActive];
		newIsAiActive[index] = true;
		setIsAiActive(newIsAiActive);
	};

	return (
		<Box>
			{questions
				?.filter((question) => question !== null)
				?.map((question, index) => {
					return isPracticeLesson ? (
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
							index={index}
							aiDrawerOpen={aiDrawerOpen[index]}
							isAiActive={isAiActive[index]}
							openAiResponseDrawer={openAiResponseDrawer}
							closeAiResponseDrawer={closeAiResponseDrawer}
							toggleAiIcon={toggleAiIcon}
							isSoundMuted={isSoundMuted}
						/>
					) : isQuiz ? (
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
							lessonName={lessonName}
						/>
					) : null;
				})}
		</Box>
	);
};

export default Questions;
