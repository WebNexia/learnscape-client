import { Box, Button, FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useState } from 'react';
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

interface QuestionsProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	lessonType?: string;
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
}

const Question = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	setDisplayedQuestionNumber,
	lessonType,
}: QuestionsProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { isLessonCompleted, setIsLessonCompleted, userLessonId, handleNextLesson, nextLessonId } = useUserCourseLessonData();

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const [userAnswer, setUserAnswer] = useState<string>('');

	const [value, setValue] = useState<string>(() => {
		if (isLessonCompleted && question.correctAnswer) {
			return question.correctAnswer;
		} else {
			return '';
		}
	});
	const [error, setError] = useState<boolean>(false);
	const [success, setSuccess] = useState<boolean>(false);
	const [helperText, setHelperText] = useState<string>('Choose wisely');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);

	console.log(userAnswer);

	//creating userQuestion when the question is answered correctly and updating local storage and DB accordingly
	const createUserQuestion = async () => {
		try {
			await axios.post(`${base_url}/userQuestions`, {
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

			//updating current lesson's current question number(next question's number) if not last question
			if (displayedQuestionNumber + 1 <= numberOfQuestions) {
				await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
					currentQuestion: displayedQuestionNumber + 1,
				});
			}

			//completing lesson after answering last question correctly and navigating back to the course page
			if (displayedQuestionNumber === numberOfQuestions) {
				await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
				});

				navigate(`/user/${userId}/course/${courseId}/userCourseId/${userCourseId}/lesson/${lessonId}?isCompleted=true&next=${nextLessonId}`);
				setIsLessonCompleted(true);
				handleNextLesson();
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		console.log('deneme');
		setIsLessonCompleted(false);
		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
		setError(false);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (lessonType === 'Practice Lesson') {
			if (value === question.correctAnswer?.toString()) {
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
							<Typography variant='h6' sx={{ mr: '0.5rem' }}>
								{questionNumber}.{' '}
							</Typography>
							<Typography variant='h6' component='div' dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
						</Box>
					</FormLabel>

					{fetchQuestionTypeName(question) === 'Open-ended' && (
						<Box sx={{ width: '90%', margin: '1rem auto' }}>
							<CustomTextField required={false} multiline rows={4} resizable />
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
							/>
						</Box>
					)}
					{fetchQuestionTypeName(question) === 'Multiple Choice' && (
						<RadioGroup
							name='question'
							value={isLessonCompleted ? question.correctAnswer : value}
							onChange={handleRadioChange}
							sx={{ alignSelf: 'center' }}>
							{question &&
								question.options &&
								question.options.map((option, index) => {
									return <FormControlLabel value={option} control={<Radio />} label={option} key={index} />;
								})}
						</RadioGroup>
					)}
					{fetchQuestionTypeName(question) !== 'Open-ended' && !isLessonCompleted && (
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
					mt: '2rem',
					width: '40%',
				}}>
				<Button
					variant='outlined'
					sx={{ mr: '4rem' }}
					onClick={() => {
						if (!(displayedQuestionNumber - 1 === 0)) {
							setDisplayedQuestionNumber((prev) => prev - 1);
						}
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					disabled={displayedQuestionNumber - 1 === 0}>
					Previous
				</Button>

				<Button
					variant='outlined'
					onClick={() => {
						if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
							setDisplayedQuestionNumber((prev) => prev + 1);
						}
						if (isLessonCompleted && displayedQuestionNumber === numberOfQuestions) {
							navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
						}
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					sx={{
						color: !isAnswerCorrect ? 'inherit' : theme.textColor?.common.main,
						backgroundColor: !isAnswerCorrect ? 'inherit' : theme.bgColor?.greenPrimary,
						':hover': {
							color: theme.bgColor?.greenPrimary,
							backgroundColor: theme.textColor?.common.main,
						},
					}}
					disabled={(!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions) && !isLessonCompleted}>
					{displayedQuestionNumber === numberOfQuestions && nextLessonId === null
						? 'Complete Course'
						: displayedQuestionNumber === numberOfQuestions && nextLessonId !== null
						? 'Complete Lesson'
						: displayedQuestionNumber < numberOfQuestions
						? 'Next'
						: null}
				</Button>
			</Box>
		</Box>
	);
};

export default Question;
