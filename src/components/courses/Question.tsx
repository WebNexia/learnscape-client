import {
	Box,
	Button,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Radio,
	RadioGroup,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';

interface QuestionsProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
}

const Question = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	setDisplayedQuestionNumber,
}: QuestionsProps) => {
	const [value, setValue] = useState<string>('');
	const [error, setError] = useState<boolean>(false);
	const [success, setSuccess] = useState<boolean>(false);
	const [helperText, setHelperText] = useState<string>('Choose wisely');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const nextLessonId = searchParams.get('next');
	const nextLessonOrder = searchParams.get('nextLessonOrder');

	const userLessonData = localStorage.getItem('userLessonData');
	let parsedUserLessonData: UserLessonDataStorage[] = [];
	if (userLessonData !== null) {
		parsedUserLessonData = JSON.parse(userLessonData);
	}

	const userLessonId = parsedUserLessonData.filter(
		(data: UserLessonDataStorage) => data.lessonId === lessonId
	)[0]?.userLessonId;

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const createUserQuestion = async () => {
		try {
			await axios.post(`${base_url}/userQuestions`, {
				userLessonId,
				questionId: question._id,
				userId,
				lessonId,
				isCompleted: true,
				isInProgress: false,
			});
			await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
				currentQuestion: displayedQuestionNumber + 1,
			});

			if (displayedQuestionNumber === numberOfQuestions) {
				await axios.patch(`${base_url}/userLessons/${userLessonId}`, {
					isCompleted: true,
					isInProgress: false,
				});

				navigate(
					`/user/${userId}/course/${courseId}/userCourseId/${userCourseId}/lesson/${lessonId}?isCompleted=true&next=${nextLessonId}&nextLessonOrder=${nextLessonOrder}`
				);

				if (nextLessonId !== null) {
					const responseUserLesson = await axios.post(`${base_url}/userLessons`, {
						lessonId: nextLessonId,
						userId,
						courseId,
						userCourseId,
						currentQuestion: 1,
						lessonOrder: nextLessonOrder,
						isCompleted: false,
						isInProgress: true,
					});
					if (
						!parsedUserLessonData
							.map((data: UserLessonDataStorage) => data.lessonId)
							.includes(nextLessonId) &&
						courseId
					) {
						const newUserLessonData: UserLessonDataStorage = {
							lessonId: nextLessonId,
							userLessonId: responseUserLesson.data._id,
							courseId,
							isCompleted: false,
							isInProgress: true,
						};

						parsedUserLessonData.push(newUserLessonData);
						localStorage.setItem(
							'userLessonData',
							JSON.stringify(parsedUserLessonData)
						);
					}
				}
				const indexToUpdate = parsedUserLessonData.findIndex(
					(item) => item.userLessonId === userLessonId
				);
				parsedUserLessonData[indexToUpdate].isCompleted = true;
				parsedUserLessonData[indexToUpdate].isInProgress = false;
				localStorage.setItem('userLessonData', JSON.stringify(parsedUserLessonData));
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
		setError(false);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (value === question.correctAnswer?.toString()) {
			setHelperText('You got it!');
			setError(false);
			setIsAnswerCorrect(true);
			setSuccess(true);
			createUserQuestion();
		} else if (value !== question.correctAnswer && value !== '') {
			setHelperText('Sorry, wrong answer!');
			setError(true);
			setIsAnswerCorrect(false);
		} else {
			setHelperText('Please select an option.');
			setError(true);
			setIsAnswerCorrect(false);
		}
	};

	return (
		<Box
			sx={{
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
			}}>
			<form onSubmit={handleSubmit}>
				<FormControl sx={{ m: 3 }} error={error} variant='standard'>
					<FormLabel sx={{ color: success ? 'green' : 'inherit' }}>
						{questionNumber}. {question.question}
					</FormLabel>
					<RadioGroup name='question' value={value} onChange={handleRadioChange}>
						<FormControlLabel
							value={question.optionOne}
							control={<Radio />}
							label={question.optionOne}
						/>
						<FormControlLabel
							value={question.optionTwo}
							control={<Radio />}
							label={question.optionTwo}
						/>
						<FormControlLabel
							value={question.optionThree}
							control={<Radio />}
							label={question.optionThree}
						/>
						<FormControlLabel
							value={question.optionFour}
							control={<Radio />}
							label={question.optionFour}
						/>
					</RadioGroup>
					<FormHelperText sx={{ color: success ? 'green' : 'inherit' }}>
						{helperText}
					</FormHelperText>
					<Button sx={{ mt: '2rem' }} type='submit' variant='outlined'>
						Submit Answer
					</Button>
				</FormControl>
			</form>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-around',
					margin: '2rem',
					width: '50%',
				}}>
				<Button
					variant='outlined'
					onClick={() => {
						if (!(displayedQuestionNumber - 1 === 0)) {
							setDisplayedQuestionNumber((prev) => prev - 1);
						}
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
					}}
					disabled={!isAnswerCorrect || displayedQuestionNumber + 1 > numberOfQuestions}>
					Next
				</Button>
			</Box>
		</Box>
	);
};

export default Question;
