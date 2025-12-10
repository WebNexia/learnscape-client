import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { QuestionType, LessonType } from '../interfaces/enums';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import theme from '../themes';
import { calculateQuizTotalScore } from '../utils/calculateQuizTotalScore';
import { calculateScorePercentage } from '../utils/calculateScorePercentage';
import { Lesson } from '../interfaces/lessons';
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
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import QuestionMedia from '../components/userCourses/QuestionMedia';
import { CustomAudioPlayer } from '../components/audio';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';
import { useDashboardSync, dashboardSyncHelpers } from '../utils/dashboardSync';

export interface QuestionFeedbackData {
	userQuestionId: string;
	feedback: string;
	isUpdated: boolean;
	teacherAudioFeedbackUrl: string;
	isFeedbackGiven: boolean;
}

const AdminQuizSubmissionCheck = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userLessonId, submissionId, lessonId } = useParams();
	const { fetchQuestionTypeName } = useContext(QuestionsContext);
	const { user } = useContext(UserAuthContext);
	const navigate = useNavigate();

	// Dashboard sync for real-time updates
	const { refreshDashboard, refreshQuizSubmissions } = useDashboardSync();

	const { search } = useLocation();
	const isChecked = new URLSearchParams(search).get('isChecked');

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

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
	const [manualScore, setManualScore] = useState<number | undefined>(undefined);
	const [isScoreUpdating, setIsScoreUpdating] = useState<boolean>(false);
	const [lesson, setLesson] = useState<Lesson | null>(null);

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
				setQuizFeedback(lessonResponse.data.data[0]?.teacherFeedback || '');
				setManualScore(userCourseQuizData[0]?.pointsEarned);

				setUserQuestionsFeedbacks(
					() =>
						userCourseQuizData?.map((data: any) => ({
							userQuestionId: data._id,
							feedback: data.teacherFeedback,
							isUpdated: false,
							teacherAudioFeedbackUrl: data.teacherAudioFeedbackUrl,
							isFeedbackGiven: !!data.teacherFeedback,
						})) || []
				);

				// Fetch lesson data to get isGraded and questionScores for total score calculation
				if (lessonId) {
					try {
						const lessonDataResponse = await axios.get(`${base_url}/lessons/${lessonId}`);
						const lessonData = lessonDataResponse.data;
						setLesson(lessonData);
					} catch (error) {
						console.error('Error fetching lesson data:', error);
					}
				}
			} catch (error) {
				console.error(error);
			}
		};

		fetchData();
	}, [base_url, userLessonId, lessonId]);

	const handlePreviousResponse = () => {
		if (currentResponseIndex > 0) {
			setOpenQuestionFeedbackModal(true);
			const prevIndex = currentResponseIndex - 1;
			setCurrentResponseIndex(prevIndex);
			setUserResponseToFeedback(userResponseData[prevIndex]);
			setManualScore(userResponseData[prevIndex]?.pointsEarned);
		}
	};

	const handleNextResponse = () => {
		if (currentResponseIndex < userResponseData.length - 1) {
			setOpenQuestionFeedbackModal(true);
			const nextIndex = currentResponseIndex + 1;
			setCurrentResponseIndex(nextIndex);
			setUserResponseToFeedback(userResponseData[nextIndex]);
			setManualScore(userResponseData[nextIndex]?.pointsEarned);
		}
	};

	const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedFeedback = e.target.value;
		const updatedFeedbacks =
			userQuestionsFeedbacks?.map((feedback) =>
				feedback.userQuestionId === userResponseToFeedback._id
					? { ...feedback, feedback: updatedFeedback, isUpdated: true, isFeedbackGiven: !!updatedFeedback }
					: feedback
			) || [];

		setUserQuestionsFeedbacks(updatedFeedbacks);
		setIsQuizFeedbackUpdated(true);

		setUserResponseData(
			(prevResponses: any) =>
				prevResponses?.map((response: any) =>
					response._id === userResponseToFeedback._id ? { ...response, teacherFeedback: updatedFeedback } : response
				) || []
		);

		setUserResponseToFeedback((prev: any) => ({ ...prev, teacherFeedback: updatedFeedback }));
	};

	const resetFeedback = () => {
		const resetFeedbacks =
			userQuestionsFeedbacks?.map((feedback) =>
				feedback.userQuestionId === userResponseToFeedback._id ? { ...feedback, feedback: '', isUpdated: true, isFeedbackGiven: false } : feedback
			) || [];

		setUserQuestionsFeedbacks(resetFeedbacks);
		setUserResponseToFeedback((prev: any) => ({ ...prev, teacherFeedback: '' }));

		setUserResponseData(
			(prevResponses: any) =>
				prevResponses?.map((response: any) => (response._id === userResponseToFeedback._id ? { ...response, teacherFeedback: '' } : response)) || []
		);
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `audio-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(audioRef);

			const updatedFeedbacks =
				userQuestionsFeedbacks?.map((feedback) =>
					feedback.userQuestionId === userResponseToFeedback._id
						? { ...feedback, isUpdated: true, teacherAudioFeedbackUrl: downloadURL.trim(), isFeedbackGiven: true }
						: feedback
				) || [];

			setUserQuestionsFeedbacks(updatedFeedbacks);

			setUserResponseData(
				(prevResponses: any) =>
					prevResponses?.map((response: any) =>
						response._id === userResponseToFeedback._id ? { ...response, teacherAudioFeedbackUrl: downloadURL.trim() } : response
					) || []
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

			await Promise.all(
				userQuestionsFeedbacks?.map((feedback) => {
					if (feedback.feedback && feedback.isUpdated) {
						return axios
							.patch(`${base_url}/userquestions/${feedback.userQuestionId}`, {
								teacherFeedback: feedback.feedback.trim(),
								teacherAudioFeedbackUrl: feedback.teacherAudioFeedbackUrl.trim(),
							})
							.then(() => {
								setUserQuestionsFeedbacks(
									(prevFeedbacks) =>
										prevFeedbacks?.map((prevFeedback) =>
											prevFeedback.userQuestionId === feedback.userQuestionId
												? { ...prevFeedback, isFeedbackGiven: true, isUpdated: false }
												: prevFeedback
										) || []
								);
							});
					}
					return Promise.resolve();
				}) || []
			);

			if (isChecked === 'false') {
				// Use instructor endpoint if user is instructor
				const updateEndpoint =
					user?.role === 'instructor' ? `${base_url}/quizsubmissions/instructor/${submissionId}` : `${base_url}/quizsubmissions/${submissionId}`;

				await axios.patch(updateEndpoint, {
					isChecked: true,
				});

				// Trigger dashboard sync when quiz is checked
				dashboardSyncHelpers.onQuizSubmitted(refreshDashboard, refreshQuizSubmissions);
			}

			// Send notification AFTER submission is fully finalized (non-blocking)
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

			// Use batch operation with content-based deduplication (non-blocking)
			const batch = writeBatch(db);
			const notificationDocRef = doc(db, 'notifications', studentFirebaseId, 'userNotifications', submissionId || 'default');
			batch.set(notificationDocRef, notificationData, { merge: true });

			// Non-blocking notification - submission success is not dependent on notification success
			batch.commit().catch((error) => {
				console.warn('Failed to send quiz checked notification:', error);
			});

			setDisplaySubmissionMsg(true);
			setIsQuizFeedbackUpdated(false);

			setUserQuestionsFeedbacks((prev) => prev?.map((feedback) => ({ ...feedback, isUpdated: false })) || []);

			// Navigate to the correct route based on user role
			const basePath = user?.role === 'instructor' ? '/instructor' : '/admin';
			navigate(`${basePath}/check-submission/submission/${submissionId}/lesson/${lessonId}/userlesson/${userLessonId}?isChecked=true`);
		} catch (error) {
			console.error(error);
		} finally {
			setFeedbackSubmitting(false);
		}
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<DashboardPagesLayout pageName='Check Quiz Submission' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					width: isVerySmallScreen ? '90%' : '85%',
					margin: isMobileSizeSmall ? '1rem' : '2rem',
					boxShadow: '0 0.2rem 0.5rem 0.1rem rgba(0, 0, 0, 0.2)',
					borderRadius: '0.35rem',
					padding: '0.75rem 1rem',
				}}>
				{[
					{ label: 'Username', value: username },
					{ label: isMobileSize ? 'Quiz' : 'Quiz Name', value: quizName },
					{ label: isMobileSize ? 'Course' : 'Course Name', value: courseName },
					{ label: 'Status', value: isChecked === 'true' ? 'Checked' : 'Unchecked' },
				]?.map(({ label, value }, index) => (
					<Box key={index} sx={{ textAlign: 'center' }}>
						<Typography variant='h6' sx={{ mb: '0.35rem', fontSize: isMobileSizeSmall ? '0.8rem' : undefined }}>
							{label}
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSizeSmall ? '0.7rem' : '0.85rem' }}>
							{value}
						</Typography>
					</Box>
				))}
			</Box>

			<Box sx={{ width: isVerySmallScreen ? '90%' : '85%', margin: isMobileSizeSmall ? '1rem' : '1.5rem' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						width: '100%',
						margin: isMobileSize ? '0.25rem 0' : '0 0 0.75rem 0',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
							Questions
						</Typography>
						{lesson &&
							lesson.isGraded &&
							lesson.type === LessonType.QUIZ &&
							(() => {
								const totalPossible = calculateQuizTotalScore({ lesson, fetchQuestionTypeName });
								const totalEarned =
									userResponseData?.reduce((sum: number, response: any) => {
										return sum + (response.pointsEarned !== undefined && response.pointsEarned !== null ? response.pointsEarned : 0);
									}, 0) || 0;
								const percentage = calculateScorePercentage(totalEarned, totalPossible);
								return totalPossible > 0 ? (
									<Box
										sx={{
											display: 'inline-flex',
											alignItems: 'center',
											backgroundColor: theme.palette.primary.main,
											color: 'white',
											padding: isMobileSize ? '0.3rem 0.6rem' : '0.35rem 0.75rem',
											borderRadius: '1.5rem',
											fontSize: isMobileSize ? '0.65rem' : '0.8rem',
											fontWeight: 600,
											fontFamily: theme.fontFamily?.main || 'Poppins, sans-serif',
											boxShadow: '0 2px 8px rgba(1, 67, 90, 0.25)',
											whiteSpace: 'nowrap',
										}}>
										{totalEarned}/{totalPossible} pts
										{percentage !== null && (
											<Typography
												component='span'
												sx={{
													fontSize: isMobileSize ? '0.6rem' : '0.7rem',
													color: '#ffff',
													ml: '0.25rem',
												}}>
												- ({percentage}%)
											</Typography>
										)}
									</Box>
								) : null;
							})()}
					</Box>
					<CustomInfoMessageAlignedRight
						message={isVerySmallScreen ? 'Click questions to give feedback' : 'Click the questions to give/edit feedback for each question'}
						sx={{ marginRight: isMobileSize ? '0.85rem' : '2.5rem' }}
					/>
				</Box>
				{userResponseData?.map((response: any, index: number) => (
					<QuestionResponseCard
						key={response._id}
						response={response}
						index={index}
						fromAdminSubmissions={true}
						fetchQuestionTypeName={(q) => fetchQuestionTypeName(q)}
						onCardClick={(response, index) => {
							setOpenQuestionFeedbackModal(true);
							setUserResponseToFeedback(response);
							setCurrentResponseIndex(index);
							setManualScore(response?.pointsEarned);
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
							'position': 'fixed',
							'left': isMobileSize ? '2%' : '10%',
							'top': '50%',
							'transform': 'translateY(-50%)',
							'backgroundColor': theme.bgColor?.greenPrimary,
							'color': 'white',
							'border': 'none',
							'borderRadius': '50%',
							'padding': isMobileSize ? '0.5rem' : '0.75rem',
							'cursor': currentResponseIndex === 0 ? 'not-allowed' : 'pointer',
							'zIndex': 13000,
							':hover': { backgroundColor: theme.bgColor?.adminHeader },
						}}>
						<ArrowBackIosNewOutlined fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
					</IconButton>
					<IconButton
						onClick={handleNextResponse}
						disabled={currentResponseIndex === userResponseData.length - 1}
						sx={{
							'position': 'fixed',
							'right': isMobileSize ? '2%' : '10%',
							'top': '50%',
							'transform': 'translateY(-50%)',
							'backgroundColor': theme.bgColor?.greenPrimary,
							'color': 'white',
							'border': 'none',
							'borderRadius': '50%',
							'padding': isMobileSize ? '0.5rem' : '0.75rem',
							'cursor': currentResponseIndex === userResponseData.length - 1 ? 'not-allowed' : 'pointer',
							'zIndex': 13000,
							':hover': { backgroundColor: theme.bgColor?.adminHeader },
						}}>
						<ArrowForwardIosOutlined fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
					</IconButton>
				</>
			)}

			<CustomDialog openModal={openQuestionFeedbackModal} closeModal={() => setOpenQuestionFeedbackModal(false)} titleSx={{ paddingTop: '0.5rem' }}>
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Typography variant='h5' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.95rem' : undefined }}>
						Question ({fetchQuestionTypeName?.(userResponseToFeedback?.questionId) || ''})
					</Typography>

					<QuestionMedia question={userResponseToFeedback?.questionId} isStudentFeedbackPage={true} />

					{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) !== QuestionType.FITB_TYPING &&
						fetchQuestionTypeName?.(userResponseToFeedback?.questionId) !== QuestionType.FITB_DRAG_DROP && (
							<Typography
								variant='body2'
								component='div'
								sx={{
									'lineHeight': 1.8,
									'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
									'& img': {
										maxWidth: '100%',
										height: 'auto',
										borderRadius: '0.25rem',
										margin: '0.5rem 0',
										boxShadow: '0 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.15)',
									},
								}}
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(decode(userResponseToFeedback?.questionId.question)) }}
							/>
						)}
				</Box>

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
					<Box sx={{ width: '90%', margin: '0 auto' }}>
						{userResponseToFeedback?.questionId?.options?.map((option: string, index: number) => (
							<Typography
								key={index}
								variant='body2'
								sx={{
									margin: '1rem 0 0 2rem',
									color: option === userResponseToFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								}}>
								{String.fromCharCode(97 + index)}) {option}
							</Typography>
						))}
						<Box sx={{ width: '100%', margin: '2rem auto 1rem auto' }}>
							<Typography variant='h6' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.95rem' : undefined }}>
								Student's Answer
							</Typography>
							<Typography
								variant='body2'
								sx={{
									color:
										userResponseToFeedback?.userAnswer === userResponseToFeedback?.questionId.correctAnswer
											? theme.textColor?.greenPrimary.main
											: '#ef5350',
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								}}>
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

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.OPEN_ENDED && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Typography variant='h6' sx={{ mb: '0.5rem' }}>
							Student's Answer
						</Typography>
						<Typography sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>{userResponseToFeedback.userAnswer}</Typography>
					</Box>
				)}

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.TRUE_FALSE && (
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

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.MATCHING && (
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

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.FITB_DRAG_DROP && (
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

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.FITB_TYPING && (
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

				{fetchQuestionTypeName?.(userResponseToFeedback?.questionId) === QuestionType.AUDIO_VIDEO && (
					<Box sx={{ width: '90%', margin: '1rem auto' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
							Student's Recording
						</Typography>
						{userResponseToFeedback?.audioRecordUrl && (
							<Box sx={{ mt: '1rem' }}>
								<CustomAudioPlayer audioUrl={userResponseToFeedback?.audioRecordUrl} title='Student Recording' />
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
							<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
								Audio Feedback for Question
							</Typography>
							<Box sx={{ width: '100%', marginTop: '1rem' }}>
								{!userQuestionsFeedbacks?.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.teacherAudioFeedbackUrl ? (
									<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} recorderTitle='' teacherFeedback={true} />
								) : (
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Box sx={{ flex: 9, mt: '0.5rem' }}>
											<CustomAudioPlayer
												audioUrl={
													userQuestionsFeedbacks?.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)
														?.teacherAudioFeedbackUrl || ''
												}
												title='Teacher Audio Feedback'
											/>
										</Box>
										<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
											<CustomSubmitButton
												sx={{ borderRadius: '0.35rem' }}
												onClick={() => {
													setUserQuestionsFeedbacks(
														(prevFeedbacks) =>
															prevFeedbacks?.map((feedback) =>
																feedback.userQuestionId === userResponseToFeedback._id
																	? { ...feedback, isUpdated: true, teacherAudioFeedbackUrl: '', isFeedbackGiven: !!feedback.feedback }
																	: feedback
															) || []
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

				{userResponseToFeedback?.pointsPossible !== undefined &&
					userResponseToFeedback?.pointsPossible !== null &&
					(() => {
						const questionType = fetchQuestionTypeName(userResponseToFeedback?.questionId);
						const canUpdateScore = questionType === QuestionType.OPEN_ENDED || questionType === QuestionType.AUDIO_VIDEO;
						return canUpdateScore ? (
							<Box sx={{ width: '90%', margin: '1.5rem auto' }}>
								<Typography variant='h5' sx={{ mb: '1rem', fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
									Score
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Points Earned:
									</Typography>
									<CustomTextField
										type='number'
										value={manualScore !== undefined && manualScore !== null ? String(manualScore) : ''}
										onChange={(e) => {
											const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
											if (value === undefined || (value >= 0 && value <= (userResponseToFeedback?.pointsPossible || 0))) {
												setManualScore(value);
											}
										}}
										size='small'
										sx={{
											'width': '3.75rem',
											'& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
												WebkitAppearance: 'none',
												margin: 0,
											},
											'& input[type=number]': {
												MozAppearance: 'textfield',
											},
										}}
										InputProps={{
											inputProps: {
												min: 0,
												max: userResponseToFeedback?.pointsPossible || 0,
											},
										}}
									/>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										/ {userResponseToFeedback?.pointsPossible} pts
									</Typography>
									{(() => {
										const isOpenEndedOrAudioVideo = questionType === QuestionType.OPEN_ENDED || questionType === QuestionType.AUDIO_VIDEO;
										// For open-ended and audio/video, always show "Manually Graded" since they cannot be auto-graded
										if (isOpenEndedOrAudioVideo) {
											return (
												<Typography
													variant='body2'
													sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
													(Manually Graded)
												</Typography>
											);
										}
										// For other question types, show based on isAutoGraded flag
										return userResponseToFeedback?.isAutoGraded === false ? (
											<Typography
												variant='body2'
												sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
												(Manually Graded)
											</Typography>
										) : (
											<Typography
												variant='body2'
												sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
												(Auto Graded)
											</Typography>
										);
									})()}
								</Box>
								<CustomSubmitButton
									onClick={async () => {
										if (manualScore !== undefined && manualScore !== null && manualScore !== userResponseToFeedback?.pointsEarned) {
											try {
												setIsScoreUpdating(true);
												await axios.patch(`${base_url}/userQuestions/${userResponseToFeedback._id}/grade`, {
													pointsEarned: manualScore,
												});
												// Update local state
												setUserResponseData(
													(prevResponses: any) =>
														prevResponses?.map((response: any) =>
															response._id === userResponseToFeedback._id ? { ...response, pointsEarned: manualScore, isAutoGraded: false } : response
														) || []
												);
												setUserResponseToFeedback((prev: any) => ({ ...prev, pointsEarned: manualScore, isAutoGraded: false }));
											} catch (error) {
												console.error('Error updating score:', error);
											} finally {
												setIsScoreUpdating(false);
											}
										}
									}}
									disabled={isScoreUpdating || manualScore === userResponseToFeedback?.pointsEarned}
									sx={{ mt: '1rem', fontSize: isMobileSize ? '0.75rem' : undefined }}>
									{isScoreUpdating ? 'Updating...' : 'Update Score'}
								</CustomSubmitButton>
							</Box>
						) : null;
					})()}

				<Box sx={{ width: '90%', margin: '1.5rem auto' }}>
					<Typography variant='h5' sx={{ mb: '1rem', fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
						Feedback for Question
					</Typography>
					<CustomTextField
						multiline
						resizable
						value={userQuestionsFeedbacks?.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.feedback || ''}
						onChange={handleFeedbackChange}
						placeholder='Enter feedback for the question (max 1000 characters)'
						InputProps={{
							inputProps: {
								maxLength: 1000,
							},
						}}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
						{userQuestionsFeedbacks?.find((feedback) => feedback.userQuestionId === userResponseToFeedback?._id)?.feedback.length}/1000 Characters
					</Typography>
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

			<Box sx={{ width: isVerySmallScreen ? '90%' : '85%', margin: isMobileSize ? '1rem 0' : '2rem' }}>
				<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ mb: '1rem', fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
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
					placeholder='Enter feedback for the quiz (max 1000 characters)'
					InputProps={{
						inputProps: {
							maxLength: 1000,
						},
					}}
				/>
				<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
					{quizFeedback.length}/1000 Characters
				</Typography>
			</Box>

			<Box sx={{ width: '85%', mb: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
				{feedbackSubmitting ? (
					<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: isMobileSizeSmall ? '1.5rem' : '2rem' }}>
						Submitting
					</LoadingButton>
				) : (
					<CustomSubmitButton
						onClick={handleSubmit}
						sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : undefined, height: isMobileSizeSmall ? '1.5rem' : undefined }}>
						Submit
					</CustomSubmitButton>
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
