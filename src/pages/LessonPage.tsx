import { useContext, useEffect, useState, useMemo } from 'react';
import { Box, Button, DialogContent, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import {
	Article,
	Close,
	DoneAll,
	GetApp,
	Home,
	KeyboardBackspaceOutlined,
	KeyboardDoubleArrowRight,
	NotListedLocation,
	VolumeOff,
	VolumeUp,
} from '@mui/icons-material';
import theme from '../themes';
import DashboardHeader from '../components/layouts/dashboardLayout/DashboardHeader';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { sanitizeHtml } from '../utils/sanitizeHtml';
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
import { decode } from 'html-entities';
import UniversalVideoPlayer from '../components/video/UniversalVideoPlayer';
import DocumentViewer from '../components/documents/DocumentViewer';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import { truncateText } from '@utils/utilText';
import useQuestionTypes from '../hooks/useQuestionTypes';
import { QuestionType } from '../interfaces/enums';
import { calculateQuizTotalScore } from '../utils/calculateQuizTotalScore';
import { calculateScorePercentage } from '../utils/calculateScorePercentage';

export interface QuizQuestionAnswer {
	questionId: string;
	userAnswer: string;
	videoRecordUrl: string;
	audioRecordUrl: string;
	teacherFeedback: string;
	teacherAudioFeedbackUrl: string;
	userMatchingPairAnswers: UserMatchingPairAnswers[];
	userBlankValuePairAnswers: UserBlankValuePairAnswers[];
	pointsEarned?: number;
	pointsPossible?: number;
	isAutoGraded?: boolean;
	partialScores?: { [key: string]: number };
}

const LessonPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { lessonId, courseId, userCourseId } = useParams();
	const { organisation } = useContext(OrganisationContext);
	const {
		isSmallScreen,
		isRotatedMedium,
		isRotated,
		isVerySmallScreen,
		isSmallMobilePortrait,
		isSmallMobileLandscape,
		isMobilePortrait,
		isMobileLandscape,
		isTabletLandscape,
		isTabletPortrait,
	} = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const navigate = useNavigate();
	const { fetchUserAnswersByLesson } = useFetchUserQuestion();
	const { handleNextLesson, nextLessonId, isLessonCompleted, userLessonId } = useUserCourseLessonData();
	const { singleCourseUser } = useContext(UserCourseLessonDataContext);

	// Check if there are more lessons in the course (in any chapter)
	const hasMoreLessonsInCourse = useMemo(() => {
		if (!singleCourseUser || !lessonId) return false;

		// Find current lesson's position
		for (const chapter of singleCourseUser.chapters || []) {
			if (!chapter || !chapter.lessons) continue;
			for (const lesson of chapter.lessons) {
				if (!lesson) continue;
				if (lesson._id === lessonId) {
					// Check if there are more lessons after this one in any chapter
					const currentChapterIndex = singleCourseUser.chapters.indexOf(chapter);
					const currentLessonIndex = chapter.lessons.indexOf(lesson);

					// Check if there are more lessons in current chapter
					if (currentLessonIndex < chapter.lessons.length - 1) {
						return true;
					}

					// Check if there are more chapters with lessons
					for (let i = currentChapterIndex + 1; i < singleCourseUser.chapters.length; i++) {
						const nextChapter = singleCourseUser.chapters[i];
						if (nextChapter && nextChapter.lessons && nextChapter.lessons.length > 0) {
							return true;
						}
					}
					return false;
				}
			}
		}
		return false;
	}, [singleCourseUser, lessonId]);

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
	const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
	const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(0);

	const { fetchQuestionTypeName } = useQuestionTypes();

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
		clonedFromTitle: '',
		usedInCourses: [],
		createdBy: '',
		updatedBy: '',
		publishedAt: '',
		createdByName: '',
		updatedByName: '',
		createdByImageUrl: '',
		updatedByImageUrl: '',
		createdByRole: '',
		updatedByRole: '',
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
						questions: lessonData.questions?.filter((q: QuestionInterface) => q !== null) || [],
					});
					setLessonType(lessonData.type);

					// Only fetch user lesson data if userLessonId exists
					if (userLessonId) {
						try {
							const userLessonResponse = await axios.get(`${base_url}/userlessons/${userLessonId}`);
							if (userLessonResponse.data.data && userLessonResponse.data.data[0]) {
								setUserLessonNotes(userLessonResponse.data.data[0].notes);
								setEditorContent(userLessonResponse.data.data[0].notes);
								setTeacherQuizFeedback(userLessonResponse.data.data[0].teacherFeedback);
							}
						} catch (error) {
							console.log('Error fetching user lesson data:', error);
						}
					}

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
								pointsEarned: answer.pointsEarned,
								pointsPossible: answer.pointsPossible,
								isAutoGraded: answer.isAutoGraded,
								partialScores: answer.partialScores,
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

		if (isQuiz && !isLessonCompleted && userQuizAnswers && userQuizAnswers.length !== 0) {
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
		if (!userLessonId) {
			console.error('Cannot update notes: userLessonId is undefined');
			return;
		}
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
		navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
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
					&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. All rights reserved.
				</Typography>
			</Box>
			<Box sx={{ width: '100vw', position: 'fixed', top: 0, zIndex: 1000 }}>
				<DashboardHeader pageName={organisation?.orgName || ''} />
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					position: 'fixed',
					top: isMobileSize ? '3rem' : '3.5rem',
					width: '100%',
					backgroundColor: theme.bgColor?.secondary,
					zIndex: 3,
					height: isMobileSize ? '2.5rem' : '3rem',
					mt: isSmallMobileLandscape || isMobileLandscape || isTabletPortrait ? '0.75rem' : '0.5rem',
					boxShadow: '0 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)',
				}}>
				<Box sx={{ flex: 1, justifyContent: 'flex-start' }}>
					<Button
						variant='text'
						startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
						sx={{
							'display': !isInstructionalLesson && isQuestionsVisible ? 'flex' : 'none',
							'color': theme.textColor?.primary,
							'width': 'fit-content',
							'textTransform': 'inherit',
							'fontFamily': theme.fontFamily?.main,
							':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
							'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
						}}
						onClick={() => {
							setIsQuestionsVisible(false);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}>
						{isMobileSize ? '' : 'Lesson Instructions'}
					</Button>
				</Box>

				{isQuestionsVisible && !lesson.isGraded && (
					<Box
						sx={{
							flex: 6,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						{lessonType === LessonType.PRACTICE_LESSON && (
							<Tooltip title={isSoundMuted ? 'Unmute' : 'Mute'} placement='left' arrow>
								<IconButton onClick={() => setIsSoundMuted(!isSoundMuted)}>
									{isSoundMuted ? (
										<VolumeOff fontSize={isMobileSize ? 'small' : 'medium'} />
									) : (
										<VolumeUp fontSize={isMobileSize ? 'small' : 'medium'} />
									)}
								</IconButton>
							</Tooltip>
						)}
						<Tooltip title='Take Notes' placement='right' arrow>
							<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
								<Article fontSize={isMobileSize ? 'small' : 'medium'} />
							</IconButton>
						</Tooltip>
					</Box>
				)}

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						textAlign: 'center',
						alignItems: 'center',
					}}>
					{isQuestionsVisible && lesson.isGraded && lesson.type === LessonType.QUIZ ? (
						(() => {
							// displayedQuestionNumber is 1-indexed, convert to 0-indexed for array access
							const questionIndex = currentQuestionNumber > 0 ? currentQuestionNumber - 1 : 0;
							const filteredQuestions = lesson.questions?.filter((q) => q !== null && q !== undefined) || [];
							const currentQuestion = filteredQuestions[questionIndex];
							if (!currentQuestion) return null;
							const questionId = currentQuestion._id;
							const questionScores = lesson.questionScores || {};
							const scoreConfig = questionScores[questionId];
							if (!scoreConfig) return null;

							const questionTypeName = fetchQuestionTypeName(currentQuestion);
							let pointsPossible = 0;
							let perItemScore: number | undefined = undefined;

							if (
								questionTypeName === QuestionType.FITB_TYPING ||
								questionTypeName === QuestionType.FITB_DRAG_DROP ||
								questionTypeName === QuestionType.MATCHING
							) {
								const scoreObj = typeof scoreConfig === 'object' ? scoreConfig : { total: scoreConfig };
								pointsPossible = scoreObj.total || 0;
								if (questionTypeName === QuestionType.FITB_TYPING || questionTypeName === QuestionType.FITB_DRAG_DROP) {
									perItemScore = scoreObj.perBlank;
								} else if (questionTypeName === QuestionType.MATCHING) {
									perItemScore = scoreObj.perMatch;
								}
							} else {
								pointsPossible = typeof scoreConfig === 'number' ? scoreConfig : 0;
							}

							// Get user's earned score for this question
							const userAnswer = userQuizAnswers?.find((data) => data.questionId === questionId);
							const pointsEarned = userAnswer?.pointsEarned;
							const isOpenEndedOrAudioVideo = questionTypeName === QuestionType.OPEN_ENDED || questionTypeName === QuestionType.AUDIO_VIDEO;

							return pointsPossible > 0 ? (
								<Box
									sx={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.25rem',
										backgroundColor: theme.palette.primary.main,
										color: 'white',
										padding: isMobileSize ? '0.4rem 0.75rem' : '0.35rem 1rem',
										borderRadius: '1.5rem',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										fontWeight: 600,
										fontFamily: theme.fontFamily?.main || 'Poppins, sans-serif',
										boxShadow: '0 2px 8px rgba(1, 67, 90, 0.25)',
										whiteSpace: 'nowrap',
									}}>
									<Typography
										component='span'
										sx={{
											fontSize: 'inherit',
											fontWeight: 'inherit',
											color: 'inherit',
										}}>
										{isLessonCompleted && pointsEarned !== undefined && pointsEarned !== null
											? isOpenEndedOrAudioVideo && pointsEarned === 0
												? `- / ${pointsPossible} pts`
												: `${pointsEarned} / ${pointsPossible} pts`
											: `${pointsPossible} pts`}
									</Typography>
									{perItemScore !== undefined && perItemScore !== null && !isLessonCompleted && (
										<Typography
											component='span'
											sx={{
												fontSize: 'inherit',
												fontWeight: 500,
												color: 'rgba(255, 255, 255, 0.9)',
												opacity: 0.9,
											}}>
											({perItemScore} each)
										</Typography>
									)}
								</Box>
							) : null;
						})()
					) : (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
							{!isQuestionsVisible && (
								<Typography
									variant={isMobileSize ? 'h6' : 'h3'}
									sx={{
										fontSize: isMobileSize ? (lesson?.title?.length > 30 ? '0.7rem' : '0.85rem') : '1.25rem',
									}}>
									{truncateText(lesson?.title, isSmallMobilePortrait ? 30 : lesson?.title?.length || 0)}
								</Typography>
							)}
							{lesson.isGraded &&
								lesson.type === LessonType.QUIZ &&
								(() => {
									const totalPossible = calculateQuizTotalScore({ lesson, fetchQuestionTypeName });
									// Calculate user's total earned score
									const totalEarned =
										userQuizAnswers?.reduce((sum, answer) => {
											return sum + (answer.pointsEarned || 0);
										}, 0) || 0;
									const percentage = isLessonCompleted && totalEarned > 0 ? calculateScorePercentage(totalEarned, totalPossible) : null;
									return totalPossible > 0 ? (
										<Box
											sx={{
												display: 'inline-flex',
												alignItems: 'center',
												backgroundColor: theme.palette.primary.main,
												color: 'white',
												padding: isMobileSize ? '0.4rem 0.75rem' : '0.35rem 1rem',
												borderRadius: '1.5rem',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												fontWeight: 600,
												fontFamily: theme.fontFamily?.main || 'Poppins, sans-serif',
												boxShadow: '0 2px 8px rgba(1, 67, 90, 0.25)',
												whiteSpace: 'nowrap',
												ml: '0.5rem',
											}}>
											{isLessonCompleted && totalEarned > 0 ? `${totalEarned}/${totalPossible} pts` : `${totalPossible} pts`}
											{percentage !== null && (
												<Typography
													component='span'
													display={isMobilePortrait ? 'none' : ''}
													sx={{
														fontSize: isMobileSize ? '0.65rem' : '0.75rem',
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
					)}
				</Box>
				<Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
					{lesson.isGraded && lesson.type === LessonType.QUIZ && isQuestionsVisible && (
						<Tooltip title='Take Notes' placement='left' arrow>
							<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
								<Article fontSize={isMobileSize ? 'small' : 'medium'} />
							</IconButton>
						</Tooltip>
					)}
					<Button
						variant='text'
						endIcon={<Home fontSize='small' />}
						sx={{
							'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
							'color': theme.textColor?.primary,
							'width': 'fit-content',
							'textTransform': 'inherit',
							'fontFamily': theme.fontFamily?.main,
							':hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
						}}
						onClick={handleLessonNavigation}
						disabled={isQuizInProgress}>
						{isMobileSize ? '' : 'Course Home Page'}
					</Button>
				</Box>
			</Box>

			<Box
				sx={{
					position: 'fixed',
					top: isSmallMobilePortrait ? '6.5rem' : isSmallMobileLandscape ? '9rem' : '8rem',
					left: isSmallScreen ? '0.15rem' : isRotatedMedium ? '1rem' : '2rem',
					width: '80%',
					zIndex: 3,
					overflow: 'auto',
				}}>
				{!isQuestionsVisible && (
					<Tooltip title='Take Notes' placement='right' arrow>
						<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
							<Article fontSize={isMobileSize ? 'small' : 'medium'} />
						</IconButton>
					</Tooltip>
				)}
				<Slide direction='right' in={isNotesDrawerOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
					<Box
						sx={{
							position: 'fixed',
							left: 0,
							top: isSmallMobilePortrait || isSmallMobileLandscape || isMobilePortrait || isMobileLandscape ? '6rem' : '11rem',
							width: isSmallMobilePortrait
								? '90%'
								: isSmallMobileLandscape
									? '70%'
									: isMobilePortrait
										? '80%'
										: isTabletPortrait
											? '70%'
											: isTabletLandscape
												? '60%'
												: '40%',
							height: 'fit-content',
							maxHeight:
								isSmallMobilePortrait || isSmallMobileLandscape || isMobilePortrait || isMobileLandscape
									? 'calc(100vh - 6rem)'
									: 'calc(100vh - 11rem)',
							boxShadow: 10,
							padding: '1rem 1rem 0.5rem 1rem',
							borderRadius: '0 0.35rem  0.35rem 0 ',
							bgcolor: 'background.paper',
							overflow: 'auto',
							zIndex: 30,
							display: 'flex',
							flexDirection: 'column',
						}}>
						<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : undefined }}>
									Lesson Notes
								</Typography>
								<IconButton
									onClick={() => {
										setIsNotesDrawerOpen(false);
										setUserLessonNotes(editorContent);
									}}
									sx={{ padding: isMobileSize ? '0.5rem' : undefined }}>
									<Close sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
								</IconButton>
							</Box>
							<Box sx={{ mt: '0.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }} id='editor-content'>
								<TinyMceEditor
									height='300'
									handleEditorChange={(content) => {
										setEditorContent(content);
										setIsNotesUpdated(true);
									}}
									initialValue={userLessonNotes}
								/>
							</Box>
							<Box sx={{ display: 'flex', mt: '1rem', justifyContent: 'space-between', flexShrink: 0 }}>
								<Tooltip title='Download as PDF' placement='right' arrow>
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
				</Slide>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0 0 0', width: '100%' }}>
				{lesson?.videoUrl && !isQuestionsVisible && (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							margin: isMobileSize ? '7rem 0 1rem 0' : '9rem 0 2rem 0',
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
							<UniversalVideoPlayer
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
						margin: lesson?.videoUrl ? '1rem 0' : isSmallMobilePortrait ? '6rem 0 1rem 0' : '7rem 0 1rem 0',
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
							<Box sx={{ width: '100%', marginBottom: '1rem', mt: !isInstructionalLesson && !isMobileSize ? '1rem' : '0' }}>
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
									dangerouslySetInnerHTML={{ __html: sanitizeHtml(decode(lesson.text)) }}
									sx={{
										'lineHeight': 1.9,
										'fontSize': isMobileSize ? '0.7rem' : '0.9rem',
										'& img': {
											maxWidth: '100%',
											height: 'auto',
											borderRadius: '0.35rem',
											margin: '1rem 0',
											boxShadow: '0 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)',
										},
									}}
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
				<Box
					sx={{
						width: isSmallMobilePortrait
							? '85%'
							: isSmallMobileLandscape
								? '75%'
								: isMobilePortrait
									? '80%'
									: isMobileLandscape
										? '70%'
										: isTabletPortrait
											? '70%'
											: isTabletLandscape
												? '70%'
												: '60%',
						mt: isSmallMobilePortrait ? '1rem' : isSmallMobileLandscape ? '1rem' : '1rem',
						minHeight: 'calc(90vh)',
					}}>
					<Questions
						questions={lesson?.questions}
						lessonType={lessonType}
						userAnswers={userAnswers}
						setUserAnswers={setUserAnswers}
						setIsQuizInProgress={setIsQuizInProgress}
						userQuizAnswers={userQuizAnswers}
						setUserQuizAnswers={setUserQuizAnswers}
						lessonName={lesson.title}
						onQuestionChange={setCurrentQuestionNumber}
						isSoundMuted={isSoundMuted}
					/>
				</Box>
			)}
			{isQuiz && isQuestionsVisible && !isLessonCompleted && (
				<>
					<Box sx={{ position: 'fixed', top: '90vh', right: isMobileSize ? '0.5rem' : '2rem', transform: 'translateY(-50%)', zIndex: 10 }}>
						<Tooltip title='Questions Map' placement='left' arrow>
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
			{lesson?.documents?.length !== 0 && !isQuestionsVisible && (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem', width: '85%' }}>
					<DocumentViewer
						documents={lesson?.documents || []}
						title='Lesson Materials'
						layout={isMobileSize ? 'list' : 'grid'}
						showTitle={lesson?.documents?.length !== 0}
						inlinePDFs={true}
					/>
				</Box>
			)}

			{isInstructionalLesson && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: isMobileSize ? '80%' : '85%', marginTop: 'auto', mb: '1rem' }}>
					<CustomSubmitButton
						endIcon={nextLessonId || hasMoreLessonsInCourse ? <KeyboardDoubleArrowRight /> : <DoneAll />}
						onClick={() => setIsLessonCourseCompletedModalOpen(true)}
						type='button'
						sx={{ marginTop: lesson?.documents && lesson?.documents.length === 0 ? '1rem' : '0rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{nextLessonId || hasMoreLessonsInCourse ? 'Next Lesson' : 'Complete Course'}
					</CustomSubmitButton>
					<CustomDialog
						openModal={isLessonCourseCompletedModalOpen}
						closeModal={() => setIsLessonCourseCompletedModalOpen(false)}
						maxWidth='xs'
						title={`${nextLessonId || hasMoreLessonsInCourse ? 'Lesson Completed' : 'Course Completed'}`}>
						<DialogContent sx={{ mb: '-0.5rem' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{`You have completed this ${nextLessonId || hasMoreLessonsInCourse ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId || hasMoreLessonsInCourse ? 'lesson' : 'course'}.`}
							</Typography>
						</DialogContent>
						<CustomDialogActions
							onCancel={() => setIsLessonCourseCompletedModalOpen(false)}
							onSubmit={async () => {
								await handleNextLesson();
								navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							submitBtnText='OK'
							actionSx={{ margin: '0rem 0.5rem 0.5rem 0' }}
						/>
					</CustomDialog>
				</Box>
			)}
		</Box>
	);
};

export default LessonPage;
