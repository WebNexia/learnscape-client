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
import { LoadingButton } from '@mui/lab';
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
import { AutoAwesome, Close, Done, DoneAll, KeyboardArrowLeft, KeyboardArrowRight, KeyboardDoubleArrowRight, Refresh } from '@mui/icons-material';
import AiIcon from '@mui/icons-material/AutoAwesome';
import { UserQuestionData } from '../../hooks/useFetchUserQuestion';
import { QuestionType, LessonType } from '../../interfaces/enums';
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
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
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

const AI_FEEDBACK_LIMIT = 2;
const PRACTICE_AGAIN_AI_LIMIT = 1;
const AI_FEEDBACK_TOTAL_MAX = AI_FEEDBACK_LIMIT + PRACTICE_AGAIN_AI_LIMIT;

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
	practiceAgainMode?: boolean;
	enableWordAssist?: boolean;
	/** Lesson content (plain text) for open-ended AI context */
	lessonText?: string;
	/** Chapter name for open-ended AI context */
	chapterName?: string;
	/** Staff learner-view: unlocked navigation, no answer/progress persistence */
	staffPreviewMode?: boolean;
	staffPreviewNextLessonId?: string;
	staffPreviewCoursePath?: string;
	onStaffPreviewGoToNextLesson?: () => void;
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
	practiceAgainMode = false,
	enableWordAssist = false,
	lessonText,
	chapterName,
	staffPreviewMode = false,
	staffPreviewNextLessonId,
	staffPreviewCoursePath,
	onStaffPreviewGoToNextLesson,
}: PracticeQuestionProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { userLessonId, handleNextLesson, nextLessonId, updateLastQuestion, getLastQuestion } = useUserCourseLessonData();
	const { aiResponse, handleInitialSubmit, isLoadingAiResponse } = useAiResponse();
	const effectivePracticeAgainMode = staffPreviewMode || practiceAgainMode;
	const effectiveIsLessonCompleted = staffPreviewMode ? true : isLessonCompleted;
	const effectiveNextLessonId = staffPreviewMode ? staffPreviewNextLessonId ?? null : nextLessonId;

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

	const { lessonId, courseId, userCourseId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName, questionTypes } = useQuestionTypes();

	// Sound effects - enabled even when lesson is completed
	const { playSuccessSound, playErrorSound, playSubmitSound } = useSoundEffect(true, isSoundMuted);
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
		if (staffPreviewMode) {
			return isOpenEndedQuestion ? '' : userAnswer;
		}
		if ((isLessonCompleted && question.correctAnswer && !practiceAgainMode) || (!isLessonCompleted && displayedQuestionNumber < getLastQuestion())) {
			return question.correctAnswer;
		} else if (isOpenEndedQuestion) {
			const answer: string = userAnswers?.find((data) => String(data.questionId) === String(question._id))?.userAnswer || '';
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
	const [isSubmittingOpenEnded, setIsSubmittingOpenEnded] = useState<boolean>(false);
	const [selectedQuestion, setSelectedQuestion] = useState<number>(displayedQuestionNumber);
	const [isLessonUpdating, setIsLessonUpdating] = useState<boolean>(false);
	const [isLessonCourseCompletedModalOpen, setIsLessonCourseCompletedModalOpen] = useState<boolean>(false);
	const [isNavigatingFromCompletedDialog, setIsNavigatingFromCompletedDialog] = useState<boolean>(false);
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
	// Open-ended flow: true after "Edit Answer" (user can edit/save again), false after Save (feedback phase)
	const [unlockedForNextRound, setUnlockedForNextRound] = useState<boolean>(staffPreviewMode);
	const [aiFeedbackError, setAiFeedbackError] = useState<string>('');
	// In each round, AI is requested only once; further clicks just show saved feedback. Reset on Refresh or question change.
	const [hasRequestedAiThisRound, setHasRequestedAiThisRound] = useState<boolean>(false);
	const hasInitializedAiRoundRef = useRef<boolean>(false);
	const prevUnlockedForNextRoundRef = useRef<boolean>(false);
	const prevQuestionKeyRef = useRef<string>('');

	const isLastQuestion: boolean = displayedQuestionNumber === numberOfQuestions;
	const isCompletingCourse: boolean = isLastQuestion && effectiveNextLessonId === null && effectiveIsLessonCompleted;
	const isCompletingLesson: boolean = isLastQuestion && effectiveNextLessonId !== null && effectiveIsLessonCompleted;

	const [questionPrompt, setQuestionPrompt] = useState<QuestionPrompt>({
		question: stripHtml(question.question),
		type: fetchQuestionTypeName(question),
		options: isMultipleChoiceQuestion ? question.options : [],
		userInput: isLessonCompleted && !isLessonUpdating ? question.correctAnswer : userAnswer,
		correctAnswer: question.correctAnswer,
	});

	// Open-ended: current user-question entry for AI feedback count and last response (no effect, no refetch)
	const existingUserAnswerForAi = useMemo(
		() => userAnswers?.find((data) => String(data.questionId) === String(question._id)),
		[userAnswers, question._id]
	);
	const aiFeedbackCount = existingUserAnswerForAi?.aiFeedbackRequestCount ?? 0;
	const hasReachedAiLimit = aiFeedbackCount >= AI_FEEDBACK_LIMIT;
	const hasReachedTotalAiLimit = aiFeedbackCount >= AI_FEEDBACK_TOTAL_MAX;
	const savedLastAiFeedback = existingUserAnswerForAi?.lastAiFeedback ?? '';
	const hasOpenEndedUserQuestionId = Boolean(existingUserAnswerForAi?.userQuestionId);
	// First-time solving: input enabled when no save yet, or after "Edit Answer" (unlimited edits after AI limit)
	const isOpenEndedFirstTime = isOpenEndedQuestion && !effectiveIsLessonCompleted && !staffPreviewMode;
	const isOpenEndedPracticeAgain = isOpenEndedQuestion && (effectivePracticeAgainMode && effectiveIsLessonCompleted);
	const openEndedInputEnabled =
		(isOpenEndedFirstTime &&
			((aiFeedbackCount === 0 && !hasOpenEndedUserQuestionId) || unlockedForNextRound)) ||
		(isOpenEndedPracticeAgain && unlockedForNextRound);
	const openEndedSaveEnabled =
		(isOpenEndedFirstTime || isOpenEndedPracticeAgain) &&
		openEndedInputEnabled &&
		value.trim() !== '' &&
		!isSubmittingOpenEnded;
	// Hide Edit until AI is requested for the current round (except after first-time AI limit is exhausted)
	const openEndedAwaitingAiThisRound =
		isOpenEndedFirstTime &&
		!hasReachedAiLimit &&
		aiFeedbackCount >= 1 &&
		!hasRequestedAiThisRound &&
		!openEndedInputEnabled;
	const openEndedShowRefresh =
		(isOpenEndedPracticeAgain &&
			hasOpenEndedUserQuestionId &&
			!openEndedInputEnabled) ||
		(isOpenEndedFirstTime &&
			hasOpenEndedUserQuestionId &&
			!openEndedInputEnabled &&
			!openEndedAwaitingAiThisRound &&
			(hasReachedAiLimit || aiFeedbackCount >= 1));
	// Practice again: 1 AI request per session, after Edit Answer + Save (not on entry)
	const [practiceAgainAiCount, setPracticeAgainAiCount] = useState(0);
	const [practiceAgainSavedForAi, setPracticeAgainSavedForAi] = useState(false);
	useEffect(() => {
		if (practiceAgainMode) {
			setPracticeAgainAiCount(0);
			setPracticeAgainSavedForAi(false);
		}
	}, [practiceAgainMode]);
	const practiceAgainAiLimitReached =
		practiceAgainMode &&
		isOpenEndedQuestion &&
		(practiceAgainAiCount >= PRACTICE_AGAIN_AI_LIMIT || hasReachedTotalAiLimit);
	const practiceAgainAiRequestEnabled =
		practiceAgainMode &&
		isOpenEndedQuestion &&
		hasOpenEndedUserQuestionId &&
		practiceAgainSavedForAi &&
		!openEndedInputEnabled &&
		practiceAgainAiCount < PRACTICE_AGAIN_AI_LIMIT &&
		!hasReachedTotalAiLimit;
	const openEndedAiRequestEnabled =
		(isOpenEndedFirstTime && !openEndedInputEnabled && hasOpenEndedUserQuestionId && !hasReachedAiLimit) ||
		practiceAgainAiRequestEnabled;

	useEffect(() => {
		const questionKey = `${question._id}-${displayedQuestionNumber}-${practiceAgainMode}`;
		const isQuestionChange = prevQuestionKeyRef.current !== questionKey;
		if (isQuestionChange) {
			prevQuestionKeyRef.current = questionKey;
		}

		if (isTranslate && isLessonCompleted) {
			// Translate answers are not saved to database, so always start fresh for practice
			setTranslateAnswers({});
			// Don't mark pairs as checked - allow practice mode
			setCheckedTranslatePairs(new Set());
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
		} else if (isLessonCompleted && question.correctAnswer && !isOpenEndedQuestion && !isTranslate && !practiceAgainMode) {
			setValue(question.correctAnswer);
		} else if (isQuestionChange && isLessonCompleted && practiceAgainMode && !isOpenEndedQuestion && !isTranslate && !isFlipCard) {
			// Hide answers in practice again mode - reset to empty when navigating to a question
			setValue('');
			if (isTrueFalseQuestion || isMultipleChoiceQuestion) {
				setHelperText('Choose wisely');
				setError(false);
				setSuccess(false);
			}
		} else if (isOpenEndedQuestion) {
			setValue(() => {
				const answer = userAnswers?.find((data) => String(data.questionId) === String(question._id))?.userAnswer || '';
				return answer;
			});
		} else if (!isLessonCompleted && displayedQuestionNumber === getLastQuestion()) {
			setValue(userAnswer);
		} else if (!isLessonCompleted && displayedQuestionNumber < getLastQuestion()) {
			setValue(question.correctAnswer);
		}

		setSelectedQuestion(displayedQuestionNumber);

		if (isQuestionChange && isLessonCompleted) {
			setShowQuestionSelector(true);
			setQuestionPrompt((prevData) => {
				const answer: string = userAnswers?.find((data) => String(data.questionId) === String(question._id))?.userAnswer || '';
				return { ...prevData, userInput: answer };
			});
		}

		if (isQuestionChange) {
			if (!practiceAgainMode && (isLessonCompleted || isAnswerCorrect || displayedQuestionNumber < getLastQuestion())) {
				setHelperText(' ');
			}

			setIsOpenEndedAnswerSubmitted(false);
			setIsAnswerCorrect(false);
			setIsSubmittingOpenEnded(false);
			if (!isTranslate) {
				setCheckedTranslatePairs(new Set());
				setTranslateAnswers({});
			}

			// Reset AI feedback state when question changes
			setHasRequestedAiFeedback(false);
			setUnlockedForNextRound(false);
			setHasRequestedAiThisRound(false);
			setAiFeedbackError('');
			setPracticeAgainSavedForAi(false);
			hasInitializedAiRoundRef.current = false;

			// Reset sound tracking refs when question changes
			prevIsAnswerCorrectRef.current = false;
			prevErrorRef.current = false;
		}
	}, [displayedQuestionNumber, question._id, userAnswers, practiceAgainMode]);

	// Keep open-ended answer populated after lesson completion when user answers load asynchronously.
	useEffect(() => {
		if (!isOpenEndedQuestion) return;
		if (!isLessonCompleted || practiceAgainMode) return;

		const savedOpenEndedAnswer = userAnswers?.find((data) => String(data.questionId) === String(question._id))?.userAnswer || '';
		setValue(savedOpenEndedAnswer);
	}, [isOpenEndedQuestion, isLessonCompleted, practiceAgainMode, userAnswers, question._id]);

	// First-time open-ended: when AI limit is reached, show last saved answer in the disabled field.
	useEffect(() => {
		if (!isOpenEndedQuestion || isLessonCompleted) return;
		if (aiFeedbackCount < AI_FEEDBACK_LIMIT) return;
		const saved = existingUserAnswerForAi?.userAnswer;
		if (saved !== undefined && saved !== null) setValue(saved);
	}, [isOpenEndedQuestion, isLessonCompleted, aiFeedbackCount, existingUserAnswerForAi?.userAnswer]);

	// When loading a question that already has AI feedback (count >= 1), show "View" not "Receive". Do not set when user just saved after Refresh (they need to see "Receive").
	useEffect(() => {
		if (!isOpenEndedFirstTime || !openEndedAiRequestEnabled || aiFeedbackCount < 1) return;
		if (prevUnlockedForNextRoundRef.current) return; // They were unlocked last render (e.g. just saved after Refresh) → show "Receive"
		hasInitializedAiRoundRef.current = true;
		setHasRequestedAiThisRound(true);
	}, [isOpenEndedFirstTime, openEndedAiRequestEnabled, aiFeedbackCount]);
	useEffect(() => {
		prevUnlockedForNextRoundRef.current = unlockedForNextRound;
	});

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

	const createUserQuestion = async (answerOverride?: string) => {
		if (staffPreviewMode) {
			const answerToPersist = (answerOverride ?? userAnswer ?? '').trim();
			setUserAnswers((prevData) => {
				const currentData = prevData || [];
				const hasExistingQuestion = currentData.some((data) => String(data.questionId) === String(question._id));
				if (hasExistingQuestion) {
					return currentData.map((data) =>
						String(data.questionId) === String(question._id) ? { ...data, userAnswer: answerToPersist } : data
					);
				}
				return [
					...currentData,
					{
						userQuestionId: `preview-${question._id}`,
						questionId: question._id,
						userAnswer: answerToPersist,
						audioRecordUrl: '',
						videoRecordUrl: '',
						teacherFeedback: '',
						teacherAudioFeedbackUrl: '',
						userMatchingPairAnswers: [],
						userBlankValuePairAnswers: [],
					},
				];
			});
			setIsOpenEndedAnswerSubmitted(true);
			setValue(answerToPersist);
			playSubmitSound();
			setUnlockedForNextRound(false);
			if (effectivePracticeAgainMode) setPracticeAgainSavedForAi(true);
			return;
		}

		const answerToPersist = (answerOverride ?? userAnswer ?? '').trim();
		const existingUserAnswer = userAnswers?.find((data) => String(data.questionId) === String(question._id));

		if (!existingUserAnswer || existingUserAnswer.userAnswer !== answerToPersist) {
			try {
				if (isOpenEndedQuestion) {
					const existingId = existingUserAnswer?.userQuestionId;

					if (existingId) {
						// Edit Answer + Save: update existing (so next AI request uses new answer)
						await axios.patch(`${base_url}/userQuestions/${existingId}`, { userAnswer: answerToPersist });
						setUserAnswers((prevData) =>
							(prevData || []).map((data) =>
								String(data.questionId) === String(question._id) ? { ...data, userAnswer: answerToPersist } : data
							)
						);
						setIsOpenEndedAnswerSubmitted(true);
						setValue(answerToPersist);
						playSubmitSound();
						setUnlockedForNextRound(false);
						if (practiceAgainMode) setPracticeAgainSavedForAi(true);
					} else {
						// First save: create new
						const res = await axios.post(`${base_url}/userQuestions`, {
							userLessonId,
							questionId: question._id,
							userId: user?._id,
							lessonId,
							courseId,
							isCompleted: true,
							isInProgress: false,
							orgId,
							userAnswer: answerToPersist,
							teacherFeedback: '',
							teacherAudioFeedbackUrl: '',
						});

						const userQuestionId = res.data._id;
						if (res.status === 200) {
							await axios.patch(`${base_url}/userQuestions/${userQuestionId}`, { userAnswer: answerToPersist });
							setUserAnswers((prevData) => {
								const currentData = prevData || [];
								const hasExistingQuestion = currentData.some((data) => String(data.questionId) === String(question._id));
								if (hasExistingQuestion) {
									return currentData.map((data) =>
										String(data.questionId) === String(question._id) ? { ...data, userAnswer: answerToPersist } : data
									);
								}
								return [
									...currentData,
									{
										userQuestionId: userQuestionId || '',
										questionId: question._id,
										userAnswer: answerToPersist,
										audioRecordUrl: '',
										videoRecordUrl: '',
										teacherFeedback: '',
										teacherAudioFeedbackUrl: '',
										userMatchingPairAnswers: [],
										userBlankValuePairAnswers: [],
									},
								];
							});
						} else {
							setUserAnswers((prevData) => {
								const newUserAnswer = {
									userQuestionId: res.data._id,
									questionId: question._id,
									userAnswer: answerToPersist,
									audioRecordUrl: '',
									videoRecordUrl: '',
									teacherFeedback: '',
									teacherAudioFeedbackUrl: '',
									userMatchingPairAnswers: [],
									userBlankValuePairAnswers: [],
								};
								return [...(prevData || []), newUserAnswer];
							});
						}

						setIsOpenEndedAnswerSubmitted(true);
						setValue(answerToPersist);
						playSubmitSound();
						setUnlockedForNextRound(false);
						if (practiceAgainMode) setPracticeAgainSavedForAi(true);
					}
				}

				if (!practiceAgainMode && !staffPreviewMode) {
					if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
						updateLastQuestion(displayedQuestionNumber + 1);
					}

					if (displayedQuestionNumber === numberOfQuestions) {
						await handleNextLesson();
						setIsLessonCompleted(true);
						setShowQuestionSelector(true);
					}
				}
				if (staffPreviewMode) {
					setShowQuestionSelector(true);
				}
			} catch (error) {
				console.log(error);
			}
		} else {
			setIsOpenEndedAnswerSubmitted(true);
			if (isOpenEndedQuestion) {
				setUnlockedForNextRound(false);
				if (practiceAgainMode || staffPreviewMode) setPracticeAgainSavedForAi(true);
			}
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const effectiveIsLessonCompleted = isLessonCompleted && !practiceAgainMode;
		if (effectiveIsLessonCompleted) {
			setShowQuestionSelector(true);
			setIsLessonUpdating(true);
			setIsOpenEndedAnswerSubmitted(false);
		}

		const selectedValue = (event.target as HTMLInputElement).value;
		setValue(selectedValue);
		setHelperText(' ');
		setError(false);
		setUserAnswer(selectedValue);

		// Auto-submit for Multiple Choice practice questions when answer is selected
		if (!effectiveIsLessonCompleted && isMultipleChoiceQuestion && lessonType === LessonType.PRACTICE_LESSON) {
			// Use setTimeout to ensure state updates are processed first
			setTimeout(() => {
				handleAutoSubmit(selectedValue);
			}, 0);
		}
	};

	// Auto-submit handler for True-False and Multiple Choice questions
	const handleAutoSubmit = async (answerValue: string) => {
		const effectiveIsLessonCompleted = isLessonCompleted && !practiceAgainMode;
		if (!answerValue || effectiveIsLessonCompleted) return;

		if (answerValue === question.correctAnswer?.toString()) {
			setHelperText('You got it!');
			setError(false);
			setIsAnswerCorrect(true);
			setSuccess(true);
			await createUserQuestion();
			setUserAnswer(answerValue);
			setIsOpenEndedAnswerSubmitted(true);
			toggleAiIcon(index);
		} else {
			setHelperText('Sorry, wrong answer!');
			setError(true);
			setIsAnswerCorrect(false);
			setUserAnswer(answerValue);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (isOpenEndedQuestion && value !== '') {
			setIsSubmittingOpenEnded(true);
			setError(false); // Explicitly set error to false for open-ended questions
			setUserAnswer(value);
			await createUserQuestion(value);
			setUserAnswer(value);
			setIsOpenEndedAnswerSubmitted(true);
			setIsAnswerCorrect(true);
			setIsSubmittingOpenEnded(false);
			toggleAiIcon(index);
			return; // Return early to prevent other error checks
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
		} else if (value !== question.correctAnswer && value !== '' && !isOpenEndedQuestion) {
			setHelperText('Sorry, wrong answer!');
			setError(true);
			setIsAnswerCorrect(false);
			setUserAnswer(value);
		} else if (!isOpenEndedQuestion) {
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
				paddingBottom: isTranslate ? (isMobileSize ? '4rem' : '6rem') : '8rem',
			}}>
			{!isFlipCard && (
				<form onSubmit={handleSubmit} style={{ width: '100%' }}>
					<FormControl sx={{ width: '100%' }} error={error && !isOpenEndedQuestion} variant='standard'>
						<QuestionMedia question={question} />
						{!isFITBDragDrop && !isFITBTyping && (
							<QuestionText question={question} isMatching={isMatching} questionNumber={questionNumber} enableWordAssist={enableWordAssist} />
						)}

						{isOpenEndedQuestion && (
							<Box sx={{ width: '95%', margin: '0rem auto' }}>
								<CustomTextField
									required={false}
									multiline
									rows={4}
									resizable
									value={value}
									disabled={
										isOpenEndedFirstTime || isOpenEndedPracticeAgain
											? !openEndedInputEnabled
											: isLessonCompleted
									}
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
									isLessonCompleted={!staffPreviewMode && isLessonCompleted && !practiceAgainMode}
									displayedQuestionNumber={displayedQuestionNumber}
									setHelperText={setHelperText}
									setIsLessonUpdating={setIsLessonUpdating}
									isLessonUpdating={isLessonUpdating}
									setUserAnswer={setUserAnswer}
									lessonType={lessonType}
									setQuestionPrompt={setQuestionPrompt}
									onAutoSubmit={handleAutoSubmit}
								/>
							</Box>
						)}

						{isMatching && (
							<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto 2rem auto' }}>
								<MatchingPreview
									initialPairs={question.matchingPairs}
									setAllPairsMatchedMatching={setAllPairsMatchedMatching}
									fromPracticeQuestionUser={!staffPreviewMode}
									displayedQuestionNumber={displayedQuestionNumber}
									numberOfQuestions={numberOfQuestions}
									setIsLessonCompleted={setIsLessonCompleted}
									setShowQuestionSelector={setShowQuestionSelector}
									lessonType={lessonType}
									isLessonCompleted={!staffPreviewMode && isLessonCompleted && !practiceAgainMode}
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
											? '3rem auto 0 auto'
											: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
												? '6.5rem auto 0 auto'
												: isTabletPortrait || isTabletLandscape
													? '7rem auto 0 auto'
													: isDesktopPortrait || isDesktopLandscape
														? '8rem auto 0 auto'
														: '6.5rem auto 0 auto',
								}}>
								<FillInTheBlanksDragDrop
									textWithBlanks={question.question}
									blankValuePairs={question.blankValuePairs}
									setAllPairsMatchedFITBDragDrop={setAllPairsMatchedFITBDragDrop}
									fromPracticeQuestionUser={!staffPreviewMode}
									displayedQuestionNumber={displayedQuestionNumber}
									numberOfQuestions={numberOfQuestions}
									isLessonCompleted={!staffPreviewMode && isLessonCompleted && !practiceAgainMode}
									setIsLessonCompleted={setIsLessonCompleted}
									setShowQuestionSelector={setShowQuestionSelector}
									lessonType={lessonType}
									onCorrectMatch={playSuccessSound}
									onWrongMatch={playErrorSound}
									enableWordAssist={enableWordAssist}
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
											? '3rem auto 0 auto'
											: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
												? '6.5rem auto 0 auto'
												: isTabletPortrait || isTabletLandscape
													? '7rem auto 0 auto'
													: isDesktopPortrait || isDesktopLandscape
														? '8rem auto 0 auto'
														: '6.5rem auto 0 auto',
								}}>
								<FillInTheBlanksTyping
									textWithBlanks={question.question}
									blankValuePairs={question.blankValuePairs}
									setAllPairsMatchedFITBTyping={setAllPairsMatchedFITBTyping}
									fromPracticeQuestionUser={!staffPreviewMode}
									displayedQuestionNumber={displayedQuestionNumber}
									numberOfQuestions={numberOfQuestions}
									isLessonCompleted={!staffPreviewMode && isLessonCompleted && !practiceAgainMode}
									setIsLessonCompleted={setIsLessonCompleted}
									setShowQuestionSelector={setShowQuestionSelector}
									lessonType={lessonType}
									onCorrectMatch={playSuccessSound}
									enableWordAssist={enableWordAssist}
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
									pb: isMobileSize ? '4rem' : '5rem',
								}}>
								{question.translatePairs?.map((pair, index) => {
									const pairId = pair.id || index.toString();
									const isPairChecked = checkedTranslatePairs.has(pairId);
									const showTranslation = isPairChecked; // Only show translation when pair is checked, not just because lesson is completed

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
												InputProps={{
													inputProps: {
														maxLength: 500,
													},
												}}
												sx={{
													width: '100%',
												}}
											/>

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

											{!isPairChecked && (
												<Box sx={{ display: 'flex', justifyContent: 'center', mt: '-1rem', mb: '-0.5rem' }}>
													<CustomSubmitButton
														onClick={async () => {
															playSubmitSound();

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

															// Only submit to server if lesson is not completed
															if (!isLessonCompleted) {
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
															}
														}}
														sx={{
															width: '40%',
														}}>
														Compare
													</CustomSubmitButton>
												</Box>
											)}

											{isPairChecked && (
												<Box sx={{ display: 'flex', justifyContent: 'center', mb: '-1rem' }}>
													<Tooltip title='Try Again' placement='top' arrow>
														<IconButton
															onClick={() => {
																// Un-check the pair to allow editing again
																setCheckedTranslatePairs((prev) => {
																	const newSet = new Set(prev);
																	newSet.delete(pairId);
																	return newSet;
																});
															}}>
															<Refresh fontSize='small' />
														</IconButton>
													</Tooltip>
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
										const effectiveIsLessonCompleted = isLessonCompleted && !practiceAgainMode;
										const isSelected = effectiveIsLessonCompleted
											? question.correctAnswer === option
											: value === option;
										return (
											<Box
												key={index}
												onClick={() => {
													if (effectiveIsLessonCompleted) return;

													const syntheticEvent = {
														target: { value: option },
													} as React.ChangeEvent<HTMLInputElement>;
													handleRadioChange(syntheticEvent);
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
													'cursor': effectiveIsLessonCompleted ? 'default' : 'pointer',
													'backdropFilter': 'blur(10px)',
													'&:hover': effectiveIsLessonCompleted
														? {}
														: {
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
						{!isOpenEndedQuestion && (!isLessonCompleted || isLessonUpdating || practiceAgainMode) && helperText !== ' ' && (
							<FormHelperText
								sx={{
									color: success ? 'green' : 'inherit',
									alignSelf: 'center',
									mt: '2rem',
									fontSize: isMobileLandscape || isMobilePortrait ? '0.9rem' : isTabletPortrait || isTabletLandscape ? '0.9rem' : '0.9rem',
								}}>
								{helperText}
							</FormHelperText>
						)}

						{!isMatching && !isFITBDragDrop && !isFITBTyping && !isTranslate && !isMultipleChoiceQuestion && !isTrueFalseQuestion && (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 2,
									mt: isMobileSize ? '2rem' : '3rem',
									mb: '2rem',
									flexWrap: 'wrap',
								}}>
								<LoadingButton
									loading={isSubmittingOpenEnded}
									type='submit'
									variant='contained'
									size='small'
									disabled={
										isOpenEndedFirstTime || isOpenEndedPracticeAgain
											? !openEndedSaveEnabled || isSubmittingOpenEnded
											: isLessonCompleted || isSubmittingOpenEnded
									}
									sx={{
										minWidth: isMobileSize ? 120 : 140,
										py: isMobileSize ? 1 : 1,
										px: isMobileSize ? 1.5 : 2.5,
										fontSize: isMobileSize ? '0.8rem' : '0.9rem',
										fontWeight: 500,
										textTransform: 'none',
										borderRadius: 2,
										boxShadow: '0 2px 8px rgba(1, 67, 90, 0.25)',
										'&:hover': {
											boxShadow: '0 4px 14px rgba(1, 67, 90, 0.35)',
										},
										'&.Mui-disabled': {
											opacity: 0.7,
										},
									}}>
									Save Answer
								</LoadingButton>
								{openEndedShowRefresh && (
									<Button
										variant='outlined'
										size='small'
										startIcon={<Refresh fontSize='small' />}
										onClick={() => {
											setUnlockedForNextRound(true);
											setHasRequestedAiThisRound(false);
											if (practiceAgainMode) setPracticeAgainSavedForAi(false);
										}}
										sx={{
											minWidth: isMobileSize ? 120 : 140,
											py: isMobileSize ? 0.75 : 0.75,
											px: isMobileSize ? 1.5 : 2,
											fontSize: isMobileSize ? '0.8rem' : '0.9rem',
											fontWeight: 500,
											textTransform: 'none',
											borderRadius: 2,
											borderWidth: 2,
											color: 'primary.main',
											borderColor: 'primary.main',
											'&:hover': {
												borderWidth: 2,
												borderColor: 'primary.dark',
												backgroundColor: 'rgba(1, 67, 90, 0.06)',
											},
										}}>
										Edit Answer
									</Button>
								)}
							</Box>
						)}
					</FormControl>
				</form>
			)}

			{isFlipCard && (
				<Box sx={{ mt: isMobileSize ? '6.5rem' : '9rem' }}>
					<FlipCardPreview
						question={question}
						fromPracticeQuestionUser={!staffPreviewMode}
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
					width: '50%',
					minWidth: isMobileSize ? '11.5rem' : '14rem',
					left: '50%',
					transform: 'translateX(-50%)',
					gap: isMobileSize ? '0.55rem' : '0.75rem',
					padding: isMobileSize ? '0.35rem 0.45rem' : '0.45rem 0.6rem',
					borderRadius: '0.95rem',
					background: 'rgba(255,255,255,0.78)',
					backdropFilter: 'blur(10px)',
					border: '1px solid rgba(1, 67, 90, 0.12)',
					boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
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
						'width': isMobileSize ? 34 : 40,
						'height': isMobileSize ? 34 : 40,
						'borderRadius': '12px',
						'backgroundColor': 'rgba(1, 67, 90, 0.08)',
						'border': '1px solid rgba(1, 67, 90, 0.15)',
						'color': theme.palette.primary.main,
						'boxShadow': '0 2px 8px rgba(0,0,0,0.08)',
						'transition': 'all .2s ease',
						'&:hover': {
							backgroundColor: 'rgba(1, 67, 90, 0.14)',
							transform: 'translateY(-1px)',
							boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
						},
						'&.Mui-disabled': {
							opacity: 0.35,
							color: 'rgba(0,0,0,0.35)',
							borderColor: 'rgba(0,0,0,0.12)',
							backgroundColor: 'rgba(0,0,0,0.03)',
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

				{!showQuestionSelector && !staffPreviewMode && (
					<Typography
						variant={isMobileSize ? 'body2' : 'body1'}
						sx={{
							position: 'absolute',
							left: '50%',
							transform: 'translateX(-50%)',
							fontWeight: 600,
							fontSize: isMobileSize ? '0.8rem' : '0.9rem',
							color: theme.textColor?.secondary.main,
							padding: isMobileSize ? '0.2rem 0.45rem' : '0.25rem 0.55rem',
							borderRadius: '0.55rem',
							backgroundColor: 'rgba(1, 67, 90, 0.06)',
						}}>
						{displayedQuestionNumber} / {numberOfQuestions}
					</Typography>
				)}

				{(showQuestionSelector || staffPreviewMode) && (
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
							sx={{
								fontSize: isMobileSize ? '0.75rem' : '0.9rem',
								minWidth: isMobileSize ? '3.25rem' : '3.6rem',
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 'rgba(1, 67, 90, 0.2)',
								},
								'& .MuiSelect-select': {
									paddingTop: isMobileSize ? '0.35rem' : '0.45rem',
									paddingBottom: isMobileSize ? '0.35rem' : '0.45rem',
								},
							}}
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

				{displayedQuestionNumber !== numberOfQuestions || !effectiveIsLessonCompleted ? (
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
							'width': isMobileSize ? 34 : 40,
							'height': isMobileSize ? 34 : 40,
							'borderRadius': '12px',
							'backgroundColor': 'rgba(1, 67, 90, 0.08)',
							'border': '1px solid rgba(1, 67, 90, 0.15)',
							'color': theme.palette.primary.main,
							'boxShadow': '0 2px 8px rgba(0,0,0,0.08)',
							'transition': 'all .2s ease',
							'&:hover': {
								backgroundColor: 'rgba(1, 67, 90, 0.14)',
								transform: 'translateY(-1px)',
								boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
							},
							'&.Mui-disabled': {
								opacity: 0.35,
								color: 'rgba(0,0,0,0.35)',
								borderColor: 'rgba(0,0,0,0.12)',
								backgroundColor: 'rgba(0,0,0,0.03)',
							},
						}}
						disabled={
							staffPreviewMode
								? displayedQuestionNumber + 1 > numberOfQuestions
								: isLessonCompleted
									? false
									: isOpenEndedQuestion && hasOpenEndedUserQuestionId
										? false
										: displayedQuestionNumber < getLastQuestion()
											? false
											: isTranslate
												? checkedTranslatePairs.size !== (question.translatePairs?.length || 0)
												: (!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions || !isOpenEndedAnswerSubmitted) &&
												!isCardFlipped &&
												!allPairsMatchedFITBDragDrop &&
												!allPairsMatchedFITBTyping &&
												!allPairsMatchedMatching
						}>
						<KeyboardArrowRight fontSize={isMobileSize ? 'medium' : 'large'} />
					</IconButton>
				) : (
					<Tooltip
						title={
							staffPreviewMode
								? effectiveNextLessonId
									? 'Next Lesson'
									: 'Back to Course'
								: isCompletingCourse
									? 'Complete Course'
									: isLessonCompleted && isLastQuestion
										? 'Next Lesson'
										: isCompletingLesson
											? 'Complete Lesson'
											: 'Next Lesson'
						}
						placement='top'
						arrow>
						<IconButton
							onClick={() => {
								if (staffPreviewMode) {
									onStaffPreviewGoToNextLesson?.();
									return;
								}
								if (isLessonCompleted) {
									setIsLessonCourseCompletedModalOpen(true);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
								setIsOpenEndedAnswerSubmitted(false);
							}}
							sx={{
								'flexShrink': 0,
								'width': isMobileSize ? 34 : 40,
								'height': isMobileSize ? 34 : 40,
								'borderRadius': '12px',
								'backgroundColor': 'rgba(1, 67, 90, 0.08)',
								'border': '1px solid rgba(1, 67, 90, 0.15)',
								'color': theme.palette.primary.main,
								'boxShadow': '0 2px 8px rgba(0,0,0,0.08)',
								'transition': 'all .2s ease',
								'&:hover': {
									backgroundColor: 'rgba(1, 67, 90, 0.14)',
									transform: 'translateY(-1px)',
									boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
								},
							}}>
							{isCompletingCourse ? (
								<DoneAll fontSize={isMobileSize ? 'small' : 'medium'} />
							) : isLessonCompleted && isLastQuestion ? (
								<KeyboardDoubleArrowRight fontSize={isMobileSize ? 'small' : 'large'} />
							) : isCompletingLesson ? (
								<Done fontSize={isMobileSize ? 'small' : 'medium'} />
							) : (
								<KeyboardArrowRight fontSize={isMobileSize ? 'small' : 'medium'} />
							)}
						</IconButton>
					</Tooltip>
				)}

				{isLessonCourseCompletedModalOpen && <CustomDialog
					openModal={isLessonCourseCompletedModalOpen}
					closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
					disableDismiss
					maxWidth='xs'
					title={nextLessonId ? 'Lesson Completed / Ders Tamamlandı' : 'Course Completed / Kurs Tamamlandı'}>
					<DialogContent sx={{ mb: '-0.5rem' }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.8 }}>
							{`You have completed this ${nextLessonId ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId ? 'lesson' : 'course'}.`}
						</Typography>
						<Typography
							variant='body2'
							sx={{ mt: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.8, color: 'text.secondary' }}>
							{nextLessonId
								? 'Bu dersi tamamladınız. Bir sonraki derse geçin.'
								: 'Bu kursu tamamladınız. Bir sonraki kursa geçin.'}
						</Typography>
					</DialogContent>
					<CustomDialogActions
						showCancelBtn={false}
						onSubmit={async () => {
							setIsNavigatingFromCompletedDialog(true);
							try {
								await handleNextLesson();
								navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							} catch (e) {
								setIsNavigatingFromCompletedDialog(false);
								console.error(e);
							}
						}}
						submitBtnText='OK'
						isSubmitting={isNavigatingFromCompletedDialog}
						actionSx={{ margin: '0rem 0.5rem 0.5rem 0' }}
					/>
				</CustomDialog>}
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					position: 'fixed',
					top: isMobileSize ? '7.5rem' : '11rem',
					right: isSmallScreen ? '0.15rem' : isRotatedMedium ? '1rem' : '2rem',
					width: 'fit-content',
					zIndex: 9,
				}}>
				{!staffPreviewMode &&
					displayedQuestionNumber === questionNumber &&
					!isFlipCard &&
					!isMatching &&
					!isFITBDragDrop &&
					!isFITBTyping &&
					!isTranslate &&
					!isTrueFalseQuestion &&
					!isMultipleChoiceQuestion ? (
					// Review: show saved answer + last AI only; no new requests
					isLessonCompleted && !practiceAgainMode ? (
						<Tooltip title={savedLastAiFeedback ? 'View last AI feedback' : 'No AI feedback yet'} placement='left' arrow>
							<IconButton onClick={() => openAiResponseDrawer(index)} sx={{ color: '#4D7B8B' }}>
								<AiIcon sx={{ fontSize: '2rem', width: isMobileSize ? '1.25rem' : '1.5rem', height: isMobileSize ? '1.25rem' : '1.5rem', border: 'none', ml: 0.8 }} />
							</IconButton>
						</Tooltip>
					) : isOpenEndedPracticeAgain && !practiceAgainSavedForAi ? (
						savedLastAiFeedback ? (
							<Tooltip title='View last AI feedback' placement='left' arrow>
								<IconButton onClick={() => openAiResponseDrawer(index)} sx={{ color: '#4D7B8B' }}>
									<AiIcon sx={{ fontSize: '2rem', width: isMobileSize ? '1.25rem' : '1.5rem', height: isMobileSize ? '1.25rem' : '1.5rem', border: 'none', ml: 0.8 }} />
								</IconButton>
							</Tooltip>
						) : (
							<Tooltip title='Edit your answer and save first to receive AI feedback' placement='left' arrow>
								<IconButton sx={{ ':hover': { backgroundColor: 'transparent' }, color: 'gray' }} disabled>
									<AutoAwesome fontSize={isMobileSize ? 'small' : 'medium'} />
								</IconButton>
							</Tooltip>
						)
					) : practiceAgainAiLimitReached ? (
						<Tooltip title={`View last AI feedback (${PRACTICE_AGAIN_AI_LIMIT}/${PRACTICE_AGAIN_AI_LIMIT})`} placement='left' arrow>
							<IconButton onClick={() => openAiResponseDrawer(index)} sx={{ color: '#4D7B8B' }}>
								<AiIcon sx={{ fontSize: '2rem', width: isMobileSize ? '1.25rem' : '1.5rem', height: isMobileSize ? '1.25rem' : '1.5rem', border: 'none', ml: 0.8 }} />
							</IconButton>
						</Tooltip>
					) : hasReachedAiLimit && !practiceAgainMode ? (
						<Tooltip title={`View last AI feedback (${AI_FEEDBACK_LIMIT}/${AI_FEEDBACK_LIMIT})`} placement='left' arrow>
							<IconButton onClick={() => openAiResponseDrawer(index)} sx={{ color: '#4D7B8B' }}>
								<AiIcon sx={{ fontSize: '2rem', width: isMobileSize ? '1.25rem' : '1.5rem', height: isMobileSize ? '1.25rem' : '1.5rem', border: 'none', ml: 0.8 }} />
							</IconButton>
						</Tooltip>
					) : openEndedAiRequestEnabled && (hasRequestedAiThisRound || (practiceAgainMode && practiceAgainAiCount >= 1)) ? (
						<Tooltip title='View AI feedback' placement='left' arrow>
							<IconButton onClick={() => openAiResponseDrawer(index)} sx={{ color: '#4D7B8B' }}>
								<AiIcon sx={{ fontSize: '2rem', width: isMobileSize ? '1.25rem' : '1.5rem', height: isMobileSize ? '1.25rem' : '1.5rem', border: 'none', ml: 0.8 }} />
							</IconButton>
						</Tooltip>
					) : openEndedAiRequestEnabled ? (
						<Tooltip
							title={`Receive feedback from AI (${practiceAgainMode ? practiceAgainAiCount + 1 : aiFeedbackCount + 1}/${practiceAgainMode ? PRACTICE_AGAIN_AI_LIMIT : AI_FEEDBACK_LIMIT})`}
							placement='left'
							arrow>
							<IconButton
								onClick={async () => {
									if (isAiFeedbackLoading) return;
									if (!existingUserAnswerForAi?.userQuestionId) return;

									setIsAiFeedbackLoading(true);
									setHasRequestedAiFeedback(true);
									setAiFeedbackError('');
									openAiResponseDrawer(index);

									const currentAnswer = practiceAgainMode
										? existingUserAnswerForAi?.userAnswer ?? ''
										: typeof value === 'string' && value.trim()
											? value
											: existingUserAnswerForAi?.userAnswer ?? questionPrompt.userInput ?? '';
									const promptWithSavedAnswer: QuestionPrompt = {
										...questionPrompt,
										userInput: currentAnswer,
										...(isOpenEndedQuestion && { lessonText, chapterName }),
									};

									try {
										const responseText = await handleInitialSubmit(promptWithSavedAnswer);
										if (responseText) {
											if (practiceAgainMode) setPracticeAgainAiCount((c) => c + 1);
											const res = await axios.patch(
												`${base_url}/userQuestions/${existingUserAnswerForAi.userQuestionId}`,
												{ aiFeedbackResponse: responseText }
											);
											const updated = res.data?.data;
											if (updated) {
												setHasRequestedAiThisRound(true);
												setUserAnswers((prev) =>
													prev.map((data) =>
														String(data.questionId) === String(question._id)
															? {
																...data,
																aiFeedbackRequestCount: updated.aiFeedbackRequestCount ?? aiFeedbackCount + 1,
																lastAiFeedback: updated.lastAiFeedback ?? responseText,
															}
															: data
													)
												);
											}
										} else {
											setAiFeedbackError('AI geri bildirimi alınamadı. Cevabınız kaydedildi; daha sonra tekrar deneyebilirsiniz.');
											setHasRequestedAiFeedback(false);
										}
									} catch (err) {
										console.error('AI feedback error:', err);
										setAiFeedbackError('AI şu an kullanılamıyor. Cevabınız kaydedildi; dersinize devam edebilirsiniz.');
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
					) : (
						<Tooltip title='Save answer first to receive feedback from AI' placement='left' arrow>
							<IconButton sx={{ ':hover': { backgroundColor: 'transparent' }, color: 'gray' }} disabled>
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
								) : savedLastAiFeedback || aiResponse ? (
									<Typography
										variant='body2'
										sx={{
											mt: '0.5rem',
											lineHeight: 1.9,
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											whiteSpace: 'pre-wrap',
										}}>
										{savedLastAiFeedback || aiResponse}
									</Typography>
								) : (
									<Typography
										variant='body2'
										sx={{ mt: '0.5rem', lineHeight: 1.9, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{aiFeedbackError || 'Henüz AI geri bildirimi yok.'}
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
