import {
	Box,
	Button,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	IconButton,
	Radio,
	RadioGroup,
	Tooltip,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../../themes';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import ReactPlayer from 'react-player';
import TrueFalseOptions from '../layouts/questionTypes/TrueFalseOptions';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import { useUserCourseLessonData } from '../../hooks/useUserCourseLessonData';
import { UserQuestionData } from '../../hooks/useFetchUserQuestion';
import { Done, KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from '@mui/icons-material';

interface QuestionsProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	lessonType?: string;
	userAnswerCurrentQuestionOpenEnded: string;
	userAnswers: UserQuestionData[];
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
}

const Question = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	setDisplayedQuestionNumber,
	userAnswerCurrentQuestionOpenEnded,
	userAnswers,
	lessonType,
}: QuestionsProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { isLessonCompleted, setIsLessonCompleted, userLessonId, handleNextLesson, nextLessonId, updateLastQuestion, getLastQuestion } =
		useUserCourseLessonData();

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const [userAnswer, setUserAnswer] = useState<string>('');

	const [value, setValue] = useState<string>('');

	const [error, setError] = useState<boolean>(false);
	const [success, setSuccess] = useState<boolean>(false);
	const [helperText, setHelperText] = useState<string>('Choose wisely');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
	const [isOpenEndedAnswerSubmitted, setIsOpenEndedAnswerSubmitted] = useState<boolean>(false);

	const isCompletingCourse: boolean = displayedQuestionNumber === numberOfQuestions && nextLessonId === null;
	const isCompletingLesson: boolean = displayedQuestionNumber === numberOfQuestions && nextLessonId !== null;
	const isNextQuestion: boolean = displayedQuestionNumber < numberOfQuestions;

	useEffect(() => {
		if (isLessonCompleted && question.correctAnswer) {
			setValue(question.correctAnswer);
		} else if (fetchQuestionTypeName(question) === 'Open-ended') {
			setValue(userAnswerCurrentQuestionOpenEnded);
		} else if (!isLessonCompleted && displayedQuestionNumber < getLastQuestion()) {
			setValue(question.correctAnswer);
		} else {
			setValue(userAnswer);
		}
	}, [displayedQuestionNumber]);

	//creating userQuestion when the question is answered correctly and updating local storage and DB accordingly
	const createUserQuestion = async () => {
		const existingUserAnswer = userAnswers.find((data) => data.questionId === question._id);

		if (!existingUserAnswer || existingUserAnswer.userAnswer !== userAnswer) {
			try {
				if ((lessonType === 'Practice Lesson' && fetchQuestionTypeName(question) === 'Open-ended') || lessonType === 'Quiz') {
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
					});
					const userQuestionId = res.data._id;
					if (res.status === 200) {
						await axios.patch(`${base_url}/userQuestions/${userQuestionId}`, { userAnswer });
					}
					setIsOpenEndedAnswerSubmitted(true);
				}

				// Updating current lesson's current question number (next question's number) if not the last question
				if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
					updateLastQuestion(displayedQuestionNumber + 1);
				}

				// Completing lesson after answering last question correctly and navigating back to the course page
				if (displayedQuestionNumber === numberOfQuestions) {
					setIsLessonCompleted(true);
					handleNextLesson();
				}
			} catch (error) {
				console.log(error);
			}
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setIsLessonCompleted(false);
		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
		setError(false);
		setUserAnswer((event.target as HTMLInputElement).value);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (lessonType === 'Practice Lesson') {
			if (fetchQuestionTypeName(question) === 'Open-ended') {
				await createUserQuestion();
				setUserAnswer(value);
				setIsOpenEndedAnswerSubmitted(true);
			} else if (value === question.correctAnswer?.toString()) {
				setHelperText('You got it!');
				setError(false);
				setIsAnswerCorrect(true);
				setSuccess(true);
				createUserQuestion();
				setUserAnswer(value);
			} else if (value !== question.correctAnswer && value !== '') {
				setHelperText('Sorry, wrong answer!');
				setError(true);
				setIsAnswerCorrect(false);
				setIsLessonCompleted(false);
				setUserAnswer(value);
			} else {
				setHelperText('Please select an option.');
				setError(true);
				setIsAnswerCorrect(false);
				setIsLessonCompleted(false);
			}
		} else if (lessonType === 'Quiz') {
		}
	};

	return (
		<Box
			sx={{
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
			}}>
			<form onSubmit={handleSubmit} style={{ width: '100%' }}>
				<FormControl sx={{ margin: '1rem', width: '100%' }} error={error} variant='standard'>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
							height: question?.imageUrl || question?.videoUrl ? '18rem' : '0',
							margin: question?.imageUrl || question?.videoUrl ? '10rem 0 2rem 0' : 'none',
						}}>
						{question?.imageUrl && (
							<Box
								sx={{
									height: '100%',
									flex: 1,
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
								}}>
								<img
									src={question?.imageUrl}
									alt='question_img'
									style={{
										height: '100%',
										width: question?.videoUrl ? '90%' : '50%',
										borderRadius: '0.2rem',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									}}
								/>
							</Box>
						)}

						{question?.videoUrl && (
							<Box
								sx={{
									height: '100%',
									flex: 1,
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
								}}>
								<ReactPlayer
									url={question.videoUrl}
									width={question?.imageUrl ? '90%' : '50%'}
									height='100%'
									style={{
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									}}
									controls
								/>
							</Box>
						)}
					</Box>
					<FormLabel
						sx={{
							color: success ? theme.textColor?.greenPrimary.main : 'inherit',
							margin: question.videoUrl || question.imageUrl ? '3rem 0 1rem 0' : '11rem 0 1rem 0',
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Typography variant='h6' sx={{ mr: '0.5rem' }}></Typography>
							<Typography variant='h6' component='div' dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
						</Box>
					</FormLabel>

					{fetchQuestionTypeName(question) === 'Open-ended' && (
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
								}}
							/>
						</Box>
					)}

					{fetchQuestionTypeName(question) === 'True-False' && (
						<Box>
							<TrueFalseOptions
								correctAnswer={value}
								setCorrectAnswer={setValue}
								fromLearner={true}
								question={question}
								isLessonCompleted={isLessonCompleted}
								setIsLessonCompleted={setIsLessonCompleted}
								displayedQuestionNumber={displayedQuestionNumber}
								setHelperText={setHelperText}
							/>
						</Box>
					)}
					{fetchQuestionTypeName(question) === 'Multiple Choice' && (
						<RadioGroup
							name='question'
							value={isLessonCompleted && displayedQuestionNumber < getLastQuestion() ? question.correctAnswer : value}
							onChange={handleRadioChange}
							sx={{ alignSelf: 'center' }}>
							{question &&
								question.options &&
								question.options.map((option, index) => {
									return <FormControlLabel value={option} control={<Radio />} label={option} key={index} />;
								})}
						</RadioGroup>
					)}
					{fetchQuestionTypeName(question) !== 'Open-ended' && !isLessonCompleted && helperText !== ' ' && (
						<FormHelperText sx={{ color: success ? 'green' : 'inherit', alignSelf: 'center', mt: '2rem' }}>{helperText}</FormHelperText>
					)}
					<Button sx={{ mt: '3rem', width: '13rem', alignSelf: 'center' }} type='submit' variant='outlined'>
						Submit Answer
					</Button>
				</FormControl>
			</form>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					position: 'relative',
					mt: '2rem',
					width: '40%',
				}}>
				<Tooltip title='Previous' placement='left'>
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
							}
							window.scrollTo({ top: 0, behavior: 'smooth' });
							setIsOpenEndedAnswerSubmitted(false);
						}}
						disabled={displayedQuestionNumber - 1 === 0}>
						<KeyboardDoubleArrowLeft />
					</IconButton>
				</Tooltip>

				<Typography
					variant='body1'
					sx={{
						position: 'absolute',
						left: '50%',
						transform: 'translateX(-50%)',
					}}>
					{displayedQuestionNumber} / {numberOfQuestions}
				</Typography>

				<Tooltip
					title={isCompletingCourse ? 'Complete Course' : isCompletingLesson ? 'Complete Lesson' : isNextQuestion ? 'Next' : null}
					placement='right'>
					<IconButton
						onClick={() => {
							if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
								setDisplayedQuestionNumber((prev) => prev + 1);
							}
							if (isLessonCompleted && displayedQuestionNumber === numberOfQuestions) {
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}
							window.scrollTo({ top: 0, behavior: 'smooth' });
							setIsOpenEndedAnswerSubmitted(false);
						}}
						sx={{
							flexShrink: 0,
							color: !isAnswerCorrect && !isOpenEndedAnswerSubmitted ? 'gray' : theme.textColor?.common.main,
							backgroundColor: !isAnswerCorrect && !isOpenEndedAnswerSubmitted ? 'inherit' : theme.bgColor?.greenPrimary,
							':hover': {
								color: theme.bgColor?.greenPrimary,
								backgroundColor: 'transparent',
							},
						}}
						disabled={
							(!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions) &&
							!(isLessonCompleted || displayedQuestionNumber < getLastQuestion())
						}>
						{isCompletingCourse ? 'Complete Course' : isCompletingLesson ? <Done /> : isNextQuestion ? <KeyboardDoubleArrowRight /> : null}
					</IconButton>
				</Tooltip>
			</Box>
		</Box>
	);
};

export default Question;
