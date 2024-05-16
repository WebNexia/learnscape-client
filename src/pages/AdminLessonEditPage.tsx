import { Box, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography } from '@mui/material';
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
import LessonPaper from '../components/adminSingleLesson/Paper';
import QuestionDialogContentNonEdit from '../components/adminSingleLesson/QuestionDialogContentNonEdit';
import LessonEditorBox from '../components/adminSingleLesson/LessonEditorBox';
import QuestionsBoxNonEdit from '../components/adminSingleLesson/QuestionsBoxNonEdit';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CreateQuestionDialog from '../components/forms/newQuestion/createQuestionDialog';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import useNewQuestion from '../hooks/useNewQuestion';

export interface QuestionUpdateTrack {
	questionId: string;
	isUpdated: boolean;
}

const AdminLessonEditPage = () => {
	const { userId, lessonId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { updateLessonPublishing, updateLessons } = useContext(LessonsContext);
	const { questionTypes, fetchQuestionTypes } = useContext(QuestionsContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const defaultLesson: Lesson = {
		_id: '',
		title: '',
		type: '',
		imageUrl: '',
		videoUrl: '',
		isActive: false,
		createdAt: '',
		updatedAt: '',
		text: '',
		orgId: '',
		questionIds: [],
		questions: [],
	};

	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [singleLesson, setSingleLesson] = useState<Lesson>(defaultLesson);
	const [singleLessonBeforeSave, setSingleLessonBeforeSave] = useState<Lesson>(defaultLesson);

	const [isActive, setIsActive] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [displayedQuestionNonEdit, setDisplayedQuestionNonEdit] = useState<QuestionInterface | null>(null);
	const [isDisplayNonEditQuestion, setIsDisplayNonEditQuestion] = useState<boolean>(false);
	const [isLessonUpdated, setIsLessonUpdated] = useState<boolean>(false);
	const [isQuestionUpdated, setIsQuestionUpdated] = useState<QuestionUpdateTrack[]>([]);

	const [questionType, setQuestionType] = useState<string>('');
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);

	useEffect(() => {
		if (lessonId) {
			const fetchSingleLessonData = async (lessonId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/lessons/${lessonId}`);

					const lessonsResponse = response?.data?.data[0];

					setSingleLesson(lessonsResponse);
					setSingleLessonBeforeSave(lessonsResponse);

					setIsActive(lessonsResponse.isActive);

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
		fetchQuestionTypes();
	}, [lessonId, isActive, resetChanges]);

	// Define state for tracking edit modal visibility for each question
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<Array<boolean>>(new Array(singleLessonBeforeSave?.questions.length).fill(false));

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

		let updatedQuestions: QuestionInterface[] = [];
		if (singleLessonBeforeSave?.questions) {
			updatedQuestions = await Promise.all(
				singleLessonBeforeSave.questions
					.filter((question) => question !== null || question !== undefined)
					.map(async (question) => {
						if (question !== null) {
							const questionTypeId = questionTypes.filter((type) => (type.name = question.questionType))[0]._id;
							question.questionType = questionTypeId;

							if (question._id.includes('temp_question_id')) {
								const questionResponse = await axios.post(`${base_url}/questions`, {
									orgId,
									question: question.question,
									options: question.options,
									correctAnswer: question.correctAnswer,
									videoUrl: question.videoUrl,
									imageUrl: question.imageUrl,
									questionType: questionTypeId,
									isActive: true,
								});
								return {
									...question,
									_id: questionResponse.data._id,
									createdAt: questionResponse.data.createdAt,
									updatedAt: questionResponse.data.updatedAt,
								};
							}
						}
						return question;
					})
			);

			await Promise.all(
				updatedQuestions?.map(async (question, index) => {
					if (isQuestionUpdated[index]?.isUpdated) {
						await axios.patch(`${base_url}/questions/${question._id}`, question);
					}
				})
			);

			const updatedQuestionIds = updatedQuestions.filter((question) => question !== null).map((question) => question._id);

			setSingleLessonBeforeSave((prevData) => {
				return {
					...prevData,
					questions: updatedQuestions.filter((question) => question !== null),
					questionIds: updatedQuestionIds,
				};
			});
		}

		if (isLessonUpdated || isQuestionUpdated.some((data) => data.isUpdated === true)) {
			const updatedQuestionIds = updatedQuestions.filter((question) => question !== null).map((question) => question._id);
			try {
				await axios.patch(`${base_url}/lessons/${lessonId}`, {
					...singleLessonBeforeSave,
					questionIds: updatedQuestionIds,
				});

				setIsLessonUpdated(false);
				updateLessons(singleLessonBeforeSave);
				setSingleLesson({
					...singleLessonBeforeSave,
					questionIds: updatedQuestionIds,
				});
			} catch (error) {
				console.log(error);
			}
		}

		const questionUpdateData: QuestionUpdateTrack[] = updatedQuestions?.reduce((acc: QuestionUpdateTrack[], value: QuestionInterface) => {
			acc.push({ questionId: value?._id, isUpdated: false });
			return acc;
		}, []);
		setIsQuestionUpdated(questionUpdateData);
	};

	//questions created before save

	// const cloneQuestion = async (question: QuestionInterface) => {
	// 	try {
	// 		const response = await axios.post(`${base_url}/questions/organisation/${orgId}`, {
	// 			questionType: question.questionType,
	// 			question: question.question,
	// 			imageUrl: question.imageUrl,
	// 			videoUrl: question.videoUrl,
	// 			options: question.options,
	// 			correctAnswer: question.correctAnswer,
	// 			orgId,
	// 		});

	// 		setIsLessonUpdated(true);

	// 		setQuestions((prevQuestions) => {
	// 			const cloneIndex = prevQuestions.findIndex((q) => {
	// 				if (q !== null) {
	// 					return q._id === question._id;
	// 				}
	// 			});

	// 			// Insert the cloned question right after it in the questions array
	// 			const updatedQuestions = [...prevQuestions];
	// 			updatedQuestions.splice(cloneIndex + 1, 0, response.data);

	// 			// Insert the _id of the cloned question in the questionIds array
	// 			const updatedIds = [...questionIds];
	// 			updatedIds.splice(cloneIndex + 1, 0, response.data._id);

	// 			// Update both questions and questionIds arrays
	// 			setQuestionIds(updatedIds);

	// 			setSingleLesson((prevLesson) => {
	// 				if (prevLesson !== undefined) {
	// 					// Find the index of the cloned question
	// 					const cloneIndex = prevLesson.questions.findIndex((q) => {
	// 						if (q !== null) {
	// 							return q._id === question._id;
	// 						}
	// 					});
	// 					// Insert the cloned question right after it
	// 					const updatedQuestions = [...prevLesson.questions];
	// 					updatedQuestions.splice(cloneIndex + 1, 0, response.data);

	// 					return {
	// 						...prevLesson,
	// 						questions: updatedQuestions,
	// 						questionIds: updatedIds,
	// 					};
	// 				}
	// 				return prevLesson;
	// 			});

	// 			return updatedQuestions;
	// 		});
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// };

	const removeQuestion = (question: QuestionInterface) => {
		const updatedQuestions = singleLessonBeforeSave.questions.filter((thisQuestion) => {
			if (thisQuestion !== null) {
				return thisQuestion._id !== question._id;
			}
		});
		const updatedQuestionIds = updatedQuestions.map((question) => question._id!);
		setIsLessonUpdated(true);

		setSingleLessonBeforeSave((prevLesson) => {
			return {
				...prevLesson,
				questionIds: updatedQuestionIds,
				questions: updatedQuestions,
			};
		});
	};

	const {
		options,
		setOptions,
		correctAnswerIndex,
		setCorrectAnswerIndex,
		correctAnswer,
		setCorrectAnswer,
		isDuplicateOption,
		setIsDuplicateOption,
		setIsMinimumOptions,
		isMinimumOptions,
		addOption,
		removeOption,
		handleCorrectAnswerChange,
		handleOptionChange,
	} = useNewQuestion();

	return (
		<DashboardPagesLayout pageName='Edit Lesson' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '90%' }}>
				<LessonPaper userId={userId} singleLesson={singleLesson} isActive={isActive} />
				<LessonEditorBox
					singleLesson={singleLesson}
					singleLessonBeforeSave={singleLessonBeforeSave}
					setSingleLessonBeforeSave={setSingleLessonBeforeSave}
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

			<CreateQuestionDialog
				isQuestionCreateModalOpen={isQuestionCreateModalOpen}
				questionType={questionType}
				correctAnswer={correctAnswer}
				options={options}
				correctAnswerIndex={correctAnswerIndex}
				setIsQuestionCreateModalOpen={setIsQuestionCreateModalOpen}
				setQuestionType={setQuestionType}
				setCorrectAnswer={setCorrectAnswer}
				setOptions={setOptions}
				setSingleLessonBeforeSave={setSingleLessonBeforeSave}
				setIsLessonUpdated={setIsLessonUpdated}
				handleCorrectAnswerChange={handleCorrectAnswerChange}
				setCorrectAnswerIndex={setCorrectAnswerIndex}
				removeOption={removeOption}
				addOption={addOption}
				createNewQuestion={false}
				handleOptionChange={handleOptionChange}
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
			/>

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
					<form onSubmit={(e) => handleLessonUpdate(e)}>
						<Box sx={{ mt: '3rem' }}>
							<Typography variant='h4'>Title*</Typography>
							<CustomTextField
								sx={{
									marginTop: '0.5rem',
								}}
								value={singleLessonBeforeSave?.title}
								onChange={(e) => {
									setIsLessonUpdated(true);

									setSingleLessonBeforeSave(() => {
										setIsMissingField(false);

										return { ...singleLessonBeforeSave, title: e.target.value };
									});
								}}
								error={isMissingField && singleLessonBeforeSave?.title === ''}
							/>
							{isMissingField && singleLessonBeforeSave?.title === '' && <CustomErrorMessage>Please enter a title</CustomErrorMessage>}
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
										setCorrectAnswer('');
										setIsDuplicateOption(false);
										setIsMinimumOptions(true);
									}}>
									Create Question
								</CustomSubmitButton>
							</Box>
						</Box>

						{singleLessonBeforeSave?.questionIds.length === 0 || singleLessonBeforeSave?.questions.length === 0 ? (
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
								values={singleLessonBeforeSave.questions}
								onReorder={(newQuestions): void => {
									setIsLessonUpdated(true);
									setSingleLessonBeforeSave((prevData) => {
										return { ...prevData, questions: newQuestions, questionIds: newQuestions.map((question) => question._id) };
									});
								}}>
								{singleLessonBeforeSave.questions &&
									singleLessonBeforeSave.questions.length !== 0 &&
									singleLessonBeforeSave.questions.map((question, index) => {
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
																				// cloneQuestion(question);
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
																			setCorrectAnswerIndex(-1);
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
																				<Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: '2rem', width: '100%' }}>
																					<Typography>
																						{question !== null &&
																							questionTypes
																								.filter((type) => type._id === question.questionType)
																								.map((filteredType) => filteredType.name)[0]}
																					</Typography>
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
																							setSingleLessonBeforeSave((prevData) => {
																								if (!prevData.questions) return prevData; // Return prevData if questions array is not defined

																								const updatedQuestions = prevData.questions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											videoUrl: e.target.value,
																										};
																									} else {
																										return prevQuestion;
																									}
																								});

																								return {
																									...prevData,
																									questions: updatedQuestions, // Update the questions array with the modified question
																								};
																							});
																						}}
																					/>
																					<CustomTextField
																						label='Image Url'
																						required={false}
																						value={question.imageUrl}
																						sx={{ marginLeft: '1rem' }}
																						onChange={(e) => {
																							setSingleLessonBeforeSave((prevData) => {
																								if (!prevData.questions) return prevData; // Return prevData if questions array is not defined

																								const updatedQuestions = prevData.questions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											imageUrl: e.target.value,
																										};
																									} else {
																										return prevQuestion;
																									}
																								});

																								return {
																									...prevData,
																									questions: updatedQuestions, // Update the questions array with the modified question
																								};
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
																							setSingleLessonBeforeSave((prevData) => {
																								if (!prevData.questions) return prevData; // Return prevData if questions array is not defined

																								const updatedQuestions = prevData.questions.map((prevQuestion) => {
																									if (prevQuestion._id === question._id) {
																										return {
																											...prevQuestion,
																											question: e.target.value,
																										};
																									} else {
																										return prevQuestion;
																									}
																								});

																								return {
																									...prevData,
																									questions: updatedQuestions, // Update the questions array with the modified question
																								};
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
																				cancelBtnText='Cancel'
																				onSubmit={() => {
																					closeQuestionEditModal(index);

																					setSingleLessonBeforeSave((prevData) => {
																						if (!prevData.questions) return prevData; // Return prevData if questions array is not defined

																						const updatedQuestions = prevData.questions
																							.filter((question) => question !== null)
																							.map((prevQuestion) => {
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

																						return {
																							...prevData,
																							questions: updatedQuestions, // Update the questions array with the modified question
																						};
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
