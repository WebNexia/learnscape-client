import {
	Box,
	Button,
	FormControl,
	FormControlLabel,
	FormHelperText,
	IconButton,
	keyframes,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	SelectChangeEvent,
	Slide,
	Tooltip,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../../themes';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import TrueFalseOptions from '../layouts/questionTypes/TrueFalseOptions';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import { useUserCourseLessonData } from '../../hooks/useUserCourseLessonData';
import { AutoAwesome, Close, Done, DoneAll, KeyboardArrowLeft, KeyboardArrowRight, KeyboardDoubleArrowRight } from '@mui/icons-material';
import AiIcon from '@mui/icons-material/AutoAwesome';
import { UserQuestionData } from '../../hooks/useFetchUserQuestion';
import { QuestionType } from '../../interfaces/enums';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import QuestionMedia from './QuestionMedia';
import QuestionText from './QuestionText';
import useAiResponse, { QuestionPrompt } from '../../hooks/useAiResponse';
import { stripHtml } from '../../utils/stripHtml';
import TypingAnimation from '../layouts/loading/TypingAnimation';
import FlipCardPreview from '../layouts/flipCard/FlipCardPreview';
import MatchingPreview from '../layouts/matching/MatchingPreview';
import FillInTheBlanksDragDrop from '../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../layouts/FITBTyping/FillInTheBlanksTyping';

const colorChange = keyframes`
    0% {
        color: gold;
    }
    50% {
        color:#4D7B8B;
    }
    100% {
        color: gold;
    }
`;
const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

interface PracticeQuestionProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	lessonType?: string;
	isLessonCompleted: boolean;
	showQuestionSelector: boolean;
	userAnswers: UserQuestionData[];
	index: number;
	aiDrawerOpen: boolean;
	isAiActive: boolean;
	setUserAnswers: React.Dispatch<React.SetStateAction<UserQuestionData[]>>;
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
	setIsLessonCompleted: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector: React.Dispatch<React.SetStateAction<boolean>>;
	toggleAiIcon: (index: number) => void;
	openAiResponseDrawer: (index: number) => void;
	closeAiResponseDrawer: (index: number) => void;
}

const PracticeQuestion = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	lessonType,
	isLessonCompleted,
	showQuestionSelector,
	userAnswers,
	index,
	aiDrawerOpen,
	isAiActive,
	setUserAnswers,
	setDisplayedQuestionNumber,
	setIsLessonCompleted,
	setShowQuestionSelector,
	toggleAiIcon,
	openAiResponseDrawer,
	closeAiResponseDrawer,
}: PracticeQuestionProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { userLessonId, handleNextLesson, nextLessonId, updateLastQuestion, getLastQuestion } = useUserCourseLessonData();
	const { aiResponse, handleInitialSubmit, isLoadingAiResponse } = useAiResponse();

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const isOpenEndedQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.MULTIPLE_CHOICE;
	const isFlipCard: boolean = fetchQuestionTypeName(question) === QuestionType.FLIP_CARD;
	const isMatching: boolean = fetchQuestionTypeName(question) === QuestionType.MATCHING;
	const isFITBTyping: boolean = fetchQuestionTypeName(question) === QuestionType.FITB_TYPING;
	const isFITBDragDrop: boolean = fetchQuestionTypeName(question) === QuestionType.FITB_DRAG_DROP;

	const [userAnswer, setUserAnswer] = useState<string>(''); //user answer for current question

	const [value, setValue] = useState<string>(() => {
		if ((isLessonCompleted && question.correctAnswer) || (!isLessonCompleted && displayedQuestionNumber < getLastQuestion())) {
			return question.correctAnswer;
		} else if (isOpenEndedQuestion) {
			const answer: string = userAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
			return answer;
		} else {
			return userAnswer;
		}
	});

	const [error, setError] = useState<boolean>(false);
	const [success, setSuccess] = useState<boolean>(false);
	const [helperText, setHelperText] = useState<string>(!isMatching && !isFITBDragDrop && !isFITBTyping ? 'Choose wisely' : '');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
	const [isOpenEndedAnswerSubmitted, setIsOpenEndedAnswerSubmitted] = useState<boolean>(false);
	const [selectedQuestion, setSelectedQuestion] = useState<number>(displayedQuestionNumber);
	const [isLessonUpdating, setIsLessonUpdating] = useState<boolean>(false);
	const [isLessonCourseCompletedModalOpen, setIsLessonCourseCompletedModalOpen] = useState<boolean>(false);
	const [allPairsMatchedMatching, setAllPairsMatchedMatching] = useState<boolean>(false);
	const [allPairsMatchedFITBTyping, setAllPairsMatchedFITBTyping] = useState<boolean>(false);
	const [allPairsMatchedFITBDragDrop, setAllPairsMatchedFITBDragDrop] = useState<boolean>(false);

	const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

	const isLastQuestion: boolean = displayedQuestionNumber === numberOfQuestions;
	const isCompletingCourse: boolean = isLastQuestion && nextLessonId === null && isLessonCompleted;
	const isCompletingLesson: boolean = isLastQuestion && nextLessonId !== null && isLessonCompleted;

	const [questionPrompt, setQuestionPrompt] = useState<QuestionPrompt>({
		question: stripHtml(question.question),
		type: fetchQuestionTypeName(question),
		options: isMultipleChoiceQuestion ? question.options : [],
		userInput: isLessonCompleted && !isLessonUpdating ? question.correctAnswer : userAnswer,
		correctAnswer: question.correctAnswer,
	});

	useEffect(() => {
		if (isLessonCompleted && question.correctAnswer && !isOpenEndedQuestion) {
			setValue(question.correctAnswer);
		} else if (isOpenEndedQuestion) {
			setValue(() => {
				const answer = userAnswers?.find((data) => data.questionId === question._id)?.userAnswer || '';
				return answer;
			});
		} else if (!isLessonCompleted && displayedQuestionNumber === getLastQuestion()) {
			setValue(userAnswer);
		} else if (!isLessonCompleted && displayedQuestionNumber < getLastQuestion()) {
			setValue(question.correctAnswer);
		}

		setSelectedQuestion(displayedQuestionNumber);

		if (isLessonCompleted) {
			setShowQuestionSelector(true);
			setQuestionPrompt((prevData) => {
				const answer: string = userAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
				return { ...prevData, userInput: answer };
			});
		}

		if (isLessonCompleted || isAnswerCorrect || displayedQuestionNumber < getLastQuestion()) {
			setHelperText(' ');
		}

		setIsOpenEndedAnswerSubmitted(false);
		setIsAnswerCorrect(false);
	}, [displayedQuestionNumber]);

	const createUserQuestion = async () => {
		const existingUserAnswer = userAnswers.find((data) => data.questionId === question._id);

		if (!existingUserAnswer || existingUserAnswer.userAnswer !== userAnswer) {
			try {
				if (isOpenEndedQuestion) {
					const res = await axios.post(`${base_url}/userQuestions`, {
						userLessonId,
						questionId: question._id,
						userId,
						lessonId,
						courseId,
						isCompleted: true,
						isInProgress: false,
						orgId,
						userAnswer,
						teacherFeedback: '',
						teacherAudioFeedbackUrl: '',
					});

					const userQuestionId = res.data._id;
					if (res.status === 200) {
						await axios.patch(`${base_url}/userQuestions/${userQuestionId}`, { userAnswer });
						setUserAnswers((prevData) => {
							if (!prevData) return [];
							return prevData?.map((data) => (data.questionId === question._id ? { ...data, userAnswer } : data));
						});
					} else {
						setUserAnswers((prevData) => {
							const newUserAnswer = {
								userQuestionId: res.data._id,
								questionId: question._id,
								userAnswer,
								audioRecordUrl: '',
								videoRecordUrl: '',
								teacherFeedback: '',
								teacherAudioFeedbackUrl: '',
								userMatchingPairAnswers: [],
								userBlankValuePairAnswers: [],
							};
							return [...prevData, newUserAnswer];
						});
					}

					setIsOpenEndedAnswerSubmitted(true);
					setValue(userAnswer);
				}

				if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
					updateLastQuestion(displayedQuestionNumber + 1);
				}

				if (displayedQuestionNumber === numberOfQuestions) {
					await handleNextLesson();
					setIsLessonCompleted(true);
					setShowQuestionSelector(true);
				}
			} catch (error) {
				console.log(error);
			}
		} else {
			setIsOpenEndedAnswerSubmitted(true);
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (isLessonCompleted) {
			setShowQuestionSelector(true);
			setIsLessonUpdating(true);
			setIsOpenEndedAnswerSubmitted(false);
		}

		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
		setError(false);
		setUserAnswer((event.target as HTMLInputElement).value);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (isOpenEndedQuestion && value !== '') {
			await createUserQuestion();
			setUserAnswer(value);
			setIsOpenEndedAnswerSubmitted(true);
			setIsAnswerCorrect(true);
			toggleAiIcon(index);
		}
		if (value === question.correctAnswer?.toString() && !isOpenEndedQuestion && !isMatching && !isFITBDragDrop && !isFITBTyping) {
			setHelperText('You got it!');
			setError(false);
			setIsAnswerCorrect(true);
			setSuccess(true);
			await createUserQuestion();
			setUserAnswer(value);
			setIsOpenEndedAnswerSubmitted(true);
			toggleAiIcon(index);
		} else if (value !== question.correctAnswer && value !== '') {
			setHelperText('Sorry, wrong answer!');
			setError(true);
			setIsAnswerCorrect(false);
			setUserAnswer(value);
		} else {
			setHelperText('Please select an option.');
			setError(true);
			setIsAnswerCorrect(false);
		}
	};

	const handleQuestionChange = (event: SelectChangeEvent<number>) => {
		const selectedValue = Number(event.target.value);
		setSelectedQuestion(selectedValue);
		setDisplayedQuestionNumber(selectedValue);
		setIsOpenEndedAnswerSubmitted(false);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
			}}>
			<Box
				sx={{
					display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
					flexDirection: 'column',
					alignItems: 'center',
					width: '100%',
				}}>
				{!isFlipCard && (
					<form onSubmit={handleSubmit} style={{ width: '90%' }}>
						<FormControl sx={{ width: '100%' }} error={error} variant='standard'>
							<QuestionMedia question={question} />
							{!isFITBDragDrop && !isFITBTyping && <QuestionText question={question} questionNumber={questionNumber} />}

							{isOpenEndedQuestion && (
								<Box sx={{ width: '90%', margin: '1rem auto' }}>
									<CustomTextField
										required={false}
										multiline
										rows={4}
										resizable
										value={value}
										onChange={(e) => {
											setValue(e.target.value);
											setUserAnswer(e.target.value);
											setQuestionPrompt((prevData) => {
												return { ...prevData, userInput: e.target.value };
											});
										}}
									/>
								</Box>
							)}

							{isTrueFalseQuestion && (
								<Box>
									<TrueFalseOptions
										correctAnswer={value}
										setCorrectAnswer={setValue}
										fromLearner={true}
										question={question}
										isLessonCompleted={isLessonCompleted}
										displayedQuestionNumber={displayedQuestionNumber}
										setHelperText={setHelperText}
										setIsLessonUpdating={setIsLessonUpdating}
										isLessonUpdating={isLessonUpdating}
										setUserAnswer={setUserAnswer}
										lessonType={lessonType}
										setQuestionPrompt={setQuestionPrompt}
									/>
								</Box>
							)}

							{isMatching && (
								<Box sx={{ display: 'flex', justifyContent: 'center', width: '80%', margin: '0 auto' }}>
									<MatchingPreview
										initialPairs={question.matchingPairs}
										setAllPairsMatchedMatching={setAllPairsMatchedMatching}
										fromPracticeQuestionUser={true}
										displayedQuestionNumber={displayedQuestionNumber}
										numberOfQuestions={numberOfQuestions}
										setIsLessonCompleted={setIsLessonCompleted}
										setShowQuestionSelector={setShowQuestionSelector}
										lessonType={lessonType}
										isLessonCompleted={isLessonCompleted}
									/>
								</Box>
							)}

							{isFITBDragDrop && (
								<Box sx={{ display: 'flex', justifyContent: 'center', width: '80%', margin: '11rem auto 0 auto' }}>
									<FillInTheBlanksDragDrop
										textWithBlanks={question.question}
										blankValuePairs={question.blankValuePairs}
										setAllPairsMatchedFITBDragDrop={setAllPairsMatchedFITBDragDrop}
										fromPracticeQuestionUser={true}
										displayedQuestionNumber={displayedQuestionNumber}
										numberOfQuestions={numberOfQuestions}
										isLessonCompleted={isLessonCompleted}
										setIsLessonCompleted={setIsLessonCompleted}
										setShowQuestionSelector={setShowQuestionSelector}
										lessonType={lessonType}
									/>
								</Box>
							)}

							{isFITBTyping && (
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
										width: '80%',
										margin: '11rem auto 0 auto',
									}}>
									<FillInTheBlanksTyping
										textWithBlanks={question.question}
										blankValuePairs={question.blankValuePairs}
										setAllPairsMatchedFITBTyping={setAllPairsMatchedFITBTyping}
										fromPracticeQuestionUser={true}
										displayedQuestionNumber={displayedQuestionNumber}
										numberOfQuestions={numberOfQuestions}
										isLessonCompleted={isLessonCompleted}
										setIsLessonCompleted={setIsLessonCompleted}
										setShowQuestionSelector={setShowQuestionSelector}
										lessonType={lessonType}
									/>
								</Box>
							)}

							{isMultipleChoiceQuestion && (
								<RadioGroup
									name='question'
									value={isLessonCompleted && displayedQuestionNumber < getLastQuestion() && !isLessonUpdating ? question.correctAnswer : value}
									onChange={handleRadioChange}
									sx={{ alignSelf: 'center' }}>
									{question &&
										question.options &&
										question.options?.map((option, index) => {
											return <FormControlLabel value={option} control={<Radio />} label={option} key={index} />;
										})}
								</RadioGroup>
							)}
							{!isOpenEndedQuestion && (!isLessonCompleted || isLessonUpdating) && helperText !== ' ' && (
								<FormHelperText sx={{ color: success ? 'green' : 'inherit', alignSelf: 'center', mt: '2rem' }}>{helperText}</FormHelperText>
							)}

							{!isMatching && !isFITBDragDrop && !isFITBTyping && (
								<Button
									sx={{
										mt: '3rem',
										width: '13rem',
										alignSelf: 'center',
									}}
									type='submit'
									variant='outlined'>
									Submit Answer
								</Button>
							)}
						</FormControl>
					</form>
				)}

				{isFlipCard && (
					<Box sx={{ mt: '12rem' }}>
						<FlipCardPreview
							question={question}
							fromPracticeQuestionUser={true}
							setIsCardFlipped={setIsCardFlipped}
							displayedQuestionNumber={displayedQuestionNumber}
							numberOfQuestions={numberOfQuestions}
							setIsLessonCompleted={setIsLessonCompleted}
							setShowQuestionSelector={setShowQuestionSelector}
						/>
					</Box>
				)}

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						position: 'relative',
						mt: '2rem',
						width: '40%',
					}}>
					<IconButton
						sx={{
							flexShrink: 0,
							':hover': {
								color: theme.bgColor?.greenPrimary,
								backgroundColor: 'transparent',
							},
						}}
						onClick={() => {
							if (!(displayedQuestionNumber - 1 === 0)) {
								setDisplayedQuestionNumber((prev) => prev - 1);
								setSelectedQuestion(displayedQuestionNumber - 1);
							}
							window.scrollTo({ top: 0, behavior: 'smooth' });
							setIsOpenEndedAnswerSubmitted(false);
						}}
						disabled={displayedQuestionNumber - 1 === 0}>
						<KeyboardArrowLeft fontSize='large' />
					</IconButton>

					{!showQuestionSelector && (
						<Typography
							variant='body1'
							sx={{
								position: 'absolute',
								left: '50%',
								transform: 'translateX(-50%)',
							}}>
							{displayedQuestionNumber} / {numberOfQuestions}
						</Typography>
					)}

					{showQuestionSelector && (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								position: 'absolute',
								left: '50%',
								transform: 'translateX(-50%)',
							}}>
							<Select
								labelId='question_number'
								id='question_number'
								sx={{ mr: '0.5rem' }}
								value={selectedQuestion}
								onChange={handleQuestionChange}
								size='small'
								label='#'
								required
								MenuProps={{
									PaperProps: {
										style: {
											maxHeight: 250,
										},
									},
								}}>
								{Array.from({ length: numberOfQuestions }, (_, i) => (
									<MenuItem key={i + 1} value={i + 1}>
										{i + 1}
									</MenuItem>
								))}
							</Select>
							<Typography> / {numberOfQuestions}</Typography>
						</Box>
					)}

					{displayedQuestionNumber !== numberOfQuestions || !isLessonCompleted ? (
						<IconButton
							onClick={() => {
								if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
									setDisplayedQuestionNumber((prev) => prev + 1);
									setSelectedQuestion(displayedQuestionNumber + 1);
								}

								window.scrollTo({ top: 0, behavior: 'smooth' });
								setIsOpenEndedAnswerSubmitted(false);
							}}
							sx={{
								flexShrink: 0,
								color:
									!isAnswerCorrect &&
									!isOpenEndedAnswerSubmitted &&
									!allPairsMatchedFITBDragDrop &&
									!allPairsMatchedFITBTyping &&
									!allPairsMatchedMatching &&
									!isCardFlipped
										? 'gray'
										: theme.textColor?.common.main,
								backgroundColor:
									!isAnswerCorrect &&
									!isOpenEndedAnswerSubmitted &&
									!allPairsMatchedFITBDragDrop &&
									!allPairsMatchedFITBTyping &&
									!allPairsMatchedMatching &&
									!isCardFlipped
										? 'inherit'
										: theme.bgColor?.greenPrimary,
								':hover': {
									color: theme.bgColor?.greenPrimary,
									backgroundColor: 'transparent',
								},
							}}
							disabled={
								(!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions || !isOpenEndedAnswerSubmitted) &&
								!(isLessonCompleted || displayedQuestionNumber < getLastQuestion()) &&
								!isCardFlipped &&
								!allPairsMatchedFITBDragDrop &&
								!allPairsMatchedFITBTyping &&
								!allPairsMatchedMatching
							}>
							<KeyboardArrowRight fontSize='large' />
						</IconButton>
					) : (
						<Tooltip title={isCompletingCourse ? 'Complete Course' : isCompletingLesson ? 'Complete Lesson' : 'Next Lesson'} placement='top'>
							<IconButton
								onClick={() => {
									if (isLessonCompleted) {
										setIsLessonCourseCompletedModalOpen(true);
									}
									window.scrollTo({ top: 0, behavior: 'smooth' });
									setIsOpenEndedAnswerSubmitted(false);
								}}
								sx={{
									flexShrink: 0,
									color:
										!isAnswerCorrect &&
										!isOpenEndedAnswerSubmitted &&
										!allPairsMatchedFITBDragDrop &&
										!allPairsMatchedFITBTyping &&
										!allPairsMatchedMatching &&
										!isCardFlipped
											? 'gray'
											: theme.textColor?.common.main,
									backgroundColor:
										!isAnswerCorrect &&
										!isOpenEndedAnswerSubmitted &&
										!allPairsMatchedFITBDragDrop &&
										!allPairsMatchedFITBTyping &&
										!allPairsMatchedMatching &&
										!isCardFlipped
											? 'inherit'
											: theme.bgColor?.greenPrimary,
									':hover': {
										color: theme.bgColor?.greenPrimary,
										backgroundColor: 'transparent',
									},
								}}>
								{isCompletingCourse ? (
									<DoneAll fontSize='large' />
								) : isCompletingLesson ? (
									<Done fontSize='large' />
								) : isLessonCompleted && isLastQuestion ? (
									<KeyboardDoubleArrowRight fontSize='large' />
								) : (
									<KeyboardArrowRight fontSize='large' />
								)}
							</IconButton>
						</Tooltip>
					)}

					<CustomDialog
						openModal={isLessonCourseCompletedModalOpen}
						closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
						content={`You have completed this ${nextLessonId ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId ? 'lesson' : 'course'}.`}>
						<CustomDialogActions
							onCancel={() => setIsLessonCourseCompletedModalOpen(false)}
							onSubmit={async () => {
								await handleNextLesson();
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							submitBtnText='OK'
						/>
					</CustomDialog>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					position: 'fixed',
					top: '11rem',
					right: '2rem',
					width: '80%',
					zIndex: 9,
				}}>
				{displayedQuestionNumber === questionNumber && !isFlipCard && !isMatching && !isFITBDragDrop && !isFITBTyping ? (
					isAiActive || isLessonCompleted ? (
						<Tooltip title={`Receive ${!aiDrawerOpen ? '' : 'another'} feedback from AI`} placement='left'>
							<IconButton
								onClick={async () => {
									openAiResponseDrawer(index);
									await handleInitialSubmit(questionPrompt);
								}}>
								<AiIcon
									sx={{
										fontSize: '2rem',
										width: '1.5rem',
										height: '1.5rem',
										border: 'none',
										ml: 0.8,
										color: '#4D7B8B',
										animation: `${colorChange} 1s infinite, ${spin} 3s linear infinite`,
									}}
								/>
							</IconButton>
						</Tooltip>
					) : (
						<Tooltip title='Submit answer to receive feedback from AI' placement='left'>
							<IconButton
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<AutoAwesome />
							</IconButton>
						</Tooltip>
					)
				) : null}

				{displayedQuestionNumber === questionNumber && (
					<Slide direction='left' in={aiDrawerOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
						<Box
							sx={{
								position: 'fixed',
								right: 0,
								top: '14rem',
								width: '30%',
								minHeight: '30%',
								maxHeight: '50%',
								boxShadow: 10,
								padding: '1.75rem',
								bgcolor: 'background.paper',
								borderRadius: '0.35rem 0 0 0.35rem',
								overflow: 'auto',
							}}>
							<Box sx={{ minHeight: '100%' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Box>
										<Typography variant='h6'>AI Assist</Typography>
									</Box>
									<Box>
										<IconButton onClick={() => closeAiResponseDrawer(index)}>
											<Close />
										</IconButton>
									</Box>
								</Box>
								{isLoadingAiResponse ? (
									<Box sx={{ display: 'flex', height: '25vh', justifyContent: 'center', alignItems: 'center' }}>
										<TypingAnimation />
									</Box>
								) : (
									<Typography variant='body2' sx={{ mt: '0.5rem', lineHeight: 1.9 }}>
										{aiResponse}
									</Typography>
								)}
							</Box>
						</Box>
					</Slide>
				)}
			</Box>
		</Box>
	);
};

export default PracticeQuestion;
