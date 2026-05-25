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
	practiceAgainMode?: boolean;
	enableWordAssist?: boolean;
	/** Lesson content (plain text) for open-ended AI context */
	lessonText?: string;
	/** Chapter name for open-ended AI context */
	chapterName?: string;
	/** Chapter context for quiz submission when lesson appears in multiple chapters */
	chapterId?: string;
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
	practiceAgainMode = false,
	enableWordAssist = false,
	lessonText,
	chapterName,
	chapterId,
}) => {
	const { getLastQuestion, isLessonCompleted, setIsLessonCompleted, updateLastQuestion } = useUserCourseLessonData();
	const filteredQuestions = questions?.filter((question) => question !== null && question !== undefined) ?? [];
	const numberOfQuestions = filteredQuestions.length;
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(() => {
		if (practiceAgainMode || isLessonCompleted) return 1;
		return getLastQuestion();
	});
	const [showQuestionSelector, setShowQuestionSelector] = useState<boolean>(false);
	const { lessonId } = useParams();

	// Practice Again always starts at question 1 (Review uses questionsSessionKey remount in LessonPage)
	useEffect(() => {
		if (practiceAgainMode) {
			setDisplayedQuestionNumber(1);
			setShowQuestionSelector(false);
		}
	}, [practiceAgainMode]);

	// When lesson changes or question list changes, sync displayed index (e.g. after questions were deleted)
	useEffect(() => {
		if (practiceAgainMode) return;
		if (isLessonCompleted) {
			setDisplayedQuestionNumber(1);
		} else {
			const last = getLastQuestion();
			const clamped = numberOfQuestions > 0 ? Math.min(Math.max(1, last), numberOfQuestions) : 1;
			setDisplayedQuestionNumber(clamped);
			if (numberOfQuestions > 0 && last !== clamped) {
				updateLastQuestion(clamped);
			}
		}
	}, [lessonId, numberOfQuestions]);

	// Keep displayed index in bounds when question list shrinks (e.g. admin deleted questions)
	useEffect(() => {
		if (numberOfQuestions === 0) return;
		if (displayedQuestionNumber > numberOfQuestions) {
			setDisplayedQuestionNumber(numberOfQuestions);
			updateLastQuestion(numberOfQuestions);
		}
	}, [numberOfQuestions, displayedQuestionNumber, updateLastQuestion]);

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
					return filteredQuestions
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
			{filteredQuestions.map((question, index) => {
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
							practiceAgainMode={practiceAgainMode}
							enableWordAssist={enableWordAssist}
							lessonText={lessonText}
							chapterName={chapterName}
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
							chapterId={chapterId}
							enableWordAssist={enableWordAssist}
						/>
					) : null;
				})}
		</Box>
	);
};

export default Questions;
