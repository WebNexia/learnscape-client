import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
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
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import AudioRecorder from '../components/userCourses/AudioRecorder';
import MatchingPreview from '../components/layouts/matching/MatchingPreview';
import FillInTheBlanksDragDrop from '../components/layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../components/layouts/FITBTyping/FillInTheBlanksTyping';
import CustomInfoMessageAlignedRight from '../components/layouts/infoMessage/CustomInfoMessageAlignedRight';
import QuestionResponseCard from '../components/layouts/quizSubmissions/QuestionResponseCard';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export interface QuestionFeedbackData {
	userQuestionId: string;
	feedback: string;
	isUpdated: boolean;
	teacherAudioFeedbackUrl: string;
	isFeedbackGiven: boolean;
}

const AdminQuizSubmissionCheck = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId, userLessonId, submissionId, lessonId } = useParams();
	const { fetchQuestionTypeName } = useContext(QuestionsContext);
	const { user } = useContext(UserAuthContext);
	const navigate = useNavigate();

	const { search } = useLocation();
	const isChecked = new URLSearchParams(search).get('isChecked');

	const [username, setUsername] = useState<string>('');
	const [quizName, setQuizName] = useState<string>('');
	const [courseName, setCourseName] = useState<string>('');
	const [studentFirebaseId, setStudentFirebaseId] = useState<string>('');
	const [userResponseData, setUserResponseData] = useState<any>([]);
	const [userResponseToFeedback, setUserResponseToFeedback] = useState<any>(null);
	const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(0);
	const [openQuestionFeedbackModal, setOpenQuestionFeedbackModal] = useState<boolean>(false);
	const [quizFeedback, setQuizFeedback] = useState<string>('');
	const [isQuizFeedbackUpdated, setIsQuizFeedbackUpdated] = useState<boolean>(false);
	const [userQuestionsFeedbacks, setUserQuestionsFeedbacks] = useState<QuestionFeedbackData[]>([]);
	const [displaySubmissionMsg, setDisplaySubmissionMsg] = useState<boolean>(false);
	const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [quizResponse, lessonResponse] = await Promise.all([
					axios.get(`${base_url}/userQuestions/userlesson/${userLessonId}`),
					axios.get(`${base_url}/userlessons/${userLessonId}`),
				]);

				const userCourseQuizData = quizResponse.data.response;
				setUserResponseData(userCourseQuizData);
				setUsername(userCourseQuizData[0].userId.username);
				setStudentFirebaseId(userCourseQuizData[0].userId.firebaseUserId);
				setQuizName(userCourseQuizData[0].lessonId.title);
				setCourseName(userCourseQuizData[0].courseId.title);
				setUserResponseToFeedback(userCourseQuizData[0]);
				setQuizFeedback(lessonResponse.data.data[0].teacherFeedback);

				setUserQuestionsFeedbacks(() =>
					userCourseQuizData.map((data: any) => ({
						userQuestionId: data._id,
						feedback: data.teacherFeedback,
						isUpdated: false,
						teacherAudioFeedbackUrl: data.teacherAudioFeedbackUrl,
						isFeedbackGiven: !!data.teacherFeedback,
					}))
				);
			} catch (error) {
				console.error(error);
			}
		};

		fetchData();
	}, [base_url, userLessonId]);

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
		const updatedFeedbacks = userQuestionsFeedbacks.map((feedback) =>
			feedback.userQuestionId === userResponseToFeedback._id
				? { ...feedback, feedback: updatedFeedback, isUpdated: true, isFeedbackGiven: !!updatedFeedback }
				: feedback
		);

		setUserQuestionsFeedbacks(updatedFeedbacks);
		setIsQuizFeedbackUpdated(true);

		setUserResponseData((prevResponses: any) =>
			prevResponses.map((response: any) =>
				response._id === userResponseToFeedback._id ? { ...response, teacherFeedback: updatedFeedback } : response
			)
		);

		setUserResponseToFeedback((prev: any) => ({ ...prev, teacherFeedback: updatedFeedback }));
	};

	const resetFeedback = () => {
		const resetFeedbacks = userQuestionsFeedbacks.map((feedback) =>
			feedback.userQuestionId === userResponseToFeedback._id ? { ...feedback, feedback: '', isUpdated: true, isFeedbackGiven: false } : feedback
		);

		setUserQuestionsFeedbacks(resetFeedbacks);
		setUserResponseToFeedback((prev: any) => ({ ...prev, teacherFeedback: '' }));

		setUserResponseData((prevResponses: any) =>
			prevResponses.map((response: any) => (response._id === userResponseToFeedback._id ? { ...response, teacherFeedback: '' } : response))
		);
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `audio-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(audioRef);

			const updatedFeedbacks = userQuestionsFeedbacks.map((feedback) =>
				feedback.userQuestionId === userResponseToFeedback._id
					? { ...feedback, isUpdated: true, teacherAudioFeedbackUrl: downloadURL.trim(), isFeedbackGiven: true }
					: feedback
			);

			setUserQuestionsFeedbacks(updatedFeedbacks);

			setUserResponseData((prevResponses: any) =>
				prevResponses.map((response: any) =>
					response._id === userResponseToFeedback._id ? { ...response, teacherAudioFeedbackUrl: downloadURL.trim() } : response
				)
			);

			setUserResponseToFeedback((prev: any) => ({ ...prev, teacherAudioFeedbackUrl: downloadURL.trim() }));
		} catch (error) {
			console.error(error);
		} finally {
			setIsAudioUploading(false);
		}
	};

	const handleSubmit = async () => {
		try {
			setFeedbackSubmitting(true);

			if (quizFeedback && isQuizFeedbackUpdated) {
				await axios.patch(`${base_url}/userlessons/${userLessonId}`, {
					teacherFeedback: quizFeedback.trim(),
					isFeedbackGiven: true,
				});
			}

			const notificationData = {
				title: 'Quiz Checked',
				message: `${user?.username} checked ${quizName} in the ${courseName} course.`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'QuizSubmission',
				userImageUrl: user?.imageUrl,
				lessonId,
				submissionId,
				userLessonId,
			};

			const notificationRef = collection(db, 'notifications', studentFirebaseId, 'userNotifications');
			await addDoc(notificationRef, notificationData);

			await Promise.all(
				userQuestionsFeedbacks.map(async (feedback) => {
					if (feedback.feedback && feedback.isUpdated) {
						await axios.patch(`${base_url}/userquestions/${feedback.userQuestionId}`, {
							teacherFeedback: feedback.feedback.trim(),
							teacherAudioFeedbackUrl: feedback.teacherAudioFeedbackUrl.trim(),
						});

						setUserQuestionsFeedbacks((prevFeedbacks) =>
							prevFeedbacks.map((prevFeedback) =>
								prevFeedback.userQuestionId === feedback.userQuestionId ? { ...prevFeedback, isFeedbackGiven: true, isUpdated: false } : prevFeedback
							)
						);
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

			setUserQuestionsFeedbacks((prev) => prev.map((feedback) => ({ ...feedback, isUpdated: false })));

			navigate(`/admin/check-submission/user/${userId}/submission/${submissionId}/lesson/${lessonId}/userlesson/${userLessonId}?isChecked=true`);
		} catch (error) {
			console.error(error);
		} finally {
			setFeedbackSubmitting(false);
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<DashboardPagesLayout pageName='Check Quiz Submission' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '90%', margin: '2rem' }}>
				{[
					{ label: 'Username', value: username },
					{ label: 'Quiz Name', value: quizName },
					{ label: 'Course Name', value: courseName },
					{ label: 'Status', value: isChecked === 'true' ? 'Checked' : 'Unchecked' },
				].map(({ label, value }, index) => (
					<Box key={index} sx={{ textAlign: 'center' }}>
						<Typography variant='h6' sx={{ mb: '0.35rem' }}>
							{label}
						</Typography>
						<Typography variant='body2'>{value}</Typography>
					</Box>
				))}
			</Box>

			<Box sx={{ width: '90%', margin: '1.5rem' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '1rem 0' }}>
					<Box>
						<Typography variant='h5'>Questions</Typography>
					</Box>
					<CustomInfoMessageAlignedRight message='Click the questions to give/edit feedback for each question' sx={{ marginRight: '2.5rem' }} />
				</Box>
				{userResponseData?.map((response: any, index: number) => (
					<QuestionResponseCard
						key={response._id}
						response={response}
						index={index}
						fromAdminSubmissions={true}
						fetchQuestionTypeName={fetchQuestionTypeName}
						onCardClick={(response, index) => {
							setOpenQuestionFeedbackModal(true);
							setUserResponseToFeedback(response);
							setCurrentResponseIndex(index);
						}}
					/>
				))}
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
							':hover': { backgroundColor: theme.bgColor?.adminHeader },
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
							':hover': { backgroundColor: theme.bgColor?.adminHeader },
						}}>
						<ArrowForwardIosOutlined />
					</IconButton>
				</>
			)}

			<CustomDialog openModal={openQuestionFeedbackModal} closeModal={() => setOpenQuestionFeedbackModal(false)} titleSx={{ paddingTop: '0.5rem' }}>
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Typography variant='h5' sx={{ mb: '0.5rem' }}>
						Question ({fetchQuestionTypeName(userResponseToFeedback?.questionId)})
					</Typography>
					{fetchQuestionTypeName(userResponseToFeedback?.questionId) !== QuestionType.FITB_TYPING &&
						fetchQuestionTypeName(userResponseToFeedback?.questionId) !== QuestionType.FITB_DRAG_DROP && (
							<Typography
								variant='body1'
								component='div'
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(userResponseToFeedback?.questionId.question) }}
							/>
						)}
				</Box>

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
					<Box sx={{ width: '90%', margin: '0 auto' }}>
						{userResponseToFeedback?.questionId?.options?.map((option: string, index: number) => (
							<Typography
								key={index}
								variant='body1'
								sx={{
									margin: '1rem 0 0 2rem',
									color: option === userResponseToFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
									fontWeight: 'bolder',
								}}>
								{String.fromCharCode(97 + index)}) {option}
							</Typography>
						))}
						<Box sx={{ width: '100%', margin: '2rem auto 1rem auto' }}>
							<Typography variant='h6' sx={{ mb: '0.5rem' }}>
								Student's Answer
							</Typography>
							<Typography variant='body2'>
								{userResponseToFeedback?.questionId.options?.findIndex((option: string) => option === userResponseToFeedback?.userAnswer) !== -1
									? `${String.fromCharCode(
											97 + userResponseToFeedback?.questionId.options?.findIndex((option: string) => option === userResponseToFeedback?.userAnswer)
									  )})`
									: ''}{' '}
								{userResponseToFeedback?.userAnswer}
							</Typography>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.OPEN_ENDED && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Typography variant='h6' sx={{ mb: '0.5rem' }}>
							Student's Answer
						</Typography>
						<Typography variant='body2'>{userResponseToFeedback.userAnswer}</Typography>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.TRUE_FALSE && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Box sx={{ marginBottom: '2rem' }}>
							<Typography variant='h6' sx={{ mb: '0.5rem' }}>
								Correct Answer
							</Typography>
							<Typography variant='body2'>{userResponseToFeedback?.questionId.correctAnswer}</Typography>
						</Box>
						<Box>
							<Typography variant='h6' sx={{ mb: '0.5rem' }}>
								Student's Answer
							</Typography>
							<Typography variant='body2'>{userResponseToFeedback.userAnswer}</Typography>
						</Box>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.MATCHING && (
					<Box sx={{ width: '90%', margin: '0rem auto' }}>
						<MatchingPreview
							initialPairs={userResponseToFeedback?.questionId.matchingPairs}
							userMatchingPairsAfterSubmission={userResponseToFeedback?.userMatchingPairAnswers}
							questionId={userResponseToFeedback?.questionId}
							fromQuizQuestionUser={true}
							isLessonCompleted={true}
						/>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.FITB_DRAG_DROP && (
					<Box sx={{ width: '90%', margin: '0rem auto' }}>
						<FillInTheBlanksDragDrop
							textWithBlanks={userResponseToFeedback?.questionId.question}
							blankValuePairs={userResponseToFeedback?.questionId.blankValuePairs}
							userBlankValuePairsAfterSubmission={userResponseToFeedback?.userBlankValuePairAnswers}
							questionId={userResponseToFeedback?.questionId}
							fromQuizQuestionUser={true}
							isLessonCompleted={true}
						/>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.FITB_TYPING && (
					<Box sx={{ width: '90%', margin: '0rem auto' }}>
						<FillInTheBlanksTyping
							textWithBlanks={userResponseToFeedback?.questionId.question}
							blankValuePairs={userResponseToFeedback?.questionId.blankValuePairs}
							userBlankValuePairsAfterSubmission={userResponseToFeedback?.userBlankValuePairAnswers}
							questionId={userResponseToFeedback?.questionId}
							fromQuizQuestionUser={true}
							isLessonCompleted={true}
						/>
					</Box>
				)}

				{fetchQuestionTypeName(userResponseToFeedback?.questionId) === QuestionType.AUDIO_VIDEO && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Typography variant='h6'>Student's Recording</Typography>
						{userResponseToFeedback?.audioRecordUrl && (
							<Box>
								<audio
									src={userResponseToFeedback?.audioRecordUrl}
									controls
									style={{
										marginTop: '1rem',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
										borderRadius: '0.35rem',
										width: '100%',
									}}
								/>
								<a
									href={userResponseToFeedback?.audioRecordUrl}
									download
									style={{ display: 'block', marginTop: '0.5rem', textAlign: 'center' }}
									target='_blank'>
									<Typography variant='body2'>Download Audio</Typography>
								</a>
							</Box>
						)}
						{userResponseToFeedback?.videoRecordUrl && (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
								<video
									src={userResponseToFeedback?.videoRecordUrl}
									controls
									style={{
										margin: '1rem auto 0 auto',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
										borderRadius: '0.35rem',
										width: '60%',
									}}
								/>
								<a
									href={userResponseToFeedback?.videoRecordUrl}
									download
									style={{ display: 'block', marginTop: '0.5rem', textAlign: 'center' }}
									target='_blank'>
									<Typography variant='body2'>Download Video</Typography>
								</a>
							</Box>
						)}

						<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: '5rem' }}>
							<Typography variant='h5'>Audio Feedback for Question</Typography>
							<Box sx={{ width: '100%', marginTop: '1rem' }}>
								{!userQuestionsFeedbacks.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.teacherAudioFeedbackUrl ? (
									<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} recorderTitle='' teacherFeedback={true} />
								) : (
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Box sx={{ flex: 9 }}>
											<audio
												src={
													userQuestionsFeedbacks.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.teacherAudioFeedbackUrl
												}
												controls
												style={{
													marginTop: '1rem',
													boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
													borderRadius: '0.35rem',
													width: '100%',
												}}
											/>
										</Box>
										<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
											<CustomSubmitButton
												sx={{ borderRadius: '0.35rem' }}
												onClick={() => {
													setUserQuestionsFeedbacks((prevFeedbacks) =>
														prevFeedbacks.map((feedback) =>
															feedback.userQuestionId === userResponseToFeedback._id
																? { ...feedback, isUpdated: true, teacherAudioFeedbackUrl: '', isFeedbackGiven: !!feedback.feedback }
																: feedback
														)
													);
												}}>
												Remove
											</CustomSubmitButton>
										</Box>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				)}

				<Box sx={{ width: '90%', margin: '1.5rem auto' }}>
					<Typography variant='h5' sx={{ mb: '1rem' }}>
						Feedback for Question
					</Typography>
					<CustomTextField
						multiline
						resizable
						value={userQuestionsFeedbacks.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.feedback || ''}
						onChange={handleFeedbackChange}
					/>
				</Box>

				<CustomDialogActions
					onCancel={() => setOpenQuestionFeedbackModal(false)}
					deleteBtn={true}
					cancelBtnText='Close'
					deleteBtnText='Reset'
					submitBtnType='button'
					actionSx={{ width: '94%', margin: '0 auto 1rem auto' }}
					onDelete={resetFeedback}
				/>
			</CustomDialog>

			<Box sx={{ width: '90%', margin: '2rem' }}>
				<Typography variant='h5' sx={{ mb: '1rem' }}>
					Feedback for Quiz
				</Typography>
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

			<Box sx={{ width: '90%', mb: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
				{feedbackSubmitting ? (
					<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
						Submitting
					</LoadingButton>
				) : (
					<CustomSubmitButton onClick={handleSubmit}>Submit</CustomSubmitButton>
				)}
			</Box>

			<Snackbar
				open={displaySubmissionMsg}
				autoHideDuration={4000}
				onClose={() => setDisplaySubmissionMsg(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert onClose={() => setDisplaySubmissionMsg(false)} severity='success' sx={{ width: '100%' }}>
					You have successfully submitted the feedback for this quiz!
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default AdminQuizSubmissionCheck;
