import {
	Box,
	Button,
	DialogContent,
	FormControl,
	FormHelperText,
	IconButton,
	keyframes,
	MenuItem,
	Select,
	SelectChangeEvent,
	Slide,
	Tooltip,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../../themes';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import TrueFalseOptions from '../layouts/questionTypes/TrueFalseOptions';
import useQuestionTypes from '../../hooks/useQuestionTypes';
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
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';

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
	isSoundMuted?: boolean;
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
	isSoundMuted = false,
}: PracticeQuestionProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { userLessonId, handleNextLesson, nextLessonId, updateLastQuestion, getLastQuestion } = useUserCourseLessonData();
	const { aiResponse, handleInitialSubmit, isLoadingAiResponse } = useAiResponse();

	const {
		isSmallScreen,
		isRotatedMedium,
		isRotated,
		isVerySmallScreen,
		isSmallMobileLandscape,
		isSmallMobilePortrait,
		isMobileLandscape,
		isMobilePortrait,
		isTabletPortrait,
		isTabletLandscape,
		isDesktopPortrait,
		isDesktopLandscape,
	} = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName, questionTypes } = useQuestionTypes();

	// Sound effects - enabled even when lesson is completed
	const { playSuccessSound, playErrorSound } = useSoundEffect(true, isSoundMuted);
	const prevIsAnswerCorrectRef = useRef<boolean>(false);
	const prevErrorRef = useRef<boolean>(false);

	// Use useMemo to recalculate when questionTypes loads
	const questionTypeName = useMemo(() => fetchQuestionTypeName(question), [question, questionTypes]);

	const isTranslate: boolean = questionTypeName === QuestionType.TRANSLATE;
	const isOpenEndedQuestion: boolean = questionTypeName === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = questionTypeName === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = questionTypeName === QuestionType.MULTIPLE_CHOICE;
	const isFlipCard: boolean = questionTypeName === QuestionType.FLIP_CARD;
	const isMatching: boolean = questionTypeName === QuestionType.MATCHING;
	const isFITBTyping: boolean = questionTypeName === QuestionType.FITB_TYPING;
	const isFITBDragDrop: boolean = questionTypeName === QuestionType.FITB_DRAG_DROP;

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
	const [helperText, setHelperText] = useState<string>(isTrueFalseQuestion || isMultipleChoiceQuestion ? 'Choose wisely' : '');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
	const [isOpenEndedAnswerSubmitted, setIsOpenEndedAnswerSubmitted] = useState<boolean>(false);
	const [selectedQuestion, setSelectedQuestion] = useState<number>(displayedQuestionNumber);
	const [isLessonUpdating, setIsLessonUpdating] = useState<boolean>(false);
	const [isLessonCourseCompletedModalOpen, setIsLessonCourseCompletedModalOpen] = useState<boolean>(false);
	const [allPairsMatchedMatching, setAllPairsMatchedMatching] = useState<boolean>(false);
	const [allPairsMatchedFITBTyping, setAllPairsMatchedFITBTyping] = useState<boolean>(false);
	const [allPairsMatchedFITBDragDrop, setAllPairsMatchedFITBDragDrop] = useState<boolean>(false);
	const [translateAnswers, setTranslateAnswers] = useState<{ [pairId: string]: string }>({});
	const [checkedTranslatePairs, setCheckedTranslatePairs] = useState<Set<string>>(new Set());

	// Store translate answers per question ID to preserve them when navigating between questions
	const translateAnswersStoreRef = useRef<{ [questionId: string]: { answers: { [pairId: string]: string }; checkedPairs: Set<string> } }>({});

	const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
	const [hasRequestedAiFeedback, setHasRequestedAiFeedback] = useState<boolean>(false);
	const [isAiFeedbackLoading, setIsAiFeedbackLoading] = useState<boolean>(false);

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
		if (isTranslate && isLessonCompleted) {
			// If lesson is completed, mark all pairs as checked and show translations
			const allPairIds = new Set(question.translatePairs?.map((pair, idx) => pair.id || idx.toString()) || []);
			setCheckedTranslatePairs(allPairIds);
			// Load user answers if available
			const savedAnswer = userAnswers?.find((data) => data.questionId === question._id)?.userAnswer || '';
			if (savedAnswer) {
				setUserAnswer(savedAnswer);
			}
			// Clear stored answers when lesson is completed
			translateAnswersStoreRef.current = {};
		} else if (isTranslate && !isLessonCompleted) {
			// Restore stored answers for this question if they exist
			const stored = translateAnswersStoreRef.current[question._id];
			if (stored) {
				setTranslateAnswers(stored.answers);
				setCheckedTranslatePairs(stored.checkedPairs);
			} else {
				// Initialize empty if no stored data
				setTranslateAnswers({});
				setCheckedTranslatePairs(new Set());
			}
		} else if (isLessonCompleted && question.correctAnswer && !isOpenEndedQuestion && !isTranslate) {
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
		if (!isTranslate) {
			setCheckedTranslatePairs(new Set());
			setTranslateAnswers({});
		}

		// Reset AI feedback state when question changes
		setHasRequestedAiFeedback(false);

		// Reset sound tracking refs when question changes
		prevIsAnswerCorrectRef.current = false;
		prevErrorRef.current = false;
	}, [displayedQuestionNumber, question._id]);

	// Save translate answers to store whenever they change (only during active practice, not when lesson is completed)
	useEffect(() => {
		if (isTranslate && !isLessonCompleted && question._id) {
			translateAnswersStoreRef.current[question._id] = {
				answers: { ...translateAnswers },
				checkedPairs: new Set(checkedTranslatePairs),
			};
		}
	}, [translateAnswers, checkedTranslatePairs, isTranslate, isLessonCompleted, question._id]);

	useEffect(() => {
		return () => {
			translateAnswersStoreRef.current = {};
		};
	}, []);

	useEffect(() => {
		if (isOpenEndedQuestion || isFlipCard) return;

		if (isMatching || isFITBDragDrop || isFITBTyping || isTranslate) return;

		if (isAnswerCorrect && !prevIsAnswerCorrectRef.current) {
			playSuccessSound();
			prevIsAnswerCorrectRef.current = true;
		}

		if (error && !prevErrorRef.current && !isAnswerCorrect) {
			playErrorSound();
			prevErrorRef.current = true;
		}

		if (!error) {
			prevErrorRef.current = false;
		}
	}, [
		isAnswerCorrect,
		error,
		isLessonCompleted,
		isMatching,
		isFITBDragDrop,
		isFITBTyping,
		isOpenEndedQuestion,
		isFlipCard,
		playSuccessSound,
		playErrorSound,
	]);

	const createUserQuestion = async () => {
		const existingUserAnswer = userAnswers?.find((data) => data.questionId === question._id);

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
						userAnswer: userAnswer.trim(),
						teacherFeedback: '',
						teacherAudioFeedbackUrl: '',
					});

					const userQuestionId = res.data._id;
					if (res.status === 200) {
						await axios.patch(`${base_url}/userQuestions/${userQuestionId}`, { userAnswer });
						setUserAnswers((prevData) => {
							if (!prevData) return [];
							return prevData?.map((data) => (data.questionId === question._id ? { ...data, userAnswer } : data)) || [];
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
		if (value === question.correctAnswer?.toString() && !isOpenEndedQuestion && !isMatching && !isFITBDragDrop && !isFITBTyping && !isTranslate) {
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
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'relative',
				minHeight: 'calc(95vh)',
				height: 'fit-content',
				paddingBottom: '8rem',
			}}>
			{!isFlipCard && (
				<form onSubmit={handleSubmit} style={{ width: '100%' }}>
					<FormControl sx={{ width: '100%' }} error={error} variant='standard'>
						<QuestionMedia question={question} />
						{!isFITBDragDrop && !isFITBTyping && <QuestionText question={question} isMatching={isMatching} questionNumber={questionNumber} />}

						{isOpenEndedQuestion && (
							<Box sx={{ width: '95%', margin: '0rem auto' }}>
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
									InputProps={{
										inputProps: {
											maxLength: 5000,
										},
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
							<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto 2rem auto' }}>
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
									onCorrectMatch={playSuccessSound}
									onWrongMatch={playErrorSound}
								/>
							</Box>
						)}

						{isFITBDragDrop && (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									width: '100%',
									margin:
										question.imageUrl || question.videoUrl
											? '2.5rem auto 0 auto'
											: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
												? '6rem auto 0 auto'
												: isTabletPortrait || isTabletLandscape
													? '7rem auto 0 auto'
													: isDesktopPortrait || isDesktopLandscape
														? '8rem auto 0 auto'
														: '6rem auto 0 auto',
								}}>
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
									onCorrectMatch={playSuccessSound}
									onWrongMatch={playErrorSound}
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
									width: '100%',
									margin:
										question.imageUrl || question.videoUrl
											? '2.5rem auto 0 auto'
											: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
												? '6rem auto 0 auto'
												: isTabletPortrait || isTabletLandscape
													? '7rem auto 0 auto'
													: isDesktopPortrait || isDesktopLandscape
														? '8rem auto 0 auto'
														: '6rem auto 0 auto',
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
									onCorrectMatch={playSuccessSound}
								/>
							</Box>
						)}

						{isTranslate && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									alignItems: 'center',
									width: '100%',
									margin:
										question.imageUrl || question.videoUrl
											? '1rem auto 1rem auto'
											: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
												? '-0.5rem auto 0 auto'
												: isTabletPortrait || isTabletLandscape
													? '-0.5rem auto 0 auto'
													: isDesktopPortrait || isDesktopLandscape
														? '0rem auto 0 auto'
														: '0rem auto',
									gap: '1.5rem',
								}}>
								{question.translatePairs?.map((pair, index) => {
									const pairId = pair.id || index.toString();
									const isPairChecked = checkedTranslatePairs.has(pairId);
									const showTranslation = isLessonCompleted || isPairChecked;

									return (
										<Box
											key={pairId}
											sx={{
												display: 'flex',
												flexDirection: 'column',
												width: '100%',
												maxWidth: isMobileSize ? '100%' : '600px',
												gap: '1rem',
												padding: '1.5rem',
												borderRadius: '12px',
												boxShadow: '2px 1px 8px rgba(0, 0, 0, 0.3)',
												backgroundColor: theme.bgColor?.secondary || '#fff',
												position: 'relative',
												mb: question.translatePairs?.length > 1 ? '2rem' : '0rem',
											}}>
											<Typography
												variant='body1'
												sx={{
													fontSize: isMobileSize ? '0.85rem' : '0.95rem',
													color: theme.textColor?.secondary?.main,
												}}>
												Original Text:
											</Typography>
											<Typography
												variant='body1'
												sx={{
													fontSize: isMobileSize ? '0.75rem' : '0.9rem',
													padding: '1rem',
													borderRadius: '8px',
													backgroundColor: theme.bgColor?.primary || '#f5f5f5',
													minHeight: '3rem',
													display: 'flex',
													alignItems: 'center',
													color: theme.textColor?.common?.main,
												}}>
												{pair.originalText}
											</Typography>

											{!isLessonCompleted && (
												<CustomTextField
													label='Your Translation'
													multiline
													rows={2}
													value={translateAnswers[pairId] || ''}
													onChange={(e) => {
														setTranslateAnswers((prev) => ({
															...prev,
															[pairId]: e.target.value,
														}));
													}}
													disabled={showTranslation}
													InputProps={{
														inputProps: {
															maxLength: 500,
														},
													}}
													sx={{
														width: '100%',
													}}
												/>
											)}

											{showTranslation && (
												<>
													<Typography
														variant='body2'
														sx={{
															fontSize: isMobileSize ? '0.85rem' : '0.95rem',
															mb: '-0.5rem',
															mt: isLessonCompleted ? '0.5rem' : '0rem',
														}}>
														Translation:
													</Typography>
													<Box
														sx={{
															padding: '1rem',
															borderRadius: '8px',
															backgroundColor: theme.bgColor?.greenPrimary || '#e8f5e9',
															border: `2px solid ${theme.textColor?.greenPrimary?.main || '#4caf50'}`,
														}}>
														<Typography
															variant='body1'
															sx={{
																fontSize: isMobileSize ? '0.75rem' : '0.9rem',
																color: theme.textColor?.common?.main,
															}}>
															{pair.translation}
														</Typography>
													</Box>
												</>
											)}

											{!isLessonCompleted && !isPairChecked && (
												<Box sx={{ display: 'flex', justifyContent: 'center', mt: '-1rem', mb: '-0.5rem' }}>
													<CustomSubmitButton
														onClick={async () => {
															const answer = translateAnswers[pairId]?.trim() || '';
															if (!answer) {
																return;
															}

															// Mark this pair as checked
															setCheckedTranslatePairs((prev) => new Set([...prev, pairId]));

															// Update user answer
															const updatedAnswers = { ...translateAnswers, [pairId]: answer };
															setTranslateAnswers(updatedAnswers);

															const userAnswerText =
																question.translatePairs
																	?.map((p, idx) => {
																		const ans = updatedAnswers[p.id || idx.toString()] || '';
																		return ans.trim() ? `${p.originalText}: ${ans}` : '';
																	})
																	.filter((text) => text !== '')
																	.join(' | ') || '';

															setUserAnswer(userAnswerText);
															setError(false);

															// Check if all pairs are checked
															const allPairIds = new Set(question.translatePairs?.map((p, idx) => p.id || idx.toString()) || []);
															const newCheckedPairs = new Set([...checkedTranslatePairs, pairId]);
															const allChecked =
																allPairIds.size > 0 &&
																allPairIds.size === newCheckedPairs.size &&
																Array.from(allPairIds).every((id) => newCheckedPairs.has(id));

															if (allChecked) {
																setIsAnswerCorrect(true);
																setSuccess(true);

																await createUserQuestion();
																toggleAiIcon(index);
															}
														}}
														sx={{
															width: '40%',
														}}>
														Check
													</CustomSubmitButton>
												</Box>
											)}
										</Box>
									);
								})}
							</Box>
						)}

						{isMultipleChoiceQuestion && (
							<Box
								sx={{
									alignSelf: 'center',
									width: '100%',
									maxWidth: isMobileSize ? '100%' : '600px',
									display: 'flex',
									flexDirection: 'column',
									gap: '0.75rem',
								}}>
								{question &&
									question.options &&
									question.options?.map((option, index) => {
										const isSelected =
											(isLessonCompleted && displayedQuestionNumber < getLastQuestion() && !isLessonUpdating ? question.correctAnswer : value) ===
											option;
										return (
											<Box
												key={index}
												onClick={() => {
													if (!isLessonCompleted || displayedQuestionNumber >= getLastQuestion() || isLessonUpdating) {
														const syntheticEvent = {
															target: { value: option },
														} as React.ChangeEvent<HTMLInputElement>;
														handleRadioChange(syntheticEvent);
													} else {
														setShowQuestionSelector(true);
														setIsLessonUpdating(true);
														setIsOpenEndedAnswerSubmitted(false);
													}
												}}
												sx={{
													'position': 'relative',
													'display': 'flex',
													'alignItems': 'center',
													'justifyContent': 'space-between',
													'padding': isMobileSize ? '0.75rem 1rem' : '1rem 1.25rem',
													'borderRadius': '12px',
													'border': '2px solid',
													'borderColor': isSelected ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.12)',
													'background': isSelected
														? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
														: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
													'boxShadow': isSelected ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
													'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
													'cursor': 'pointer',
													'backdropFilter': 'blur(10px)',
													'&:hover': {
														transform: 'translateY(-2px)',
														boxShadow: isSelected ? '0 6px 16px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.12)',
														borderColor: isSelected ? theme.palette.primary.main : 'rgba(102, 126, 234, 0.4)',
														background: isSelected
															? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
															: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
													},
													'&::before': {
														content: '""',
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														background: isSelected
															? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
															: 'transparent',
														borderRadius: '12px',
														zIndex: 0,
													},
												}}>
												<Typography
													sx={{
														fontSize: isMobileSize ? '0.8rem' : '0.9rem',
														fontWeight: isSelected ? 600 : 400,
														color: isSelected ? theme.palette.primary.main : theme.textColor?.secondary.main,
														zIndex: 1,
														position: 'relative',
														lineHeight: 1.5,
														transition: 'all 0.2s ease',
														flex: 1,
													}}>
													{stripHtml(option)}
												</Typography>
											</Box>
										);
									})}
							</Box>
						)}
						{!isOpenEndedQuestion && (!isLessonCompleted || isLessonUpdating) && helperText !== ' ' && (
							<FormHelperText
								sx={{
									color: success ? 'green' : 'inherit',
									alignSelf: 'center',
									mt: '2rem',
									fontSize: isMobileLandscape || isMobilePortrait ? '0.9rem' : isTabletPortrait || isTabletLandscape ? '1rem' : '1rem',
								}}>
								{helperText}
							</FormHelperText>
						)}

						{!isMatching && !isFITBDragDrop && !isFITBTyping && !isTranslate && (
							<Button
								sx={{
									'mt': isMobileSize ? '2rem' : '3rem',
									'width': isMobileSize ? 'fit-content' : '10rem',
									'alignSelf': 'center',
									'fontSize': isMobileSize ? '0.7rem' : undefined,
									'textTransform': 'capitalize',
									'boxShadow': '0 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.2)',
									'border': 'none',
									':hover': {
										boxShadow: '0 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)',
										border: 'none',
									},
									'mb': '2rem',
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
				<Box sx={{ mt: isMobileSize ? '6.5rem' : '9rem' }}>
					<FlipCardPreview
						question={question}
						fromPracticeQuestionUser={true}
						setIsCardFlipped={setIsCardFlipped}
						displayedQuestionNumber={displayedQuestionNumber}
						numberOfQuestions={numberOfQuestions}
						setIsLessonCompleted={setIsLessonCompleted}
						setShowQuestionSelector={setShowQuestionSelector}
						isSoundMuted={isSoundMuted}
					/>
				</Box>
			)}

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					position: 'absolute',
					mt: isMobileSize ? '1.5rem' : '2rem',
					width: '70%',
					mb: '1rem',
					bottom:
						isSmallMobilePortrait || isMobilePortrait
							? '1rem'
							: isMobileLandscape || isSmallMobileLandscape
								? '2rem'
								: isTabletLandscape || isDesktopLandscape
									? '3rem'
									: '2rem',
				}}>
				<IconButton
					sx={{
						'flexShrink': 0,
						'padding': '0.35rem',
						':hover': {
							color: theme.bgColor?.greenPrimary,
							backgroundColor: 'transparent',
							border: '2px solid lightgray',
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
					<KeyboardArrowLeft fontSize={isMobileSize ? 'medium' : 'large'} />
				</IconButton>

				{!showQuestionSelector && (
					<Typography
						variant={isMobileSize ? 'body2' : 'body1'}
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
							sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}
							value={selectedQuestion}
							onChange={handleQuestionChange}
							size='small'
							label='#'
							required
							MenuProps={{
								PaperProps: {
									style: {
										maxHeight: isMobileSize ? 200 : 250,
									},
								},
							}}>
							{Array.from({ length: numberOfQuestions }, (_, i) => (
								<MenuItem
									key={i + 1}
									value={i + 1}
									sx={{
										display: 'flex',
										justifyContent: 'center',
										fontSize: isMobileSize ? '0.75rem' : '0.9rem',
										minHeight: '2rem',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
									}}>
									{i + 1}
								</MenuItem>
							))}
						</Select>
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
							'flexShrink': 0,
							'padding': '0.35rem',
							'color': isTranslate
								? // For translate questions: gray if not all pairs checked (unless lesson completed or viewing previous)
									!(isLessonCompleted || displayedQuestionNumber < getLastQuestion()) &&
									checkedTranslatePairs.size !== (question.translatePairs?.length || 0)
									? 'gray'
									: theme.textColor?.common.main
								: // For other question types: use existing logic
									!isAnswerCorrect &&
									  !isOpenEndedAnswerSubmitted &&
									  !allPairsMatchedFITBDragDrop &&
									  !allPairsMatchedFITBTyping &&
									  !allPairsMatchedMatching &&
									  !isCardFlipped
									? 'gray'
									: theme.textColor?.common.main,
							'backgroundColor': isTranslate
								? // For translate questions: inherit if not all pairs checked (unless lesson completed or viewing previous)
									!(isLessonCompleted || displayedQuestionNumber < getLastQuestion()) &&
									checkedTranslatePairs.size !== (question.translatePairs?.length || 0)
									? 'inherit'
									: theme.bgColor?.greenPrimary
								: // For other question types: use existing logic
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
								border: '2px solid lightgray',
							},
						}}
						disabled={
							isTranslate
								? // For translate questions: disabled if not all pairs are checked (unless lesson is completed or viewing previous questions)
									!(isLessonCompleted || displayedQuestionNumber < getLastQuestion()) &&
									checkedTranslatePairs.size !== (question.translatePairs?.length || 0)
								: // For other question types: use existing logic
									(!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions || !isOpenEndedAnswerSubmitted) &&
									!(isLessonCompleted || displayedQuestionNumber < getLastQuestion()) &&
									!isCardFlipped &&
									!allPairsMatchedFITBDragDrop &&
									!allPairsMatchedFITBTyping &&
									!allPairsMatchedMatching
						}>
						<KeyboardArrowRight fontSize={isMobileSize ? 'medium' : 'large'} />
					</IconButton>
				) : (
					<Tooltip title={isCompletingCourse ? 'Complete Course' : isCompletingLesson ? 'Complete Lesson' : 'Next Lesson'} placement='top' arrow>
						<IconButton
							onClick={() => {
								if (isLessonCompleted) {
									setIsLessonCourseCompletedModalOpen(true);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
								setIsOpenEndedAnswerSubmitted(false);
							}}
							sx={{
								'flexShrink': 0,
								'color':
									!isAnswerCorrect &&
									!isOpenEndedAnswerSubmitted &&
									!allPairsMatchedFITBDragDrop &&
									!allPairsMatchedFITBTyping &&
									!allPairsMatchedMatching &&
									!isCardFlipped
										? 'gray'
										: theme.textColor?.common.main,
								'backgroundColor':
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
								'padding': '0.35rem',
							}}>
							{isCompletingCourse ? (
								<DoneAll fontSize={isMobileSize ? 'small' : 'medium'} />
							) : isCompletingLesson ? (
								<Done fontSize={isMobileSize ? 'small' : 'medium'} />
							) : isLessonCompleted && isLastQuestion ? (
								<KeyboardDoubleArrowRight fontSize={isMobileSize ? 'small' : 'medium'} />
							) : (
								<KeyboardArrowRight fontSize={isMobileSize ? 'small' : 'medium'} />
							)}
						</IconButton>
					</Tooltip>
				)}

				<CustomDialog
					openModal={isLessonCourseCompletedModalOpen}
					closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
					maxWidth='xs'
					title={`${nextLessonId ? 'Lesson Completed' : 'Course Completed'}`}>
					<DialogContent sx={{ mb: '-0.5rem' }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{`You have completed this ${nextLessonId ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId ? 'lesson' : 'course'}.`}
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => setIsLessonCourseCompletedModalOpen(false)}
						onSubmit={async () => {
							await handleNextLesson();
							navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						submitBtnText='OK'
						actionSx={{ margin: '0rem 0.5rem 0.5rem 0' }}
					/>
				</CustomDialog>
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					position: 'fixed',
					top: isMobileSize ? '7.5rem' : '11rem',
					right: isSmallScreen ? '0.15rem' : isRotatedMedium ? '1rem' : '2rem',
					width: '80%',
					zIndex: 9,
				}}>
				{displayedQuestionNumber === questionNumber && !isFlipCard && !isMatching && !isFITBDragDrop && !isFITBTyping && !isTranslate ? (
					!hasRequestedAiFeedback && (isAiActive || isLessonCompleted) ? (
						<Tooltip title='Receive feedback from AI' placement='left' arrow>
							<IconButton
								onClick={async () => {
									if (isAiFeedbackLoading) return; // Prevent multiple calls

									setIsAiFeedbackLoading(true);
									setHasRequestedAiFeedback(true);
									openAiResponseDrawer(index);

									try {
										await handleInitialSubmit(questionPrompt);
									} catch (error) {
										console.error('AI feedback error:', error);
										// Reset state if there's an error so user can try again
										setHasRequestedAiFeedback(false);
									} finally {
										setIsAiFeedbackLoading(false);
									}
								}}
								disabled={isAiFeedbackLoading}>
								<AiIcon
									sx={{
										fontSize: '2rem',
										width: isMobileSize ? '1.25rem' : '1.5rem',
										height: isMobileSize ? '1.25rem' : '1.5rem',
										border: 'none',
										ml: 0.8,
										color: isAiFeedbackLoading ? 'gray' : '#4D7B8B',
										animation: isAiFeedbackLoading ? 'none' : `${colorChange} 1s infinite, ${spin} 3s linear infinite`,
									}}
								/>
							</IconButton>
						</Tooltip>
					) : hasRequestedAiFeedback ? (
						<Tooltip title='AI feedback already requested for this question' placement='left' arrow>
							<IconButton
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
									'color': 'gray',
								}}
								disabled>
								<AutoAwesome fontSize={isMobileSize ? 'small' : 'medium'} />
							</IconButton>
						</Tooltip>
					) : (
						<Tooltip title='Submit answer to receive feedback from AI' placement='left' arrow>
							<IconButton
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<AutoAwesome fontSize={isMobileSize ? 'small' : 'medium'} />
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
								top: isMobileSize ? '11rem' : '14rem',
								width: isSmallScreen ? '70%' : isRotated ? '50%' : '30%',
								minHeight: '30%',
								maxHeight: '50%',
								boxShadow: 10,
								padding: isMobileSize ? '0.75rem 1.5rem' : '1.75rem',
								bgcolor: 'background.paper',
								borderRadius: '0.35rem 0 0 0.35rem',
								overflow: 'auto',
							}}>
							<Box sx={{ minHeight: '100%' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Box>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
											AI Assist
										</Typography>
									</Box>
									<Box>
										<IconButton onClick={() => closeAiResponseDrawer(index)}>
											<Close fontSize={isMobileSize ? 'small' : 'medium'} />
										</IconButton>
									</Box>
								</Box>
								{isLoadingAiResponse ? (
									<Box sx={{ display: 'flex', height: '25vh', justifyContent: 'center', alignItems: 'center' }}>
										<TypingAnimation />
									</Box>
								) : (
									<Typography variant='body2' sx={{ mt: '0.5rem', lineHeight: 1.9, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
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
