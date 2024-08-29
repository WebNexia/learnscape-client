import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { stripHtml } from '../utils/stripHtml';
import { truncateText } from '../utils/utilText';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { QuestionType } from '../interfaces/enums';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import theme from '../themes';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { ArrowBackIosNewOutlined, ArrowForwardIosOutlined } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';

export interface QuestionFeedbackData {
	userQuestionId: string;
	feedback: string;
	isUpdated: boolean;
}

const AdminCheckQuizSubmission = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const { userLessonId, submissionId, userId, lessonId } = useParams();
	const navigate = useNavigate();
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const isChecked = queryParams.get('isChecked');

	const [username, setUsername] = useState<string>('');
	const [quizName, setQuizName] = useState<string>('');
	const [courseName, setCourseName] = useState<string>('');
	const [userResponseData, setUserResponseData] = useState<any>([]);
	const [userResponseToFeedback, setUserResponseToFeedback] = useState<any>(null);
	const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(0);

	const [openQuestionFeedbackModal, setOpenQuestionFeedbackModal] = useState<boolean>(false);

	const [quizFeedback, setQuizFeedback] = useState<string>('');
	const [isQuizFeedbackUpdated, setIsQuizFeedbackUpdated] = useState<boolean>(false);
	const [userQuestionsFeedbacks, setUserQuestionsFeedbacks] = useState<QuestionFeedbackData[]>([]);

	const [displaySubmissionMsg, setDisplaySubmissionMsg] = useState<boolean>(false);
	const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);

	useEffect(() => {
		const fetchQuizSubmissionData = async () => {
			try {
				const response = await axios.get(`${base_url}/userQuestions/userlesson/${userLessonId}`);

				const userCourseQuizData = response.data.response;

				setUserResponseData(userCourseQuizData);
				setUsername(userCourseQuizData[0].userId.username);
				setQuizName(userCourseQuizData[0].lessonId.title);
				setCourseName(userCourseQuizData[0].courseId.title);
				setUserResponseToFeedback(userCourseQuizData[0]);

				setUserQuestionsFeedbacks(() => {
					const feedbacks = userCourseQuizData.map((data: any) => {
						return { userQuestionId: data._id, feedback: data.teacherFeedback, isUpdated: false };
					});

					return feedbacks;
				});
			} catch (error) {
				console.log(error);
			}
		};

		const fetchUserLessonData = async () => {
			try {
				const response = await axios.get(`${base_url}/userLessons/${userLessonId}`);

				console.log(response.data.data[0]);
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
			setUserResponseToFeedback(userResponseData[nextIndex]);
		}
	};

	const handlePreviousResponse = () => {
		if (currentResponseIndex > 0) {
			setOpenQuestionFeedbackModal(true);
			const prevIndex = currentResponseIndex - 1;
			setCurrentResponseIndex(prevIndex);
			setUserResponseToFeedback(userResponseData[prevIndex]);
		}
	};

	const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedFeedback = e.target.value;

		setUserQuestionsFeedbacks((prevFeedbacks) =>
			prevFeedbacks.map((feedback) =>
				feedback.userQuestionId === userResponseToFeedback._id ? { ...feedback, feedback: updatedFeedback, isUpdated: true } : feedback
			)
		);

		setUserResponseToFeedback((prevResponse: any) => ({
			...prevResponse,
			teacherFeedback: updatedFeedback,
		}));
	};

	const resetFeedback = () => {
		setUserQuestionsFeedbacks((prevFeedbacks) =>
			prevFeedbacks.map((feedback) =>
				feedback.userQuestionId === userResponseToFeedback._id ? { ...feedback, feedback: '', isUpdated: true } : feedback
			)
		);

		setUserResponseToFeedback((prevResponse: any) => ({
			...prevResponse,
			teacherFeedback: '',
		}));
	};

	const handleSubmit = async () => {
		try {
			setFeedbackSubmitting(true);

			if (quizFeedback && isQuizFeedbackUpdated) {
				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					teacherFeedback: quizFeedback,
				});
			}

			await Promise.all(
				userQuestionsFeedbacks.map(async (feedback: QuestionFeedbackData) => {
					try {
						if (feedback.feedback && feedback.isUpdated) {
							await axios.patch(`${base_url}/userquestions/${feedback.userQuestionId}`, {
								teacherFeedback: feedback.feedback,
							});
						}
					} catch (error) {
						console.log(error);
					}
				})
			);

			if (isChecked === 'false') {
				await axios.patch(`${base_url}/quizsubmissions/${submissionId}`, {
					isChecked: true,
				});
			}

			setDisplaySubmissionMsg(true);
			setIsQuizFeedbackUpdated(false);

			setUserQuestionsFeedbacks((prevFeedbacks) => {
				const updatedFeedbacks = prevFeedbacks.map((feedback) => {
					return { ...feedback, isUpdated: false };
				});
				return updatedFeedbacks;
			});

			navigate(`/admin/check-submission/user/${userId}/submission/${submissionId}/lesson/${lessonId}/userlesson/${userLessonId}?isChecked=true`);
		} catch (error) {
			console.log(error);
		} finally {
			setFeedbackSubmitting(false);
		}
	};

	return (
		<DashboardPagesLayout pageName='Check Quiz Submission' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '90%', margin: '2rem' }}>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h6' sx={{ mb: '0.35rem' }}>
						Username
					</Typography>
					<Typography variant='body2'>{username}</Typography>
				</Box>
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
						Status
					</Typography>
					<Typography variant='body2'>{isChecked === 'true' ? 'Checked' : 'Unchecked'}</Typography>
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
									setUserResponseToFeedback(response);
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
						Question ({fetchQuestionTypeName(userResponseToFeedback?.questionId)})
					</Typography>
					<Typography
						variant='body1'
						component='div'
						dangerouslySetInnerHTML={{ __html: sanitizeHtml(userResponseToFeedback?.questionId.question) }}
					/>
				</Box>

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
					<Box sx={{ width: '90%', margin: '0 auto' }}>
						<Box>
							{userResponseToFeedback?.questionId?.options?.map((option: string, index: number) => {
								const choiceLabel = String.fromCharCode(97 + index) + ')';
								return (
									<Typography
										variant='body1'
										key={index}
										sx={{
											margin: '1rem 0 0 2rem',
											color: option === userResponseToFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
											fontStyle: option === userResponseToFeedback?.questionId.correctAnswer ? 'italic' : null,
										}}>
										{choiceLabel} {option}
									</Typography>
								);
							})}
						</Box>
						<Box sx={{ width: '100%', margin: '2rem auto 1rem auto' }}>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>User Answer</Typography>
							</Box>
							<Box>
								{(() => {
									const userAnswerIndex = userResponseToFeedback?.questionId.options?.findIndex(
										(option: string) => option === userResponseToFeedback?.userAnswer
									);
									const choiceLabel = userAnswerIndex !== -1 ? `${String.fromCharCode(97 + userAnswerIndex)})` : '';
									return (
										<Typography variant='body2'>
											{choiceLabel} {userResponseToFeedback?.userAnswer}
										</Typography>
									);
								})()}
							</Box>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.OPEN_ENDED && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box sx={{ mb: '0.5rem' }}>
							<Typography variant='h6'>User Answer</Typography>
						</Box>
						<Box>
							<Typography variant='body2'>{userResponseToFeedback.userAnswer}</Typography>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.TRUE_FALSE && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box sx={{ marginBottom: '2rem' }}>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>Correct Answer</Typography>
							</Box>
							<Box>
								<Typography variant='body2'>{userResponseToFeedback?.questionId.correctAnswer}</Typography>
							</Box>
						</Box>
						<Box>
							<Box sx={{ mb: '0.5rem' }}>
								<Typography variant='h6'>User Answer</Typography>
							</Box>
							<Box>
								<Typography variant='body2'>{userResponseToFeedback.userAnswer}</Typography>
							</Box>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.AUDIO_VIDEO && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box>
							<Typography variant='h6'>User Recording</Typography>
						</Box>
						{userResponseToFeedback?.audioRecordUrl && (
							<Box>
								<audio
									src={userResponseToFeedback?.audioRecordUrl}
									controls
									style={{ marginTop: '1rem', boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.35rem' }}></audio>
							</Box>
						)}
						{userResponseToFeedback?.videoRecordUrl && (
							<Box>
								<video
									src={userResponseToFeedback?.videoRecordUrl}
									controls
									style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.25rem' }}></video>
							</Box>
						)}
					</Box>
				)}

				<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '2rem auto' }}>
					<Box sx={{ mb: '1rem' }}>
						<Typography variant='h5'>Feedback for Question</Typography>
					</Box>
					<CustomTextField
						multiline
						resizable
						value={userQuestionsFeedbacks.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.feedback || ''}
						onChange={handleFeedbackChange}
					/>
				</Box>

				<CustomDialogActions
					onCancel={() => {
						setOpenQuestionFeedbackModal(false);
					}}
					cancelBtnText='Close'
					submitBtnText='Reset'
					submitBtnType='button'
					actionSx={{ width: '94%', margin: '0 auto 1rem auto' }}
					onSubmit={resetFeedback}
				/>
			</CustomDialog>

			<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '2rem' }}>
				<Box sx={{ mb: '1rem' }}>
					<Typography variant='h5'>Feedback for Quiz</Typography>
				</Box>
				<CustomTextField
					multiline
					resizable
					value={quizFeedback}
					onChange={(e) => {
						setQuizFeedback(e.target.value);
						setIsQuizFeedbackUpdated(true);
					}}
				/>
			</Box>
			{!feedbackSubmitting ? (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '90%', mb: '3rem' }}>
					<CustomSubmitButton onClick={handleSubmit}>Submit</CustomSubmitButton>
				</Box>
			) : (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '90%', mb: '3rem' }}>
					<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
						Submitting
					</LoadingButton>
				</Box>
			)}

			<Snackbar
				open={displaySubmissionMsg}
				autoHideDuration={4000}
				onClose={() => setDisplaySubmissionMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setDisplaySubmissionMsg(false)} severity='success' sx={{ width: '100%' }}>
					You have successfully submitted the feedback for this quiz!
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default AdminCheckQuizSubmission;
