import { Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { LessonType } from '../../../interfaces/enums';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';
import { QuestionPrompt } from '../../../hooks/useAiResponse';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface TrueFalseOptionsProps {
	question?: QuestionInterface;
	correctAnswer?: string;
	fromLessonEditPage?: boolean;
	correctAnswerAdminQuestions?: string;
	fromLearner?: boolean;
	isLessonCompleted?: boolean;
	displayedQuestionNumber?: number;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setCorrectAnswer?: React.Dispatch<React.SetStateAction<string>>;
	setIsCorrectAnswerMissing?: React.Dispatch<React.SetStateAction<boolean>>;
	setCorrectAnswerAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
	setHelperText?: React.Dispatch<React.SetStateAction<string>>;
	setIsLessonUpdating?: React.Dispatch<React.SetStateAction<boolean>>;
	isLessonUpdating?: boolean;
	setUserAnswer?: React.Dispatch<React.SetStateAction<string>>;
	setUserQuizAnswers?: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	lessonType?: string | undefined;
	userQuizAnswerAfterSubmission?: string;
	setQuestionPrompt?: React.Dispatch<React.SetStateAction<QuestionPrompt>>;
	onAutoSubmit?: (value: string) => void; // Callback for auto-submit when answer is selected
}

const TrueFalseOptions = ({
	question,
	correctAnswer,
	fromLessonEditPage,
	correctAnswerAdminQuestions,
	fromLearner,
	isLessonCompleted,
	displayedQuestionNumber = 1,
	setCorrectAnswer,
	setIsCorrectAnswerMissing,
	setCorrectAnswerAdminQuestions,
	setHelperText,
	setIsLessonUpdating,
	isLessonUpdating,
	setUserAnswer,
	setUserQuizAnswers,
	lessonType,
	userQuizAnswerAfterSubmission,
	setQuestionPrompt,
	onAutoSubmit,
}: TrueFalseOptionsProps) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = (event.target as HTMLInputElement).value;

		if (setCorrectAnswer) setCorrectAnswer(value);
		if (isLessonCompleted && setIsLessonUpdating) setIsLessonUpdating(true);
		if (setIsCorrectAnswerMissing) setIsCorrectAnswerMissing(false);
		if (!fromLessonEditPage && setCorrectAnswerAdminQuestions) {
			setCorrectAnswerAdminQuestions(value);
		}
		if (setQuestionPrompt)
			setQuestionPrompt((prevData) => {
				return { ...prevData, userInput: value };
			});
		if (setHelperText) setHelperText(' ');
		if (setUserAnswer) setUserAnswer(value);
		if (setUserQuizAnswers && lessonType === LessonType.QUIZ) {
			setUserQuizAnswers((prevData) => {
				if (prevData) {
					const updatedAnswers = prevData?.map((answer) => {
						if (answer.questionId === question?._id) {
							return { ...answer, userAnswer: value };
						}
						return answer;
					});
					return updatedAnswers;
				}
				return prevData;
			});
		}

		// Auto-submit for practice questions when answer is selected
		if (onAutoSubmit && fromLearner && !isLessonCompleted && lessonType === LessonType.PRACTICE_LESSON) {
			// Use setTimeout to ensure state updates are processed first
			setTimeout(() => {
				onAutoSubmit(value);
			}, 0);
		}
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { getLastQuestion } = useUserCourseLessonData();

	const adminSetting = fromLessonEditPage ? correctAnswer : (correctAnswerAdminQuestions ?? correctAnswer);
	const learnerSetting =
		isLessonCompleted && displayedQuestionNumber < getLastQuestion() && isLessonUpdating
			? question?.correctAnswer
			: isLessonCompleted && lessonType === LessonType.QUIZ
				? userQuizAnswerAfterSubmission
				: correctAnswer;

	const showCheckmark = (optionValue: string) => {
		return isLessonCompleted && optionValue === question?.correctAnswer;
	};

	const isQuizResultsView = fromLearner && isLessonCompleted && lessonType === LessonType.QUIZ;
	const isUserAnswer = (optionValue: string) => isQuizResultsView && learnerSetting === optionValue;
	const isCorrectOption = (optionValue: string) => isQuizResultsView && question?.correctAnswer === optionValue;

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mt: isMobileSize ? '1.75rem' : '2.5rem' }}>
			<RadioGroup
				row
				value={fromLearner ? learnerSetting : adminSetting}
				onChange={handleChange}
				{...(isQuizResultsView && { sx: { pointerEvents: 'none', cursor: 'default' } })}
			>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem 0' }}>
					{showCheckmark('True') && lessonType !== LessonType.PRACTICE_LESSON && !isQuizResultsView && (
						<CheckCircleIcon sx={{ color: theme.palette.success.main, marginRight: 1 }} />
					)}
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobileSize ? '5rem' : '6rem' }}>
						<Box
							sx={{
								'width': isMobileSize ? '5rem' : '6rem',
								'padding': isMobileSize ? '1.15rem 1.75rem' : '1.45rem 2rem',
								'boxShadow': (fromLearner ? learnerSetting : adminSetting) === 'True' ? '0 10px 24px rgba(15, 118, 110, 0.42)' : '0 6px 14px rgba(6, 95, 70, 0.25)',
								'transition': 'all .22s ease',
								'background': (fromLearner ? learnerSetting : adminSetting) === 'True'
									? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
									: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
								'border': (fromLearner ? learnerSetting : adminSetting) === 'True' ? '2px solid rgba(187, 247, 208, 0.88)' : '1px solid rgba(167, 243, 208, 0.3)',
								'textAlign': 'center',
								'borderRadius': '0.75rem',
								'position': 'relative',
								':hover': !isQuizResultsView
									? { boxShadow: '0 12px 26px rgba(16, 185, 129, 0.38)', transform: 'translateY(-1px)' }
									: {},
								...(isQuizResultsView && { cursor: 'default' }),
							}}>
							<FormControlLabel
								value='True'
								control={
									<Radio
										sx={{
											opacity: 0,
											position: 'absolute',
											width: '100%',
											height: '100%',
											top: 0,
											left: 0,
											padding: 0,
											margin: 0,
											zIndex: 2,
											'& .MuiSvgIcon-root': { display: 'none' },
										}}
									/>
								}
								label={
									<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
									{/* In quiz results, show checkmark only for correct answer, not for user's selection */}
									{(fromLearner ? learnerSetting : adminSetting) === 'True' && !isQuizResultsView && (
										<CheckRoundedIcon sx={{ color: '#fff', fontSize: isMobileSize ? '1rem' : '1.15rem' }} />
									)}
									{isQuizResultsView && isCorrectOption('True') && (
										<CheckCircleIcon sx={{ color: '#fff', fontSize: isMobileSize ? '1rem' : '1.15rem', mr: 0.25 }} />
									)}
									<Typography variant={'body2'} sx={{ color: '#fff', fontWeight: 600, letterSpacing: '0.01em' }}>
										True
									</Typography>
								</Box>
							}
							sx={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								margin: 0,
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						/>
						</Box>
						{isQuizResultsView && (
							<Box sx={{ minHeight: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
								<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary' }}>
									{isUserAnswer('True') && isCorrectOption('True') ? 'Correct' : isUserAnswer('True') ? 'Your answer' : isCorrectOption('True') ? 'Correct answer' : ''}
								</Typography>
							</Box>
						)}
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '1.5rem', width: isMobileSize ? '5rem' : '6rem' }}>
						<Box
							sx={{
								'width': isMobileSize ? '5rem' : '6rem',
								'padding': isMobileSize ? '1.15rem 1.75rem' : '1.45rem 2rem',
								'boxShadow': (fromLearner ? learnerSetting : adminSetting) === 'False' ? '0 10px 24px rgba(153, 27, 27, 0.44)' : '0 6px 14px rgba(127, 29, 29, 0.28)',
								'transition': 'all .22s ease',
								'background': (fromLearner ? learnerSetting : adminSetting) === 'False'
								? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
								: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
							'border': (fromLearner ? learnerSetting : adminSetting) === 'False' ? '2px solid rgba(254, 202, 202, 0.88)' : '1px solid rgba(252, 165, 165, 0.3)',
							'textAlign': 'center',
							'borderRadius': '0.75rem',
							'position': 'relative',
							':hover': !isQuizResultsView
								? { boxShadow: '0 12px 26px rgba(239, 68, 68, 0.38)', transform: 'translateY(-1px)' }
								: {},
							...(isQuizResultsView && { cursor: 'default' }),
						}}>
						<FormControlLabel
							value='False'
							control={
								<Radio
									sx={{
										opacity: 0,
										position: 'absolute',
										width: '100%',
										height: '100%',
										top: 0,
										left: 0,
										padding: 0,
										margin: 0,
										zIndex: 2,
										'& .MuiSvgIcon-root': { display: 'none' },
									}}
								/>
							}
							label={
								<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
									{/* In quiz results, show checkmark only for correct answer */}
									{(fromLearner ? learnerSetting : adminSetting) === 'False' && !isQuizResultsView && (
										<CheckRoundedIcon sx={{ color: '#fff', fontSize: isMobileSize ? '1rem' : '1.15rem' }} />
									)}
									{isQuizResultsView && isCorrectOption('False') && (
										<CheckCircleIcon sx={{ color: '#fff', fontSize: isMobileSize ? '1rem' : '1.15rem', mr: 0.25 }} />
									)}
									<Typography variant={'body2'} sx={{ color: '#fff', fontWeight: 600, letterSpacing: '0.01em' }}>
										False
									</Typography>
								</Box>
							}
							sx={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								margin: 0,
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						/>
						</Box>
						{isQuizResultsView && (
							<Box sx={{ minHeight: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
								<Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary' }}>
									{isUserAnswer('False') && isCorrectOption('False') ? 'Correct' : isUserAnswer('False') ? 'Your answer' : isCorrectOption('False') ? 'Correct answer' : ''}
								</Typography>
							</Box>
						)}
					</Box>
					{showCheckmark('False') && lessonType !== LessonType.PRACTICE_LESSON && !isQuizResultsView && (
						<CheckCircleIcon sx={{ color: theme.palette.success.main, marginLeft: 1 }} />
					)}
				</Box>
			</RadioGroup>
		</Box>
	);
};

export default TrueFalseOptions;
