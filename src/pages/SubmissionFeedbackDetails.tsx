import { Box, IconButton, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useLocation, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import axios from 'axios';
import { QuestionType } from '../interfaces/enums';
import { stripHtml } from '../utils/stripHtml';
import { truncateText } from '../utils/utilText';
import { ArrowBackIosNewOutlined, ArrowForwardIosOutlined } from '@mui/icons-material';
import theme from '../themes';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { sanitizeHtml } from '../utils/sanitizeHtml';

const SubmissionFeedbackDetails = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const isChecked = queryParams.get('isChecked');

	const { userLessonId } = useParams();
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const [quizName, setQuizName] = useState<string>('');
	const [courseName, setCourseName] = useState<string>('');

	const [quizFeedback, setQuizFeedback] = useState<string>('');
	const [userResponseData, setUserResponseData] = useState<any>([]);
	const [userSingleResponseWithFeedback, setUserSingleResponseWithFeedback] = useState<any>(null);
	const [openQuestionFeedbackModal, setOpenQuestionFeedbackModal] = useState<boolean>(false);
	const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(0);

	useEffect(() => {
		const fetchQuizSubmissionData = async () => {
			try {
				const response = await axios.get(`${base_url}/userQuestions/userlesson/${userLessonId}`);

				const userCourseQuizData = response.data.response;

				setUserResponseData(userCourseQuizData);
				setQuizName(userCourseQuizData[0].lessonId.title);
				setCourseName(userCourseQuizData[0].courseId.title);
			} catch (error) {
				console.log(error);
			}
		};

		const fetchUserLessonData = async () => {
			try {
				const response = await axios.get(`${base_url}/userlessons/${userLessonId}`);

				setQuizFeedback(response.data.data[0].teacherFeedback);
			} catch (error) {
				console.log(error);
			}
		};

		fetchQuizSubmissionData();
		fetchUserLessonData();
	}, []);

	const handleNextResponse = () => {
		if (currentResponseIndex < userResponseData.length - 1) {
			setOpenQuestionFeedbackModal(true);
			const nextIndex = currentResponseIndex + 1;
			setCurrentResponseIndex(nextIndex);
			setUserSingleResponseWithFeedback(userResponseData[nextIndex]);
		}
	};

	const handlePreviousResponse = () => {
		if (currentResponseIndex > 0) {
			setOpenQuestionFeedbackModal(true);
			const prevIndex = currentResponseIndex - 1;
			setCurrentResponseIndex(prevIndex);
			setUserSingleResponseWithFeedback(userResponseData[prevIndex]);
		}
	};

	return (
		<DashboardPagesLayout pageName='Instructor Feedback' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-around', width: '90%', margin: '2rem' }}>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h6' sx={{ mb: '0.35rem' }}>
						Quiz Name
					</Typography>
					<Typography variant='body2'>{quizName}</Typography>
				</Box>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h6' sx={{ mb: '0.35rem' }}>
						Course Name
					</Typography>
					<Typography variant='body2'>{courseName}</Typography>
				</Box>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h6' sx={{ mb: '0.35rem' }}>
						Feedback
					</Typography>
					<Typography variant='body2'>{isChecked === 'true' ? 'Given' : 'Not Given'}</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '90%', margin: '2rem' }}>
				<Box>
					<Typography variant='h5' sx={{ mb: '1rem' }}>
						Questions
					</Typography>
				</Box>
				<Box>
					{userResponseData?.map((response: any, index: number) => {
						return (
							<Box
								key={response._id}
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									width: '100%',
									boxShadow: '0 0.1rem 0.4rem 0.1rem rgba(0, 0,0,0.2)',
									borderRadius: '0.35rem',
									padding: '0.75rem 1rem',
									mb: '0.75rem',
									cursor: 'pointer',
									backgroundColor:
										fetchQuestionTypeName(response.questionId) === QuestionType.TRUE_FALSE ||
										fetchQuestionTypeName(response.questionId) === QuestionType.MULTIPLE_CHOICE
											? response.userAnswer === response.questionId.correctAnswer
												? 'lightgreen'
												: 'pink'
											: null,
								}}
								onClick={() => {
									setOpenQuestionFeedbackModal(true);
									setUserSingleResponseWithFeedback(response);
									setCurrentResponseIndex(index);
								}}>
								<Box>
									<Typography>{truncateText(stripHtml(response.questionId.question), 50)}</Typography>
								</Box>
								<Box>
									<Typography variant='body2'>{fetchQuestionTypeName(response.questionId)}</Typography>
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
			{openQuestionFeedbackModal && (
				<>
					<IconButton
						onClick={handlePreviousResponse}
						disabled={currentResponseIndex === 0}
						sx={{
							position: 'fixed',
							left: '10%',
							top: '50%',
							transform: 'translateY(-50%)',
							backgroundColor: theme.bgColor?.greenPrimary,
							color: 'white',
							border: 'none',
							borderRadius: '50%',
							padding: '0.75rem',
							cursor: currentResponseIndex === 0 ? 'not-allowed' : 'pointer',
							zIndex: 13000,
							':hover': {
								backgroundColor: theme.bgColor?.adminHeader,
							},
						}}>
						<ArrowBackIosNewOutlined />
					</IconButton>
					<IconButton
						onClick={handleNextResponse}
						disabled={currentResponseIndex === userResponseData.length - 1}
						sx={{
							position: 'fixed',
							right: '10%',
							top: '50%',
							transform: 'translateY(-50%)',
							backgroundColor: theme.bgColor?.greenPrimary,
							color: 'white',
							border: 'none',
							borderRadius: '50%',
							padding: '0.75rem',
							cursor: currentResponseIndex === userResponseData.length - 1 ? 'not-allowed' : 'pointer',
							zIndex: 13000,
							':hover': {
								backgroundColor: theme.bgColor?.adminHeader,
							},
						}}>
						<ArrowForwardIosOutlined />
					</IconButton>
				</>
			)}

			<CustomDialog
				openModal={openQuestionFeedbackModal}
				closeModal={() => {
					setOpenQuestionFeedbackModal(false);
				}}
				titleSx={{ paddingTop: '0.5rem' }}>
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Typography variant='h5' sx={{ mb: '0.5rem' }}>
						Question ({fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId)})
					</Typography>
					<Typography
						variant='body1'
						component='div'
						dangerouslySetInnerHTML={{ __html: sanitizeHtml(userSingleResponseWithFeedback?.questionId.question) }}
					/>
				</Box>

				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
					<Box sx={{ width: '90%', margin: '0 auto' }}>
						<Box>
							{userSingleResponseWithFeedback?.questionId?.options?.map((option: string, index: number) => {
								const choiceLabel = String.fromCharCode(97 + index) + ')';
								return (
									<Typography
										variant='body1'
										key={index}
										sx={{
											margin: '1rem 0 0 2rem',
											color: option === userSingleResponseWithFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
											fontStyle: option === userSingleResponseWithFeedback?.questionId.correctAnswer ? 'italic' : null,
										}}>
										{choiceLabel} {option}
									</Typography>
								);
							})}
						</Box>
						<Box sx={{ width: '100%', margin: '2rem auto 1rem auto' }}>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>Your Answer</Typography>
							</Box>
							<Box>
								{(() => {
									const userAnswerIndex = userSingleResponseWithFeedback?.questionId.options?.findIndex(
										(option: string) => option === userSingleResponseWithFeedback?.userAnswer
									);
									const choiceLabel = userAnswerIndex !== -1 ? `${String.fromCharCode(97 + userAnswerIndex)})` : '';
									return (
										<Typography variant='body2'>
											{choiceLabel} {userSingleResponseWithFeedback?.userAnswer}
										</Typography>
									);
								})()}
							</Box>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.OPEN_ENDED && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box sx={{ mb: '0.5rem' }}>
							<Typography variant='h6'>Your Answer</Typography>
						</Box>
						<Box>
							<Typography variant='body2'>{userSingleResponseWithFeedback.userAnswer}</Typography>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.TRUE_FALSE && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box sx={{ marginBottom: '2rem' }}>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>Correct Answer</Typography>
							</Box>
							<Box>
								<Typography variant='body2'>{userSingleResponseWithFeedback?.questionId.correctAnswer}</Typography>
							</Box>
						</Box>
						<Box>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>Your Answer</Typography>
							</Box>
							<Box>
								<Typography variant='body2'>{userSingleResponseWithFeedback.userAnswer}</Typography>
							</Box>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.AUDIO_VIDEO && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box>
							<Typography variant='h6'>Your Recording</Typography>
						</Box>
						{userSingleResponseWithFeedback?.audioRecordUrl && (
							<Box>
								<audio
									src={userSingleResponseWithFeedback?.audioRecordUrl}
									controls
									style={{ marginTop: '1rem', boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.35rem', width: '100%' }}></audio>
							</Box>
						)}
						{userSingleResponseWithFeedback?.videoRecordUrl && (
							<Box>
								<video
									src={userSingleResponseWithFeedback?.videoRecordUrl}
									controls
									style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.25rem' }}></video>
							</Box>
						)}

						{userSingleResponseWithFeedback?.teacherAudioFeedbackUrl && (
							<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: '3rem' }}>
								<Box>
									<Typography variant='h5'>Instructor's Audio Feedback for Question</Typography>
								</Box>
								<Box>
									<audio
										src={userSingleResponseWithFeedback?.teacherAudioFeedbackUrl}
										controls
										style={{
											marginTop: '1rem',
											boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
											borderRadius: '0.35rem',
											width: '100%',
										}}></audio>
								</Box>
							</Box>
						)}
					</Box>
				)}

				{userSingleResponseWithFeedback?.teacherFeedback && (
					<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '1rem auto 3rem auto' }}>
						<Box sx={{ mb: '1rem' }}>
							<Typography variant='h5'>Instructor's Feedback for Question</Typography>
						</Box>
						<Box>
							<Typography variant='body2'>{userSingleResponseWithFeedback?.teacherFeedback}</Typography>
						</Box>
					</Box>
				)}
			</CustomDialog>

			{quizFeedback && (
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '2rem' }}>
					<Box sx={{ mb: '1rem' }}>
						<Typography variant='h5'>Instructor's Feedback for Quiz</Typography>
					</Box>
					<Box sx={{ mb: '1rem' }}>
						<Typography variant='body2'>{quizFeedback}</Typography>
					</Box>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default SubmissionFeedbackDetails;
