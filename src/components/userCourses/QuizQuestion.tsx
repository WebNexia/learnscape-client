import {
	Box,
	DialogActions,
	FormControl,
	FormControlLabel,
	FormHelperText,
	IconButton,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	SelectChangeEvent,
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
import { Done, DoneAll, KeyboardArrowLeft, KeyboardArrowRight, KeyboardDoubleArrowRight } from '@mui/icons-material';
import { QuestionType } from '../../interfaces/enums';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { QuizQuestionAnswer } from '../../pages/LessonPage';
import LoadingButton from '@mui/lab/LoadingButton';
import QuestionMedia from './QuestionMedia';
import QuestionText from './QuestionText';

interface QuizQuestionProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	lessonType?: string;
	isLessonCompleted: boolean;
	userQuizAnswers: QuizQuestionAnswer[];
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
	setIsLessonCompleted: React.Dispatch<React.SetStateAction<boolean>>;
	setUserQuizAnswers: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	setIsQuizInProgress: React.Dispatch<React.SetStateAction<boolean>>;
}

const QuizQuestion = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	lessonType,
	isLessonCompleted,
	userQuizAnswers,
	setDisplayedQuestionNumber,
	setIsLessonCompleted,
	setUserQuizAnswers,
	setIsQuizInProgress,
}: QuizQuestionProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { userLessonId, handleNextLesson, nextLessonId } = useUserCourseLessonData();

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const [userQuizAnswer, setUserQuizAnswer] = useState<string>('');

	const [value, setValue] = useState<string>(() => {
		if (!isLessonCompleted) {
			const value: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
			return value;
		}
		return '';
	});

	const [helperText, setHelperText] = useState<string>('Choose wisely');
	const [selectedQuestion, setSelectedQuestion] = useState<number>(displayedQuestionNumber);
	const [isSubmitQuizModalOpen, setIsSubmitQuizModalOpen] = useState<boolean>(false);
	const [userQuizAnswersUploading, setUserQuizAnswersUploading] = useState<boolean>(false);

	const isCompletingCourse: boolean = displayedQuestionNumber === numberOfQuestions && nextLessonId === null;
	const isCompletingLesson: boolean = displayedQuestionNumber === numberOfQuestions && nextLessonId !== null;

	useEffect(() => {
		setUserQuizAnswer(() => {
			if (isLessonCompleted) {
				const answer: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
				return answer;
			}
			return '';
		});
	}, []);

	useEffect(() => {
		setSelectedQuestion(displayedQuestionNumber);

		if (isLessonCompleted || (!isLessonCompleted && value !== '')) {
			setHelperText(' ');
		}
	}, [displayedQuestionNumber]);

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setUserQuizAnswers((prevData) => {
			if (prevData) {
				const updatedAnswers = prevData?.map((answer) => {
					if (answer.questionId === question._id) {
						return { ...answer, userAnswer: (event.target as HTMLInputElement).value };
					}
					return answer;
				});
				return updatedAnswers;
			}
			return prevData;
		});

		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
	};

	const handleQuestionChange = (event: SelectChangeEvent<number>) => {
		const selectedValue = Number(event.target.value);
		setSelectedQuestion(selectedValue);
		setDisplayedQuestionNumber(selectedValue);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleQuizSubmission = async () => {
		setUserQuizAnswersUploading(true);
		await Promise.all(
			userQuizAnswers.map(async (answer) => {
				try {
					await axios.post(`${base_url}/userQuestions`, {
						userLessonId,
						questionId: answer.questionId,
						userId,
						lessonId,
						courseId,
						isCompleted: true,
						isInProgress: false,
						orgId,
						userAnswer: answer.userAnswer,
					});
				} catch (error) {
					console.log(error);
				}
			})
		);

		await handleNextLesson();
		setIsLessonCompleted(true);
		setIsSubmitQuizModalOpen(false);
		setIsQuizInProgress(false);
		setUserQuizAnswersUploading(false);
		localStorage.removeItem(`UserQuizAnswers-${lessonId}`);
		navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
	};

	return (
		<Box
			sx={{
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
			}}>
			<form style={{ width: '100%' }}>
				<FormControl sx={{ margin: '1rem', width: '100%' }} variant='standard'>
					<QuestionMedia question={question} />
					<QuestionText question={question} questionNumber={questionNumber} />

					{fetchQuestionTypeName(question) === QuestionType.OPEN_ENDED && (
						<Box sx={{ width: '90%', margin: '1rem auto' }}>
							<CustomTextField
								required={false}
								multiline
								rows={4}
								resizable
								value={isLessonCompleted ? userQuizAnswer : value}
								onChange={(e) => {
									setValue(e.target.value);
									setUserQuizAnswers((prevData) => {
										if (prevData) {
											const updatedAnswers = prevData?.map((answer) => {
												if (answer.questionId === question._id) {
													return { ...answer, userAnswer: e.target.value };
												}
												return answer;
											});
											return updatedAnswers;
										}
										return prevData;
									});
								}}
							/>
						</Box>
					)}

					{fetchQuestionTypeName(question) === QuestionType.TRUE_FALSE && (
						<Box>
							<TrueFalseOptions
								correctAnswer={value}
								setCorrectAnswer={setValue}
								fromLearner={true}
								question={question}
								isLessonCompleted={isLessonCompleted}
								displayedQuestionNumber={displayedQuestionNumber}
								setHelperText={setHelperText}
								setUserQuizAnswers={setUserQuizAnswers}
								lessonType={lessonType}
								userQuizAnswer={userQuizAnswer}
							/>
						</Box>
					)}
					{fetchQuestionTypeName(question) === QuestionType.MULTIPLE_CHOICE && (
						<RadioGroup name='question' value={isLessonCompleted ? userQuizAnswer : value} onChange={handleRadioChange} sx={{ alignSelf: 'center' }}>
							{question &&
								question.options &&
								question.options?.map((option, index) => {
									return <FormControlLabel value={option} control={<Radio />} label={option} key={index} />;
								})}
						</RadioGroup>
					)}
					{fetchQuestionTypeName(question) !== QuestionType.OPEN_ENDED && !isLessonCompleted && helperText !== ' ' && (
						<FormHelperText sx={{ alignSelf: 'center', mt: '2rem' }}>{helperText}</FormHelperText>
					)}
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
					}}
					disabled={displayedQuestionNumber - 1 === 0}>
					<KeyboardArrowLeft fontSize='large' />
				</IconButton>

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
						required>
						{Array.from({ length: numberOfQuestions }, (_, i) => (
							<MenuItem key={i + 1} value={i + 1}>
								{i + 1}
							</MenuItem>
						))}
					</Select>
					<Typography> / {numberOfQuestions}</Typography>
				</Box>

				<IconButton
					onClick={() => {
						if (displayedQuestionNumber === numberOfQuestions && !isLessonCompleted) {
							setIsSubmitQuizModalOpen(true);
						} else if (displayedQuestionNumber === numberOfQuestions && isLessonCompleted) {
							navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
						}
						if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
							setDisplayedQuestionNumber((prev) => prev + 1);
							setSelectedQuestion(displayedQuestionNumber + 1);
						}
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					sx={{
						flexShrink: 0,
						':hover': {
							color: theme.bgColor?.greenPrimary,
							backgroundColor: 'transparent',
						},
					}}>
					{isLessonCompleted && displayedQuestionNumber === numberOfQuestions ? (
						<KeyboardDoubleArrowRight fontSize='large' />
					) : isCompletingCourse ? (
						<DoneAll fontSize='large' />
					) : isCompletingLesson ? (
						<Done fontSize='large' />
					) : (
						<KeyboardArrowRight fontSize='large' />
					)}
				</IconButton>
				<CustomDialog
					openModal={isSubmitQuizModalOpen}
					closeModal={() => setIsSubmitQuizModalOpen(false)}
					content='Are you sure you want to submit the quiz?'>
					{userQuizAnswersUploading ? (
						<DialogActions sx={{ marginBottom: '1.5rem' }}>
							<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
						</DialogActions>
					) : (
						<CustomDialogActions onCancel={() => setIsSubmitQuizModalOpen(false)} onSubmit={handleQuizSubmission} submitBtnText='Submit' />
					)}
				</CustomDialog>
			</Box>
		</Box>
	);
};

export default QuizQuestion;
