import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useParams } from 'react-router-dom';
import { useContext, useState } from 'react';
import useQuestionTypes from '../hooks/useQuestionTypes';
import { useSubmissionFeedback } from '../hooks/useSubmissionFeedback';
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
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import QuestionMedia from '../components/userCourses/QuestionMedia';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { decode } from 'html-entities';
import CustomAudioPlayer from '../components/audio/CustomAudioPlayer';
import { calculateScorePercentage } from '../utils/calculateScorePercentage';
import InstructorFeedbackPanel from '../components/layouts/quizSubmissions/InstructorFeedbackPanel';
import QuizSubmissionSummaryBar from '../components/layouts/quizSubmissions/QuizSubmissionSummaryBar';

const SubmissionFeedbackDetails = () => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated, isMobilePortrait } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { userLessonId, submissionId } = useParams();
	const { fetchQuestionTypeName } = useQuestionTypes();
	const { data: feedbackData, isLoading } = useSubmissionFeedback(userLessonId, submissionId);

	const userResponseData = feedbackData?.response ?? [];
	const quizName = feedbackData?.lessonName ?? '';
	const chapterName = feedbackData?.chapterName ?? '';
	const courseName = feedbackData?.courseName ?? '';
	const quizFeedback = feedbackData?.teacherFeedback ?? '';
	const isChecked = feedbackData?.isChecked ?? false;
	const totalPossible = feedbackData?.totalPossible ?? 0;
	const showInitialLoading = isLoading && !feedbackData;

	const [userSingleResponseWithFeedback, setUserSingleResponseWithFeedback] = useState<any>(null);
	const [openQuestionFeedbackModal, setOpenQuestionFeedbackModal] = useState<boolean>(false);
	const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(0);

	const handleResponseNavigation = (direction: 'next' | 'prev') => {
		const newIndex = currentResponseIndex + (direction === 'next' ? 1 : -1);
		setOpenQuestionFeedbackModal(true);
		setCurrentResponseIndex(newIndex);
		setUserSingleResponseWithFeedback(userResponseData[newIndex]);
	};

	const renderFeedbackModal = () => (
		<CustomDialog
			openModal={openQuestionFeedbackModal}
			closeModal={() => setOpenQuestionFeedbackModal(false)}
			titleSx={{ paddingTop: '0.5rem' }}
			disableScrollLock>
			<Box sx={{ width: '90%', margin: '1rem auto' }}>
				<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.95rem' : undefined }}>
					Question ({fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId)})
				</Typography>

				<QuestionMedia question={userSingleResponseWithFeedback?.questionId} isStudentFeedbackPage={true} />

				{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) !== QuestionType.FITB_TYPING &&
					fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) !== QuestionType.FITB_DRAG_DROP && (
						<Typography
							variant={isMobileSize ? 'body2' : 'body1'}
							component='div'
							sx={{
								'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
								'lineHeight': 1.8,
								'& img': {
									maxWidth: '100%',
									height: 'auto',
									borderRadius: '0.25rem',
									margin: '0.5rem 0',
									boxShadow: '0 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.15)',
								},
							}}
							dangerouslySetInnerHTML={{ __html: sanitizeHtml(decode(userSingleResponseWithFeedback?.questionId.question)) }}
						/>
					)}
			</Box>

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.MULTIPLE_CHOICE && (
				<Box sx={{ width: '90%', margin: '0 auto' }}>
					{userSingleResponseWithFeedback?.questionId?.options?.map((option: string, index: number) => (
						<Typography
							variant='body2'
							key={index}
							sx={{
								margin: isMobileSize ? '0.5rem 0 0 1.5rem' : '1rem 0 0 2rem',
								color: option === userSingleResponseWithFeedback?.questionId.correctAnswer ? theme.textColor?.greenPrimary.main : null,
								fontWeight: 500,
								fontSize: isMobileSize ? '0.75rem' : undefined,
							}}>
							{String.fromCharCode(97 + index)}) {option}
						</Typography>
					))}
					<Box sx={{ width: '100%', margin: isMobileSize ? '1rem auto' : '2rem auto' }}>
						<Typography variant='h6' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.9rem' : undefined }}>
							Your Answer
						</Typography>
						<Typography
							variant='body2'
							sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							color={
								userSingleResponseWithFeedback?.userAnswer === userSingleResponseWithFeedback?.questionId.correctAnswer
									? theme.palette.success.main
									: '#ef5350'
							}>
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
				<Box sx={{ width: '90%', margin: isMobileSize ? '1rem auto' : '2rem auto' }}>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.9rem' : undefined }}>
						Your Answer
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{userSingleResponseWithFeedback.userAnswer}
					</Typography>
				</Box>
			)}

			{fetchQuestionTypeName(userSingleResponseWithFeedback?.questionId) === QuestionType.TRUE_FALSE && (
				<Box sx={{ width: '90%', margin: isMobileSize ? '1rem auto' : '2rem auto' }}>
					<Box sx={{ marginBottom: isMobileSize ? '1rem' : '2rem' }}>
						<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.9rem' : undefined }}>
							Correct Answer
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{userSingleResponseWithFeedback?.questionId.correctAnswer}
						</Typography>
					</Box>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.9rem' : undefined }}>
						Your Answer
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{userSingleResponseWithFeedback.userAnswer}
					</Typography>
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
				<Box sx={{ width: '90%', margin: isMobileSize ? '0 auto' : '1rem auto' }}>
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
				<Box sx={{ width: '90%', margin: isMobileSize ? '-1rem auto 1rem auto' : '1rem auto' }}>
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
				<Box sx={{ width: '90%', margin: isMobileSize ? '1rem auto' : '2rem auto' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }}>
						Your Recording
					</Typography>
					{userSingleResponseWithFeedback?.audioRecordUrl && (
						<CustomAudioPlayer
							audioUrl={userSingleResponseWithFeedback?.audioRecordUrl}
							sx={{
								marginTop: '1rem',
								width: '100%',
							}}
						/>
					)}
					{userSingleResponseWithFeedback?.videoRecordUrl && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								mb: '1rem',
								width: '100%',
							}}>
							<Box
								sx={{
									'display': 'flex',
									'flexDirection': 'column',
									'alignItems': 'center',
									'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									'borderRadius': '12px',
									'padding': isMobileSize ? '0.35rem' : '0.5rem',
									'boxShadow': '0 8px 20px rgba(0,0,0,0.1)',
									'backdropFilter': 'blur(10px)',
									'border': '1px solid rgba(255,255,255,0.1)',
									'position': 'relative',
									'overflow': 'hidden',
									'transition': 'all 0.3s ease',
									'width': isMobileSize ? '100%' : '60%',
									'maxWidth': isMobileSize ? '100%' : '600px',
									'marginTop': '1rem',
									'&:hover': {
										transform: 'translateY(-2px)',
										boxShadow: '0 12px 25px rgba(0,0,0,0.15)',
									},
									'&::before': {
										content: '""',
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										background: 'rgba(255,255,255,0.05)',
										borderRadius: '12px',
										zIndex: 0,
									},
								}}>
								<video
									src={userSingleResponseWithFeedback?.videoRecordUrl}
									controls
									style={{
										borderRadius: '8px',
										width: '100%',
										height: 'auto',
										maxHeight: isMobileSize ? '20rem' : '25rem',
										objectFit: 'contain',
										position: 'relative',
										zIndex: 1,
									}}
								/>
							</Box>
						</Box>
					)}
				</Box>
			)}

			{((userSingleResponseWithFeedback?.teacherFeedback &&
				userSingleResponseWithFeedback.teacherFeedback.trim() !== '') ||
				userSingleResponseWithFeedback?.teacherAudioFeedbackUrl) && (
					<Box sx={{ width: '90%', margin: '1.5rem auto 0 auto' }}>
						<InstructorFeedbackPanel
							title="Instructor's Feedback for Question"
							sx={{ mt: 1 }}
							titleFontSize={isMobileSize ? '0.85rem' : '0.9rem'}>
							{userSingleResponseWithFeedback?.teacherFeedback?.trim() && (
								<Typography
									variant='body2'
									sx={{
										fontSize: isMobileSize ? '0.75rem' : '0.825rem',
										lineHeight: 1.7,
										color: theme.textColor?.primary?.main,
									}}>
									{userSingleResponseWithFeedback.teacherFeedback}
								</Typography>
							)}
							{userSingleResponseWithFeedback?.teacherAudioFeedbackUrl && (
								<CustomAudioPlayer
									audioUrl={userSingleResponseWithFeedback.teacherAudioFeedbackUrl}
									sx={{
										marginTop: userSingleResponseWithFeedback?.teacherFeedback?.trim() ? '1.25rem' : 0,
										width: '100%',
									}}
								/>
							)}
						</InstructorFeedbackPanel>
					</Box>
				)}
			<CustomCancelButton
				sx={{ alignSelf: 'end', width: isMobileSize ? '20%' : '10%', margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0', padding: 0 }}
				onClick={() => setOpenQuestionFeedbackModal(false)}>
				Close
			</CustomCancelButton>
		</CustomDialog>
	);

	return (
		<DashboardPagesLayout pageName='Instructor Feedback' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{showInitialLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '12rem', width: '100%' }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					<Box sx={{ width: '90%', margin: isMobileSize ? '1rem 0' : '2rem' }}>
						<QuizSubmissionSummaryBar
							quizName={quizName}
							chapterName={chapterName}
							courseName={courseName}
							isChecked={isChecked}
							compact={isMobileSizeSmall}
						/>
					</Box>

					<Box sx={{ width: '90%', margin: isMobileSize ? '0.5rem' : '1rem' }}>
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
								{totalPossible > 0 &&
									(() => {
										const totalEarned =
											userResponseData?.reduce((sum: number, response: any) => {
												return sum + (response.pointsEarned !== undefined && response.pointsEarned !== null ? response.pointsEarned : 0);
											}, 0) || 0;
										const percentage = calculateScorePercentage(totalEarned, totalPossible);
										return (
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
														display={isMobilePortrait ? 'none' : ''}
														sx={{
															fontSize: isMobileSize ? '0.6rem' : '0.7rem',
															color: '#ffff',
															ml: '0.25rem',
														}}>
														- ({percentage}%)
													</Typography>
												)}
											</Box>
										);
									})()}
							</Box>
							<CustomInfoMessageAlignedRight
								message={isVerySmallScreen ? 'Click on a question to view details' : 'Click on a question to view details and feedback (if available)'}
								sx={{ marginRight: isMobileSize ? '0.85rem' : '2.5rem' }}
							/>
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
								onClick={() => handleResponseNavigation('next')}
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

					{renderFeedbackModal()}

					{quizFeedback && (
						<Box sx={{ width: '90%', margin: isMobileSize ? '1rem 0' : '2rem' }}>
							<InstructorFeedbackPanel title="Instructor's Feedback for Quiz" titleFontSize={isMobileSize ? '0.9rem' : '1rem'}>
								<Typography
									variant='body2'
									sx={{
										fontSize: isMobileSize ? '0.8rem' : '0.9rem',
										lineHeight: 1.7,
										color: theme.textColor?.primary?.main,
									}}>
									{quizFeedback}
								</Typography>
							</InstructorFeedbackPanel>
						</Box>
					)}
				</>
			)}
		</DashboardPagesLayout>
	);
};

export default SubmissionFeedbackDetails;
