import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import theme from '../themes';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
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
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import useNewQuestion from '../hooks/useNewQuestion';
import CreateQuestionDialog from '../components/forms/newQuestion/CreateQuestionDialog';
import EditQuestionDialog from '../components/forms/editQuestion/EditQuestionDialog';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import useImageUpload from '../hooks/useImageUpload';
import useVideoUpload from '../hooks/useVideoUpload';
import HandleImageUploadURL from '../components/forms/uploadImageVideo/HandleImageUploadURL';
import HandleVideoUploadURL from '../components/forms/uploadImageVideo/HandleVideoUploadURL';
import AddNewQuestionDialog from '../components/adminSingleLesson/AddNewQuestionDialog';

export interface QuestionUpdateTrack {
	questionId: string;
	isUpdated: boolean;
}

const AdminLessonEditPage = () => {
	const { userId, lessonId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { updateLessonPublishing, updateLessons } = useContext(LessonsContext);

	const { questionTypes } = useContext(QuestionsContext);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

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

	const { resetImageUpload } = useImageUpload();

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	const { resetVideoUpload } = useVideoUpload();

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

	const [addNewQuestionModalOpen, setAddNewQuestionModalOpen] = useState<boolean>(false);

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

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
		resetVideoUpload();
		resetImageUpload();
		resetEnterImageVideoUrl();
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

	const handleLessonUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		let updatedQuestions: QuestionInterface[] = [];

		if (singleLessonBeforeSave?.questions) {
			const questionsWithPossibleNulls = await Promise.all(
				singleLessonBeforeSave.questions
					?.filter((question) => question !== null && question !== undefined)
					?.map(async (question) => {
						if (question !== null) {
							if (question._id.includes('temp_question_id')) {
								const questionTypeId = questionTypes.find((type) => type.name === question.questionType)?._id;
								if (questionTypeId) {
									question.questionType = questionTypeId;

									if (question.correctAnswer !== '') {
										try {
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
										} catch (error) {
											console.error('Error creating question:', error);
											return null;
										}
									}
								}
							}
						}
						return question;
					})
			);

			updatedQuestions = questionsWithPossibleNulls?.filter((question): question is QuestionInterface => question !== null);

			await Promise.all(
				updatedQuestions?.map(async (question) => {
					const trackData = isQuestionUpdated.find((data) => data.questionId === question._id);
					if (question.correctAnswer !== '' && trackData?.isUpdated) {
						try {
							await axios.patch(`${base_url}/questions/${question._id}`, question);
						} catch (error) {
							console.error('Error updating question:', error);
						}
					}
				})
			);
			const updatedQuestionIds = updatedQuestions?.filter((question) => question !== null).map((question) => question._id);

			setSingleLessonBeforeSave((prevData) => ({
				...prevData,
				questions: updatedQuestions,
				questionIds: updatedQuestionIds,
			}));
		}

		if (isLessonUpdated || isQuestionUpdated.some((data) => data.isUpdated === true)) {
			const updatedQuestionIds = updatedQuestions.map((question) => question._id);
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
				console.error('Error updating lesson:', error);
			}
		}

		const questionUpdateData: QuestionUpdateTrack[] = updatedQuestions.map((question) => ({
			questionId: question._id,
			isUpdated: false,
		}));
		setIsQuestionUpdated(questionUpdateData);
	};

	const removeQuestion = (question: QuestionInterface) => {
		const updatedQuestions = singleLessonBeforeSave.questions.filter((thisQuestion) => {
			return thisQuestion?._id !== question._id;
		});

		const updatedQuestionIds = updatedQuestions.map((question) => question._id!);
		setIsLessonUpdated(true);

		setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => prevData.filter((data) => data.questionId !== question._id));

		setSingleLessonBeforeSave((prevLesson) => {
			return {
				...prevLesson,
				questionIds: updatedQuestionIds,
				questions: updatedQuestions,
			};
		});
	};

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
					resetImageUpload={resetImageUpload}
					resetVideoUpload={resetVideoUpload}
					resetEnterImageVideoUrl={resetEnterImageVideoUrl}
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
								placeholder='Enter title'
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

						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: '2rem', width: '100%' }}>
							<Box sx={{ flex: 1, mr: '2rem' }}>
								<HandleImageUploadURL
									onImageUploadLogic={(url) => {
										setIsLessonUpdated(true);

										setSingleLessonBeforeSave(() => {
											return { ...singleLessonBeforeSave, imageUrl: url };
										});
									}}
									onChangeImgUrl={(e) => {
										setSingleLessonBeforeSave((prevCourse) => ({
											...prevCourse,
											imageUrl: e.target.value,
										}));
										setIsLessonUpdated(true);
									}}
									imageUrlValue={singleLessonBeforeSave?.imageUrl}
									imageFolderName='LessonImages'
									enterImageUrl={enterImageUrl}
									setEnterImageUrl={setEnterImageUrl}
								/>
							</Box>
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										setIsLessonUpdated(true);

										setSingleLessonBeforeSave(() => {
											return { ...singleLessonBeforeSave, videoUrl: url };
										});
									}}
									onChangeVideoUrl={(e) => {
										setSingleLessonBeforeSave((prevCourse) => ({
											...prevCourse,
											videoUrl: e.target.value,
										}));
										setIsLessonUpdated(true);
									}}
									videoUrlValue={singleLessonBeforeSave?.videoUrl}
									videoFolderName='LessonVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>
							</Box>
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
									onClick={() => {
										setAddNewQuestionModalOpen(true);
									}}>
									Add Question
								</CustomSubmitButton>

								<AddNewQuestionDialog
									addNewQuestionModalOpen={addNewQuestionModalOpen}
									singleLessonBeforeSave={singleLessonBeforeSave}
									setAddNewQuestionModalOpen={setAddNewQuestionModalOpen}
									setIsLessonUpdated={setIsLessonUpdated}
									setSingleLessonBeforeSave={setSingleLessonBeforeSave}
								/>

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
										setCorrectAnswerIndex(-1);
									}}>
									Create Question
								</CustomSubmitButton>
							</Box>
						</Box>

						{singleLessonBeforeSave?.questionIds.length === 0 ||
						singleLessonBeforeSave?.questions?.filter((question) => question !== null).length === 0 ? (
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
							<Box sx={{ mb: '5rem' }}>
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
											const filteredQuestionType = questionTypes.filter((type) => {
												if (question !== null) {
													return type._id === question.questionType || type.name === question.questionType;
												}
											});
											let questionTypeName: string = '';
											if (filteredQuestionType.length !== 0) {
												questionTypeName = filteredQuestionType[0].name;
											}
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
																					setOptions(question.options);
																					setCorrectAnswer(question.correctAnswer);
																					const correctAnswerIndex = question.options.indexOf(question.correctAnswer);
																					setCorrectAnswerIndex(correctAnswerIndex);
																					toggleQuestionEditModal(index);
																				}}>
																				<Edit />
																			</IconButton>
																		</Tooltip>
																		<EditQuestionDialog
																			fromLessonEditPage={true}
																			question={question}
																			correctAnswerIndex={correctAnswerIndex}
																			index={index}
																			options={options}
																			correctAnswer={correctAnswer}
																			questionType={questionTypeName}
																			isMinimumOptions={isMinimumOptions}
																			isDuplicateOption={isDuplicateOption}
																			setSingleLessonBeforeSave={setSingleLessonBeforeSave}
																			setIsLessonUpdated={setIsLessonUpdated}
																			handleCorrectAnswerChange={handleCorrectAnswerChange}
																			setCorrectAnswerIndex={setCorrectAnswerIndex}
																			handleOptionChange={handleOptionChange}
																			closeQuestionEditModal={closeQuestionEditModal}
																			setIsQuestionUpdated={setIsQuestionUpdated}
																			editQuestionModalOpen={editQuestionModalOpen}
																			addOption={addOption}
																			removeOption={removeOption}
																			setCorrectAnswer={setCorrectAnswer}
																			setIsDuplicateOption={setIsDuplicateOption}
																			setIsMinimumOptions={setIsMinimumOptions}
																		/>
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
							</Box>
						)}
					</form>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminLessonEditPage;
