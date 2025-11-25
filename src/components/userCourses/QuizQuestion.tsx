import {
	Box,
	DialogActions,
	DialogContent,
	FormControl,
	FormHelperText,
	IconButton,
	MenuItem,
	Select,
	SelectChangeEvent,
	Tooltip,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../../themes';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import TrueFalseOptions from '../layouts/questionTypes/TrueFalseOptions';
import useQuestionTypes from '../../hooks/useQuestionTypes';
import CustomTextField from '../forms/customFields/CustomTextField';
import { useUserCourseLessonData } from '../../hooks/useUserCourseLessonData';
import { CheckCircle, Done, DoneAll, KeyboardArrowLeft, KeyboardArrowRight, KeyboardDoubleArrowRight } from '@mui/icons-material';
import { QuestionType } from '../../interfaces/enums';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { QuizQuestionAnswer } from '../../pages/LessonPage';
import LoadingButton from '@mui/lab/LoadingButton';
import QuestionMedia from './QuestionMedia';
import QuestionText from './QuestionText';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import VideoRecorder from './VideoRecorder';
import AudioRecorder from './AudioRecorder';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import FillInTheBlanksTyping from '../layouts/FITBTyping/FillInTheBlanksTyping';
import FillInTheBlanksDragDrop from '../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import MatchingPreview from '../layouts/matching/MatchingPreview';
import { UserBlankValuePairAnswers, UserMatchingPairAnswers } from '../../interfaces/userQuestion';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { UserCourseLessonDataContext } from '../../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomAudioPlayer from '../audio/CustomAudioPlayer';
import { stripHtml } from '@utils/stripHtml';

interface QuizQuestionProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	lessonType?: string;
	lessonName: string;
	isLessonCompleted: boolean;
	userQuizAnswers: QuizQuestionAnswer[];
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
	setIsLessonCompleted: React.Dispatch<React.SetStateAction<boolean>>;
	setUserQuizAnswers: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	setIsQuizInProgress: React.Dispatch<React.SetStateAction<boolean>>;
}

const QuizQuestion = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	lessonType,
	lessonName,
	isLessonCompleted,
	userQuizAnswers,
	setDisplayedQuestionNumber,
	setIsLessonCompleted,
	setUserQuizAnswers,
	setIsQuizInProgress,
}: QuizQuestionProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { userLessonId, handleNextLesson, nextLessonId } = useUserCourseLessonData();

	const { lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useQuestionTypes();
	const { user } = useContext(UserAuthContext);
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	const {
		isSmallScreen,
		isRotatedMedium,
		isSmallMobileLandscape,
		isSmallMobilePortrait,
		isMobilePortrait,
		isMobileLandscape,
		isTabletPortrait,
		isTabletLandscape,
		isDesktopPortrait,
		isDesktopLandscape,
	} = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [userQuizAnswerAfterSubmission, setUserQuizAnswerAfterSubmission] = useState<string>('');
	const [userMatchingPairsAfterSubmission, setUserMatchingPairsAfterSubmission] = useState<UserMatchingPairAnswers[]>([]);
	const [userBlankValuePairsAfterSubmission, setUserBlankValuePairsAfterSubmission] = useState<UserBlankValuePairAnswers[]>([]);

	const [uploadUrlForCompletedLesson, setUploadUrlForCompletedLesson] = useState<string>('');

	const [selectedQuestion, setSelectedQuestion] = useState<number>(displayedQuestionNumber);
	const [isSubmitQuizModalOpen, setIsSubmitQuizModalOpen] = useState<boolean>(false);
	const [isMsgModalAfterSubmitOpen, setIsMsgModalAfterSubmitOpen] = useState<boolean>(false);
	const [userQuizAnswersUploading, setUserQuizAnswersUploading] = useState<boolean>(false);
	const [isAudioVideoUploaded, setIsAudioVideoUploaded] = useState<boolean>(() => {
		const userUpload = userQuizAnswers?.find((data) => data.questionId === question._id);
		if (userUpload?.audioRecordUrl || userUpload?.videoRecordUrl) {
			return true;
		}
		return false;
	});

	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);
	const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

	const [teacherQuestionFeedback, setTeacherQuestionFeedback] = useState<string>('');
	const [teacherQuestionAudioFeedback, setTeacherQuestionAudioFeedback] = useState<string>('');

	const isOpenEndedQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion: boolean = fetchQuestionTypeName(question) === QuestionType.AUDIO_VIDEO;
	const isMatching: boolean = fetchQuestionTypeName(question) === QuestionType.MATCHING;
	const isFITBTyping: boolean = fetchQuestionTypeName(question) === QuestionType.FITB_TYPING;
	const isFITBDragDrop: boolean = fetchQuestionTypeName(question) === QuestionType.FITB_DRAG_DROP;

	const [helperText, setHelperText] = useState<string>(isMultipleChoiceQuestion || isTrueFalseQuestion ? 'Choose wisely' : '');
	const [courseTitle, setCourseTitle] = useState<string>('');

	const [recordOption, setRecordOption] = useState<string>('');
	const toggleRecordOption = (type: string) => {
		return () => {
			setRecordOption(type);
		};
	};

	const [value, setValue] = useState<string>(() => {
		if (!isLessonCompleted && !isAudioVideoQuestion) {
			const value: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
			return value;
		}

		return '';
	});

	const isLastQuestion: boolean = displayedQuestionNumber === numberOfQuestions;
	const isCompletingCourse: boolean = isLastQuestion && nextLessonId === null;
	const isCompletingLesson: boolean = isLastQuestion && nextLessonId !== null;

	useEffect(() => {
		setUserQuizAnswerAfterSubmission(() => {
			if (isLessonCompleted) {
				const answer: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.userAnswer || '';
				return answer;
			}
			return '';
		});

		setUserMatchingPairsAfterSubmission(() => {
			if (isLessonCompleted) {
				const pairs: UserMatchingPairAnswers[] = userQuizAnswers?.find((data) => data.questionId == question._id)?.userMatchingPairAnswers || [];
				return pairs;
			}
			return [];
		});

		setUserBlankValuePairsAfterSubmission(() => {
			if (isLessonCompleted) {
				const pairs: UserBlankValuePairAnswers[] = userQuizAnswers?.find((data) => data.questionId == question._id)?.userBlankValuePairAnswers || [];
				return pairs;
			}
			return [];
		});

		setTeacherQuestionFeedback(() => {
			if (isLessonCompleted) {
				const feedback: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.teacherFeedback || '';
				return feedback;
			}
			return '';
		});

		setTeacherQuestionAudioFeedback(() => {
			if (isLessonCompleted) {
				const feedback: string = userQuizAnswers?.find((data) => data.questionId == question._id)?.teacherAudioFeedbackUrl || '';
				return feedback;
			}
			return '';
		});

		setUploadUrlForCompletedLesson(() => {
			if (isLessonCompleted) {
				const answer = userQuizAnswers?.find((data) => data.questionId == question._id);
				if (answer?.audioRecordUrl) {
					return answer?.audioRecordUrl;
				} else if (answer?.videoRecordUrl) {
					return answer?.videoRecordUrl;
				}
			}
			return '';
		});

		// Use context data instead of localStorage
		const userCourseData = userCoursesData || [];

		setCourseTitle(() => {
			return userCourseData?.find((data) => data.courseId === courseId)?.courseTitle || '';
		});
	}, [userCoursesData, courseId, isLessonCompleted, userQuizAnswers, question._id, displayedQuestionNumber]);

	useEffect(() => {
		setSelectedQuestion(displayedQuestionNumber);

		if (isLessonCompleted || (!isLessonCompleted && value !== '')) {
			setHelperText(' ');
		}
	}, [displayedQuestionNumber]);

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setUserQuizAnswers((prevData) => {
			if (prevData) {
				const updatedAnswers = prevData?.map((answer) => {
					if (answer.questionId === question._id) {
						return { ...answer, userAnswer: (event.target as HTMLInputElement).value };
					}
					return answer;
				});
				return updatedAnswers;
			}
			return prevData;
		});

		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
	};

	const handleQuestionChange = (event: SelectChangeEvent<number>) => {
		const selectedValue = Number(event.target.value);
		setSelectedQuestion(selectedValue);
		setDisplayedQuestionNumber(selectedValue);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleQuizSubmission = async () => {
		setUserQuizAnswersUploading(true);

		// Upload user answers
		await Promise.all(
			userQuizAnswers?.map((answer) => {
				return (async () => {
					try {
						await axios.post(`${base_url}/userQuestions`, {
							userLessonId,
							questionId: answer.questionId,
							userId: user?._id,
							lessonId,
							courseId,
							isCompleted: true,
							isInProgress: false,
							orgId,
							userAnswer: answer.userAnswer?.trim() || '',
							userBlankValuePairAnswers: answer.userBlankValuePairAnswers || [],
							userMatchingPairAnswers: answer.userMatchingPairAnswers || [],
							videoRecordUrl: answer.videoRecordUrl?.trim() || '',
							audioRecordUrl: answer.audioRecordUrl?.trim() || '',
							teacherFeedback: '',
							teacherAudioFeedbackUrl: '',
						});
					} catch (error) {
						console.log(error);
					}
				})();
			}) || []
		);

		try {
			// Submit quiz
			const submissionResponse = await axios.post(`${base_url}/quizSubmissions`, {
				userId: user?._id,
				lessonId,
				courseId,
				userLessonId,
				orgId,
			});

			// Send notification AFTER quiz submission is complete (non-blocking)
			const courseInstructor = submissionResponse.data?.courseInstructor;
			if (courseInstructor?.firebaseUserId) {
				const notificationData = {
					title: 'Quiz Submitted',
					message: `${user?.username} submitted ${lessonName} in the ${courseTitle} course.`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'QuizSubmission',
					userImageUrl: user?.imageUrl,
					lessonId,
					submissionId: submissionResponse.data._id,
					userLessonId,
				};

				// Use batch operation with content-based deduplication (non-blocking)
				const batch = writeBatch(db);
				const notificationDocRef = doc(db, 'notifications', courseInstructor.firebaseUserId, 'userNotifications', submissionResponse.data._id);
				batch.set(notificationDocRef, notificationData, { merge: true });

				// Non-blocking notification - quiz submission success is not dependent on notification success
				batch.commit().catch((error) => {
					console.warn('Failed to send quiz submitted notification:', error);
				});
			}
		} catch (error) {
			console.error('Error submitting quiz:', error);
		} finally {
			setIsMsgModalAfterSubmitOpen(true);
		}

		await handleNextLesson();
		setIsLessonCompleted(true);
		setIsSubmitQuizModalOpen(false);
		setIsQuizInProgress(false);
		setUserQuizAnswersUploading(false);
		localStorage.removeItem(`UserQuizAnswers-${lessonId}`);
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `audio-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(audioRef);

			setUserQuizAnswers((prevData) => {
				if (prevData) {
					const updatedAnswers = prevData?.map((answer) => {
						if (answer.questionId === question._id) {
							return { ...answer, audioRecordUrl: downloadURL };
						}
						return answer;
					});
					return updatedAnswers;
				}
				return prevData;
			});

			setIsAudioVideoUploaded(true);
			setRecordOption('');
		} catch (error) {
			console.log(error);
		} finally {
			setIsAudioUploading(false);
		}
	};

	const uploadVideo = async (blob: Blob) => {
		setIsVideoUploading(true);
		try {
			const videoRef = ref(storage, `video-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(videoRef, blob);
			const downloadURL = await getDownloadURL(videoRef);

			setUserQuizAnswers((prevData) => {
				if (prevData) {
					const updatedAnswers = prevData?.map((answer) => {
						if (answer.questionId === question._id) {
							return { ...answer, videoRecordUrl: downloadURL };
						}
						return answer;
					});
					return updatedAnswers;
				}
				return prevData;
			});

			setIsAudioVideoUploaded(true);
			setRecordOption('');
		} catch (error) {
			console.log(error);
		} finally {
			setIsVideoUploading(false);
		}
	};

	return (
		<Box
			sx={{
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'relative',
				minHeight: 'calc(95vh)',
				height: 'fit-content',
				paddingBottom: '8rem',
			}}>
			<form style={{ width: '100%' }}>
				<FormControl sx={{ width: '100%' }} variant='standard'>
					<QuestionMedia question={question} />
					{!isFITBDragDrop && !isFITBTyping && <QuestionText question={question} questionNumber={questionNumber} />}

					{isOpenEndedQuestion && (
						<Box sx={{ width: '90%', margin: '1rem auto' }}>
							<CustomTextField
								required={false}
								multiline
								rows={4}
								resizable
								value={isLessonCompleted ? userQuizAnswerAfterSubmission : value}
								onChange={(e) => {
									setValue(e.target.value);
									setUserQuizAnswers((prevData) => {
										if (prevData) {
											const updatedAnswers = prevData?.map((answer) => {
												if (answer.questionId === question._id) {
													return { ...answer, userAnswer: e.target.value };
												}
												return answer;
											});
											return updatedAnswers;
										}
										return prevData;
									});
								}}
								InputProps={{
									inputProps: {
										maxLength: 5000,
									},
								}}
							/>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '0.5rem' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{value.length} characters
								</Typography>
							</Box>
						</Box>
					)}

					{isAudioVideoQuestion && (
						<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
							<Box>
								{question?.audio && !isAudioVideoUploaded && !isLessonCompleted && (
									<CustomSubmitButton
										onClick={toggleRecordOption('audio')}
										sx={{ margin: '0 1rem 1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
										type='button'
										size='small'>
										Record Audio
									</CustomSubmitButton>
								)}
								{question?.video && !isAudioVideoUploaded && !isLessonCompleted && (
									<CustomSubmitButton
										onClick={toggleRecordOption('video')}
										sx={{ margin: '0 0 1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
										type='button'
										size='small'>
										Record Video
									</CustomSubmitButton>
								)}
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
								{recordOption === 'video' ? (
									<VideoRecorder uploadVideo={uploadVideo} isVideoUploading={isVideoUploading} />
								) : recordOption === 'audio' ? (
									<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} />
								) : null}
							</Box>

							{isAudioVideoUploaded && (
								<Box sx={{ width: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									{userQuizAnswers?.map((answer) => {
										if (answer.questionId === question._id) {
											if (answer.audioRecordUrl) {
												return (
													<CustomAudioPlayer
														audioUrl={!isLessonCompleted ? answer.audioRecordUrl : uploadUrlForCompletedLesson}
														key={question._id}
														sx={{
															marginTop: '0.5rem',
															marginBottom: '0.75rem',
														}}
													/>
												);
											} else if (answer.videoRecordUrl) {
												return (
													<Box
														key={question._id}
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
															'width': isMobileSize ? '100%' : '80%',
															'maxWidth': isMobileSize ? '100%' : '600px',
															'marginTop': '0.5rem',
															'marginBottom': '0.75rem',
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
															src={!isLessonCompleted ? answer.videoRecordUrl : uploadUrlForCompletedLesson}
															controls
															style={{
																borderRadius: '8px',
																width: '100%',
																height: 'auto',
																maxHeight: isMobileSize ? '20rem' : '25rem',
																objectFit: 'contain',
																position: 'relative',
																zIndex: 1,
															}}></video>
													</Box>
												);
											}
										}
									})}
								</Box>
							)}
						</Box>
					)}

					{isTrueFalseQuestion && (
						<Box>
							<TrueFalseOptions
								correctAnswer={value}
								setCorrectAnswer={setValue}
								fromLearner={true}
								question={question}
								isLessonCompleted={isLessonCompleted}
								displayedQuestionNumber={displayedQuestionNumber}
								setHelperText={setHelperText}
								setUserQuizAnswers={setUserQuizAnswers}
								lessonType={lessonType}
								userQuizAnswerAfterSubmission={userQuizAnswerAfterSubmission}
							/>
						</Box>
					)}

					{isMatching && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								width: isMobileSize ? '100%' : '80%',
								margin: isMobileSize ? '0 auto' : '0 auto 3rem auto',
							}}>
							<MatchingPreview
								questionId={question._id}
								initialPairs={question.matchingPairs}
								fromQuizQuestionUser={true}
								displayedQuestionNumber={displayedQuestionNumber}
								numberOfQuestions={numberOfQuestions}
								setIsLessonCompleted={setIsLessonCompleted}
								isLessonCompleted={isLessonCompleted}
								userQuizAnswers={userQuizAnswers}
								setUserQuizAnswers={setUserQuizAnswers}
								userMatchingPairsAfterSubmission={userMatchingPairsAfterSubmission}
							/>
						</Box>
					)}

					{isFITBDragDrop && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								width: '100%',
								margin:
									question.imageUrl || question.videoUrl
										? '2.5rem auto 0 auto'
										: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
											? '6rem auto 0 auto'
											: isTabletPortrait || isTabletLandscape
												? '7rem auto 0 auto'
												: isDesktopPortrait || isDesktopLandscape
													? '8rem auto 0 auto'
													: '6rem auto 0 auto',
							}}>
							<FillInTheBlanksDragDrop
								questionId={question._id}
								fromQuizQuestionUser={true}
								textWithBlanks={question.question}
								blankValuePairs={question.blankValuePairs}
								displayedQuestionNumber={displayedQuestionNumber}
								numberOfQuestions={numberOfQuestions}
								setIsLessonCompleted={setIsLessonCompleted}
								isLessonCompleted={isLessonCompleted}
								userQuizAnswers={userQuizAnswers}
								setUserQuizAnswers={setUserQuizAnswers}
								userBlankValuePairsAfterSubmission={userBlankValuePairsAfterSubmission}
								lessonType={lessonType}
							/>
						</Box>
					)}

					{isFITBTyping && (
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'center',
								width: '100%',
								margin:
									question.imageUrl || question.videoUrl
										? '2.5rem auto 0 auto'
										: isSmallMobileLandscape || isSmallMobilePortrait || isMobilePortrait || isMobileLandscape
											? '6rem auto 0 auto'
											: isTabletPortrait || isTabletLandscape
												? '7rem auto 0 auto'
												: isDesktopPortrait || isDesktopLandscape
													? '8rem auto 0 auto'
													: '6rem auto 0 auto',
							}}>
							<FillInTheBlanksTyping
								questionId={question._id}
								fromQuizQuestionUser={true}
								textWithBlanks={question.question}
								blankValuePairs={question.blankValuePairs}
								displayedQuestionNumber={displayedQuestionNumber}
								numberOfQuestions={numberOfQuestions}
								setIsLessonCompleted={setIsLessonCompleted}
								isLessonCompleted={isLessonCompleted}
								userQuizAnswers={userQuizAnswers}
								setUserQuizAnswers={setUserQuizAnswers}
								userBlankValuePairsAfterSubmission={userBlankValuePairsAfterSubmission}
								lessonType={lessonType}
							/>
						</Box>
					)}

					{isMultipleChoiceQuestion && (
						<Box
							sx={{
								alignSelf: 'center',
								width: '100%',
								maxWidth: isMobileSize ? '100%' : '600px',
								display: 'flex',
								flexDirection: 'column',
								gap: '0.75rem',
								mb: isDesktopLandscape || isDesktopPortrait ? '3rem' : '1rem',
							}}>
							{question &&
								question.options &&
								question.options?.map((option, index) => {
									let textColor = null;
									let borderColor = 'rgba(0, 0, 0, 0.12)';
									let backgroundColor = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)';
									let boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
									let isSelected = false;
									let isCorrect = false;
									let isWrong = false;
									let checkmarkColor = theme.palette.primary.main;

									// Get user's submitted answer - use state if available, otherwise get from array
									const foundAnswer = userQuizAnswers?.find((data) => {
										const dataQuestionId = String(data.questionId);
										const currentQuestionId = String(question._id);
										return dataQuestionId === currentQuestionId;
									});

									const currentUserAnswer = isLessonCompleted ? userQuizAnswerAfterSubmission || foundAnswer?.userAnswer || '' : value;

									if (isLessonCompleted) {
										const isCorrectAnswer = option === question.correctAnswer;
										const isSelectedAnswer = option === currentUserAnswer && currentUserAnswer !== '';

										if (isCorrectAnswer) {
											// Correct answer: keep green border and light green background
											textColor = theme.palette.success.main;
											borderColor = theme.palette.success.main;
											backgroundColor = 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.15) 100%)';
											boxShadow = '0 4px 12px rgba(76, 175, 80, 0.2)';
											isCorrect = true;
											checkmarkColor = theme.palette.success.main;
										} else if (isSelectedAnswer && !isCorrectAnswer) {
											// Wrong answer: use error color border (only if user selected it and it's not the correct answer)
											textColor = theme.palette.error.main;
											borderColor = theme.palette.error.main;
											backgroundColor = 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.15) 100%)';
											boxShadow = '0 4px 12px rgba(211, 47, 47, 0.2)';
											isWrong = true;
										}
									} else {
										isSelected = value === option;
										if (isSelected) {
											borderColor = theme.palette.primary.main;
											backgroundColor = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
											boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
										}
									}

									return (
										<Box
											key={index}
											onClick={() => {
												if (!isLessonCompleted) {
													const syntheticEvent = {
														target: { value: option },
													} as React.ChangeEvent<HTMLInputElement>;
													handleRadioChange(syntheticEvent);
												}
											}}
											sx={{
												'position': 'relative',
												'display': 'flex',
												'alignItems': 'center',
												'justifyContent': 'space-between',
												'padding': isMobileSize ? '0.75rem 1rem' : '1rem 1.25rem',
												'borderRadius': '12px',
												'border': '2px solid',
												'borderColor': borderColor,
												'background': backgroundColor,
												'boxShadow': boxShadow,
												'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												'cursor': isLessonCompleted ? 'default' : 'pointer',
												'backdropFilter': 'blur(10px)',
												'&:hover': {
													transform: isLessonCompleted ? 'none' : 'translateY(-2px)',
													boxShadow: isCorrect
														? '0 6px 16px rgba(76, 175, 80, 0.3)'
														: isWrong
															? '0 6px 16px rgba(211, 47, 47, 0.3)'
															: isSelected
																? '0 6px 16px rgba(102, 126, 234, 0.3)'
																: '0 4px 12px rgba(0, 0, 0, 0.12)',
													borderColor: isCorrect
														? theme.palette.success.main
														: isWrong
															? '#d32f2f'
															: isSelected
																? theme.palette.primary.main
																: 'rgba(102, 126, 234, 0.4)',
													background: isCorrect
														? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.2) 100%)'
														: isWrong
															? 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(211, 47, 47, 0.2) 100%)'
															: isSelected
																? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
																: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
												},
												'&::before': {
													content: '""',
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													background:
														isCorrect || isWrong || isSelected
															? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
															: 'transparent',
													borderRadius: '12px',
													zIndex: 0,
												},
											}}>
											<Typography
												sx={{
													color: textColor || (isSelected ? theme.palette.primary.main : theme.textColor?.secondary.main),
													fontWeight: isCorrect || isSelected ? 600 : 400,
													display: 'flex',
													alignItems: 'center',
													fontSize: isMobileSize ? '0.8rem' : '0.9rem',
													zIndex: 1,
													position: 'relative',
													lineHeight: 1.5,
													transition: 'all 0.2s ease',
													flex: 1,
												}}>
												{stripHtml(option)}
											</Typography>
											{isCorrect && (
												<CheckCircle
													sx={{
														color: checkmarkColor,
														fontSize: isMobileSize ? '1.25rem' : '1.5rem',
														zIndex: 1,
														position: 'relative',
														ml: 1,
													}}
												/>
											)}
										</Box>
									);
								})}
						</Box>
					)}

					{!isOpenEndedQuestion &&
						!isLessonCompleted &&
						!isMatching &&
						!isFITBDragDrop &&
						!isFITBDragDrop &&
						helperText !== ' ' &&
						!isAudioVideoQuestion && <FormHelperText sx={{ alignSelf: 'center', mt: '2rem' }}>{helperText}</FormHelperText>}

					{isLessonCompleted && (teacherQuestionFeedback || teacherQuestionAudioFeedback) && (
						<Box
							sx={{
								width: '80%',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								margin: '3rem auto 1rem auto',
								padding: '1rem 2rem 2rem 2rem',
								borderRadius: '0.35rem',
							}}>
							<Typography variant='h6' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
								Instructor Feedback
							</Typography>
							<Box>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{teacherQuestionFeedback}
								</Typography>
							</Box>
							{teacherQuestionAudioFeedback && (
								<Box sx={{ textAlign: 'center', width: '100%' }}>
									<CustomAudioPlayer
										audioUrl={teacherQuestionAudioFeedback}
										key={question._id}
										sx={{
											marginTop: '1.5rem',
											width: '80%',
										}}
									/>
								</Box>
							)}
						</Box>
					)}
				</FormControl>
			</form>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					position: 'absolute',
					mt: isMobileSize ? '1.5rem' : '2rem',
					width: '70%',
					mb: '1rem',
					bottom:
						isSmallMobilePortrait || isMobilePortrait
							? '1rem'
							: isMobileLandscape || isSmallMobileLandscape
								? '2rem'
								: isTabletLandscape || isDesktopLandscape
									? '3rem'
									: '2rem',
				}}>
				<IconButton
					sx={{
						'flexShrink': 0,
						'padding': '0.35rem',
						':hover': {
							color: theme.bgColor?.greenPrimary,
							backgroundColor: 'transparent',
							border: '2px solid lightgray',
						},
					}}
					onClick={() => {
						window.scrollTo({ top: 0, behavior: 'smooth' });
						if (!(displayedQuestionNumber - 1 === 0)) {
							setDisplayedQuestionNumber((prev) => prev - 1);
							setSelectedQuestion(displayedQuestionNumber - 1);
						}
					}}
					disabled={displayedQuestionNumber - 1 === 0}>
					<KeyboardArrowLeft fontSize={isMobileSize ? 'medium' : 'large'} />
				</IconButton>

				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						position: 'absolute',
						left: '50%',
						transform: 'translateX(-50%)',
					}}>
					<Select
						labelId='question_number'
						id='question_number'
						sx={{ mr: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}
						value={selectedQuestion}
						onChange={handleQuestionChange}
						size='small'
						label='#'
						required
						MenuProps={{
							PaperProps: {
								style: {
									maxHeight: isMobileSize ? 200 : 250,
								},
							},
						}}>
						{Array.from({ length: numberOfQuestions }, (_, i) => (
							<MenuItem
								key={i + 1}
								value={i + 1}
								sx={{
									display: 'flex',
									justifyContent: 'center',
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									minHeight: '2rem',
									padding: isMobileSize ? '4px 8px' : undefined,
								}}>
								{i + 1}
							</MenuItem>
						))}
					</Select>
				</Box>
				<Tooltip
					title={
						isCompletingCourse ? 'Complete Course' : isLessonCompleted && isLastQuestion ? 'Next Lesson' : isCompletingLesson ? 'Submit Quiz' : ''
					}
					placement='top'
					arrow>
					<IconButton
						onClick={() => {
							if (isLastQuestion && !isLessonCompleted) {
								setIsSubmitQuizModalOpen(true);
							} else if (isLastQuestion && isLessonCompleted) {
								navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}
							if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
								setDisplayedQuestionNumber((prev) => prev + 1);
								setSelectedQuestion(displayedQuestionNumber + 1);
							}
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						sx={{
							'flexShrink': 0,
							':hover': {
								color: theme.bgColor?.greenPrimary,
								backgroundColor: 'transparent',
								border: '2px solid lightgray',
							},
							'padding': '0.35rem',
						}}>
						{isCompletingCourse ? (
							<DoneAll fontSize={isMobileSize ? 'medium' : 'large'} />
						) : isLessonCompleted && isLastQuestion ? (
							<KeyboardDoubleArrowRight fontSize={isMobileSize ? 'medium' : 'large'} />
						) : isCompletingLesson ? (
							<Done fontSize={isMobileSize ? 'medium' : 'large'} />
						) : (
							<KeyboardArrowRight fontSize={isMobileSize ? 'medium' : 'large'} />
						)}
					</IconButton>
				</Tooltip>
				<CustomDialog openModal={isSubmitQuizModalOpen} closeModal={() => setIsSubmitQuizModalOpen(false)} maxWidth='xs' title='Quiz Submission'>
					<DialogContent>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.8 }}>
							Are you sure you want to submit the quiz? You will not have another chance.
						</Typography>
					</DialogContent>
					{userQuizAnswersUploading ? (
						<DialogActions sx={{ marginBottom: '1.5rem' }}>
							<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
						</DialogActions>
					) : (
						<CustomDialogActions
							onCancel={() => setIsSubmitQuizModalOpen(false)}
							onSubmit={handleQuizSubmission}
							submitBtnText='Submit'
							actionSx={{ margin: '0rem 0.5rem 0.5rem 0' }}
						/>
					)}
				</CustomDialog>

				<CustomDialog
					openModal={isMsgModalAfterSubmitOpen}
					closeModal={() => {
						setIsMsgModalAfterSubmitOpen(false);
						navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
					}}
					maxWidth='sm'>
					<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '2rem auto 0 auto' }}>
						<Box>
							<Typography variant='body1' sx={{ mb: '0.75rem', lineHeight: '1.9', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>
								You will receive feedback on the quiz from your instructor soon. You can review the answers for the following question types by
								revisiting the quiz:
							</Typography>
						</Box>

						<Box sx={{ ml: '3rem' }}>
							{[QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.MATCHING, 'Fill in the Blanks']?.map((type, index) => (
								<Typography key={index} variant='body2' sx={{ lineHeight: '1.9', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									- {type}
								</Typography>
							))}
						</Box>
					</Box>

					<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '90%', margin: '0 auto' }}>
						<CustomSubmitButton
							type='button'
							onClick={() => {
								setIsMsgModalAfterSubmitOpen(false);
								navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}}
							sx={{ width: '2rem', padding: '0.5rem 2rem', margin: '1rem  0rem 2rem 0', height: isMobileSize ? '1.75rem' : '2rem' }}>
							Close
						</CustomSubmitButton>
					</Box>
				</CustomDialog>
			</Box>
		</Box>
	);
};

export default QuizQuestion;
