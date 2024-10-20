import { Box, FormControl, IconButton, InputLabel, Link, MenuItem, Select, SelectChangeEvent, Tooltip, Typography } from '@mui/material';
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
import LessonPaper from '../components/adminSingleLesson/LessonPaper';
import QuestionDialogContentNonEdit from '../components/adminSingleLesson/QuestionDialogContentNonEdit';
import QuestionsBoxNonEdit from '../components/adminSingleLesson/QuestionsBoxNonEdit';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import useNewQuestion from '../hooks/useNewQuestion';
import CreateQuestionDialog from '../components/forms/newQuestion/CreateQuestionDialog';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import useImageUpload from '../hooks/useImageUpload';
import useVideoUpload from '../hooks/useVideoUpload';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import HandleVideoUploadURL from '../components/forms/uploadImageVideoDocument/HandleVideoUploadURL';
import AddNewQuestionDialog from '../components/adminSingleLesson/AddNewQuestionDialog';
import { stripHtml } from '../utils/stripHtml';
import { truncateText } from '../utils/utilText';
import ImageThumbnail from '../components/forms/uploadImageVideoDocument/ImageThumbnail';
import VideoThumbnail from '../components/forms/uploadImageVideoDocument/VideoThumbnail';
import LessonImageCourseDisplay from '../components/adminSingleLesson/LessonImageCourseDisplay';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import TinyMceEditor from '../components/richTextEditor/TinyMceEditor';
import { Document } from '../interfaces/document';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import HandleDocUploadURL from '../components/forms/uploadImageVideoDocument/HandleDocUploadURL';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import DocumentsListEditBox from '../components/adminDocuments/DocumentsListEditBox';
import { LessonType, QuestionType } from '../interfaces/enums';
import NoContentBoxAdmin from '../components/layouts/noContentBox/NoContentBoxAdmin';
import AdminLessonEditPageEditQuestionDialog from '../components/forms/editQuestion/AdminLessonEditPageEditQuestionDialog';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

export interface QuestionUpdateTrack {
	questionId: string;
	isUpdated: boolean;
}

export interface DocumentUpdateTrack {
	documentId: string;
	isUpdated: boolean;
}

const AdminLessonEditPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId, lessonId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { updateLessonPublishing, updateLessons, lessonTypes, fetchLessons, lessonsPageNumber } = useContext(LessonsContext);

	const { questionTypes, fetchQuestions, questionsPageNumber, fetchQuestionTypeName } = useContext(QuestionsContext);
	const { fetchDocuments, documentsPageNumber } = useContext(DocumentsContext);

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
	const { resetVideoUpload } = useVideoUpload();

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

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
		documentIds: [],
		documents: [],
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
	const [isDocumentUpdated, setIsDocumentUpdated] = useState<DocumentUpdateTrack[]>([]);

	const [addNewQuestionModalOpen, setAddNewQuestionModalOpen] = useState<boolean>(false);
	const [addNewDocumentModalOpen, setAddNewDocumentModalOpen] = useState<boolean>(false);

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);
	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);

	const [editorContent, setEditorContent] = useState<string>('');
	const [prevEditorContent, setPrevEditorContent] = useState<string>('');

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
		setEnterDocUrl(true);
	};

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState<Array<boolean>>([]);
	const [originalDocumentNames, setOriginalDocumentNames] = useState<Record<string, string>>({});

	const toggleDocRenameModal = (index: number, document: Document) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		if (!newRenameModalOpen[index]) {
			setOriginalDocumentNames((prevNames) => ({
				...prevNames,
				[document._id]: document.name,
			})); // Set the original document name
		}
		newRenameModalOpen[index] = !newRenameModalOpen[index];
		setIsDocRenameModalOpen(newRenameModalOpen);
		setIsLessonUpdated(true);
	};

	const closeDocRenameModal = (index: number, document: Document) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		newRenameModalOpen[index] = false;

		setSingleLessonBeforeSave((prevData) => {
			if (prevData) {
				const updatedDocuments = prevData.documents
					?.filter((document) => document !== null)
					?.map((thisDoc) => {
						if (thisDoc._id === document._id) {
							return { ...thisDoc, name: originalDocumentNames[document._id] || thisDoc.name }; // Revert to original name
						} else {
							return thisDoc;
						}
					});
				return { ...prevData, documents: updatedDocuments };
			}
			return prevData;
		});

		setIsDocRenameModalOpen(newRenameModalOpen);
	};

	const saveDocRename = (index: number) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		newRenameModalOpen[index] = false;

		setIsDocRenameModalOpen(newRenameModalOpen);
		setIsLessonUpdated(true);
	};

	// Define state for tracking edit modal visibility for each question
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<Array<boolean>>([]);

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

	useEffect(() => {
		if (lessonId) {
			const fetchSingleLessonData = async (lessonId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/lessons/${lessonId}`);

					const lessonsResponse = response?.data;

					setSingleLesson(lessonsResponse);
					setSingleLessonBeforeSave(lessonsResponse);

					setEditorContent(lessonsResponse.text);
					setPrevEditorContent(lessonsResponse.text);

					setIsActive(lessonsResponse.isActive);

					setEditQuestionModalOpen(new Array(lessonsResponse?.questions?.length || 0).fill(false));

					setIsDocRenameModalOpen(new Array(lessonsResponse?.documents?.length || 0).fill(false));

					const questionUpdateData: QuestionUpdateTrack[] = lessonsResponse?.questions?.reduce(
						(acc: QuestionUpdateTrack[], value: QuestionInterface) => {
							acc.push({ questionId: value?._id, isUpdated: false });
							return acc;
						},
						[]
					);
					setIsQuestionUpdated(questionUpdateData);

					const documentUpdateData: DocumentUpdateTrack[] = lessonsResponse?.documents?.reduce((acc: DocumentUpdateTrack[], value: Document) => {
						acc.push({ documentId: value?._id, isUpdated: false });
						return acc;
					}, []);

					setIsDocumentUpdated(documentUpdateData);
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

	useEffect(() => {
		setEditorContent(prevEditorContent);
		setSingleLessonBeforeSave(() => {
			return { ...singleLessonBeforeSave, text: prevEditorContent };
		});
	}, [singleLessonBeforeSave.type]);

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
		let updatedDocuments: Document[] = [];

		try {
			if (singleLessonBeforeSave?.documents) {
				const updatedDocumentsPromises = (singleLessonBeforeSave.documents as (Document | null)[])
					?.filter((doc): doc is Document => doc !== null)
					?.map(async (document) => {
						if (document._id.includes('temp_doc_id')) {
							try {
								const response = await axios.post(`${base_url}/documents`, {
									name: document.name.trim(),
									orgId,
									userId,
									documentUrl: document.documentUrl,
								});
								fetchDocuments(documentsPageNumber);
								return {
									...document,
									_id: response.data._id,
									createdAt: response.data.createdAt,
									updatedAt: response.data.updatedAt,
								} as Document;
							} catch (error) {
								console.error('Error creating document:', error);
								return null;
							}
						}
						return document;
					});

				const updatedDocumentsWithNulls = await Promise.all(updatedDocumentsPromises);
				updatedDocuments = updatedDocumentsWithNulls?.filter((doc): doc is Document => doc !== null);
			}

			await Promise.all(
				updatedDocuments?.map(async (doc) => {
					const trackData = isDocumentUpdated.find((data) => data.documentId === doc._id);
					if (trackData?.isUpdated) {
						try {
							await axios.patch(`${base_url}/documents/${doc._id}`, {
								name: doc.name.trim(),
							});
							fetchDocuments(documentsPageNumber);
						} catch (error) {
							console.error('Error updating document:', error);
						}
					}
				})
			);

			const updatedDocumentIds = updatedDocuments?.map((doc) => doc._id);

			const allowedQuestionTypes = (lessonType: LessonType): QuestionType[] => {
				if (lessonType === LessonType.QUIZ) {
					return [
						QuestionType.MULTIPLE_CHOICE,
						QuestionType.TRUE_FALSE,
						QuestionType.OPEN_ENDED,
						QuestionType.AUDIO_VIDEO,
						QuestionType.MATCHING,
						QuestionType.FITB_TYPING,
						QuestionType.FITB_DRAG_DROP,
					];
				} else if (lessonType === LessonType.PRACTICE_LESSON) {
					return [
						QuestionType.MULTIPLE_CHOICE,
						QuestionType.TRUE_FALSE,
						QuestionType.OPEN_ENDED,
						QuestionType.MATCHING,
						QuestionType.FITB_TYPING,
						QuestionType.FITB_DRAG_DROP,
						QuestionType.FLIP_CARD,
					];
				} else {
					// For INSTRUCTIONAL_LESSON
					return [];
				}
			};

			const lessonType = singleLessonBeforeSave.type as LessonType;

			const filteredQuestions = singleLessonBeforeSave?.questions?.filter((question) => {
				if (question !== null && question !== undefined) {
					return allowedQuestionTypes(lessonType).includes(fetchQuestionTypeName(question) as QuestionType);
				}
				return false;
			});

			if (singleLessonBeforeSave.type === LessonType.INSTRUCTIONAL_LESSON) {
				setSingleLessonBeforeSave((prevData) => ({
					...prevData,
					questions: [],
					questionIds: [],
				}));

				updatedQuestions = [];
			} else if (filteredQuestions) {
				const updatedQuestionsPromises = filteredQuestions.map(async (question) => {
					if (question._id.includes('temp_question_id')) {
						const questionTypeId = questionTypes.find((type) => type.name === question.questionType)?._id;
						if (questionTypeId) {
							try {
								const response = await axios.post(`${base_url}/questions`, {
									orgId,
									question: question.question.trim(),
									options: question.options,
									correctAnswer: question.correctAnswer.trim(),
									videoUrl: question.videoUrl.trim(),
									imageUrl: question.imageUrl.trim(),
									questionType: questionTypeId,
									audio: question.audio,
									video: question.video,
									matchingPairs: question.matchingPairs,
									blankValuePairs: question.blankValuePairs,
									isActive: true,
								});
								fetchQuestions(questionsPageNumber);
								return {
									...question,
									_id: response.data._id,
									createdAt: response.data.createdAt,
									updatedAt: response.data.updatedAt,
								} as QuestionInterface;
							} catch (error) {
								console.error('Error creating question:', error);
								return null;
							}
						}
					}
					return question;
				});

				const updatedQuestionsWithNulls = await Promise.all(updatedQuestionsPromises);

				updatedQuestions = updatedQuestionsWithNulls?.filter((question): question is QuestionInterface => question !== null);

				await Promise.all(
					updatedQuestions?.map(async (question) => {
						const trackData = isQuestionUpdated.find((data) => data.questionId === question._id);
						if (trackData?.isUpdated) {
							try {
								const { questionType, ...questionWithoutType } = question;
								await axios.patch(`${base_url}/questions/${question._id}`, questionWithoutType);
								fetchQuestions(questionsPageNumber);
							} catch (error) {
								console.error('Error updating question:', error);
							}
						}
					})
				);
			}

			const updatedQuestionIds = updatedQuestions?.map((question) => question._id);

			if (isLessonUpdated || isQuestionUpdated.some((data) => data.isUpdated === true)) {
				try {
					const updatedLesson = {
						...singleLessonBeforeSave,
						questionIds: updatedQuestionIds,
						text: editorContent.trim(),
						documentIds: updatedDocumentIds,
					};

					await axios.patch(`${base_url}/lessons/${lessonId}`, updatedLesson);

					fetchLessons(lessonsPageNumber);
					updateLessons({
						...singleLessonBeforeSave,
						questions: updatedQuestions,
						questionIds: updatedQuestionIds,
						text: editorContent.trim(),
						documentIds: updatedDocumentIds,
						documents: updatedDocuments,
					});

					setSingleLesson({
						...singleLessonBeforeSave,
						questions: updatedQuestions,
						questionIds: updatedQuestionIds,
						text: editorContent.trim(),
						documentIds: updatedDocumentIds,
						documents: updatedDocuments,
					});

					setSingleLessonBeforeSave((prevData) => {
						return {
							...prevData,
							questions: updatedQuestions,
							questionIds: updatedQuestionIds,
							text: singleLessonBeforeSave.type === 'Quiz' ? '' : editorContent.trim(),
							documentIds: updatedDocumentIds,
							documents: updatedDocuments,
						};
					});
				} catch (error) {
					console.error('Error updating lesson:', error);
				}
			}

			const questionUpdateData: QuestionUpdateTrack[] = updatedQuestions?.map((question) => ({
				questionId: question._id,
				isUpdated: false,
			}));

			setIsQuestionUpdated(questionUpdateData);

			const documentUpdateData: DocumentUpdateTrack[] = updatedDocuments?.map((document) => ({
				documentId: document._id,
				isUpdated: false,
			}));

			setIsDocumentUpdated(documentUpdateData);
			setIsLessonUpdated(false);
		} catch (error) {
			console.error('Error during lesson update process:', error);
		}
	};

	const removeQuestion = (question: QuestionInterface) => {
		const updatedQuestions = singleLessonBeforeSave.questions
			?.filter((question) => question !== null)
			?.filter((thisQuestion) => {
				return thisQuestion?._id !== question._id;
			});

		const updatedQuestionIds = updatedQuestions?.map((question) => question._id!);
		setIsLessonUpdated(true);

		setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => prevData?.filter((data) => data.questionId !== question._id));

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
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<LessonPaper
					userId={userId}
					singleLesson={singleLesson}
					isActive={isActive}
					singleLessonBeforeSave={singleLessonBeforeSave}
					setSingleLessonBeforeSave={setSingleLessonBeforeSave}
					isEditMode={isEditMode}
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
				createNewQuestion={false}
				isQuestionCreateModalOpen={isQuestionCreateModalOpen}
				questionType={questionType}
				correctAnswer={correctAnswer}
				options={options}
				correctAnswerIndex={correctAnswerIndex}
				singleLessonBeforeSave={singleLessonBeforeSave}
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
				handleOptionChange={handleOptionChange}
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
			/>

			<Box sx={{ display: 'flex', width: '95%', justifyContent: 'center', marginTop: isEditMode ? '5rem' : '11rem' }}>
				{!isEditMode && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
						}}>
						<LessonImageCourseDisplay singleLesson={singleLesson} />

						<Box className='rich-text-content' component='div' sx={{ textAlign: 'justify', width: '90%', mt: '6rem' }}>
							<Typography variant='h4' sx={{ mb: '1.25rem' }}>
								{singleLesson.type === LessonType.INSTRUCTIONAL_LESSON ? 'Lesson Instructions' : 'Instructions'}
							</Typography>
							{singleLesson.text ? (
								<Typography
									variant='body1'
									dangerouslySetInnerHTML={{ __html: sanitizeHtml(singleLesson.text) }}
									sx={{ boxShadow: singleLesson.text ? '0 0 0.4rem 0.2rem rgba(0,0,0,0.25)' : 'none', padding: '1rem', borderRadius: '0.35rem' }}
								/>
							) : (
								<NoContentBoxAdmin content='No instruction for this lesson' />
							)}
						</Box>

						{singleLessonBeforeSave.type !== LessonType.INSTRUCTIONAL_LESSON && (
							<QuestionsBoxNonEdit
								singleLesson={singleLesson}
								setIsDisplayNonEditQuestion={setIsDisplayNonEditQuestion}
								setDisplayedQuestionNonEdit={setDisplayedQuestionNonEdit}
							/>
						)}

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'flex-start',
								width: '90%',
								margin: singleLesson?.type === LessonType.INSTRUCTIONAL_LESSON ? '3rem 0 4rem 0' : '1rem 0 4rem 0',
							}}>
							<Box>
								<Typography variant='h4' sx={{ mb: '1.25rem' }}>
									{singleLesson.type} Materials
								</Typography>
							</Box>
							{singleLesson.documents?.filter((doc) => doc !== null).length !== 0 ? (
								<Box>
									{singleLesson.documents
										?.filter((doc) => doc !== null)
										?.map((doc) => (
											<Box sx={{ mb: '0.5rem' }} key={doc._id}>
												<Link href={doc?.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
													{doc?.name}
												</Link>
											</Box>
										))}
								</Box>
							) : (
								<NoContentBoxAdmin content='No material for this lesson' />
							)}
						</Box>
					</Box>
				)}

				<CustomDialog
					openModal={isDisplayNonEditQuestion}
					closeModal={() => {
						setIsDisplayNonEditQuestion(false);
						setDisplayedQuestionNonEdit(null);
					}}
					titleSx={{ paddingTop: '0.5rem' }}>
					<QuestionDialogContentNonEdit question={displayedQuestionNonEdit} singleLessonBeforeSave={singleLessonBeforeSave} />
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
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
								<Box sx={{ flex: 1, mr: '2rem' }}>
									<Typography variant='h6'>Title*</Typography>
									<Tooltip title='Max 50 Characters' placement='top'>
										<CustomTextField
											sx={{
												marginTop: '0.5rem',
											}}
											value={singleLessonBeforeSave?.title}
											InputProps={{ inputProps: { maxLength: 50 } }}
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
									</Tooltip>
									{isMissingField && singleLessonBeforeSave?.title === '' && <CustomErrorMessage>Please enter a title</CustomErrorMessage>}
								</Box>
								<Box sx={{ flex: 1, textAlign: 'right', mt: '1rem' }}>
									<FormControl>
										<InputLabel id='type' sx={{ fontSize: '0.8rem' }} required>
											Type
										</InputLabel>
										<Select
											labelId='type'
											id='lesson_type'
											value={singleLessonBeforeSave.type}
											onChange={(e: SelectChangeEvent) => {
												setSingleLessonBeforeSave(() => {
													return { ...singleLessonBeforeSave, type: e.target.value };
												});
												setIsLessonUpdated(true);
											}}
											size='small'
											label='Type'
											required
											sx={{ backgroundColor: theme.bgColor?.common }}>
											{lessonTypes &&
												lessonTypes?.map((type) => (
													<MenuItem value={type} key={type}>
														{type}
													</MenuItem>
												))}
										</Select>
									</FormControl>
								</Box>
							</Box>

							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: '2rem', width: '100%' }}>
								<Box sx={{ flex: 1, mr: '2rem' }}>
									<HandleImageUploadURL
										label='Cover Image'
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
									<ImageThumbnail
										imgSource={singleLessonBeforeSave?.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
										removeImage={() => {
											{
												setIsLessonUpdated(true);
												setSingleLessonBeforeSave((prevData) => {
													return {
														...prevData,
														imageUrl: '',
													};
												});

												resetImageUpload();
											}
										}}
									/>
								</Box>
								<Box sx={{ flex: 1 }}>
									<HandleVideoUploadURL
										label='Lesson Video'
										onVideoUploadLogic={(url) => {
											setIsLessonUpdated(true);

											setSingleLessonBeforeSave(() => {
												return { ...singleLessonBeforeSave, videoUrl: url };
											});
										}}
										onChangeVideoUrl={(e) => {
											setSingleLessonBeforeSave((prevData) => ({
												...prevData,
												videoUrl: e.target.value,
											}));
											setIsLessonUpdated(true);
										}}
										videoUrlValue={singleLessonBeforeSave?.videoUrl}
										videoFolderName='LessonVideos'
										enterVideoUrl={enterVideoUrl}
										setEnterVideoUrl={setEnterVideoUrl}
									/>
									<VideoThumbnail
										videoPlayCondition={singleLessonBeforeSave?.videoUrl}
										videoUrl={singleLessonBeforeSave?.videoUrl}
										videoPlaceholderUrl='https://riggswealth.com/wp-content/uploads/2016/06/Riggs-Video-Placeholder.jpg'
										removeVideo={() => {
											setIsLessonUpdated(true);
											setSingleLessonBeforeSave((prevData) => {
												return {
													...prevData,
													videoUrl: '',
												};
											});

											resetVideoUpload();
										}}
									/>
								</Box>
							</Box>

							<Box sx={{ mt: '5rem' }}>
								<Typography variant='h6' sx={{ mb: '1rem' }}>
									{singleLessonBeforeSave.type === LessonType.INSTRUCTIONAL_LESSON ? 'Lesson Instructions' : 'Instructions'}
								</Typography>
								<TinyMceEditor
									height={400}
									handleEditorChange={(content) => {
										setEditorContent(content);
										setPrevEditorContent(content);
										setIsLessonUpdated(true);
									}}
									initialValue={singleLesson.text}
								/>
							</Box>

							{singleLessonBeforeSave.type !== LessonType.INSTRUCTIONAL_LESSON && (
								<>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: '100%',
											margin: '5rem 0 1.5rem 0',
										}}>
										<Box sx={{ flex: 1 }}>
											<Typography variant='h5'>Questions</Typography>
										</Box>
										<CustomInfoMessageAlignedLeft
											message='Drag the questions to reorder'
											sx={{ justifyContent: 'flex-end', alignItems: 'center', flex: 4, marginTop: '0.85rem' }}
										/>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 5 }}>
											<CustomSubmitButton
												type='button'
												size='small'
												sx={{ margin: 'auto 0.5rem auto 0' }}
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
												setIsQuestionUpdated={setIsQuestionUpdated}
											/>

											<CustomSubmitButton
												type='button'
												size='small'
												sx={{ marginBottom: 'auto 0' }}
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
										<NoContentBoxAdmin content='No question for this lesson' />
									) : (
										<Box sx={{ mb: '5rem' }}>
											<Reorder.Group
												axis='y'
												values={singleLessonBeforeSave.questions}
												onReorder={(newQuestions): void => {
													setIsLessonUpdated(true);
													setSingleLessonBeforeSave((prevData) => {
														return { ...prevData, questions: newQuestions, questionIds: newQuestions?.map((question) => question._id) };
													});
												}}>
												{singleLessonBeforeSave.questions &&
													singleLessonBeforeSave.questions.length !== 0 &&
													singleLessonBeforeSave.questions?.map((question, index) => {
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
																			height: '3rem',
																			width: '100%',
																			backgroundColor: theme.bgColor?.common,
																			margin: '1rem 0',
																			borderRadius: '0.25rem',
																			boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
																			cursor: 'pointer',
																		}}>
																		<Box
																			sx={{
																				height: '3rem',
																				width: '2rem',
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
																				margin: '0 1rem',
																			}}>
																			<Box sx={{ width: '35%' }}>
																				<Typography variant='body2'>{truncateText(stripHtml(question.question), 45)}</Typography>
																			</Box>

																			<Box>
																				<Typography variant='body2'>{fetchQuestionTypeName(question)}</Typography>
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

																					<AdminLessonEditPageEditQuestionDialog
																						lessonType={singleLessonBeforeSave.type}
																						question={question}
																						correctAnswerIndex={correctAnswerIndex}
																						index={index}
																						options={options}
																						correctAnswer={correctAnswer}
																						questionType={fetchQuestionTypeName(question)}
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
											{singleLessonBeforeSave?.questions?.length >= 10 && (
												<Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
													<CustomSubmitButton
														type='button'
														sx={{ margin: '0 0.5rem 1rem 0' }}
														onClick={() => {
															setAddNewQuestionModalOpen(true);
														}}>
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
															setCorrectAnswerIndex(-1);
														}}>
														Create Question
													</CustomSubmitButton>
												</Box>
											)}
										</Box>
									)}
								</>
							)}
							<Box sx={{ margin: '2rem 0 1rem 0' }}>
								<HandleDocUploadURL
									label={singleLessonBeforeSave.type === 'Quiz' ? 'Quiz Materials' : 'Lesson Materials'}
									onDocUploadLogic={(url, docName) => {
										setIsLessonUpdated(true);

										setSingleLessonBeforeSave((prevData) => {
											if (prevData && userId) {
												const maxNumber = prevData.documents
													.filter((doc) => doc !== null)
													.reduce((max, doc) => {
														const match = doc.name.match(/Untitled Document (\d+)/);
														const num = match ? parseInt(match[1], 10) : 0;
														return num > max ? num : max;
													}, 0);

												const newName = docName || `Untitled Document ${maxNumber + 1}`;
												return {
													...prevData,
													documents: [
														...prevData.documents,
														{
															_id: generateUniqueId('temp_doc_id_'),
															name: newName.trim(),
															documentUrl: url,
															orgId,
															userId,
															createdAt: '',
															updatedAt: '',
														},
													],
												};
											}
											return prevData;
										});
									}}
									enterDocUrl={enterDocUrl}
									setEnterDocUrl={setEnterDocUrl}
									docFolderName='Lesson Materials'
									addNewDocumentModalOpen={addNewDocumentModalOpen}
									setAddNewDocumentModalOpen={setAddNewDocumentModalOpen}
									setSingleLessonBeforeSave={setSingleLessonBeforeSave}
									singleLessonBeforeSave={singleLessonBeforeSave}
									setIsLessonUpdated={setIsLessonUpdated}
								/>
							</Box>

							<DocumentsListEditBox
								documentsSource={singleLessonBeforeSave.documents}
								toggleDocRenameModal={toggleDocRenameModal}
								closeDocRenameModal={closeDocRenameModal}
								isDocRenameModalOpen={isDocRenameModalOpen}
								saveDocRename={saveDocRename}
								setIsDocumentUpdated={setIsDocumentUpdated}
								removeDocOnClick={(document: Document) => {
									setIsLessonUpdated(true);
									setSingleLessonBeforeSave((prevData) => {
										if (prevData) {
											const filteredDocuments = prevData.documents?.filter((thisDoc) => thisDoc._id !== document._id);
											const filteredDocumentsIds = filteredDocuments?.map((doc) => doc._id);

											return {
												...prevData,
												documents: filteredDocuments,
												documentIds: filteredDocumentsIds,
											};
										}
										return prevData;
									});
								}}
								renameDocOnChange={(e: React.ChangeEvent<HTMLInputElement>, document: Document) => {
									setSingleLessonBeforeSave((prevData) => {
										if (prevData) {
											const updatedDocuments = prevData.documents
												?.filter((doc) => doc !== null)
												?.map((thisDoc) => {
													if (thisDoc._id === document._id) {
														return { ...thisDoc, name: e.target.value };
													} else {
														return thisDoc;
													}
												});
											return { ...prevData, documents: updatedDocuments };
										}
										return prevData;
									});
								}}
							/>
						</form>
					</Box>
				)}
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminLessonEditPage;
