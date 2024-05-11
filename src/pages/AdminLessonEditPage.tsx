import {
	Box,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Radio,
	Select,
	SelectChangeEvent,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import theme from '../themes';
import { AddCircle, Delete, Edit, FileCopy, RemoveCircle } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { Lesson } from '../interfaces/lessons';
import axios from 'axios';
import { QuestionInterface } from '../interfaces/question';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/useRaisedShadow';
import { QuestionType } from '../interfaces/questionTypes';
import LessonPaper from '../components/adminSingleLesson/Paper';
import QuestionDialogContentNonEdit from '../components/adminSingleLesson/QuestionDialogContentNonEdit';
import LessonEditorBox from '../components/adminSingleLesson/LessonEditorBox';
import QuestionsBoxNonEdit from '../components/adminSingleLesson/QuestionsBoxNonEdit';
import CustomDialog from '../components/layouts/dialog2/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog2/CustomDialogActions';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

export interface QuestionUpdateTrack {
	questionId: string;
	isUpdated: boolean;
}

const AdminLessonEditPage = () => {
	const { userId, lessonId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { updateLessonPublishing, updateLesson } = useContext(LessonsContext);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [singleLesson, setSingleLesson] = useState<Lesson>();
	const [questions, setQuestions] = useState<QuestionInterface[]>([]);
	const [questionIds, setQuestionIds] = useState<string[]>([]);

	const [isActive, setIsActive] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [displayedQuestionNonEdit, setDisplayedQuestionNonEdit] = useState<QuestionInterface | null>(null);
	const [isDisplayNonEditQuestion, setIsDisplayNonEditQuestion] = useState<boolean>(false);
	const [isLessonUpdated, setIsLessonUpdated] = useState<boolean>(false);
	const [newQuestion, setNewQuestion] = useState<QuestionInterface>({
		_id: '',
		questionType: '',
		question: '',
		options: [],
		correctAnswer: '',
		videoUrl: '',
		imageUrl: '',
		orgId,
		isActive: true,
		createdAt: '',
		updatedAt: '',
	});
	const [questionType, setQuestionType] = useState<string>('');
	const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
	const [options, setOptions] = useState<string[]>(['']);
	const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(-1);
	const [correctAnswer, setCorrectAnswer] = useState<string>('');
	const [isQuestionUpdated, setIsQuestionUpdated] = useState<QuestionUpdateTrack[]>([]);

	// Define state for tracking edit modal visibility for each question
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<Array<boolean>>(new Array(questions.length).fill(false));

	// Function to toggle edit modal for a specific question
	const toggleQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setEditQuestionModalOpen(newEditModalOpen);
	};
	const closeQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = false;
		setEditQuestionModalOpen(newEditModalOpen);
	};

	const addOption = () => {
		setOptions([...options, '']);
	};

	const removeOption = (indexToRemove: number) => {
		const newOptions = [...options];
		newOptions.splice(indexToRemove, 1); // Remove the option at the specified index
		setOptions(newOptions);
		if (indexToRemove === correctAnswerIndex) {
			setCorrectAnswerIndex(-1); // Reset correct answer index if the removed option was the correct answer
			setCorrectAnswer('');
		} else if (indexToRemove < correctAnswerIndex) {
			setCorrectAnswerIndex(correctAnswerIndex - 1); // Adjust correct answer index if an option before it is removed
			setCorrectAnswer(options[correctAnswerIndex - 1]);
		}
	};
	const handleCorrectAnswerChange = (index: number) => {
		setCorrectAnswerIndex(index); // Set the correct answer index
		setCorrectAnswer(options[index]);
	};

	const handleOptionChange = (index: number, newValue: string) => {
		const newOptions = [...options];
		newOptions[index] = newValue;
		setOptions(newOptions);
	};

	useEffect(() => {
		if (lessonId) {
			const fetchSingleLessonData = async (lessonId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/lessons/${lessonId}`);

					const lessonsResponse = response?.data?.data[0];

					setSingleLesson(lessonsResponse);

					setIsActive(lessonsResponse.isActive);
					setQuestions(lessonsResponse.questions);
					setQuestionIds(lessonsResponse.questionIds);

					const questionUpdateData: QuestionUpdateTrack[] = lessonsResponse?.questions?.reduce(
						(acc: QuestionUpdateTrack[], value: QuestionInterface) => {
							acc.push({ questionId: value?._id, isUpdated: false });
							return acc;
						},
						[]
					);
					setIsQuestionUpdated(questionUpdateData);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleLessonData(lessonId);
		}
		const fetchQuestionTypes = async (): Promise<void> => {
			try {
				const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
				setQuestionTypes(response.data.data);
			} catch (error) {
				console.log(error);
			}
		};

		fetchQuestionTypes();
	}, [lessonId, isActive, resetChanges]);

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

		if (singleLesson !== undefined && isLessonUpdated && isQuestionUpdated.some((data) => data.isUpdated === true)) {
			try {
				await axios.patch(`${base_url}/lessons/${lessonId}`, singleLesson);
				setIsLessonUpdated(false);
				updateLesson(singleLesson);

				await Promise.all(
					questions?.map(async (question, index) => {
						if (isQuestionUpdated[index]?.isUpdated) {
							await axios.patch(`${base_url}/questions/${question._id}`, question);
						}
					})
				);
			} catch (error) {
				console.log(error);
			}
		}
		setIsQuestionUpdated((prevData) => {
			prevData = prevData.map((data) => {
				return { ...data, isUpdated: false };
			});
			return prevData;
		});
	};

	const createQuestion = async () => {
		try {
			const response = await axios.post(`${base_url}/questions`, {
				questionType: questionTypes.filter((type) => type.name === questionType)[0]._id,
				question: newQuestion?.question,
				imageUrl: newQuestion?.imageUrl,
				videoUrl: newQuestion?.videoUrl,
				options,
				correctAnswer,
				isActive: true,
				orgId,
			});
			setIsLessonUpdated(true);

			setQuestions((prevQuestions) => {
				return [response.data, ...prevQuestions];
			});

			setQuestionIds((prevIds) => {
				return [response.data._id, ...prevIds];
			});

			setSingleLesson((prevLesson) => {
				if (prevLesson !== undefined) {
					return {
						...prevLesson,
						questions: [response.data, ...prevLesson.questions],
						questionIds: [response.data._id, ...prevLesson.questionIds],
					};
				}
				return prevLesson;
			});
		} catch (error) {
			console.log(error);
		}
	};

	const cloneQuestion = async (question: QuestionInterface) => {
		try {
			const response = await axios.post(`${base_url}/questions/organisation/${orgId}`, {
				questionType: question.questionType,
				question: question.question,
				imageUrl: question.imageUrl,
				videoUrl: question.videoUrl,
				options: question.options,
				correctAnswer: question.correctAnswer,
				orgId,
			});

			setIsLessonUpdated(true);

			setQuestions((prevQuestions) => {
				const cloneIndex = prevQuestions.findIndex((q) => {
					if (q !== null) {
						return q._id === question._id;
					}
				});

				// Insert the cloned question right after it in the questions array
				const updatedQuestions = [...prevQuestions];
				updatedQuestions.splice(cloneIndex + 1, 0, response.data);

				// Insert the _id of the cloned question in the questionIds array
				const updatedIds = [...questionIds];
				updatedIds.splice(cloneIndex + 1, 0, response.data._id);

				// Update both questions and questionIds arrays
				setQuestionIds(updatedIds);

				setSingleLesson((prevLesson) => {
					if (prevLesson !== undefined) {
						// Find the index of the cloned question
						const cloneIndex = prevLesson.questions.findIndex((q) => {
							if (q !== null) {
								return q._id === question._id;
							}
						});
						// Insert the cloned question right after it
						const updatedQuestions = [...prevLesson.questions];
						updatedQuestions.splice(cloneIndex + 1, 0, response.data);

						return {
							...prevLesson,
							questions: updatedQuestions,
							questionIds: updatedIds,
						};
					}
					return prevLesson;
				});

				return updatedQuestions;
			});
		} catch (error) {
			console.log(error);
		}
	};

	const removeQuestion = (question: QuestionInterface) => {
		const updatedQuestions = questions.filter((thisQuestion) => {
			if (thisQuestion !== null) {
				return thisQuestion._id !== question._id;
			}
		});
		const updatedQuestionIds = updatedQuestions.map((question) => question._id!);
		setIsLessonUpdated(true);
		setQuestions(updatedQuestions);

		setQuestionIds(updatedQuestionIds);
		setSingleLesson((prevLesson) => {
			if (prevLesson?.questionIds !== undefined) {
				return {
					...prevLesson,
					questionIds: updatedQuestionIds,
					questions: updatedQuestions,
				};
			}
			return prevLesson;
		});
	};

	return (
		<DashboardPagesLayout pageName='Edit Lesson' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '90%' }}>
				<LessonPaper userId={userId} singleLesson={singleLesson} isActive={isActive} />
				<LessonEditorBox
					singleLesson={singleLesson}
					isEditMode={isEditMode}
					isActive={isActive}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					resetChanges={resetChanges}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					setIsMissingField={setIsMissingField}
					handlePublishing={handlePublishing}
					setResetChanges={setResetChanges}
					handleLessonUpdate={handleLessonUpdate}
					setIsLessonUpdated={setIsLessonUpdated}
					setIsQuestionUpdated={setIsQuestionUpdated}
				/>
			</Box>
			{!isEditMode && (
				<QuestionsBoxNonEdit
					singleLesson={singleLesson}
					setIsDisplayNonEditQuestion={setIsDisplayNonEditQuestion}
					setDisplayedQuestionNonEdit={setDisplayedQuestionNonEdit}
				/>
			)}

			<CustomDialog
				openModal={isDisplayNonEditQuestion}
				closeModal={() => {
					setIsDisplayNonEditQuestion(false);
					setDisplayedQuestionNonEdit(null);
				}}>
				<QuestionDialogContentNonEdit question={displayedQuestionNonEdit} />
			</CustomDialog>

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
							{isMissingField && singleLesson?.title === '' && <CustomErrorMessage>Please enter a title</CustomErrorMessage>}
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
								<CustomSubmitButton sx={{ margin: '0 0.5rem 1rem 0' }} onClick={() => {}}>
									Add Question
								</CustomSubmitButton>
								<CustomSubmitButton
									type='button'
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

						<CustomDialog openModal={isQuestionCreateModalOpen} closeModal={() => setIsQuestionCreateModalOpen(false)} title='Create Question'>
							<form
								onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
									e.preventDefault();
									createQuestion();
									setIsQuestionCreateModalOpen(false);
								}}
								style={{ display: 'flex', flexDirection: 'column' }}>
								<DialogContent>
									<FormControl sx={{ mb: '1rem', width: '15rem', backgroundColor: theme.bgColor?.common }}>
										<InputLabel id='type' sx={{ fontSize: '0.9rem' }} required>
											Type
										</InputLabel>
										<Select
											labelId='type'
											id='lesson_type'
											value={questionType}
											onChange={(event: SelectChangeEvent) => {
												setQuestionType(event.target.value);
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
													value={newQuestion?.videoUrl}
													label='Video URL'
													required={false}
													onChange={(e) => {
														setNewQuestion((prevQuestion) => {
															if (prevQuestion?.videoUrl !== undefined) {
																return {
																	...prevQuestion,
																	videoUrl: e.target.value,
																};
															}
															return prevQuestion;
														});
													}}
												/>
											</Box>
											<Box sx={{ flex: 1 }}>
												<CustomTextField
													value={newQuestion?.imageUrl}
													label='Image URL'
													required={false}
													onChange={(e) => {
														setNewQuestion((prevQuestion) => {
															if (prevQuestion?.imageUrl !== undefined) {
																return {
																	...prevQuestion,
																	imageUrl: e.target.value,
																};
															}
															return prevQuestion;
														});
													}}
												/>
											</Box>
										</Box>
										<Box>
											<CustomTextField
												value={newQuestion?.question}
												label='Question'
												onChange={(e) => {
													setNewQuestion((prevQuestion) => {
														if (prevQuestion?.question !== undefined) {
															return {
																...prevQuestion,
																question: e.target.value,
															};
														}
														return prevQuestion;
													});
												}}
											/>
										</Box>
										{questionType === 'Multiple Choice' && (
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
														<Tooltip title='Correct Answer' placement='left'>
															<FormControlLabel
																control={
																	<Radio checked={index === correctAnswerIndex} onChange={() => handleCorrectAnswerChange(index)} color='primary' />
																}
																label=''
															/>
														</Tooltip>
														{index === options.length - 1 && (
															<Tooltip title='Add Option' placement='top'>
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
																marginRight: index === 0 ? '2.5rem' : 0,
															}}
														/>
														{index > 0 && (
															<Tooltip title='Remove Option' placement='top'>
																<IconButton onClick={() => removeOption(index)}>
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
								<CustomDialogActions
									onCancel={() => setIsQuestionCreateModalOpen(false)}
									cancelBtnSx={{ margin: '0 0.5rem 1rem 0' }}
									submitBtnSx={{ margin: '0 1rem 1rem 0' }}
								/>
							</form>
						</CustomDialog>

						{singleLesson?.questionIds.length === 0 || questions.length === 0 ? (
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
												.filter((newQuestion) => newQuestion._id !== undefined) // Filter out undefined _id
												.map((newQuestion) => newQuestion._id!); // Assert _id as string
											return {
												...prevLesson,
												questions: newQuestions,
												questionIds: questionIds,
											};
										}
										return prevLesson;
									});
								}}>
								{questions &&
									questions.length !== 0 &&
									questions.map((question, index) => {
										if (question !== null) {
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
															boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
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
																<Typography variant='h6'>{question.question}</Typography>
															</Box>

															<Box sx={{ display: 'flex' }}>
																<Box>
																	<Tooltip title='Clone' placement='top'>
																		<IconButton
																			onClick={() => {
																				cloneQuestion(question);
																			}}>
																			<FileCopy />
																		</IconButton>
																	</Tooltip>
																</Box>
																<Box>
																	<Tooltip title='Edit' placement='top'>
																		<IconButton
																			onClick={() => {
																				toggleQuestionEditModal(index);
																				if (question.options && question.correctAnswer) {
																					setOptions(question.options);
																					setCorrectAnswer(question.correctAnswer);
																				}
																			}}>
																			<Edit />
																		</IconButton>
																	</Tooltip>

																	<CustomDialog
																		openModal={editQuestionModalOpen[index]}
																		closeModal={() => {
																			closeQuestionEditModal(index);
																			// setCorrectAnswerIndex(-1);
																		}}
																		title='Edit Question'>
																		<form
																			onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
																				e.preventDefault();
																			}}>
																			<DialogContent
																				sx={{
																					display: 'flex',
																					flexDirection: 'column',
																					justifyContent: 'center',
																					alignItems: 'center',

																					margin: '0.5rem 0.5rem 2rem 0.5rem',
																				}}>
																				<Box
																					sx={{
																						mt: '3rem',
																						mb: '2rem',
																					}}>
																					<Typography>{question._id}</Typography>
																				</Box>
																				<Box
																					sx={{
																						display: 'flex',
																						width: '100%',
																					}}>
																					<CustomTextField
																						label='Video Url'
																						required={false}
																						value={question.videoUrl}
																						onChange={(e) => {
																							setQuestions((prevQuestions) => {
																								if (!prevQuestions) return prevQuestions;

																								return prevQuestions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											videoUrl: e.target.value,
																										};
																									} else {
																										return prevQuestion;
																									}
																								});
																							});
																						}}
																					/>
																					<CustomTextField
																						label='Image Url'
																						required={false}
																						value={question.imageUrl}
																						sx={{ marginLeft: '1rem' }}
																						onChange={(e) => {
																							setQuestions((prevQuestions) => {
																								if (!prevQuestions) return prevQuestions;

																								return prevQuestions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											imageUrl: e.target.value,
																										};
																									} else {
																										return prevQuestion;
																									}
																								});
																							});
																						}}
																					/>
																				</Box>
																				<Box sx={{ width: '100%' }}>
																					<CustomTextField
																						label='Question'
																						value={question.question}
																						multiline={true}
																						rows={1}
																						onChange={(e) => {
																							setQuestions((prevQuestions) => {
																								if (!prevQuestions) return prevQuestions; // If prevQuestions is undefined, return it as is

																								return prevQuestions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											question: e.target.value,
																										};
																									} else {
																										return prevQuestion; // Return unchanged element for other questions
																									}
																								});
																							});
																						}}
																					/>
																				</Box>
																				<Box
																					sx={{
																						width: '90%',
																					}}>
																					{question.options &&
																						options.map((option, index) => (
																							<Box
																								key={index}
																								sx={{
																									display: 'flex',
																									justifyContent: 'flex-end',
																									alignItems: 'center',
																									width: '100%',
																									marginLeft: '3rem',
																								}}>
																								<Tooltip title='Correct Answer' placement='left'>
																									<FormControlLabel
																										control={
																											<Radio
																												checked={index === correctAnswerIndex}
																												onChange={() => handleCorrectAnswerChange(index)}
																												color='primary'
																											/>
																										}
																										label=''
																									/>
																								</Tooltip>
																								{index === options.length - 1 && (
																									<Tooltip title='Add Option' placement='top'>
																										<IconButton onClick={addOption}>
																											<AddCircle />
																										</IconButton>
																									</Tooltip>
																								)}
																								<CustomTextField
																									label={`Option ${index + 1}`}
																									value={option}
																									onChange={(e) => handleOptionChange(index, e.target.value)}
																									sx={{
																										marginTop: '0.75rem',
																										marginRight: index === 0 ? '2.5rem' : 0,
																										borderBottom: option === question.correctAnswer ? 'solid 0.2rem green' : 'inherit',
																									}}
																								/>
																								{index > 0 && (
																									<Tooltip title='Remove Option' placement='top'>
																										<IconButton onClick={() => removeOption(index)}>
																											<RemoveCircle />
																										</IconButton>
																									</Tooltip>
																								)}
																							</Box>
																						))}
																				</Box>
																			</DialogContent>

																			<CustomDialogActions
																				onCancel={() => {
																					closeQuestionEditModal(index);
																					setCorrectAnswerIndex(-1);
																				}}
																				cancelBtnText='Reset'
																				onSubmit={() => {
																					closeQuestionEditModal(index);
																					setQuestions((prevQuestions) => {
																						if (!prevQuestions) return prevQuestions;

																						return prevQuestions.map((prevQuestion) => {
																							if (prevQuestion._id === question._id) {
																								return {
																									...prevQuestion,
																									options: options.filter((option) => option !== ''),
																									correctAnswer,
																								};
																							} else {
																								return prevQuestion;
																							}
																						});
																					});

																					setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => {
																						setIsLessonUpdated(true);
																						if (prevData) {
																							prevData = prevData.map((data) => {
																								if (data.questionId === question._id) {
																									return {
																										...data,
																										isUpdated: true,
																									};
																								}
																								return data;
																							})!;
																						}
																						return prevData;
																					});
																				}}
																				submitBtnText='Save'
																				submitBtnType='button'
																			/>
																		</form>
																	</CustomDialog>
																</Box>
																<Tooltip title='Remove' placement='top'>
																	<IconButton onClick={() => removeQuestion(question)}>
																		<Delete />
																	</IconButton>
																</Tooltip>
															</Box>
														</Box>
													</Box>
												</Reorder.Item>
											);
										}
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
