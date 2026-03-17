import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Collapse, DialogActions, DialogContent, Drawer, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import {
	Article,
	CheckCircle,
	Close,
	DoneAll,
	ExpandMore,
	GetApp,
	HelpOutline,
	Home,
	KeyboardBackspaceOutlined,
	KeyboardDoubleArrowRight,
	Lock,
	Menu,
	MenuBook,
	NotListedLocation,
	PlayCircleOutline,
	RecordVoiceOver,
	RecordVoiceOverOutlined,
	VolumeOff,
	VolumeUp,
} from '@mui/icons-material';
import theme from '../themes';
import DashboardHeader from '../components/layouts/dashboardLayout/DashboardHeader';
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
import { stripHtml } from '../utils/stripHtml';
import UniversalVideoPlayer from '../components/video/UniversalVideoPlayer';
import DocumentViewer from '../components/documents/DocumentViewer';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import { truncateText } from '@utils/utilText';
import useQuestionTypes from '../hooks/useQuestionTypes';
import { QuestionType } from '../interfaces/enums';
import { calculateQuizTotalScore } from '../utils/calculateQuizTotalScore';
import { calculateScorePercentage } from '../utils/calculateScorePercentage';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import InstructionalLessonsDialog from '../components/userCourses/InstructionalLessonsDialog';
import { useWordAssist, wrapWordsForHover } from '../hooks/useWordAssist';
import WordAssistPopper from '../components/userCourses/WordAssistPopper';
import { useUserLessonsForCourse } from '../hooks/useUserLessonsForCourse';

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
	const { handleNextLesson, nextLessonId, isLessonCompleted, setIsLessonCompleted, userLessonId } = useUserCourseLessonData();
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
	const [wasLessonCompletedOnMount, setWasLessonCompletedOnMount] = useState<boolean>(isLessonCompleted);
	const [isQuizInProgress, setIsQuizInProgress] = useState<boolean>(false);
	const [lessonType, setLessonType] = useState<string>('');
	const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState<boolean>(false);
	const [editorContent, setEditorContent] = useState<string>('');
	const [userLessonNotes, setUserLessonNotes] = useState<string>(editorContent);
	const [isUserLessonNotesUploading, setIsUserLessonNotesUploading] = useState<boolean>(false);
	const [isNotesUpdated, setIsNotesUpdated] = useState<boolean>(false);
	const [isQuestionsMapOpen, setIsQuestionsMapOpen] = useState<boolean>(false);
	const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
	const [isWordAssistEnabled, setIsWordAssistEnabled] = useState<boolean>(() => {
		const saved = localStorage.getItem('word-assist-enabled');
		return saved === null ? true : saved === 'true';
	});
	const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(0);
	const [isNavigatingToNextLesson, setIsNavigatingToNextLesson] = useState<boolean>(false);
	const [practiceAgainMode, setPracticeAgainMode] = useState<boolean>(false);
	const [isHelpDialogOpen, setIsHelpDialogOpen] = useState<boolean>(false);
	const [isInstructionalLessonsDialogOpen, setIsInstructionalLessonsDialogOpen] = useState<boolean>(false);
	const [selectedInstructionalLessonId, setSelectedInstructionalLessonId] = useState<string>('');
	const [isChapterListDrawerOpen, setIsChapterListDrawerOpen] = useState<boolean>(false);
	const currentChapterDrawerRef = useRef<HTMLDivElement>(null);
	const drawerScrollContainerRef = useRef<HTMLDivElement>(null);
	// Chapters expanded in the drawer: by default only the one containing the current lesson
	const [drawerExpandedChapterIds, setDrawerExpandedChapterIds] = useState<Set<string>>(() => {
		const initial = new Set<string>();
		if (!lessonId || !singleCourseUser?.chapters) return initial;
		const chapter = singleCourseUser.chapters.find((ch) => ch?.lessons?.some((l) => l?._id === lessonId));
		const chapterId = (chapter as any)?._id ?? (chapter as any)?.chapterId;
		if (chapterId) initial.add(String(chapterId));
		return initial;
	});
	const { anchorEl, activeWord, wordInfo, isLoadingWordInfo, handleWordHover, handleWordTouchStart, handleWordTouchEnd, handleMouseLeave } = useWordAssist({
		enabled: isWordAssistEnabled,
		hoverDelayMs: 1000,
	});

	const { fetchQuestionTypeName } = useQuestionTypes();
	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessonData = useMemo(() => userLessonsData ?? [], [userLessonsData]);

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
	const lessonTextColor = theme.textColor?.secondary.main || '#4D7B8B';
	const lessonTextFontFamily = theme.fontFamily?.main || 'Poppins';

	const currentChapter = useMemo(() => {
		if (!singleCourseUser?.chapters || !lessonId) return null;
		return (singleCourseUser.chapters || []).find((ch) => ch?.lessons?.some((l) => l?._id === lessonId)) ?? null;
	}, [singleCourseUser?.chapters, lessonId]);

	const instructionalLessonsInChapter = useMemo(() => {
		if (!currentChapter?.lessons) return [];
		return currentChapter.lessons.filter(
			(chapterLesson) => chapterLesson !== null && chapterLesson.type === LessonType.INSTRUCTIONAL_LESSON
		);
	}, [currentChapter]);

	useEffect(() => {
		if (instructionalLessonsInChapter.length > 0) {
			setSelectedInstructionalLessonId((previousSelectedLessonId) => {
				const hasPreviousLesson = instructionalLessonsInChapter.some(
					(chapterLesson) => chapterLesson._id === previousSelectedLessonId
				);
				return hasPreviousLesson ? previousSelectedLessonId : instructionalLessonsInChapter[0]._id;
			});
			return;
		}
		setSelectedInstructionalLessonId('');
	}, [instructionalLessonsInChapter]);

	useEffect(() => {
		localStorage.setItem('word-assist-enabled', String(isWordAssistEnabled));
	}, [isWordAssistEnabled]);

	// When chapter list drawer opens, ensure the chapter containing the current lesson is expanded
	useEffect(() => {
		if (!isChapterListDrawerOpen || !lessonId || !singleCourseUser?.chapters) return;
		const chapter = singleCourseUser.chapters.find((ch) => ch?.lessons?.some((l) => l?._id === lessonId));
		const chapterId = chapter && ((chapter as any)._id ?? (chapter as any)?.chapterId);
		if (chapterId) {
			setDrawerExpandedChapterIds((prev) => new Set(prev).add(String(chapterId)));
		}
	}, [isChapterListDrawerOpen, lessonId, singleCourseUser?.chapters]);

	// When drawer opens, scroll so the current chapter is vertically centered (slow smooth scroll)
	useEffect(() => {
		if (!isChapterListDrawerOpen) return;
		const startDelay = 350;
		const durationMs = 1500;
		const t = setTimeout(() => {
			const container = drawerScrollContainerRef.current;
			const chapterEl = currentChapterDrawerRef.current;
			if (!container || !chapterEl) return;
			const targetScrollTop =
				chapterEl.offsetTop - container.clientHeight / 2 + chapterEl.offsetHeight / 2;
			const clamped = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight));
			const start = container.scrollTop;
			const startTime = performance.now();
			const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
			const tick = (now: number) => {
				const elapsed = now - startTime;
				const p = Math.min(1, elapsed / durationMs);
				container.scrollTop = start + (clamped - start) * easeInOutCubic(p);
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, startDelay);
		return () => clearTimeout(t);
	}, [isChapterListDrawerOpen]);



	useEffect(() => {
		setIsQuestionsVisible(false);
		setPracticeAgainMode(false);
	}, [lessonId]);

	useEffect(() => {
		const fetchData = async () => {
			if (lessonId) {
				try {
					const lessonResponse = await axios.get(`${base_url}/lessons/${lessonId}`, {
						params: courseId ? { courseId } : undefined,
					});
					const lessonData = lessonResponse.data;

					setLesson({
						...lessonData,
						questions: lessonData.questions?.filter((q: QuestionInterface) => q !== null) || [],
					});
					setLessonType(lessonData.type);

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
	}, [lessonId, courseId, isLessonCompleted]);


	useEffect(() => {
		if (!userLessonId) return;

		const fetchUserLessonData = async () => {
			try {
				const userLessonResponse = await axios.get(`${base_url}/userlessons/${userLessonId}`);
				if (userLessonResponse.data.data && userLessonResponse.data.data[0]) {
					const lessonData = userLessonResponse.data.data[0];
					setUserLessonNotes(lessonData.notes || '');
					setEditorContent(lessonData.notes || '');
					setTeacherQuizFeedback(lessonData.teacherFeedback);
					setIsLessonCompleted(Boolean(lessonData.isCompleted));
				}
			} catch (error) {
				console.log('Error fetching user lesson data:', error);
			}
		};

		fetchUserLessonData();
	}, [userLessonId]);

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

	// Show completion dialog when lesson is completed (for practice lessons and quizzes)
	useEffect(() => {
		// Only show dialog if lesson just became completed (not if it was already completed on mount)
		if (isLessonCompleted && !wasLessonCompletedOnMount && (lessonType === LessonType.PRACTICE_LESSON || lessonType === LessonType.QUIZ)) {
			setIsLessonCourseCompletedModalOpen(true);
		}
		setWasLessonCompletedOnMount(isLessonCompleted);
	}, [isLessonCompleted, wasLessonCompletedOnMount, lessonType]);

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
		// Store current lesson/chapter so the course page can expand and scroll to the active chapter
		if (lessonId) {
			for (let i = sessionStorage.length - 1; i >= 0; i--) {
				const key = sessionStorage.key(i);
				if (key && (key.startsWith('expand-chapter-for-lesson-') || key.startsWith('expand-chapter-by-id-'))) {
					sessionStorage.removeItem(key);
				}
			}

			sessionStorage.setItem(`expand-chapter-for-lesson-${lessonId}`, 'true');

			const targetChapter = singleCourseUser?.chapters?.find((chapter) => chapter?.lessons?.some((lesson) => lesson && lesson._id === lessonId));
			const targetChapterId = (targetChapter as any)?._id || (targetChapter as any)?.chapterId;

			if (targetChapterId) {
				sessionStorage.setItem(`expand-chapter-by-id-${targetChapterId}`, 'true');
			}
		}
		navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (isNotesUpdated) {
			updateUserLessonNotes();
		}
	};

	const handleDrawerLessonClick = (targetLessonId: string) => {
		if (!courseId || !userCourseId || targetLessonId === lessonId) return;
		setIsChapterListDrawerOpen(false);
		navigate(`/course/${courseId}/userCourseId/${userCourseId}/lesson/${targetLessonId}`);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const toggleDrawerChapter = (chapterId: string) => {
		setDrawerExpandedChapterIds((prev) => {
			const next = new Set(prev);
			if (next.has(chapterId)) next.delete(chapterId);
			else next.add(chapterId);
			return next;
		});
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
				<DashboardHeader pageName={'Aden Academy'} />
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
						<Tooltip title='Take Notes' placement='top' arrow>
							<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
								<Article fontSize={isMobileSize ? 'small' : 'medium'} />
							</IconButton>
						</Tooltip>
						{lessonType === LessonType.PRACTICE_LESSON && (
							<Tooltip title={isWordAssistEnabled ? 'Disable Pronunciation Assist' : 'Enable Pronunciation Assist'} placement='top' arrow>
								<IconButton
									onClick={() => setIsWordAssistEnabled((prev) => !prev)}
									sx={{
										'&:hover': {
											backgroundColor: isWordAssistEnabled ? 'rgba(25, 118, 210, 0.2)' : 'rgba(77, 123, 139, 0.2)',
										},
									}}>
									{!isWordAssistEnabled ? <RecordVoiceOverOutlined fontSize='small' /> : <RecordVoiceOver fontSize='small' />}
								</IconButton>
							</Tooltip>
						)}
						{lessonType === LessonType.PRACTICE_LESSON && instructionalLessonsInChapter.length > 0 && (
							<Tooltip title='Lectures in this Chapter' placement='right' arrow>
								<IconButton onClick={() => setIsInstructionalLessonsDialogOpen(true)}>
									<MenuBook fontSize={isMobileSize ? 'small' : 'medium'} />
								</IconButton>
							</Tooltip>
						)}
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
					{lesson.isGraded && lesson.type === LessonType.QUIZ && isQuestionsVisible && isLessonCompleted && (
						<Tooltip title={isWordAssistEnabled ? 'Disable Pronunciation Assist' : 'Enable Pronunciation Assist'} placement='left' arrow>
							<IconButton
								onClick={() => setIsWordAssistEnabled((prev) => !prev)}>
								{!isWordAssistEnabled ? <RecordVoiceOverOutlined fontSize='small' /> : <RecordVoiceOver fontSize='small' />}
							</IconButton>
						</Tooltip>
					)}
					{lesson.isGraded && lesson.type === LessonType.QUIZ && isQuestionsVisible && (
						<Tooltip title='Take Notes' placement='left' arrow>
							<IconButton onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}>
								<Article fontSize={isMobileSize ? 'small' : 'medium'} />
							</IconButton>
						</Tooltip>
					)}

					<Tooltip title='Course Home Page' placement='left' arrow>
						<IconButton onClick={handleLessonNavigation} disabled={isQuizInProgress} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
							<Home fontSize='small' />
						</IconButton>
					</Tooltip>


					<Tooltip title='Chapters & Lessons' placement='top' arrow>
						<IconButton
							onClick={() => setIsChapterListDrawerOpen(true)}
							disabled={isQuizInProgress}
							sx={{ color: theme.textColor?.primary, ':hover': { backgroundColor: 'transparent' } }}>
							<Menu fontSize={'small'} />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Chapter & lesson list drawer */}
			<Drawer
				anchor='right'
				open={isChapterListDrawerOpen}
				onClose={() => setIsChapterListDrawerOpen(false)}
				transitionDuration={{ enter: 1000, exit: 1000 }}
				PaperProps={{
					sx: {
						width: isMobileSize ? '85%' : 360,
						maxWidth: '100%',
						backgroundColor: theme.bgColor?.common || '#faf9f6',
					},
				}}>
				<Box sx={{ p: 2, pb: 3 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.95rem' : '1.1rem' }}>
							Chapters & Lessons
						</Typography>
						<IconButton onClick={() => setIsChapterListDrawerOpen(false)} size='small'>
							<Close />
						</IconButton>
					</Box>
					<Box ref={drawerScrollContainerRef} sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
						{singleCourseUser?.chapters
							?.filter((ch) => ch && ch.lessons && ch.lessons.length > 0)
							.map((chapter, chapterIndex) => {
								const chapterId = (chapter as any)?._id ?? (chapter as any)?.chapterId ?? '';
								const validLessons = chapter.lessons?.filter((l) => l != null) ?? [];
								const containsCurrentLesson = validLessons.some((l) => l?._id === lessonId);
								const isExpanded = drawerExpandedChapterIds.has(String(chapterId)) || containsCurrentLesson;
								const isAlternateHeaderTone = chapterIndex % 2 === 1;
								const chapterHeaderBackground = isAlternateHeaderTone ? '#1a5a71' : theme.bgColor?.primary || theme.palette.primary.main;
								return (
									<Box
										ref={containsCurrentLesson ? currentChapterDrawerRef : undefined}
										key={chapterId}
										sx={{
											mb: 1,
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 1,
											overflow: 'hidden',
											backgroundColor: '#fff',
										}}>
										<Box
											onClick={() => toggleDrawerChapter(String(chapterId))}
											sx={{
												display: 'flex',
												alignItems: 'center',
												px: 0.5,
												py: 0.75,
												cursor: 'pointer',
												backgroundColor: chapterHeaderBackground,
												color: 'white',
												'&:hover': { backgroundColor: chapterHeaderBackground },
											}}
											role='button'
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													toggleDrawerChapter(String(chapterId));
												}
											}}>
											<IconButton
												size='small'
												sx={{
													color: 'white',
													padding: '0.25rem',
													transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
													transition: 'transform 0.2s ease',
												}}>
												<ExpandMore fontSize='small' />
											</IconButton>
											<Typography sx={{ flex: 1, fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: 'white' }}>
												{chapter.title}
											</Typography>
										</Box>
										<Collapse in={isExpanded} timeout='auto' unmountOnExit>
											<Box sx={{ py: 0.5 }}>
												{validLessons.map((lesson) => {
													const isCurrent = lesson._id === lessonId;
													const isCompleted = parsedUserLessonData.some((d) => d.lessonId === lesson._id && d.isCompleted);
													// Same as CoursePage Lesson: accessible only if user has a userLesson record (unlocked)
													const isAccessible = parsedUserLessonData.some(
														(d) => d.lessonId === lesson._id && d.courseId === courseId
													);
													return (
														<Box
															key={lesson._id}
															onClick={() => isAccessible && handleDrawerLessonClick(lesson._id)}
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																px: 2,
																py: 1,
																cursor: isAccessible ? 'pointer' : 'default',
																backgroundColor: isCurrent ? theme.palette.primary.light + '25' : 'transparent',
																borderLeft: 3,
																borderLeftColor: isCurrent ? theme.palette.primary.main : 'transparent',
																opacity: isAccessible ? 1 : 0.65,
																'&:hover': isAccessible
																	? { backgroundColor: theme.palette.action.hover }
																	: {},
															}}>
															{!isAccessible ? (
																<Lock sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }} />
															) : isCurrent ? (
																<PlayCircleOutline sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }} />
															) : isCompleted ? (
																<CheckCircle sx={{ fontSize: '1.1rem', color: theme.palette.success.main }} />
															) : (
																<Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
																	<Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary, opacity: 0.6 }} />
																</Box>
															)}
															<Typography
																sx={{
																	fontSize: isMobileSize ? '0.6rem' : '0.7rem',
																	fontWeight: isCurrent ? 600 : 400,
																	flex: 1,
																	color: isAccessible ? undefined : 'text.secondary',
																}}>
																{truncateText(lesson.title ?? '', 40)}
															</Typography>
														</Box>
													);
												})}
											</Box>
										</Collapse>
									</Box>
								);
							})}
					</Box>
				</Box>
			</Drawer>

			<Box
				sx={{
					position: 'fixed',
					top: isSmallMobilePortrait ? '6.5rem' : isSmallMobileLandscape ? '9rem' : '8rem',
					left: isSmallScreen ? '0.15rem' : isRotatedMedium ? '1rem' : '2rem',
					width: 'fit-content',
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
				<Slide direction='right' in={isNotesDrawerOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 1000 }}>
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
									value={editorContent}
								/>
							</Box>
							<Box sx={{ display: 'flex', mt: '1rem', justifyContent: 'space-between', flexShrink: 0 }}>
								<Tooltip title='Download as PDF' placement='right' arrow>
									<IconButton onClick={handleDownloadPDF} sx={{ padding: isMobileSize ? '0.5rem' : undefined }}>
										<GetApp sx={{ fontSize: isMobileSize ? '1.15rem' : '1.25rem' }} />
									</IconButton>
								</Tooltip>
								<Box>
									<CustomCancelButton
										size='small'
										onClick={() => setIsNotesDrawerOpen(false)}
										sx={{ height: '1.75rem', fontSize: isMobileSize ? '0.75rem' : undefined, marginRight: '0.5rem' }}>
										Close
									</CustomCancelButton>
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
						<Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: '0.35rem' }}>
							<Tooltip title={isWordAssistEnabled ? 'Disable Pronunciation Assist' : 'Enable Pronunciation Assist'} placement='top' arrow>
								<IconButton onClick={() => setIsWordAssistEnabled((prev) => !prev)}>
									{!isWordAssistEnabled ? <RecordVoiceOverOutlined fontSize='small' /> : <RecordVoiceOver fontSize='small' />}
								</IconButton>
							</Tooltip>
						</Box>
						<Box
							sx={{
								boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
								padding: isMobileSize ? '0.75rem' : '2rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.35rem',
								width: '100%',
								mt: isMobileSizeSmall ? '0.85rem' : '',
								ml: isMobileSizeSmall ? '1rem' : '',
								'&, & *': {
									fontFamily: `${lessonTextFontFamily} !important`,
									color: `${lessonTextColor} !important`,
									lineHeight: '2 !important',
								},
							}}>
							<Box
								className='rich-text-content'
								onMouseOver={handleWordHover}
								onMouseLeave={handleMouseLeave}
								onTouchStart={handleWordTouchStart}
								onTouchEnd={handleWordTouchEnd}
								onTouchCancel={handleWordTouchEnd}>
								<Typography
									component='div'
									dangerouslySetInnerHTML={{ __html: wrapWordsForHover(sanitizeHtml(decode(lesson.text))) }}
									sx={{
										'lineHeight': 2,
										'fontSize': isMobileSize ? '0.75rem' : '0.9rem',
										'color': lessonTextColor,
										'fontFamily': lessonTextFontFamily,
										'& img': {
											maxWidth: '100%',
											height: 'auto',
											borderRadius: '0.35rem',
											margin: '1rem 0',
											boxShadow: '0 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)',
										},
										'& .pronounceable-word': {
											cursor: isWordAssistEnabled ? 'pointer' : 'default',
											borderRadius: '0.2rem',
											padding: '0 0.1rem',
											transition: 'background-color 0.15s ease',
										},
										'& .pronounceable-word:hover': {
											backgroundColor: isWordAssistEnabled ? 'rgba(1, 67, 90, 0.14)' : 'transparent',
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
				<Box
					sx={{
						mt: isMobileSize ? '1rem' : '2rem',
						display: 'flex',
						gap: isMobileSize ? '1rem' : '1rem',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<CustomSubmitButton
						onClick={() => {
							setPracticeAgainMode(false);
							setIsQuestionsVisible(true);
							if (isQuiz && !isLessonCompleted) setIsQuizInProgress(true);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						capitalize={false}
						sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{lessonType === LessonType.PRACTICE_LESSON && !isLessonCompleted
							? 'Go to Questions'
							: lessonType === LessonType.PRACTICE_LESSON && isLessonCompleted
								? 'Review Questions'
								: isQuiz && !isLessonCompleted && isQuizInProgress
									? 'Resume'
									: isQuiz && !isLessonCompleted
										? 'Start Quiz'
										: 'Review Quiz'}
					</CustomSubmitButton>
					{isLessonCompleted && <Box>
						{lessonType === LessonType.PRACTICE_LESSON && isLessonCompleted && (
							<CustomSubmitButton
								onClick={() => {
									setPracticeAgainMode(true);
									setIsQuestionsVisible(true);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}
								capitalize={false}
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Practice Again
							</CustomSubmitButton>
						)}
						<IconButton onClick={() => setIsHelpDialogOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
							<HelpOutline fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
						</IconButton>
						<CustomDialog openModal={isHelpDialogOpen} closeModal={() => setIsHelpDialogOpen(false)} maxWidth='xs'>
							<DialogContent>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.9, mt: '0.75rem' }}>
									You can solve the multiple choice, true/false, fill in the blank, matching pairs, and translate questions again.
								</Typography>
							</DialogContent>
							<DialogActions>
								<CustomCancelButton onClick={() => setIsHelpDialogOpen(false)} sx={{ margin: '0rem 0.5rem 0.5rem 0' }}>
									Close
								</CustomCancelButton>
							</DialogActions>
						</CustomDialog>
					</Box>}
				</Box>
			)}
			{isQuestionsVisible && (() => {
				const filteredQuestions = lesson?.questions?.filter((q) => q != null) ?? [];
				if (filteredQuestions.length === 0) {
					return (
						<Box
							sx={{
								width: isSmallMobilePortrait ? '85%' : isTabletLandscape ? '70%' : '60%',
								mt: isMobileSize ? '15vh' : '20vh',
								mx: 'auto',
								p: 3,
								textAlign: 'center',
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
								border: '1px solid',
								borderColor: 'divider',
								bgcolor: 'background.paper',
							}}>
							<Typography variant='h6' sx={{ mb: 1.5, fontSize: isMobileSize ? '0.95rem' : '1.1rem' }}>
								No questions in this lesson
							</Typography>
							<Typography variant='body2' sx={{ my: '2rem', color: 'text.secondary', fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
								This lesson has no questions right now (they may have been removed). You can go back to the course or mark this lesson complete and continue.
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
								<Button
									variant='outlined'
									startIcon={<KeyboardBackspaceOutlined />}
									onClick={() => navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`)}
									sx={{ textTransform: 'none' }}>
									Back to course
								</Button>
								<Button
									variant='contained'
									startIcon={<DoneAll />}
									onClick={async () => {
										try {
											await handleNextLesson();
											navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
											window.scrollTo({ top: 0, behavior: 'smooth' });
										} catch (e) {
											console.error(e);
										}
									}}
									sx={{ textTransform: 'none' }}>
									Mark complete and go back
								</Button>
							</Box>
						</Box>
					);
				}
				return (
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
							practiceAgainMode={practiceAgainMode}
							enableWordAssist={isWordAssistEnabled}
							lessonText={lesson?.text ? stripHtml(lesson.text) : undefined}
							chapterName={currentChapter?.title}
						/>
					</Box>
				);
			})()}
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
						closeModal={() => {
							setIsLessonCourseCompletedModalOpen(false);
							setIsNavigatingToNextLesson(false);
						}}
						maxWidth='xs'
						title={`${nextLessonId || hasMoreLessonsInCourse ? 'Lesson Completed' : 'Course Completed'}`}>
						<DialogContent sx={{ mb: '-0.5rem' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{`You have completed this ${nextLessonId || hasMoreLessonsInCourse ? 'lesson' : 'course'}. Proceed to the next ${nextLessonId || hasMoreLessonsInCourse ? 'lesson' : 'course'}.`}
							</Typography>
						</DialogContent>
						<CustomDialogActions
							onCancel={() => {
								setIsLessonCourseCompletedModalOpen(false);
								setIsNavigatingToNextLesson(false);
							}}
							onSubmit={async () => {
								setIsNavigatingToNextLesson(true);
								try {
									// Always call handleNextLesson so next-chapter expansion keys are set reliably.
									await handleNextLesson();
									// Navigate to course home page
									navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								} catch (error) {
									console.error('Error navigating to course home:', error);
									setIsNavigatingToNextLesson(false);
								}
							}}
							submitBtnText='OK'
							isSubmitting={isNavigatingToNextLesson}
							actionSx={{ margin: '0rem 0.5rem 0.5rem 0' }}
						/>
					</CustomDialog>
				</Box>
			)}
			<InstructionalLessonsDialog
				open={isInstructionalLessonsDialogOpen}
				onClose={() => setIsInstructionalLessonsDialogOpen(false)}
				lessons={instructionalLessonsInChapter}
				selectedLessonId={selectedInstructionalLessonId}
				onSelectLesson={setSelectedInstructionalLessonId}
				enableWordAssist={isWordAssistEnabled}
			/>
			<WordAssistPopper
				open={Boolean(anchorEl) && isWordAssistEnabled}
				anchorEl={anchorEl}
				activeWord={activeWord}
				wordInfo={wordInfo}
				isLoadingWordInfo={isLoadingWordInfo}
			/>
		</Box>
	);
};

export default LessonPage;
