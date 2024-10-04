import {
	Box,
	DialogActions,
	FormControl,
	FormControlLabel,
	FormHelperText,
	IconButton,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	SelectChangeEvent,
	Tooltip,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../../themes';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import TrueFalseOptions from '../layouts/questionTypes/TrueFalseOptions';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { UserCoursesIdsWithCourseIds } from '../../contexts/UserCourseLessonDataContextProvider';

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

	const { userId, lessonId, courseId, userCourseId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { fetchQuestionTypeName } = useContext(QuestionsContext);
	const { user } = useContext(UserAuthContext);

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

	const [helperText, setHelperText] = useState<string>(!isMatching && !isFITBDragDrop && !isFITBTyping ? 'Choose wisely' : '');
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

	let userCourseData: UserCoursesIdsWithCourseIds[] = [];

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

		const storedUserCourseData: string | null = localStorage.getItem('userCourseData');
		if (storedUserCourseData !== null) {
			userCourseData = JSON.parse(storedUserCourseData);
		}

		setCourseTitle(() => {
			return userCourseData.find((data) => data.courseId === courseId)?.courseTitle || '';
		});

		console.log(userCourseData.find((data) => data.courseId === courseId)?.courseTitle);
	}, []);

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
			userQuizAnswers.map(async (answer) => {
				try {
					await axios.post(`${base_url}/userQuestions`, {
						userLessonId,
						questionId: answer.questionId,
						userId,
						lessonId,
						courseId,
						isCompleted: true,
						isInProgress: false,
						orgId,
						userAnswer: answer.userAnswer,
						userBlankValuePairAnswers: answer.userBlankValuePairAnswers,
						userMatchingPairAnswers: answer.userMatchingPairAnswers,
						videoRecordUrl: answer.videoRecordUrl,
						audioRecordUrl: answer.audioRecordUrl,
						teacherFeedback: '',
						teacherAudioFeedbackUrl: '',
					});
				} catch (error) {
					console.log(error);
				}
			})
		);

		try {
			// Submit quiz
			const submissionResponse = await axios.post(`${base_url}/quizSubmissions`, {
				userId,
				lessonId,
				courseId,
				userLessonId,
				orgId,
			});

			// Fetch instructors
			const instructorsResponse = await axios.get(`${base_url}/users/organisation/${orgId}/admin-users`);
			const instructors = instructorsResponse.data.data;

			// Create the notification data
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

			// Send notifications to each instructor
			for (const instructor of instructors) {
				const notificationRef = collection(db, 'notifications', instructor.firebaseUserId, 'userNotifications');
				await addDoc(notificationRef, notificationData);
			}

			console.log('Notification sent to instructors');
		} catch (error) {
			console.error('Error submitting quiz or sending notifications:', error);
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
							/>
						</Box>
					)}

					{isAudioVideoQuestion && (
						<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
							<Box>
								{question?.audio && !isAudioVideoUploaded && !isLessonCompleted && (
									<CustomSubmitButton onClick={toggleRecordOption('audio')} sx={{ margin: '0 1rem 1rem 0' }} type='button' size='small'>
										Record Audio
									</CustomSubmitButton>
								)}
								{question?.video && !isAudioVideoUploaded && !isLessonCompleted && (
									<CustomSubmitButton onClick={toggleRecordOption('video')} sx={{ margin: '0 0 1rem 0' }} type='button' size='small'>
										Record Video
									</CustomSubmitButton>
								)}
							</Box>
							<Box sx={{ display: 'flex' }}>
								{recordOption === 'video' ? (
									<VideoRecorder uploadVideo={uploadVideo} isVideoUploading={isVideoUploading} />
								) : recordOption === 'audio' ? (
									<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} />
								) : null}
							</Box>

							{isAudioVideoUploaded && (
								<Box>
									{userQuizAnswers?.map((answer) => {
										if (answer.questionId === question._id) {
											if (answer.audioRecordUrl) {
												return (
													<audio
														src={!isLessonCompleted ? answer.audioRecordUrl : uploadUrlForCompletedLesson}
														controls
														key={question._id}
														style={{ marginTop: '1rem', boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.35rem' }}></audio>
												);
											} else if (answer.videoRecordUrl) {
												return (
													<video
														src={!isLessonCompleted ? answer.videoRecordUrl : uploadUrlForCompletedLesson}
														controls
														key={question._id}
														style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.25rem' }}></video>
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
						<Box sx={{ display: 'flex', justifyContent: 'center', width: '80%', margin: '0 auto' }}>
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
						<Box sx={{ display: 'flex', justifyContent: 'center', width: '80%', margin: '11rem auto 0 auto' }}>
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
								width: '80%',
								margin: '11rem auto 0 auto',
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
						<RadioGroup
							name='question'
							value={isLessonCompleted ? userQuizAnswerAfterSubmission : value}
							onChange={handleRadioChange}
							sx={{ alignSelf: 'center' }}>
							{question &&
								question.options &&
								question.options.map((option, index) => {
									let textColor = null;

									if (isLessonCompleted) {
										const isCorrectAnswer = option === question.correctAnswer;
										const isSelectedAnswer = option === userQuizAnswerAfterSubmission;

										if (isCorrectAnswer) {
											textColor = theme.palette.success.main;
										} else if (isSelectedAnswer) {
											textColor = 'red';
										}
									}

									return (
										<FormControlLabel
											value={option}
											control={<Radio />}
											label={
												<Typography
													sx={{
														color: textColor,
														fontWeight: option === question.correctAnswer ? 900 : 'normal',
														display: 'flex',
														alignItems: 'center',
													}}>
													{option}
													{isLessonCompleted && option === question.correctAnswer && (
														<CheckCircle sx={{ color: theme.palette.success.main, marginLeft: 1 }} />
													)}
												</Typography>
											}
											key={index}
										/>
									);
								})}
						</RadioGroup>
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
							<Typography variant='h6' sx={{ mb: '0.5rem' }}>
								Instructor Feedback
							</Typography>
							<Box>
								<Typography variant='body2'>{teacherQuestionFeedback}</Typography>
							</Box>
							{teacherQuestionAudioFeedback && (
								<Box sx={{ textAlign: 'center', width: '100%' }}>
									<audio
										src={teacherQuestionAudioFeedback}
										controls
										key={question._id}
										style={{
											marginTop: '1.5rem',
											boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
											borderRadius: '0.35rem',
											width: '80%',
										}}></audio>
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
					position: 'relative',
					mt: '2rem',
					width: '40%',
				}}>
				<IconButton
					sx={{
						flexShrink: 0,
						':hover': {
							color: theme.bgColor?.greenPrimary,
							backgroundColor: 'transparent',
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
					<KeyboardArrowLeft fontSize='large' />
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
						sx={{ mr: '0.5rem' }}
						value={selectedQuestion}
						onChange={handleQuestionChange}
						size='small'
						label='#'
						required
						MenuProps={{
							PaperProps: {
								style: {
									maxHeight: 250,
								},
							},
						}}>
						{Array.from({ length: numberOfQuestions }, (_, i) => (
							<MenuItem key={i + 1} value={i + 1}>
								{i + 1}
							</MenuItem>
						))}
					</Select>
					<Typography> / {numberOfQuestions}</Typography>
				</Box>
				<Tooltip
					title={
						isCompletingCourse ? 'Complete Course' : isLessonCompleted && isLastQuestion ? 'Next Lesson' : isCompletingLesson ? 'Submit Quiz' : ''
					}
					placement='top'>
					<IconButton
						onClick={() => {
							if (isLastQuestion && !isLessonCompleted) {
								setIsSubmitQuizModalOpen(true);
							} else if (isLastQuestion && isLessonCompleted) {
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}
							if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
								setDisplayedQuestionNumber((prev) => prev + 1);
								setSelectedQuestion(displayedQuestionNumber + 1);
							}
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						sx={{
							flexShrink: 0,
							':hover': {
								color: theme.bgColor?.greenPrimary,
								backgroundColor: 'transparent',
							},
						}}>
						{isCompletingCourse ? (
							<DoneAll fontSize='large' />
						) : isLessonCompleted && isLastQuestion ? (
							<KeyboardDoubleArrowRight fontSize='large' />
						) : isCompletingLesson ? (
							<Done fontSize='large' />
						) : (
							<KeyboardArrowRight fontSize='large' />
						)}
					</IconButton>
				</Tooltip>
				<CustomDialog
					openModal={isSubmitQuizModalOpen}
					closeModal={() => setIsSubmitQuizModalOpen(false)}
					content='Are you sure you want to submit the quiz?'>
					{userQuizAnswersUploading ? (
						<DialogActions sx={{ marginBottom: '1.5rem' }}>
							<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
						</DialogActions>
					) : (
						<CustomDialogActions onCancel={() => setIsSubmitQuizModalOpen(false)} onSubmit={handleQuizSubmission} submitBtnText='Submit' />
					)}
				</CustomDialog>

				<CustomDialog
					openModal={isMsgModalAfterSubmitOpen}
					closeModal={() => {
						setIsMsgModalAfterSubmitOpen(false);
						navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', width: '90%', margin: '0 auto' }}>
						<Box>
							<Typography variant='body1' sx={{ mb: '0.75rem', lineHeight: '1.9' }}>
								You will receive feedback on the quiz from your instructor soon. You can review the answers for the following question types by
								revisiting the quiz:
							</Typography>
						</Box>

						<Box sx={{ ml: '3rem' }}>
							{[QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.MATCHING, 'Fill in the Blanks'].map((type, index) => (
								<Typography key={index} variant='body2' sx={{ lineHeight: '1.9' }}>
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
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}}
							sx={{ width: 'fit-content', padding: '0.5rem 2rem', margin: '2rem  0rem' }}>
							Close
						</CustomSubmitButton>
					</Box>
				</CustomDialog>
			</Box>
		</Box>
	);
};

export default QuizQuestion;
