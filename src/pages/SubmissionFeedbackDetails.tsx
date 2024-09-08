import { Box, IconButton, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useLocation, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import axios from 'axios';
import { QuestionType } from '../interfaces/enums';
import { ArrowBackIosNewOutlined, ArrowForwardIosOutlined } from '@mui/icons-material';
import theme from '../themes';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import FillInTheBlanksTyping from '../components/layouts/FITBTyping/FillInTheBlanksTyping';
import FillInTheBlanksDragDrop from '../components/layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import MatchingPreview from '../components/layouts/matching/MatchingPreview';
import CustomInfoMessageAlignedRight from '../components/layouts/infoMessage/CustomInfoMessageAlignedRight';
import QuestionResponseCard from '../components/layouts/quizSubmissions/QuestionResponseCard';

const SubmissionFeedbackDetails = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { userLessonId } = useParams();
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const [quizName, setQuizName] = useState<string>('');
	const [courseName, setCourseName] = useState<string>('');
	const [quizFeedback, setQuizFeedback] = useState<string>('');
	const [userResponseData, setUserResponseData] = useState<any>([]);
	const [userSingleResponseWithFeedback, setUserSingleResponseWithFeedback] = useState<any>(null);
	const [openQuestionFeedbackModal, setOpenQuestionFeedbackModal] = useState<boolean>(false);
	const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(0);

	const { search } = useLocation();
	const isChecked = new URLSearchParams(search).get('isChecked');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [quizResponse, lessonResponse] = await Promise.all([
					axios.get(`${base_url}/userQuestions/userlesson/${userLessonId}`),
					axios.get(`${base_url}/userlessons/${userLessonId}`),
				]);

				const userCourseQuizData = quizResponse.data.response;
				setUserResponseData(userCourseQuizData);
				setQuizName(userCourseQuizData[0].lessonId.title);
				setCourseName(userCourseQuizData[0].courseId.title);
				setQuizFeedback(lessonResponse.data.data[0].teacherFeedback);
			} catch (error) {
				console.error(error);
			}
		};

		fetchData();
	}, [base_url, userLessonId]);

	const handleResponseNavigation = (direction: 'next' | 'prev') => {
		const newIndex = currentResponseIndex + (direction === 'next' ? 1 : -1);
		setOpenQuestionFeedbackModal(true);
		setCurrentResponseIndex(newIndex);
		setUserSingleResponseWithFeedback(userResponseData[newIndex]);
	};

	const renderFeedbackModal = () => (
		<CustomDialog openModal={openQuestionFeedbackModal} closeModal={() => setOpenQuestionFeedbackModal(false)} titleSx={{ paddingTop: '0.5rem' }}>
			<Box sx={{ width: '90%', margin: '1rem auto' }}>
				<Typography variant='h5' sx={{ mb: '0.5rem' }}>
					Question ({fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId)})
				</Typography>
				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) !== QuestionType.FITB_TYPING &&
					fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) !== QuestionType.FITB_DRAG_DROP && (
						<Typography
							variant='body1'
							component='div'
							dangerouslySetInnerHTML={{ __html: sanitizeHtml(userSingleResponseWithFeedback?.questionId.question) }}
						/>
					)}
			</Box>

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
				<Box sx={{ width: '90%', margin: '0 auto' }}>
					{userSingleResponseWithFeedback?.questionId?.options?.map((option: string, index: number) => (
						<Typography
							variant='body1'
							key={index}
							sx={{
								margin: '1rem 0 0 2rem',
								color: option === userSingleResponseWithFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
								fontWeight: 'bolder',
							}}>
							{String.fromCharCode(97 + index)}) {option}
						</Typography>
					))}
					<Box sx={{ width: '100%', margin: '2rem auto 1rem auto' }}>
						<Typography variant='h6' sx={{ mb: '0.5rem' }}>
							Your Answer
						</Typography>
						<Typography variant='body2'>
							{(() => {
								const userAnswerIndex = userSingleResponseWithFeedback?.questionId.options?.findIndex(
									(option: string) => option === userSingleResponseWithFeedback?.userAnswer
								);
								const choiceLabel = userAnswerIndex !== -1 ? `${String.fromCharCode(97 + userAnswerIndex)})` : '';
								return `${choiceLabel} ${userSingleResponseWithFeedback?.userAnswer}`;
							})()}
						</Typography>
					</Box>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.OPEN_ENDED && (
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Typography variant='h6' sx={{ mb: '0.5rem' }}>
						Your Answer
					</Typography>
					<Typography variant='body2'>{userSingleResponseWithFeedback.userAnswer}</Typography>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.TRUE_FALSE && (
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Box sx={{ marginBottom: '2rem' }}>
						<Typography variant='h6' sx={{ mb: '0.5rem' }}>
							Correct Answer
						</Typography>
						<Typography variant='body2'>{userSingleResponseWithFeedback?.questionId.correctAnswer}</Typography>
					</Box>
					<Typography variant='h6' sx={{ mb: '0.5rem' }}>
						Your Answer
					</Typography>
					<Typography variant='body2'>{userSingleResponseWithFeedback.userAnswer}</Typography>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.MATCHING && (
				<Box sx={{ width: '90%', margin: '0rem auto' }}>
					<MatchingPreview
						initialPairs={userSingleResponseWithFeedback?.questionId.matchingPairs}
						userMatchingPairsAfterSubmission={userSingleResponseWithFeedback?.userMatchingPairAnswers}
						questionId={userSingleResponseWithFeedback?.questionId}
						fromQuizQuestionUser={true}
						isLessonCompleted={true}
					/>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.FITB_DRAG_DROP && (
				<Box sx={{ width: '90%', margin: '0rem auto' }}>
					<FillInTheBlanksDragDrop
						textWithBlanks={userSingleResponseWithFeedback?.questionId.question}
						blankValuePairs={userSingleResponseWithFeedback?.questionId.blankValuePairs}
						userBlankValuePairsAfterSubmission={userSingleResponseWithFeedback?.userBlankValuePairAnswers}
						questionId={userSingleResponseWithFeedback?.questionId}
						fromQuizQuestionUser={true}
						isLessonCompleted={true}
					/>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.FITB_TYPING && (
				<Box sx={{ width: '90%', margin: '0rem auto' }}>
					<FillInTheBlanksTyping
						textWithBlanks={userSingleResponseWithFeedback?.questionId.question}
						blankValuePairs={userSingleResponseWithFeedback?.questionId.blankValuePairs}
						userBlankValuePairsAfterSubmission={userSingleResponseWithFeedback?.userBlankValuePairAnswers}
						questionId={userSingleResponseWithFeedback?.questionId}
						fromQuizQuestionUser={true}
						isLessonCompleted={true}
					/>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.AUDIO_VIDEO && (
				<Box sx={{ width: '90%', margin: '1rem auto' }}>
					<Typography variant='h6'>Your Recording</Typography>
					{userSingleResponseWithFeedback?.audioRecordUrl && (
						<audio
							src={userSingleResponseWithFeedback?.audioRecordUrl}
							controls
							style={{
								marginTop: '1rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								borderRadius: '0.35rem',
								width: '100%',
							}}
						/>
					)}
					{userSingleResponseWithFeedback?.videoRecordUrl && (
						<Box sx={{ display: 'flex', justifyContent: 'center', mb: '1rem', width: '100%' }}>
							<video
								src={userSingleResponseWithFeedback?.videoRecordUrl}
								controls
								style={{
									marginTop: '1rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									borderRadius: '0.35rem',
									width: '60%',
								}}
							/>
						</Box>
					)}
					{userSingleResponseWithFeedback?.teacherAudioFeedbackUrl && (
						<Box sx={{ mt: '3rem' }}>
							<Typography variant='h5'>Instructor's Audio Feedback for Question</Typography>
							<audio
								src={userSingleResponseWithFeedback?.teacherAudioFeedbackUrl}
								controls
								style={{
									marginTop: '1rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									borderRadius: '0.35rem',
									width: '100%',
								}}
							/>
						</Box>
					)}
				</Box>
			)}

			{userSingleResponseWithFeedback?.teacherFeedback && (
				<Box sx={{ width: '90%', margin: '1.5rem auto 3rem auto' }}>
					<Typography variant='h5' sx={{ mb: '1rem' }}>
						Instructor's Feedback for Question
					</Typography>
					<Typography variant='body2'>{userSingleResponseWithFeedback?.teacherFeedback}</Typography>
				</Box>
			)}
		</CustomDialog>
	);

	return (
		<DashboardPagesLayout pageName='Instructor Feedback' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-around', width: '90%', margin: '2rem' }}>
				{[
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
					<CustomInfoMessageAlignedRight message='Click on a question to view details and feedback (if available)' sx={{ marginRight: '2.5rem' }} />
				</Box>
				{userResponseData?.map((response: any, index: number) => (
					<QuestionResponseCard
						key={response._id}
						response={response}
						index={index}
						fetchQuestionTypeName={fetchQuestionTypeName}
						onCardClick={(response, index) => {
							setOpenQuestionFeedbackModal(true);
							setUserSingleResponseWithFeedback(response);
							setCurrentResponseIndex(index);
						}}
					/>
				))}
			</Box>

			{openQuestionFeedbackModal && (
				<>
					<IconButton
						onClick={() => handleResponseNavigation('prev')}
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
						onClick={() => handleResponseNavigation('next')}
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

			{renderFeedbackModal()}

			{quizFeedback && (
				<Box sx={{ width: '90%', margin: '2rem' }}>
					<Typography variant='h5' sx={{ mb: '1rem' }}>
						Instructor's Feedback for Quiz
					</Typography>
					<Typography variant='body2'>{quizFeedback}</Typography>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default SubmissionFeedbackDetails;
