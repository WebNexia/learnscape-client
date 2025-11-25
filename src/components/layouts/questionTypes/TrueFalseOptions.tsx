import { Box, Typography, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { getLastQuestion } = useUserCourseLessonData();

	const adminSetting = fromLessonEditPage ? correctAnswer : correctAnswerAdminQuestions;
	const learnerSetting =
		isLessonCompleted && displayedQuestionNumber < getLastQuestion() && isLessonUpdating
			? question?.correctAnswer
			: isLessonCompleted && lessonType === LessonType.QUIZ
				? userQuizAnswerAfterSubmission
				: correctAnswer;

	const showCheckmark = (optionValue: string) => {
		return isLessonCompleted && optionValue === question?.correctAnswer;
	};

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mt: '1rem' }}>
			<RadioGroup row value={fromLearner ? learnerSetting : adminSetting} onChange={handleChange}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{showCheckmark('True') && lessonType !== LessonType.PRACTICE_LESSON && (
						<CheckCircleIcon sx={{ color: theme.palette.success.main, marginRight: 1 }} />
					)}
					<Box
						sx={{
							'width': isMobileSize ? '5rem' : '6rem',
							'padding': isMobileSize ? '1.15rem 1.75rem' : '1.5rem 2rem',
							'boxShadow': '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							'transition': '0.3s',
							'backgroundColor': theme.bgColor?.greenPrimary,
							'textAlign': 'center',
							'borderRadius': '0.3rem',
							'position': 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='True'
							control={
								<Radio
									sx={{
										'color': theme.textColor?.common.main,
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1rem', // Resize radio button
										},
									}}
									color='secondary'
								/>
							}
							label={
								<Typography variant={'body2'} sx={{ color: theme.textColor?.common.main }}>
									True
								</Typography>
							}
							sx={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						/>
					</Box>

					<Box
						sx={{
							'width': isMobileSize ? '5rem' : '6rem',
							'padding': isMobileSize ? '1.15rem 1.75rem' : '1.5rem 2rem',
							'boxShadow': '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							'transition': '0.3s',
							'marginLeft': '1.5rem',
							'backgroundColor': 'error.main',
							'textAlign': 'center',
							'borderRadius': '0.3rem',
							'position': 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='False'
							control={
								<Radio
									sx={{
										'color': theme.textColor?.common.main,
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1rem', // Resize radio button
										},
									}}
									color='secondary'
								/>
							}
							label={
								<Typography variant={'body2'} sx={{ color: theme.textColor?.common.main }}>
									False
								</Typography>
							}
							sx={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						/>
					</Box>
					{showCheckmark('False') && lessonType !== LessonType.PRACTICE_LESSON && (
						<CheckCircleIcon sx={{ color: theme.palette.success.main, marginLeft: 1 }} />
					)}
				</Box>
			</RadioGroup>
		</Box>
	);
};

export default TrueFalseOptions;
