import { useContext, useEffect, useState } from 'react';
import { Box, Button, IconButton, Link, Slide, Tooltip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Article, Close, DoneAll, GetApp, Home, KeyboardBackspaceOutlined, KeyboardDoubleArrowRight, NotListedLocation } from '@mui/icons-material';
import theme from '../themes';
import DashboardHeader from '../components/layouts/dashboardLayout/DashboardHeader';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { Document } from '../interfaces/document';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import Questions from '../components/userCourses/Questions';
import { useUserCourseLessonData } from '../hooks/useUserCourseLessonData';
import { useFetchUserQuestion, UserQuestionData } from '../hooks/useFetchUserQuestion';
import { LessonType } from '../interfaces/enums';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { Lesson } from '../interfaces/lessons';
import TinyMceEditor from '../components/richTextEditor/TinyMceEditor';
import LoadingButton from '@mui/lab/LoadingButton';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import QuizQuestionsMap from '../components/userCourses/QuizQuestionsMap';
import { QuestionInterface } from '../interfaces/question';
import { UserBlankValuePairAnswers, UserMatchingPairAnswers } from '../interfaces/userQuestion';
import { useNavigate } from 'react-router-dom';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

export interface QuizQuestionAnswer {
	questionId: string;
	userAnswer: string;
	videoRecordUrl: string;
	audioRecordUrl: string;
	teacherFeedback: string;
	teacherAudioFeedbackUrl: string;
	userMatchingPairAnswers: UserMatchingPairAnswers[];
	userBlankValuePairAnswers: UserBlankValuePairAnswers[];
}

const LessonPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { lessonId, userId, courseId, userCourseId } = useParams();
	const { organisation } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const navigate = useNavigate();
	const { fetchUserAnswersByLesson } = useFetchUserQuestion();
	const { handleNextLesson, nextLessonId, isLessonCompleted, userLessonId } = useUserCourseLessonData();

	const [isQuestionsVisible, setIsQuestionsVisible] = useState<boolean>(false);
	const [isLessonCourseCompletedModalOpen, setIsLessonCourseCompletedModalOpen] = useState<boolean>(false);
	const [isQuizInProgress, setIsQuizInProgress] = useState<boolean>(false);
	const [lessonType, setLessonType] = useState<string>('');
	const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState<boolean>(false);
	const [editorContent, setEditorContent] = useState<string>('');
	const [userLessonNotes, setUserLessonNotes] = useState<string>(editorContent);
	const [isUserLessonNotesUploading, setIsUserLessonNotesUploading] = useState<boolean>(false);
	const [isNotesUpdated, setIsNotesUpdated] = useState<boolean>(false);
	const [isQuestionsMapOpen, setIsQuestionsMapOpen] = useState<boolean>(false);

	const [lesson, setLesson] = useState<Lesson>({
		_id: '',
		title: '',
		type: '',
		imageUrl: '',
		videoUrl: '',
		isActive: true,
		createdAt: '',
		updatedAt: '',
		text: '',
		orgId: '',
		questionIds: [],
		questions: [],
		documentIds: [],
		documents: [],
		clonedFromId: '',
		usedInCourses: [],
	});

	const [userAnswers, setUserAnswers] = useState<UserQuestionData[]>([]); //User answers for practice questions

	const [userQuizAnswers, setUserQuizAnswers] = useState<QuizQuestionAnswer[]>(() => {
		const savedAnswers = localStorage.getItem(`UserQuizAnswers-${lessonId}`);
		return savedAnswers ? JSON.parse(savedAnswers) : [];
	});

	const [teacherQuizFeedback, setTeacherQuizFeedback] = useState<string | undefined>('');

	const isQuiz = lessonType === LessonType.QUIZ;
	const isInstructionalLesson = lessonType === LessonType.INSTRUCTIONAL_LESSON;

	useEffect(() => {
		const fetchData = async () => {
			if (lessonId) {
				try {
					const lessonResponse = await axios.get(`${base_url}/lessons/${lessonId}`);
					const lessonData = lessonResponse.data;

					setLesson({
						...lessonData,
						questions: lessonData.questions?.filter((q: QuestionInterface) => q !== null),
					});
					setLessonType(lessonData.type);

					const userLessonResponse = await axios.get(`${base_url}/userlessons/${userLessonId}`);
					setUserLessonNotes(userLessonResponse.data.data[0].notes);
					setEditorContent(userLessonResponse.data.data[0].notes);

					setTeacherQuizFeedback(userLessonResponse.data.data[0].teacherFeedback);

					const answers = await fetchUserAnswersByLesson(lessonId);
					if (lessonData.type === LessonType.QUIZ) {
						setUserQuizAnswers(
							answers?.map((answer) => ({
								questionId: answer.questionId,
								userAnswer: answer.userAnswer,
								audioRecordUrl: answer.audioRecordUrl,
								videoRecordUrl: answer.videoRecordUrl,
								teacherFeedback: answer.teacherFeedback,
								teacherAudioFeedbackUrl: answer.teacherAudioFeedbackUrl,
								userMatchingPairAnswers: answer.userMatchingPairAnswers,
								userBlankValuePairAnswers: answer.userBlankValuePairAnswers,
							}))
						);
					} else {
						setUserAnswers(answers);
					}
				} catch (error) {
					console.log('Error fetching user answers:', error);
				}
			}
		};
		fetchData();

		if (isQuiz && !isLessonCompleted) {
			const savedQuizAnswers = localStorage.getItem(`UserQuizAnswers-${lessonId}`);
			if (savedQuizAnswers) {
				setUserQuizAnswers(JSON.parse(savedQuizAnswers));
				setIsQuizInProgress(true);
			}
		}

		if (isQuiz && !isLessonCompleted && userQuizAnswers.length !== 0) {
			setIsQuizInProgress(true);
		}
	}, [lessonId]);

	useEffect(() => {
		if (isQuiz && !isLessonCompleted) {
			localStorage.setItem(`UserQuizAnswers-${lessonId}`, JSON.stringify(userQuizAnswers));
		}
	}, [userQuizAnswers]);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (isQuiz && isQuizInProgress) {
				event.preventDefault();
				//@ts-ignore
				event.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [isQuiz, isQuizInProgress]);

	const updateUserLessonNotes = async () => {
		try {
			setIsUserLessonNotesUploading(true);
			const res = await axios.patch(`${base_url}/userlessons/${userLessonId}`, { notes: editorContent?.trim() });
			setUserLessonNotes(res.data.data.notes);
		} catch (error) {
			console.log(error);
		} finally {
			setIsUserLessonNotesUploading(false);
			setIsNotesUpdated(true);
		}
	};

	const handleDownloadPDF = async () => {
		const tempDiv = document.createElement('div');
		tempDiv.style.position = 'absolute';
		tempDiv.style.left = '-9999px';
		tempDiv.style.top = '-9999px';
		tempDiv.style.width = '210mm';
		tempDiv.style.padding = '1.25rem';
		tempDiv.style.fontFamily = 'Arial, sans-serif';

		tempDiv.innerHTML = `
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        ul, ol {
          margin-left: 1.25rem;
        }
        li {
          margin-bottom: 0.5rem;
        }
      </style>
      ${editorContent}
    `;
		document.body.appendChild(tempDiv);

		const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
		const imgData = canvas.toDataURL('image/png');
		const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
		pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
		pdf.save(`${lesson.title}_Notes.pdf`);

		document.body.removeChild(tempDiv);
	};

	const handleLessonNavigation = () => {
		navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (isNotesUpdated) {
			updateUserLessonNotes();
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				alignItems: 'center',
				backgroundColor: theme.bgColor?.secondary,
				minHeight: '100vh',
				padding: isMobileSize ? '0 0 1rem 0' : '0 0 3rem 0',
				position: 'relative',
			}}>
			<Box sx={{ position: 'absolute', bottom: 3, paddingTop: '1rem' }}>
				<Typography sx={{ fontSize: isSmallScreen ? '0.55rem' : '0.65rem' }}>
					&copy; 2025 Webnexia Software Solutions Ltd. All rights reserved.
				</Typography>
			</Box>
			<Box sx={{ width: '100vw', position: 'fixed', top: 0, zIndex: 1000 }}>
				<DashboardHeader pageName={organisation?.orgName || ''} />
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					position: 'fixed',
					top: '3.5rem',
					width: '100%',
					backgroundColor: theme.bgColor?.secondary,
					zIndex: 3,
				}}>
				<Box sx={{ display: 'flex', justifyContent: !isInstructionalLesson && isQuestionsVisible ? 'space-between' : 'flex-end' }}>
					{!isInstructionalLesson && isQuestionsVisible && (
						<Box sx={{ alignSelf: 'flex-end' }}>
							<Button
								variant='text'
								startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
								sx={{
									'color': theme.textColor?.primary,
									'width': 'fit-content',
									'margin': '0.75rem 0 0 0.25rem',
									'textTransform': 'inherit',
									'fontFamily': theme.fontFamily?.main,
									':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
									'fontSize': isMobileSize ? '0.7rem' : '1rem',
								}}
								onClick={() => {
									setIsQuestionsVisible(false);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}>
								Lesson Instructions
							</Button>
						</Box>
					)}
					<Box>
						<Button
							variant='text'
							startIcon={<Home />}
							sx={{
								'fontSize': isMobileSize ? '0.7rem' : '1rem',
								'color': theme.textColor?.primary,
								'width': 'fit-content',
								'margin': '0.75rem 0 0 0.25rem',
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
							}}
							onClick={handleLessonNavigation}
							disabled={isQuizInProgress}>
							Course Home Page
						</Button>
					</Box>
				</Box>
				<Box sx={{ alignSelf: 'center' }}>
					<Typography
						variant={isMobileSize ? 'h6' : 'h3'}
						sx={{ marginBottom: isMobileSize ? '0.5rem' : '1rem', fontSize: isMobileSize ? '0.9rem' : undefined, mt: '0.5rem' }}>
						{lesson?.title}
					</Typography>
				</Box>
			</Box>
			<Box
				sx={{
					position: 'fixed',
					top: isMobileSize ? '9rem' : '11rem',
					left: isSmallScreen ? '0.15rem' : isRotatedMedium ? '1rem' : '2rem',
					width: '80%',
					zIndex: 3,
				}}>
				<Tooltip title='Take Notes' placement='right'>
					<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
						<Article fontSize={isMobileSize ? 'small' : 'medium'} />
					</IconButton>
				</Tooltip>
				<Slide direction='right' in={isNotesDrawerOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
					<Box
						sx={{
							position: 'fixed',
							left: 0,
							top: isMobileSize ? '11rem' : '14rem',
							width: isVerySmallScreen ? '95%' : isRotatedMedium ? '60%' : '40%',
							height: isRotatedMedium ? '50vh' : 'fit-content',
							boxShadow: 10,
							padding: '1.5rem 1.5rem 1rem 1.5rem',
							borderRadius: '0 0.35rem  0.35rem 0 ',
							bgcolor: 'background.paper',
							overflow: 'auto',
							zIndex: 3,
						}}>
						<Box sx={{ minHeight: '100%', width: '100%' }}>
							<Box sx={{ display: 'flex', flexDirection: 'column' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }}>
										{lesson.title} Notes
									</Typography>
									<IconButton
										onClick={() => {
											setIsNotesDrawerOpen(false);
											setUserLessonNotes(editorContent);
										}}
										sx={{ padding: isMobileSize ? '0.5rem' : undefined }}>
										<Close sx={{ fontSize: isMobileSize ? '1.1rem' : '1.25rem' }} />
									</IconButton>
								</Box>
								<Box sx={{ mt: '0.5rem' }} id='editor-content'>
									<TinyMceEditor
										height='300'
										handleEditorChange={(content) => {
											setEditorContent(content);
											setIsNotesUpdated(true);
										}}
										initialValue={userLessonNotes}
									/>
								</Box>
								<Box sx={{ display: 'flex', mt: '1rem', justifyContent: 'space-between' }}>
									<Tooltip title='Download as PDF' placement='right'>
										<IconButton onClick={handleDownloadPDF} sx={{ padding: isMobileSize ? '0.5rem' : undefined }}>
											<GetApp sx={{ fontSize: isMobileSize ? '1.15rem' : '1.25rem' }} />
										</IconButton>
									</Tooltip>
									{!isUserLessonNotesUploading ? (
										<CustomSubmitButton
											size='small'
											onClick={updateUserLessonNotes}
											sx={{ height: '1.75rem', fontSize: isMobileSize ? '0.75rem' : undefined }}>
											Save
										</CustomSubmitButton>
									) : (
										<LoadingButton loading variant='outlined' size='small' sx={{ textTransform: 'capitalize' }}>
											Upload
										</LoadingButton>
									)}
								</Box>
							</Box>
						</Box>
					</Box>
				</Slide>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0 0 0', width: '100%' }}>
				{lesson?.videoUrl && !isQuestionsVisible && (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							margin: isMobileSize ? '8.5rem 0 1rem 0' : '11rem 0 2rem 0',
							width: '100%',
							height: '22rem',
						}}>
						<Box
							sx={{
								height: '100%',
								flex: 1,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'flex-start',
								ml: isSmallScreen ? '1rem' : '0rem',
							}}>
							<ReactPlayer
								url={lesson.videoUrl}
								width={isSmallScreen ? '80%' : isRotatedMedium ? '75%' : '55%'}
								height='100%'
								style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)' }}
								controls
							/>
						</Box>
					</Box>
				)}
			</Box>
			{lesson?.text && !isQuestionsVisible && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'center',
						width: isVerySmallScreen ? '80%' : '85%',
						margin: lesson?.videoUrl ? '1rem 0' : isSmallScreen ? '8.75rem 0 1rem 0' : isRotatedMedium ? '8.5rem 0 1rem 0' : '11rem 0 1rem 0',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							alignItems: 'center',
							width: '100%',
						}}>
						{!isMobileSizeSmall && (
							<Box sx={{ width: '100%', marginBottom: '1rem' }}>
								<Typography variant='h5' sx={{ fontSize: isRotatedMedium || isSmallScreen ? '0.85rem' : undefined }}>
									{!isInstructionalLesson ? 'Instructions' : ''}
								</Typography>
							</Box>
						)}
						<Box
							sx={{
								boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
								padding: isMobileSize ? '0.75rem' : '2rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.35rem',
								width: '100%',
								mt: isMobileSizeSmall ? '0.85rem' : '',
								ml: isMobileSizeSmall ? '1rem' : '',
							}}>
							<Box className='rich-text-content'>
								<Typography
									component='div'
									dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.text) }}
									sx={{ lineHeight: 1.9, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
								/>
							</Box>
						</Box>
					</Box>
					{isQuiz && teacherQuizFeedback && (
						<>
							<Box sx={{ width: '100%', mt: '2rem' }}>
								<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }}>
									Instructor's Feedback for Quiz
								</Typography>
							</Box>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									width: '100%',
									mt: '1rem',
									boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
									borderRadius: '0.35rem',
									padding: '2rem',
								}}>
								<Box>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{teacherQuizFeedback}
									</Typography>
								</Box>
							</Box>
						</>
					)}
				</Box>
			)}
			{!isInstructionalLesson && !isQuestionsVisible && (
				<Box sx={{ mt: isMobileSize ? '1rem' : '2rem' }}>
					<CustomSubmitButton
						onClick={() => {
							setIsQuestionsVisible(true);
							if (isQuiz && !isLessonCompleted) setIsQuizInProgress(true);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						capitalize={false}
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{lessonType === LessonType.PRACTICE_LESSON
							? 'Go to Questions'
							: isQuiz && !isLessonCompleted && isQuizInProgress
							? 'Resume'
							: isQuiz && !isLessonCompleted
							? 'Start Quiz'
							: 'Review Quiz'}
					</CustomSubmitButton>
				</Box>
			)}
			{isQuestionsVisible && (
				<Box sx={{ width: '80%' }}>
					<Questions
						questions={lesson?.questions}
						lessonType={lessonType}
						userAnswers={userAnswers}
						setUserAnswers={setUserAnswers}
						setIsQuizInProgress={setIsQuizInProgress}
						userQuizAnswers={userQuizAnswers}
						setUserQuizAnswers={setUserQuizAnswers}
						lessonName={lesson.title}
					/>
				</Box>
			)}
			{isQuiz && isQuestionsVisible && !isLessonCompleted && (
				<>
					<Box sx={{ position: 'fixed', top: '90vh', right: isMobileSize ? '0.5rem' : '2rem', transform: 'translateY(-50%)', zIndex: 10 }}>
						<Tooltip title='Questions Map' placement='left'>
							<IconButton onClick={() => setIsQuestionsMapOpen(!isQuestionsMapOpen)}>
								<NotListedLocation fontSize={isMobileSize ? 'medium' : 'large'} sx={{ color: '#00BFFF' }} />
							</IconButton>
						</Tooltip>
					</Box>
					<QuizQuestionsMap
						questions={lesson?.questions}
						userQuizAnswers={userQuizAnswers}
						isOpen={isQuestionsMapOpen}
						setIsOpen={setIsQuestionsMapOpen}
					/>
				</>
			)}
			{lesson?.documents.length !== 0 && !isQuestionsVisible && (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem', width: '85%' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start' }}>
						<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }}>
							Lesson Materials
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
						{lesson?.documents
							?.filter((doc: Document) => doc !== null)
							?.map((doc: Document) => (
								<Box sx={{ marginTop: '0.5rem' }} key={doc._id}>
									<Link
										href={doc?.documentUrl}
										target='_blank'
										variant='body2'
										rel='noopener noreferrer'
										sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
										{doc?.name}
									</Link>
								</Box>
							))}
					</Box>
				</Box>
			)}

			{isInstructionalLesson && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: isMobileSize ? '80%' : '85%', marginTop: 'auto', mb: '1rem' }}>
					<CustomSubmitButton
						endIcon={!nextLessonId ? <DoneAll /> : <KeyboardDoubleArrowRight />}
						onClick={() => setIsLessonCourseCompletedModalOpen(true)}
						type='button'
						sx={{ marginTop: lesson.documents.length === 0 ? '1rem' : '0rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{nextLessonId ? 'Next Lesson' : 'Complete Course'}
					</CustomSubmitButton>
					<CustomDialog
						openModal={isLessonCourseCompletedModalOpen}
						closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
						content={`You have completed this ${nextLessonId ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId ? 'lesson' : 'course'}.`}
						maxWidth='sm'>
						<CustomDialogActions
							onCancel={() => setIsLessonCourseCompletedModalOpen(false)}
							onSubmit={async () => {
								await handleNextLesson();
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							submitBtnText='OK'
						/>
					</CustomDialog>
				</Box>
			)}
		</Box>
	);
};

export default LessonPage;
