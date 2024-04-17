import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Radio,
	Select,
	SelectChangeEvent,
	Snackbar,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import theme from '../themes';
import {
	AddCircle,
	Delete,
	Edit,
	FileCopy,
	KeyboardBackspaceOutlined,
	RemoveCircle,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { Lesson } from '../interfaces/lessons';
import axios from 'axios';
import { QuestionInterface } from '../interfaces/question';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import ReactPlayer from 'react-player/lazy';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import CustomErrorMessage from '../components/forms/Custom Fields/CustomErrorMessage';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/use-raised-shadow';
import { QuestionType } from '../interfaces/questionTypes';

const AdminLessonEditPage = () => {
	const navigate = useNavigate();
	const { userId, lessonId } = useParams();
	const { updateLessonPublishing, updateLesson } = useContext(LessonsContext);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleLesson, setSingleLesson] = useState<Lesson>();
	const [questions, setQuestions] = useState<QuestionInterface[]>([]);
	const [newQuestion, setNewQuestion] = useState<QuestionInterface>();
	const [isActive, setIsActive] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [displayedQuestionNonEdit, setDisplayedQuestionNonEdit] =
		useState<QuestionInterface | null>(null);
	const [isDisplayNonEditQuestion, setIsDisplayNonEditQuestion] = useState<boolean>(false);
	const [isLessonUpdated, setIsLessonUpdated] = useState<boolean>(false);
	const [questionType, setQuestionType] = useState<string>('');
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
	const [options, setOptions] = useState<string[]>(['']);
	const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(-1);

	const addOption = () => {
		setOptions([...options, '']);
	};

	const removeOption = (indexToRemove: number) => {
		const newOptions = [...options];
		newOptions.splice(indexToRemove, 1); // Remove the option at the specified index
		setOptions(newOptions);
		if (indexToRemove === correctAnswerIndex) {
			setCorrectAnswerIndex(-1); // Reset correct answer index if the removed option was the correct answer
		} else if (indexToRemove < correctAnswerIndex) {
			setCorrectAnswerIndex(correctAnswerIndex - 1); // Adjust correct answer index if an option before it is removed
		}
	};
	const handleCorrectAnswerChange = (index: number) => {
		setCorrectAnswerIndex(index); // Set the correct answer index
	};

	const vertical = 'top';
	const horizontal = 'center';

	useEffect(() => {
		if (lessonId) {
			const fetchSingleLessonData = async (lessonId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/lessons/${lessonId}`);

					const lessonsResponse = response?.data?.data[0];

					setSingleLesson(lessonsResponse);

					setIsActive(lessonsResponse.isActive);
					setQuestions(lessonsResponse.questions);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleLessonData(lessonId);
		}
		const fetchQuestionTypes = async (): Promise<void> => {
			try {
				const response = await axios.get(`${base_url}/questiontypes`);
				setQuestionTypes(response.data.data);
			} catch (error) {
				console.log(error);
			}
		};

		fetchQuestionTypes();
	}, [lessonId, isActive]);

	const handlePublishing = async (): Promise<void> => {
		if (lessonId !== undefined) {
			try {
				await axios.patch(`${base_url}/lessons/${lessonId}`, {
					isActive: !singleLesson?.isActive,
				});
				setIsActive(!singleLesson?.isActive);
				updateLessonPublishing(lessonId);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	const handleLessonUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		console.log(singleLesson);

		if (singleLesson !== undefined && isLessonUpdated) {
			try {
				await axios.patch(`${base_url}/lessons/${lessonId}`, singleLesson);
				setIsLessonUpdated(false);
				updateLesson(singleLesson);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const createQuestion = async () => {
		try {
			// const response = await axios.post(`${base_url}/questions`, {
			// 	questionType,
			// 	question,
			// 	imageUrl,
			// 	videoUrl,
			// 	options,
			// 	correctAnswer,
			// });
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<DashboardPagesLayout
			pageName='Edit Lesson'
			customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '90%' }}>
				<Paper
					elevation={10}
					sx={{
						width: '100%',
						height: '7rem',
						m: '2.25rem 0',
						backgroundColor: theme.palette.primary.main,
					}}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							height: '100%',
							width: '100%',
						}}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								flex: 2,
								padding: '0.5rem',
							}}>
							<Box>
								<Button
									variant='text'
									startIcon={<KeyboardBackspaceOutlined />}
									sx={{
										color: theme.textColor?.common.main,
										textTransform: 'inherit',
										fontFamily: theme.fontFamily?.main,
										':hover': {
											backgroundColor: 'transparent',
											textDecoration: 'underline',
										},
									}}
									onClick={() => {
										navigate(`/admin/lessons/user/${userId}`);
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}}>
									Back to lessons
								</Button>
							</Box>
							<Box sx={{ width: '100%' }}>
								<Typography
									variant='h6'
									sx={{
										textTransform: 'capitalize',
										color: theme.textColor?.common.main,
										padding: '0.5rem',
									}}>
									{singleLesson?.type}
								</Typography>
							</Box>
						</Box>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'flex-end',
								flex: 1,
								mr: '3rem',
							}}>
							<Typography variant='h3' sx={{ color: theme.textColor?.common.main }}>
								{singleLesson?.title}
							</Typography>
							<Typography
								variant='body2'
								sx={{ color: theme.textColor?.common.main, mt: '0.75rem' }}>
								{isActive ? '(Published)' : '(Unpublished)'}
							</Typography>
						</Box>
					</Box>
				</Paper>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						width: '100%',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
						<Box sx={{ height: '8rem', width: '12rem', mr: '2rem' }}>
							{singleLesson?.imageUrl && (
								<img
									src={singleLesson.imageUrl}
									alt='course_img'
									height='100%'
									style={{
										borderRadius: '0.2rem',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									}}
								/>
							)}
							<Typography variant='body2' sx={{ mt: '0.35rem' }}>
								Lesson Image
							</Typography>
						</Box>
						<Box
							sx={{ height: '8rem', width: '12rem', cursor: 'pointer' }}
							onClick={() => {
								if (singleLesson?.videoUrl) {
									setIsVideoPlayerOpen(true);
								}
							}}>
							{singleLesson?.videoUrl ? (
								<Box
									sx={{
										height: '100%',
										width: '100%',
										position: 'relative',
									}}>
									<ReactPlayer
										url={singleLesson?.videoUrl}
										height='100%'
										width='100%'
										style={{
											borderRadius: '0.2rem',
											boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
										}}
										light={true}
										controls={false}
									/>
									<Box
										sx={{
											position: 'absolute',
											top: 0,
											left: 0,
											height: '100%',
											width: '100%',
											zIndex: 1000,
											backgroundColor: 'transparent',
											cursor: 'pointer',
										}}
										onClick={() => {
											if (singleLesson?.videoUrl) {
												setIsVideoPlayerOpen(true);
											}
										}}></Box>
								</Box>
							) : (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										height: '100%',
									}}>
									<img
										src={
											'https://www.47pitches.com/contents/images/no-video.jpg'
										}
										alt='video_thumbnail'
										height='100%'
										width='100%'
										style={{
											borderRadius: '0.2rem',
											boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
										}}
									/>
								</Box>
							)}
							<Typography variant='body2' sx={{ mt: '0.35rem' }}>
								Video Thumbnail
							</Typography>
						</Box>
						<Dialog
							open={isVideoPlayerOpen}
							onClose={() => {
								setIsVideoPlayerOpen(false);
							}}
							fullWidth
							maxWidth='md'
							sx={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
							<ReactPlayer
								url={singleLesson?.videoUrl}
								height='30rem'
								width='55rem'
								style={{ margin: '0.5rem' }}
								controls={true}
							/>
						</Dialog>
					</Box>
					<Box sx={{ display: 'flex' }}>
						<Box>
							<CustomSubmitButton
								sx={{
									visibility: isEditMode ? 'hidden' : 'visible',
								}}
								onClick={handlePublishing}>
								{isActive ? 'Unpublish' : 'Publish'}
							</CustomSubmitButton>
						</Box>
						<Snackbar
							open={isMissingFieldMsgOpen}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '14rem' }}
							onClose={() => setIsMissingFieldMsgOpen(false)}>
							<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
								Fill the required field(s)
							</Alert>
						</Snackbar>
						{isEditMode ? (
							<Box>
								<CustomSubmitButton
									onClick={(e) => {
										if (
											singleLesson?.title.trim() !== '' &&
											singleLesson?.title !== ''
										) {
											setIsEditMode(false);
											handleLessonUpdate(e as FormEvent<Element>);
										} else {
											setIsMissingField(true);
											setIsMissingFieldMsgOpen(true);
										}
									}}>
									Save
								</CustomSubmitButton>
								<CustomCancelButton
									onClick={() => {
										setIsEditMode(false);
										setIsLessonUpdated(false);
									}}>
									Cancel
								</CustomCancelButton>
							</Box>
						) : (
							<Box sx={{ ml: '1rem' }}>
								<Tooltip title='Edit Lesson' placement='top'>
									<IconButton
										onClick={() => {
											setIsEditMode(true);
										}}>
										<Edit />
									</IconButton>
								</Tooltip>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
			{!isEditMode && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
						mt: '3rem',
					}}>
					<Box sx={{ mt: '3rem', minHeight: '40vh' }}>
						<Typography variant='h4'>Questions</Typography>
						{singleLesson?.questionIds?.length === 0 ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: '30vh',
								}}>
								<Typography variant='body1'>No question for this lesson</Typography>
							</Box>
						) : (
							<>
								{singleLesson &&
									singleLesson.questions &&
									singleLesson.questions.map((question) => {
										return (
											<Box
												key={question._id}
												sx={{
													display: 'flex',
													alignItems: 'center',
													height: '5rem',
													width: '80%',
													backgroundColor: theme.bgColor?.common,
													margin: '1.25rem 0',
													borderRadius: '0.25rem',
													boxShadow:
														'0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
													cursor: 'pointer',
												}}
												onClick={() => {
													setDisplayedQuestionNonEdit(question);
													setIsDisplayNonEditQuestion(true);
												}}>
												<Box
													sx={{
														height: '5rem',
														width: '4rem',
													}}>
													<img
														src='https://images.unsplash.com/photo-1601027847350-0285867c31f7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cXVlc3Rpb24lMjBtYXJrfGVufDB8fDB8fHww'
														alt='question_img'
														height='100%'
														width='100%'
														style={{
															borderRadius: '0.25rem 0 0 0.25rem',
														}}
													/>
												</Box>
												<Box sx={{ ml: '1rem' }}>
													<Typography variant='h6'>
														{question.question}
													</Typography>
												</Box>
											</Box>
										);
									})}
							</>
						)}
					</Box>
				</Box>
			)}
			<Dialog
				open={isDisplayNonEditQuestion}
				onClose={() => {
					setIsDisplayNonEditQuestion(false);
					setDisplayedQuestionNonEdit(null);
				}}
				sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
				fullWidth
				maxWidth='md'>
				<DialogContent>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '20rem',
							width: '40rem',
							margin: '0.5rem 0.5rem 2rem 0.5rem',
						}}>
						{displayedQuestionNonEdit?.imageUrl && (
							<Box sx={{ height: '100%', width: '100%', marginRight: '1rem' }}>
								<img
									src={displayedQuestionNonEdit?.imageUrl}
									alt='question_img'
									height='100%'
									width='100%'
									style={{
										borderRadius: '0.2rem',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									}}
								/>
							</Box>
						)}

						{displayedQuestionNonEdit?.videoUrl && (
							<Box
								sx={{
									height: '100%',
									width: '100%',
								}}>
								<ReactPlayer
									url={displayedQuestionNonEdit?.videoUrl}
									height='100%'
									width='100%'
									style={{
										borderRadius: '0.2rem',
										boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									}}
									controls={true}
								/>
							</Box>
						)}
					</Box>
					<Box>
						<Typography variant='body1'>
							{displayedQuestionNonEdit?.question}
						</Typography>
						{displayedQuestionNonEdit &&
							displayedQuestionNonEdit.options &&
							displayedQuestionNonEdit.options.map((option, index) => {
								const choiceLabel = String.fromCharCode(97 + index) + ')';
								return (
									<Typography
										key={index}
										sx={{
											margin: '1rem 0 0 2rem',
											color:
												option === displayedQuestionNonEdit.correctAnswer
													? theme.textColor?.greenSecondary.main
													: null,
											fontStyle:
												option === displayedQuestionNonEdit.correctAnswer
													? 'italic'
													: null,
										}}>
										{choiceLabel} {option}
									</Typography>
								);
							})}
					</Box>
				</DialogContent>
			</Dialog>
			{isEditMode && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
						mt: '3rem',
					}}>
					<form onSubmit={handleLessonUpdate}>
						<Box sx={{ mt: '3rem' }}>
							<Typography variant='h4'>Title*</Typography>
							<CustomTextField
								sx={{
									marginTop: '0.5rem',
								}}
								value={singleLesson?.title}
								onChange={(e) => {
									setIsLessonUpdated(true);

									setSingleLesson(() => {
										if (singleLesson?.title !== undefined) {
											return { ...singleLesson, title: e.target.value };
										}
									});
									setIsMissingField(false);
								}}
								error={isMissingField && singleLesson?.title === ''}
							/>
							{isMissingField && singleLesson?.title === '' && (
								<CustomErrorMessage>Please enter a title</CustomErrorMessage>
							)}
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								width: '100%',
								mt: '5rem',
							}}>
							<Typography variant='h4' sx={{ mb: '1rem' }}>
								Questions
							</Typography>
							<Box>
								<CustomSubmitButton
									sx={{ margin: '0 0.5rem 1rem 0' }}
									onClick={() => {}}>
									Add Question
								</CustomSubmitButton>
								<CustomSubmitButton
									sx={{ marginBottom: '1rem' }}
									onClick={() => {
										setIsQuestionCreateModalOpen(true);
										setQuestionType('');
										setOptions(['']);
									}}>
									Create Question
								</CustomSubmitButton>
							</Box>
						</Box>

						<Dialog
							open={isQuestionCreateModalOpen}
							onClose={() => setIsQuestionCreateModalOpen(false)}
							fullWidth
							maxWidth='md'>
							<DialogTitle variant='h3' sx={{ paddingTop: '2rem' }}>
								Create New Question
							</DialogTitle>
							<form
								onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
									e.preventDefault();
									createQuestion();
									setIsQuestionCreateModalOpen(false);
								}}
								style={{ display: 'flex', flexDirection: 'column' }}>
								<DialogContent>
									<FormControl sx={{ mb: '1rem', width: '15rem' }}>
										<InputLabel id='type' sx={{ fontSize: '0.9rem' }}>
											Type
										</InputLabel>
										<Select
											labelId='type'
											id='lesson_type'
											value={questionType}
											onChange={(event: SelectChangeEvent) => {
												setQuestionType(event.target.value);
												setNewQuestion((prevQuestion) => {
													if (newQuestion?.questionType !== undefined) {
														return {
															...newQuestion,
															questionType: questionTypes.map(
																(type) => {
																	if (
																		type.name ===
																		event.target.value
																	) {
																		return type._id;
																	}
																}
															)[0],
														};
													}
													return prevQuestion;
												});
											}}
											size='medium'
											label='Type'
											required>
											{questionTypes &&
												questionTypes.map((type) => (
													<MenuItem value={type.name} key={type._id}>
														{type.name}
													</MenuItem>
												))}
										</Select>
									</FormControl>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
										}}>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}>
											<Box sx={{ flex: 1, mr: '2rem' }}>
												<CustomTextField
													label='Video URL'
													required={false}
												/>
											</Box>
											<Box sx={{ flex: 1 }}>
												<CustomTextField
													label='Image URL'
													required={false}
												/>
											</Box>
										</Box>
										<Box>
											<CustomTextField label='Question' />
										</Box>
										{questionType === 'Multi Choice' && (
											<Box
												sx={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'flex-end',
													width: '100%',
												}}>
												{options.map((option, index) => (
													<Box
														key={index}
														sx={{
															display: 'flex',
															justifyContent: 'flex-end',
															alignItems: 'center',
															width: '90%',
															marginLeft: '3rem',
														}}>
														<Tooltip
															title='Correct Answer'
															placement='left'>
															<FormControlLabel
																control={
																	<Radio
																		checked={
																			index ===
																			correctAnswerIndex
																		}
																		onChange={() =>
																			handleCorrectAnswerChange(
																				index
																			)
																		}
																		color='primary'
																	/>
																}
																label=''
															/>
														</Tooltip>
														{index === options.length - 1 && (
															<Tooltip
																title='Add Option'
																placement='top'>
																<IconButton onClick={addOption}>
																	<AddCircle />
																</IconButton>
															</Tooltip>
														)}
														<CustomTextField
															label={`Option ${index + 1}`}
															value={option}
															onChange={(e) => {
																const newOptions = [...options];
																newOptions[index] = e.target.value;
																setOptions(newOptions);
															}}
															sx={{
																marginTop: '0.75rem',
																marginRight:
																	index === 0 ? '2.5rem' : 0,
															}}
														/>
														{index > 0 && (
															<Tooltip
																title='Remove Option'
																placement='top'>
																<IconButton
																	onClick={() =>
																		removeOption(index)
																	}>
																	<RemoveCircle />
																</IconButton>
															</Tooltip>
														)}
													</Box>
												))}
											</Box>
										)}
									</Box>
								</DialogContent>
								<DialogActions
									sx={{
										marginBottom: '2rem',
									}}>
									<CustomCancelButton
										onClick={() => setIsQuestionCreateModalOpen(false)}
										sx={{
											margin: '0 0.5rem 1rem 0',
										}}>
										Cancel
									</CustomCancelButton>
									<CustomSubmitButton
										sx={{
											margin: '0 0.5rem 1rem 0',
										}}>
										Create
									</CustomSubmitButton>
								</DialogActions>
							</form>
						</Dialog>

						{singleLesson?.questionIds.length === 0 ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: '30vh',
								}}>
								<Typography variant='body1'>No question for this lesson</Typography>
							</Box>
						) : (
							<Reorder.Group
								axis='y'
								values={questions}
								onReorder={(newQuestions): void => {
									setIsLessonUpdated(true);
									setQuestions(newQuestions);
									setSingleLesson((prevLesson: Lesson | undefined) => {
										if (prevLesson?.questions !== undefined) {
											const questionIds: string[] = newQuestions
												.filter(
													(newQuestion) => newQuestion._id !== undefined
												) // Filter out undefined _id
												.map((newQuestion) => newQuestion._id!); // Assert _id as string
											console.log(questionIds);
											console.log(newQuestions);
											return {
												...prevLesson,
												questions: newQuestions,
												questionIds: questionIds,
											};
										}
										return prevLesson;
									});
								}}>
								{singleLesson &&
									singleLesson.questionIds.length !== 0 &&
									singleLesson.questions.map((question) => {
										return (
											<Reorder.Item
												key={question._id}
												value={question}
												style={{
													listStyle: 'none',
													boxShadow,
												}}>
												<Box
													key={question._id}
													sx={{
														display: 'flex',
														alignItems: 'center',
														height: '5rem',
														width: '100%',
														backgroundColor: theme.bgColor?.common,
														margin: '1.25rem 0',
														borderRadius: '0.25rem',
														boxShadow:
															'0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
														cursor: 'pointer',
													}}>
													<Box
														sx={{
															height: '5rem',
															width: '4rem',
														}}>
														<img
															src='https://images.unsplash.com/photo-1601027847350-0285867c31f7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cXVlc3Rpb24lMjBtYXJrfGVufDB8fDB8fHww'
															alt='question_img'
															height='100%'
															width='100%'
															style={{
																borderRadius: '0.25rem 0 0 0.25rem',
															}}
														/>
													</Box>
													<Box
														sx={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
															width: '100%',
															mr: '1rem',
														}}>
														<Box sx={{ ml: '1rem' }}>
															<Typography variant='h6'>
																{question.question}
															</Typography>
														</Box>

														<Box sx={{ display: 'flex' }}>
															<Box>
																<Tooltip
																	title='Clone'
																	placement='top'>
																	<IconButton>
																		<FileCopy />
																	</IconButton>
																</Tooltip>
															</Box>
															<Box>
																<Tooltip
																	title='Edit'
																	placement='top'>
																	<IconButton>
																		<Edit />
																	</IconButton>
																</Tooltip>
															</Box>
															<Tooltip title='Remove' placement='top'>
																<IconButton>
																	<Delete />
																</IconButton>
															</Tooltip>
														</Box>
													</Box>
												</Box>
											</Reorder.Item>
										);
									})}
							</Reorder.Group>
						)}
					</form>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminLessonEditPage;
