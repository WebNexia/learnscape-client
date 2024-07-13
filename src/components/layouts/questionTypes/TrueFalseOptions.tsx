import { Box, Typography, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { LessonType } from '../../../interfaces/enums';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';

interface TrueFalseOptionsProps {
	question?: QuestionInterface;
	correctAnswer: string;
	fromLessonEditPage?: boolean;
	correctAnswerAdminQuestions?: string;
	fromLearner?: boolean;
	isLessonCompleted?: boolean;
	displayedQuestionNumber?: number;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setIsCorrectAnswerMissing?: React.Dispatch<React.SetStateAction<boolean>>;
	setCorrectAnswerAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
	setHelperText?: React.Dispatch<React.SetStateAction<string>>;
	setIsLessonUpdating?: React.Dispatch<React.SetStateAction<boolean>>;
	isLessonUpdating?: boolean;
	setUserAnswer?: React.Dispatch<React.SetStateAction<string>>;
	setUserQuizAnswers?: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	lessonType?: string | undefined;
	userQuizAnswer?: string;
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
	userQuizAnswer,
}: TrueFalseOptionsProps) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCorrectAnswer((event.target as HTMLInputElement).value);
		if (isLessonCompleted && setIsLessonUpdating) setIsLessonUpdating(true);
		if (setIsCorrectAnswerMissing) setIsCorrectAnswerMissing(false);
		if (!fromLessonEditPage && setCorrectAnswerAdminQuestions) {
			setCorrectAnswerAdminQuestions((event.target as HTMLInputElement).value);
		}
		if (setHelperText) setHelperText(' ');
		if (setUserAnswer) setUserAnswer((event.target as HTMLInputElement).value);
		if (setUserQuizAnswers && lessonType === LessonType.QUIZ) {
			setUserQuizAnswers((prevData) => {
				if (prevData) {
					const updatedAnswers = prevData.map((answer) => {
						if (answer.questionId === question?._id) {
							return { ...answer, userAnswer: (event.target as HTMLInputElement).value };
						}
						return answer;
					});
					return updatedAnswers;
				}
				return prevData;
			});
		}
	};

	const { getLastQuestion } = useUserCourseLessonData();

	const adminSetting = fromLessonEditPage ? correctAnswer : correctAnswerAdminQuestions;
	const learnerSetting =
		isLessonCompleted && displayedQuestionNumber < getLastQuestion() && isLessonUpdating
			? question?.correctAnswer
			: isLessonCompleted && lessonType === LessonType.QUIZ
			? userQuizAnswer
			: correctAnswer;
	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mt: '2rem' }}>
			<RadioGroup row value={fromLearner ? learnerSetting : adminSetting} onChange={handleChange}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box
						sx={{
							width: '7rem',
							padding: '1.5rem 2rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							transition: '0.3s',
							backgroundColor: theme.bgColor?.greenPrimary,
							textAlign: 'center',
							borderRadius: '0.3rem',
							position: 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='true'
							control={<Radio sx={{ color: theme.textColor?.common.main }} color='secondary' />}
							label={
								<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
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
							width: '7rem',
							padding: '1.5rem 2rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							transition: '0.3s',
							marginLeft: '1.5rem',
							backgroundColor: 'error.main',
							textAlign: 'center',
							borderRadius: '0.3rem',
							position: 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='false'
							control={<Radio sx={{ color: theme.textColor?.common.main }} color='secondary' />}
							label={
								<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
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
				</Box>
			</RadioGroup>
		</Box>
	);
};

export default TrueFalseOptions;
