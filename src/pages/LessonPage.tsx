import { useContext, useEffect, useState } from 'react';
import { Box, Button, IconButton, Link, Slide, Tooltip, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
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

export interface QuizQuestionAnswer {
	questionId: string;
	userAnswer: string;
	videoRecordUrl: string;
	audioRecordUrl: string;
}

const LessonPage = () => {
	const { lessonId, userId, courseId, userCourseId } = useParams();
	const { organisation } = useContext(OrganisationContext);
	const navigate = useNavigate();
	const { fetchUserAnswersByLesson } = useFetchUserQuestion();
	const { handleNextLesson, nextLessonId, isLessonCompleted, userLessonId } = useUserCourseLessonData();

	const [isQuestionsVisible, setIsQuestionsVisible] = useState(false);
	const [isLessonCourseCompletedModalOpen, setIsLessonCourseCompletedModalOpen] = useState(false);
	const [isQuizInProgress, setIsQuizInProgress] = useState(false);
	const [lessonType, setLessonType] = useState('');
	const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
	const [editorContent, setEditorContent] = useState('');
	const [userLessonNotes, setUserLessonNotes] = useState(editorContent);
	const [isUserLessonNotesUploading, setIsUserLessonNotesUploading] = useState(false);
	const [isNotesUpdated, setIsNotesUpdated] = useState(false);
	const [isQuestionsMapOpen, setIsQuestionsMapOpen] = useState(false);
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
	});
	const [userAnswers, setUserAnswers] = useState<UserQuestionData[]>([]);
	const [userQuizAnswers, setUserQuizAnswers] = useState<QuizQuestionAnswer[]>(() => {
		const savedAnswers = localStorage.getItem(`UserQuizAnswers-${lessonId}`);
		return savedAnswers ? JSON.parse(savedAnswers) : [];
	});

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
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
						questions: lessonData.questions.filter((q: QuestionInterface) => q !== null),
					});
					setLessonType(lessonData.type);

					const notesResponse = await axios.get(`${base_url}/userLessons/lesson/notes/${userLessonId}`);
					setUserLessonNotes(notesResponse.data.notes);
					setEditorContent(notesResponse.data.notes);

					const answers = await fetchUserAnswersByLesson(lessonId);
					if (lessonData.type === LessonType.QUIZ) {
						setUserQuizAnswers(
							answers.map((answer) => ({
								questionId: answer.questionId,
								userAnswer: answer.userAnswer,
								audioRecordUrl: answer.audioRecordUrl,
								videoRecordUrl: answer.videoRecordUrl,
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

	const updateUserLessonNotes = async () => {
		try {
			setIsUserLessonNotesUploading(true);
			const res = await axios.patch(`${base_url}/userlessons/${userLessonId}`, { notes: editorContent });
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
		if (!isNotesUpdated) {
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
				padding: '0 0 3rem 0',
			}}>
			<Box sx={{ width: '100vw', position: 'fixed', top: 0, zIndex: 10 }}>
				<DashboardHeader pageName={organisation?.orgName || ''} />
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					position: 'fixed',
					top: '4rem',
					width: '100%',
					backgroundColor: theme.bgColor?.secondary,
					zIndex: 10,
				}}>
				<Box sx={{ display: 'flex', justifyContent: !isInstructionalLesson && isQuestionsVisible ? 'space-between' : 'flex-end' }}>
					{!isInstructionalLesson && isQuestionsVisible && (
						<Box sx={{ alignSelf: 'flex-end' }}>
							<Button
								variant='text'
								startIcon={<KeyboardBackspaceOutlined />}
								sx={{
									color: theme.textColor?.primary,
									width: 'fit-content',
									margin: '0.75rem 0 0 0.25rem',
									textTransform: 'inherit',
									fontFamily: theme.fontFamily?.main,
									':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
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
								color: theme.textColor?.primary,
								width: 'fit-content',
								margin: '0.75rem 0 0 0.25rem',
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
							}}
							onClick={handleLessonNavigation}
							disabled={isQuizInProgress}>
							Course Home Page
						</Button>
					</Box>
				</Box>
				<Box sx={{ alignSelf: 'center' }}>
					<Typography variant='h3' sx={{ marginBottom: '1.5rem' }}>
						{lesson?.title}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ position: 'fixed', top: '11rem', left: '2rem', width: '80%', zIndex: 10 }}>
				<Tooltip title='Take Notes' placement='right'>
					<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
						<Article />
					</IconButton>
				</Tooltip>
				<Slide direction='right' in={isNotesDrawerOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
					<Box
						sx={{
							position: 'fixed',
							left: 0,
							top: '14rem',
							width: '40%',
							height: 'fit-content',
							boxShadow: 10,
							padding: '1.75rem',
							borderRadius: '0 0.35rem  0.35rem 0 ',
							bgcolor: 'background.paper',
							overflow: 'auto',
							zIndex: 10,
						}}>
						<Box sx={{ minHeight: '100%', width: '100%' }}>
							<Box sx={{ display: 'flex', flexDirection: 'column' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant='h6'>{lesson.title} Notes</Typography>
									<IconButton
										onClick={() => {
											setIsNotesDrawerOpen(false);
											setUserLessonNotes(editorContent);
										}}>
										<Close />
									</IconButton>
								</Box>
								<Box sx={{ mt: '0.5rem' }} id='editor-content'>
									<TinyMceEditor
										height='300'
										handleEditorChange={(content) => {
											setEditorContent(content);
											setIsNotesUpdated(false);
										}}
										initialValue={userLessonNotes}
									/>
								</Box>
								<Box sx={{ display: 'flex', mt: '1rem', justifyContent: 'space-between' }}>
									<Tooltip title='Download as PDF' placement='right'>
										<IconButton onClick={handleDownloadPDF}>
											<GetApp />
										</IconButton>
									</Tooltip>
									{!isUserLessonNotesUploading ? (
										<CustomSubmitButton size='small' onClick={updateUserLessonNotes}>
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
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '11rem 0 2rem 0', width: '100%', height: '22rem' }}>
						<Box sx={{ height: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
							<ReactPlayer url={lesson.videoUrl} width='55%' height='100%' style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)' }} controls />
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
						width: '85%',
						margin: lesson?.videoUrl ? '1rem 0' : '11rem 0 1rem 0',
					}}>
					<Box sx={{ width: '100%', marginBottom: '1rem' }}>
						<Typography variant='h5'>{!isInstructionalLesson ? 'Instructions' : ''}</Typography>
					</Box>
					<Box
						sx={{
							boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
							padding: '2rem',
							backgroundColor: theme.bgColor?.common,
							borderRadius: '0.35rem',
							width: '100%',
						}}>
						<Box className='rich-text-content'>
							<Typography
								variant='body1'
								component='div'
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.text) }}
								sx={{ lineHeight: 1.9, textAlign: 'justify' }}
							/>
						</Box>
					</Box>
				</Box>
			)}
			{!isInstructionalLesson && !isQuestionsVisible && (
				<Box sx={{ mt: '2rem' }}>
					<CustomSubmitButton
						onClick={() => {
							setIsQuestionsVisible(true);
							if (isQuiz && !isLessonCompleted) setIsQuizInProgress(true);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						capitalize={false}>
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
					/>
				</Box>
			)}
			{isQuiz && isQuestionsVisible && !isLessonCompleted && (
				<>
					<Box sx={{ position: 'fixed', top: '90vh', right: '2rem', transform: 'translateY(-50%)', zIndex: 1000 }}>
						<Tooltip title='Questions Map' placement='left'>
							<IconButton onClick={() => setIsQuestionsMapOpen(!isQuestionsMapOpen)}>
								<NotListedLocation fontSize='large' sx={{ color: '#00BFFF' }} />
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
						<Typography variant='h5'>Lesson Materials</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
						{lesson?.documents
							.filter((doc: Document) => doc !== null)
							.map((doc: Document) => (
								<Box sx={{ marginTop: '0.5rem' }} key={doc._id}>
									<Link href={doc?.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
										{doc?.name}
									</Link>
								</Box>
							))}
					</Box>
				</Box>
			)}
			{isInstructionalLesson && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '85%', marginTop: 'auto' }}>
					<CustomSubmitButton
						endIcon={!nextLessonId ? <DoneAll /> : <KeyboardDoubleArrowRight />}
						onClick={() => setIsLessonCourseCompletedModalOpen(true)}
						type='button'>
						{nextLessonId ? 'Next Lesson' : 'Complete Course'}
					</CustomSubmitButton>
					<CustomDialog
						openModal={isLessonCourseCompletedModalOpen}
						closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
						content={`You have completed this ${nextLessonId ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId ? 'lesson' : 'course'}.`}>
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
