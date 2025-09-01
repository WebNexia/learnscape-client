import {
	Alert,
	Box,
	DialogContent,
	FormControl,
	IconButton,
	keyframes,
	Link,
	MenuItem,
	Select,
	SelectChangeEvent,
	Snackbar,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import theme from '../themes';
import { AutoAwesome, Delete, Edit, FileCopy } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { Lesson } from '../interfaces/lessons';
import axios from '@utils/axiosInstance';
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
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { useBlocker, useNavigate } from 'react-router-dom';
import AiIcon from '@mui/icons-material/AutoAwesome';
import CreateLessonWithAIDialog from '../components/adminSingleLesson/CreateLessonWithAIDialog';
import CreateQuestionWithAIDialog from '../components/adminSingleLesson/CreateQuestionWithAIDialog';
import { validateImageUrl, validateVideoUrl, validateDocumentUrl } from '../utils/urlValidation';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

const colorChange = keyframes`
    0% {
        color: #009694;
    }
    50% {
        color:#2C3E50;
    }
    100% {
        color: #009694;
    }
`;
const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

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
	const { lessonId } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { updateLessonPublishing, updateLessons, lessonTypes } = useContext(LessonsContext);

	const { questionTypes, fetchQuestionTypeName, addNewQuestion, updateQuestion } = useContext(QuestionsContext);
	const { addNewDocument, updateDocuments } = useContext(DocumentsContext);

	const vertical = 'top';
	const horizontal = 'center';

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
	};

	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleLesson, setSingleLesson] = useState<Lesson>(defaultLesson);
	const [singleLessonBeforeSave, setSingleLessonBeforeSave] = useState<Lesson>(defaultLesson);

	const [isActive, setIsActive] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [displayedQuestionNonEdit, setDisplayedQuestionNonEdit] = useState<QuestionInterface | null>(null);
	const [isDisplayNonEditQuestion, setIsDisplayNonEditQuestion] = useState<boolean>(false);
	const [isLessonUpdated, setIsLessonUpdated] = useState<boolean>(false);
	const [isQuestionUpdated, setIsQuestionUpdated] = useState<QuestionUpdateTrack[]>([]);
	const [isDocumentUpdated, setIsDocumentUpdated] = useState<DocumentUpdateTrack[]>([]);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

	const [isQuestionCloneModalOpen, setIsQuestionCloneModalOpen] = useState<boolean[]>([]);
	const [addNewQuestionModalOpen, setAddNewQuestionModalOpen] = useState<boolean>(false);
	const [addNewDocumentModalOpen, setAddNewDocumentModalOpen] = useState<boolean>(false);

	const [isPublishAllowedMsgOpen, setIsPublishAllowedMsgOpen] = useState<boolean>(false);
	const [isAiContentGeneratedMsgOpen, setIsAiContentGeneratedMsgOpen] = useState<boolean>(false);

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);
	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);

	const [editorContent, setEditorContent] = useState<string>('');
	const [prevEditorContent, setPrevEditorContent] = useState<string>('');
	const [titleError, setTitleError] = useState<boolean>(false);
	const [instructionError, setInstructionError] = useState<boolean>(false);
	const [questionError, setQuestionError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isErrorMessageOpen, setIsErrorMessageOpen] = useState<boolean>(false);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
		setEnterDocUrl(true);
	};

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState<Array<boolean>>([]);
	const [originalDocumentNames, setOriginalDocumentNames] = useState<Record<string, string>>({});
	const [isAiInstructionModalOpen, setIsAiInstructionModalOpen] = useState<boolean>(false);
	const [isAiQuestionModalOpen, setIsAiQuestionModalOpen] = useState<boolean>(false);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);

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
		setHasUnsavedChanges(true);
	};

	const closeDocRenameModal = (index: number, document: Document) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		newRenameModalOpen[index] = false;

		setSingleLessonBeforeSave((prevData) => {
			if (prevData) {
				const updatedDocuments = prevData?.documents
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
		setHasUnsavedChanges(true);
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

	const [isPopStateNavigation, setIsPopStateNavigation] = useState(false);

	useEffect(() => {
		const handlePopState = () => {
			setIsPopStateNavigation(true);
		};
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	const navigate = useNavigate();

	const [allowNavigation, setAllowNavigation] = useState(false);
	const [nextLocation, setNextLocation] = useState<string | null>(null);
	const [pendingTx, setPendingTx] = useState<any>(null);

	// Warn on browser/tab close or refresh
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	// Warn on in-app navigation (Data Router only) with custom dialog
	useBlocker((tx) => {
		if (allowNavigation || isPopStateNavigation) {
			return false; // Allow navigation
		}
		if (hasUnsavedChanges) {
			setPendingTx(tx);
			setNextLocation(tx.nextLocation.pathname);
			return true; // Block navigation
		}
		return false;
	});

	useEffect(() => {
		if (allowNavigation && nextLocation) {
			navigate(nextLocation);
			setAllowNavigation(false);
			setNextLocation(null);
		}
		// Reset popstate flag after transition completes
		if (isPopStateNavigation) {
			setIsPopStateNavigation(false);
		}
	}, [allowNavigation, nextLocation, navigate, isPopStateNavigation]);

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
	}, [lessonId]);

	useEffect(() => {
		setEditorContent(prevEditorContent);
		setSingleLessonBeforeSave(() => {
			return { ...singleLessonBeforeSave, text: prevEditorContent };
		});
	}, [singleLessonBeforeSave.type]);

	const handlePublishing = async (): Promise<void> => {
		// If unpublishing, allow it regardless of content
		if (singleLesson?.isActive) {
			try {
				await axios.patch(`${base_url}/lessons/${lessonId}`, {
					isActive: false,
					publishedAt: null, // Clear publishedAt when unpublishing
				});

				setIsActive(false);
				setSingleLesson((prevData) => ({ ...prevData, isActive: false }));
				setSingleLessonBeforeSave((prevData) => ({ ...prevData, isActive: false }));
				updateLessons({ ...singleLesson, isActive: false });
				if (lessonId) updateLessonPublishing(lessonId);
			} catch (error) {
				console.log(error);
			}
			return;
		}

		// For publishing, check requirements
		const hasRequiredFields =
			lessonId &&
			singleLesson.title?.trim() &&
			singleLesson.text?.trim() &&
			(singleLesson.type === LessonType.INSTRUCTIONAL_LESSON ||
				(singleLesson.type !== LessonType.INSTRUCTIONAL_LESSON && singleLesson.questionIds?.length > 0));

		if (hasRequiredFields) {
			try {
				const now = new Date().toISOString();
				await axios.patch(`${base_url}/lessons/${lessonId}`, {
					isActive: true,
					publishedAt: now, // Set publishedAt when publishing
					questionIds: singleLesson.questionIds,
					documentIds: singleLesson.documentIds,
					text: singleLesson.text,
					title: singleLesson.title,
					type: singleLesson.type,
					orgId: singleLesson.orgId,
					imageUrl: singleLesson.imageUrl,
					videoUrl: singleLesson.videoUrl,
				});
				setIsActive(true);
				setSingleLesson((prevData) => ({ ...prevData, isActive: true }));
				setSingleLessonBeforeSave((prevData) => ({ ...prevData, isActive: true }));
				updateLessons({ ...singleLesson, isActive: true });
				if (lessonId) updateLessonPublishing(lessonId);
			} catch (error) {
				console.log(error);
			}
		} else {
			setIsPublishAllowedMsgOpen(true);
		}
	};

	const validateUrls = async (): Promise<boolean> => {
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (singleLessonBeforeSave.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(singleLessonBeforeSave.imageUrl.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(imageValidation.error || 'Invalid image URL');
				hasErrors = true;
			}
		}

		// Validate video URL if provided
		if (singleLessonBeforeSave.videoUrl?.trim()) {
			const videoValidation = await validateVideoUrl(singleLessonBeforeSave.videoUrl.trim());
			if (!videoValidation.isValid) {
				errorMessages.push(videoValidation.error || 'Invalid video URL');
				hasErrors = true;
			}
		}

		// Validate document URLs if provided
		if (singleLessonBeforeSave.documents && singleLessonBeforeSave.documents.length > 0) {
			for (const document of singleLessonBeforeSave.documents) {
				if (document && document.documentUrl?.trim()) {
					const documentValidation = await validateDocumentUrl(document.documentUrl.trim());
					if (!documentValidation.isValid) {
						errorMessages.push(`Document "${document.name}": ${documentValidation.error || 'Invalid document URL'}`);
						hasErrors = true;
					}
				}
			}
		}

		// Show error Snackbar if there are validation errors
		if (hasErrors) {
			setErrorMessage(errorMessages.join('\n'));
			setIsUrlErrorOpen(true);
		}

		return !hasErrors;
	};

	// Optional: Real-time URL validation (can be called when user changes URLs)
	const validateUrlOnChange = async (url: string, type: 'image' | 'video' | 'document'): Promise<void> => {
		if (!url.trim()) return; // Don't validate empty URLs

		try {
			let validation;
			if (type === 'image') {
				validation = await validateImageUrl(url.trim());
			} else if (type === 'video') {
				validation = await validateVideoUrl(url.trim());
			} else {
				validation = await validateDocumentUrl(url.trim());
			}

			if (!validation.isValid) {
				const typeLabel = type === 'image' ? 'Image' : type === 'video' ? 'Video' : 'Document';
				setErrorMessage(`${typeLabel} URL: ${validation.error}`);
				setIsUrlErrorOpen(true);
			}
		} catch (error) {
			console.error('URL validation error:', error);
		}
	};

	const handleLessonUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		// Validate URLs before proceeding with any backend operations
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			// Keep all frontend changes but don't proceed with backend update
			// Update the lesson state with current editor content to preserve it
			// This ensures the editor content is not lost when URL validation fails
			setSingleLessonBeforeSave((prevData) => ({
				...prevData,
				text: editorContent?.trim() || '',
			}));
			return;
		}

		let updatedQuestions: QuestionInterface[] = [];
		let updatedDocuments: Document[] = [];

		try {
			if (singleLessonBeforeSave?.documents) {
				const updatedDocumentsPromises = (singleLessonBeforeSave?.documents as (Document | null)[])
					?.filter((doc): doc is Document => doc !== null)
					?.map(async (document) => {
						if (document._id.includes('temp_doc_id')) {
							try {
								const response = await axios.post(`${base_url}/documents`, {
									name: document.name.trim(),
									orgId,
									userId: user?._id,
									documentUrl: document.documentUrl,
								});

								const documentResponseData = response.data;

								addNewDocument({
									_id: documentResponseData._id,
									name: document.name.trim(),
									orgId,
									userId: user?._id,
									documentUrl: document.documentUrl,
									usedInLessons: lessonId ? [lessonId] : [],
									usedInCourses: document.usedInCourses,
									createdAt: documentResponseData.createdAt,
									updatedAt: documentResponseData.updatedAt,
									createdByName: documentResponseData.createdByName,
									updatedByName: documentResponseData.updatedByName,
									createdByImageUrl: documentResponseData.createdByImageUrl,
									updatedByImageUrl: documentResponseData.updatedByImageUrl,
									createdByRole: documentResponseData.createdByRole,
									updatedByRole: documentResponseData.updatedByRole,
								});
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
							const response = await axios.patch(`${base_url}/documents/${doc._id}`, {
								name: doc.name.trim(),
							});

							const documentUpdateData = response.data.data;

							updateDocuments({
								...doc,
								name: doc.name.trim(),
								createdAt: documentUpdateData.createdAt,
								updatedAt: documentUpdateData.updatedAt,
								createdByName: documentUpdateData.createdByName,
								updatedByName: documentUpdateData.updatedByName,
								createdByImageUrl: documentUpdateData.createdByImageUrl,
								updatedByImageUrl: documentUpdateData.updatedByImageUrl,
								createdByRole: documentUpdateData.createdByRole,
								updatedByRole: documentUpdateData.updatedByRole,
							});
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
						const questionTypeId = questionTypes.find((type) => type.name === question.questionType || type._id === question.questionType)?._id;

						if (questionTypeId) {
							try {
								const response = await axios.post(`${base_url}/questions`, {
									orgId,
									question: question.question.trim(),
									options: question.options,
									correctAnswer: question.correctAnswer,
									videoUrl: question.videoUrl,
									imageUrl: question.imageUrl,
									questionType: questionTypeId,
									audio: question.audio,
									video: question.video,
									isAiGenerated: question.isAiGenerated,
									matchingPairs: question.matchingPairs,
									blankValuePairs: question.blankValuePairs,
									isActive: true,
									...(question.clonedFromId ? { clonedFromId: question.clonedFromId } : {}),
								});

								const newQuestionResponseData = response.data;

								addNewQuestion({ ...newQuestionResponseData });
								return {
									...question,
									_id: response.data._id,
									createdAt: response.data.createdAt,
									updatedAt: response.data.updatedAt,
								} as QuestionInterface;
							} catch (error: any) {
								console.error('Error creating question:', error);
								setErrorMessage('Error creating question: ' + error.response.data.message);
								setIsErrorMessageOpen(true);
								setIsEditMode(true);

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
								const response = await axios.patch(`${base_url}/questions/${question._id}`, questionWithoutType);

								const questionUpdateResponseData = response.data.data;

								updateQuestion({ ...questionUpdateResponseData });
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
					const response = await axios.patch(`${base_url}/lessons/${lessonId}`, {
						...singleLessonBeforeSave,
						title: singleLessonBeforeSave.title,
						type: singleLessonBeforeSave.type,
						orgId,
						isActive: singleLessonBeforeSave.isActive,
						imageUrl: singleLessonBeforeSave.imageUrl,
						videoUrl: singleLessonBeforeSave.videoUrl,
						text: editorContent?.trim() || '',
						documentIds: updatedDocumentIds,
						questionIds: updatedQuestionIds,
						usedInCourses: singleLessonBeforeSave.usedInCourses,
					});

					const responseUpdatedData = response.data.data;

					// fetchLessons();
					updateLessons({
						...singleLessonBeforeSave,
						questions: updatedQuestions,
						questionIds: updatedQuestionIds,
						text: editorContent?.trim() || '',
						documentIds: updatedDocumentIds,
						documents: updatedDocuments,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					// Update question contexts with current usedInLessons data
					updatedQuestions?.forEach((question) => {
						updateQuestion({
							...question,
							usedInLessons: question.usedInLessons || [],
						});
					});

					// Update document contexts with current usedInLessons data
					updatedDocuments?.forEach((document) => {
						updateDocuments({
							...document,
							usedInLessons: document.usedInLessons || [],
						});
					});

					setSingleLesson({
						...singleLessonBeforeSave,
						questions: updatedQuestions,
						questionIds: updatedQuestionIds,
						text: editorContent?.trim() || '',
						documentIds: updatedDocumentIds,
						documents: updatedDocuments,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					setSingleLessonBeforeSave((prevData) => {
						return {
							...prevData,
							questions: updatedQuestions,
							questionIds: updatedQuestionIds,
							text: singleLessonBeforeSave.type === 'Quiz' ? '' : editorContent?.trim() || '',
							documentIds: updatedDocumentIds,
							documents: updatedDocuments,
						};
					});
				} catch (error: any) {
					console.error('Error updating lesson:', error);
					setErrorMessage(error.response.data.message);
					setIsErrorMessageOpen(true);
					setIsEditMode(true);
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
			setHasUnsavedChanges(false);
			setIsEditMode(false);
		} catch (error: any) {
			console.error('Error during lesson update process:', error);
			setErrorMessage(error.response.data.message);
			setIsErrorMessageOpen(true);
			setIsEditMode(true);
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
		setHasUnsavedChanges(true);

		setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => prevData?.filter((data) => data.questionId !== question._id));

		setSingleLessonBeforeSave((prevLesson) => {
			return {
				...prevLesson,
				questionIds: updatedQuestionIds,
				questions: updatedQuestions,
			};
		});
	};

	const openCloneQuestionModal = (index: number) => {
		const updatedState = [...isQuestionCloneModalOpen];
		updatedState[index] = true;
		setIsQuestionCloneModalOpen(updatedState);
	};
	const closeCloneQuestionModal = (index: number) => {
		const updatedState = [...isQuestionCloneModalOpen];
		updatedState[index] = false;
		setIsQuestionCloneModalOpen(updatedState);
	};

	const cloneQuestion = (question: QuestionInterface, index: number) => {
		const clonedQuestion: QuestionInterface = {
			...question,
			_id: generateUniqueId('temp_question_id_'),
			clonedFromId: question._id,
			usedInLessons: lessonId ? [lessonId] : [],
		};

		setSingleLessonBeforeSave((prevData) => {
			if (prevData) {
				// Use immutability to update state
				return {
					...prevData,
					questions: [
						...prevData.questions?.slice(0, index + 1), // Questions before the index
						clonedQuestion, // The cloned question
						...prevData.questions?.slice(index + 1), // Questions after the index
					],
					questionIds: [
						...prevData.questionIds?.slice(0, index + 1), // IDs before the index
						clonedQuestion._id, // The cloned question ID
						...prevData.questionIds?.slice(index + 1), // IDs after the index
					],
				};
			}
			return prevData;
		});

		setIsLessonUpdated(true);
		setHasUnsavedChanges(true);
	};

	return (
		<DashboardPagesLayout pageName='Edit Lesson' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<LessonPaper
					singleLesson={singleLesson}
					isActive={isActive}
					singleLessonBeforeSave={singleLessonBeforeSave}
					setSingleLessonBeforeSave={setSingleLessonBeforeSave}
					isEditMode={isEditMode}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					editorContent={editorContent}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					handlePublishing={handlePublishing}
					handleLessonUpdate={handleLessonUpdate}
					setIsLessonUpdated={setIsLessonUpdated}
					setIsQuestionUpdated={setIsQuestionUpdated}
					resetImageUpload={resetImageUpload}
					resetVideoUpload={resetVideoUpload}
					resetEnterImageVideoUrl={resetEnterImageVideoUrl}
					setTitleError={setTitleError}
					setInstructionError={setInstructionError}
					setQuestionError={setQuestionError}
					hasUnsavedChanges={hasUnsavedChanges}
					setHasUnsavedChanges={setHasUnsavedChanges}
					setErrorMessage={setErrorMessage}
				/>
			</Box>

			<Snackbar
				open={isPublishAllowedMsgOpen}
				autoHideDuration={3000}
				anchorOrigin={{ vertical, horizontal }}
				sx={{ mt: '5rem' }}
				onClose={() => setIsPublishAllowedMsgOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					Add instruction and/or question(s) to publish the lesson
				</Alert>
			</Snackbar>

			<Snackbar
				open={isErrorMessageOpen}
				autoHideDuration={3000}
				anchorOrigin={{ vertical, horizontal }}
				sx={{ mt: '5rem' }}
				onClose={() => setIsErrorMessageOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{errorMessage}
				</Alert>
			</Snackbar>

			<Snackbar
				open={isAiContentGeneratedMsgOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical, horizontal }}
				sx={{ mt: '5rem' }}
				onClose={() => setIsAiContentGeneratedMsgOpen(false)}>
				<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff' }}>
					AI content generated successfully! You can now review and edit the content.
				</Alert>
			</Snackbar>

			{/* URL validation error Snackbar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical, horizontal }}
				sx={{ mt: '5rem' }}
				onClose={() => {
					setIsUrlErrorOpen(false);
					setIsEditMode(true);
				}}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{errorMessage}
				</Alert>
			</Snackbar>

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
				setIsMinimumOptions={setIsMinimumOptions}
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
				setHasUnsavedChanges={setHasUnsavedChanges}
			/>

			<Box sx={{ display: 'flex', width: '95%', justifyContent: 'center', marginTop: isEditMode ? '5rem' : '9.5rem' }}>
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

						<Box className='rich-text-content' component='div' sx={{ textAlign: 'justify', width: '90%', mt: '5rem' }}>
							<Typography variant='h5' sx={{ mb: '1.25rem' }}>
								{singleLesson.type === LessonType.INSTRUCTIONAL_LESSON ? 'Lesson Instructions' : 'Instructions'}
							</Typography>
							{singleLesson.text ? (
								<Typography
									variant='body2'
									dangerouslySetInnerHTML={{ __html: sanitizeHtml(singleLesson.text) }}
									sx={{
										'boxShadow': singleLesson.text ? '0 0 0.4rem 0.2rem rgba(0,0,0,0.25)' : 'none',
										'padding': '2rem',
										'borderRadius': '0.35rem',
										'lineHeight': 1.7,
										'& strong, & b': {
											fontWeight: 'bolder',
										},
										'& img': {
											maxWidth: '100%',
											height: 'auto',
											borderRadius: '0.35rem',
											margin: '1rem 0',
											boxShadow: '0 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)',
										},
									}}
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
								margin: singleLesson?.type === LessonType.INSTRUCTIONAL_LESSON ? '3rem 0 4rem 0' : '0rem 0 4rem 0',
							}}>
							<Box>
								<Typography variant='h5' sx={{ mb: '1.25rem' }}>
									{singleLesson.type} Materials
								</Typography>
							</Box>
							{singleLesson?.documents?.filter((doc) => doc !== null).length !== 0 ? (
								<Box>
									{singleLesson?.documents
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
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
								<Box sx={{ flex: 1, mr: '2rem' }}>
									<Typography variant='h6'>Title*</Typography>
									<Tooltip title='Max 100 Characters' placement='top' arrow>
										<CustomTextField
											sx={{
												marginTop: '0.5rem',
											}}
											value={singleLessonBeforeSave?.title}
											InputProps={{ inputProps: { maxLength: 100 } }}
											placeholder='Enter title'
											onChange={(e) => {
												setIsLessonUpdated(true);
												setHasUnsavedChanges(true);
												setTitleError(false);
												setSingleLessonBeforeSave(() => {
													return { ...singleLessonBeforeSave, title: e.target.value };
												});
											}}
											error={titleError}
										/>
									</Tooltip>
									{titleError && <CustomErrorMessage>Please enter a title</CustomErrorMessage>}
								</Box>
								<Box sx={{ flex: 1, textAlign: 'right', mb: '0.75rem' }}>
									<FormControl>
										<Typography variant='h6'>Type</Typography>
										<Select
											value={singleLessonBeforeSave.type}
											onChange={(e: SelectChangeEvent) => {
												setSingleLessonBeforeSave(() => {
													return { ...singleLessonBeforeSave, type: e.target.value };
												});
												setIsLessonUpdated(true);
												setHasUnsavedChanges(true);
											}}
											size='small'
											required
											sx={{ backgroundColor: theme.bgColor?.common, fontSize: '0.85rem', mt: '0.5rem' }}>
											{lessonTypes &&
												lessonTypes?.map((type) => (
													<MenuItem value={type} key={type} sx={{ fontSize: '0.8rem' }}>
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
											setHasUnsavedChanges(true);

											setSingleLessonBeforeSave(() => {
												return { ...singleLessonBeforeSave, imageUrl: url };
											});

											// Validate URL immediately after upload
											validateUrlOnChange(url, 'image');
										}}
										onChangeImgUrl={(e) => {
											setSingleLessonBeforeSave((prevCourse) => ({
												...prevCourse,
												imageUrl: e.target.value,
											}));
											setIsLessonUpdated(true);
											setHasUnsavedChanges(true);

											// Validate URL on change (debounced)
											validateUrlOnChange(e.target.value, 'image');
										}}
										imageUrlValue={singleLessonBeforeSave?.imageUrl}
										imageFolderName='LessonImages'
										enterImageUrl={enterImageUrl}
										setEnterImageUrl={setEnterImageUrl}
									/>
									<ImageThumbnail
										imgSource={singleLessonBeforeSave?.imageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Image'}
										removeImage={() => {
											{
												setIsLessonUpdated(true);
												setHasUnsavedChanges(true);
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
											setHasUnsavedChanges(true);

											setSingleLessonBeforeSave(() => {
												return { ...singleLessonBeforeSave, videoUrl: url };
											});

											// Validate URL immediately after upload
											validateUrlOnChange(url, 'video');
										}}
										onChangeVideoUrl={(e) => {
											setSingleLessonBeforeSave((prevData) => ({
												...prevData,
												videoUrl: e.target.value,
											}));
											setIsLessonUpdated(true);
											setHasUnsavedChanges(true);

											// Validate URL on change (debounced)
											validateUrlOnChange(e.target.value, 'video');
										}}
										videoUrlValue={singleLessonBeforeSave?.videoUrl}
										videoFolderName='LessonVideos'
										enterVideoUrl={enterVideoUrl}
										setEnterVideoUrl={setEnterVideoUrl}
									/>
									<VideoThumbnail
										videoPlayCondition={singleLessonBeforeSave?.videoUrl}
										videoUrl={singleLessonBeforeSave?.videoUrl}
										videoPlaceholderUrl='https://placehold.co/500x400/e2e8f0/64748b?text=No+Video'
										removeVideo={() => {
											setIsLessonUpdated(true);
											setHasUnsavedChanges(true);
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

							<Box sx={{ mt: '4.5rem', mb: '1rem' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant='h6' sx={{ mb: '1rem' }}>
										{singleLessonBeforeSave.type === LessonType.INSTRUCTIONAL_LESSON ? 'Lesson Instructions' : 'Instructions'}
									</Typography>
									<Tooltip title='Create instruction with AI' placement='top' arrow>
										<IconButton
											sx={{ 'mb': '1rem', '&:hover': { backgroundColor: 'transparent' } }}
											onClick={() => setIsAiInstructionModalOpen(true)}>
											<AiIcon
												sx={{
													fontSize: '2rem',
													width: '1.5rem',
													height: '1.5rem',
													border: 'none',
													ml: 0.8,
													color: '#4D7B8B',
													animation: `${colorChange} 1s infinite, ${spin} 3s linear infinite`,
												}}
											/>
										</IconButton>
									</Tooltip>
								</Box>
								<CreateLessonWithAIDialog
									isAiInstructionModalOpen={isAiInstructionModalOpen}
									setIsAiInstructionModalOpen={setIsAiInstructionModalOpen}
									onContentGenerated={(content) => {
										setEditorContent(content);
										setPrevEditorContent(content);
										setIsLessonUpdated(true);
										setHasUnsavedChanges(true);
										setInstructionError(false);
										setIsAiContentGeneratedMsgOpen(true);
									}}
								/>
								<TinyMceEditor
									height={400}
									handleEditorChange={(content) => {
										setEditorContent(content);
										setPrevEditorContent(content);
										setIsLessonUpdated(true);
										setHasUnsavedChanges(true);
										setInstructionError(false);
									}}
									initialValue={singleLesson.text}
									value={editorContent}
									maxLength={15000}
								/>
								<Box sx={{ margin: '1rem 0' }}>{instructionError && <CustomErrorMessage>Enter lesson instructions</CustomErrorMessage>}</Box>
							</Box>

							{singleLessonBeforeSave.type !== LessonType.INSTRUCTIONAL_LESSON && (
								<>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: '100%',
											margin: '4rem 0 1rem 0',
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
												setHasUnsavedChanges={setHasUnsavedChanges}
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
											<Tooltip title='Create questions with AI' placement='top' arrow>
												<IconButton
													sx={{ 'mb': '1rem', '&:hover': { backgroundColor: 'transparent' } }}
													onClick={() => setIsAiQuestionModalOpen(true)}>
													<AiIcon
														sx={{
															fontSize: '2rem',
															width: '1.5rem',
															height: '1.5rem',
															border: 'none',
															ml: 0.8,
															color: '#4D7B8B',
															animation: `${colorChange} 1s infinite, ${spin} 3s linear infinite`,
														}}
													/>
												</IconButton>
											</Tooltip>
											<CreateQuestionWithAIDialog
												isAiQuestionModalOpen={isAiQuestionModalOpen}
												setIsAiQuestionModalOpen={setIsAiQuestionModalOpen}
												lessonType={singleLessonBeforeSave.type}
												onQuestionsGenerated={(questions, questionType) => {
													try {
														// Validate that we have a valid question type
														if (!questionType || !questionTypes?.find((type) => type.name === questionType)) {
															throw new Error('Invalid question type selected');
														}

														// Parse the JSON string back to an array of questions
														const parsedQuestions = JSON.parse(questions);

														// Convert AI-generated questions to the format expected by the lesson
														const convertedQuestions: QuestionInterface[] = parsedQuestions.map((aiQuestion: any) => {
															// Use the actual question type that was selected in the AI dialog
															const questionTypeName = questionType;

															let options = aiQuestion.options || [];
															let correctAnswer = aiQuestion.correctAnswer;

															if (questionTypeName === 'True-False') {
																options = ['True', 'False'];
																// Normalize correctAnswer to 'True' or 'False' (capitalize first letter)
																if (typeof correctAnswer === 'string') {
																	const normalized = correctAnswer.trim().toLowerCase();
																	correctAnswer = normalized === 'true' ? 'True' : 'False';
																} else {
																	correctAnswer = 'True'; // fallback
																}
															}

															return {
																_id: generateUniqueId('temp_question_id_'),
																questionType: questionTypeName,
																question: aiQuestion.question,
																options,
																correctAnswer,
																imageUrl: aiQuestion.imageUrl || '',
																videoUrl: aiQuestion.videoUrl || '',
																audio: aiQuestion.audio || false,
																video: aiQuestion.video || false,
																isAiGenerated: true,
																matchingPairs: aiQuestion.matchingPairs || [],
																blankValuePairs: aiQuestion.blankValuePairs || [],
																orgId,
																isActive: true,
																createdAt: '',
																updatedAt: '',
																clonedFromId: '',
																clonedFromQuestion: '',
																usedInLessons: singleLessonBeforeSave?._id ? [singleLessonBeforeSave?._id] : [],
																createdBy: '',
																updatedBy: '',
																createdByName: '',
																updatedByName: '',
																createdByImageUrl: '',
																updatedByImageUrl: '',
																createdByRole: '',
																updatedByRole: '',
															};
														});

														// Add the generated questions to the lesson
														setSingleLessonBeforeSave((prevLesson) => ({
															...prevLesson,
															questions: [...prevLesson.questions, ...convertedQuestions],
															questionIds: [...prevLesson.questionIds, ...convertedQuestions.map((q: QuestionInterface) => q._id)],
														}));

														setIsLessonUpdated(true);
														setHasUnsavedChanges(true);
														setIsAiContentGeneratedMsgOpen(true);
													} catch (error) {
														console.error('Error parsing generated questions:', error);
														// You might want to show an error message to the user here
													}
												}}
											/>
										</Box>
									</Box>

									{singleLessonBeforeSave?.questionIds?.length === 0 ||
									singleLessonBeforeSave?.questions?.filter((question) => question !== null).length === 0 ? (
										<NoContentBoxAdmin content='No question for this lesson' />
									) : (
										<Box sx={{ mb: '5rem' }}>
											<Reorder.Group
												axis='y'
												values={singleLessonBeforeSave?.questions || []}
												onReorder={(newQuestions): void => {
													setIsLessonUpdated(true);
													setHasUnsavedChanges(true);
													setSingleLessonBeforeSave((prevData) => {
														return { ...prevData, questions: newQuestions, questionIds: newQuestions?.map((question) => question._id) };
													});
												}}>
												{singleLessonBeforeSave.questions &&
													singleLessonBeforeSave.questions?.length !== 0 &&
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

																			<Box sx={{ display: 'flex', alignItems: 'center' }}>
																				<Typography variant='body2'>{fetchQuestionTypeName(question)}</Typography>
																				{question.isAiGenerated && (
																					<Tooltip title='AI Generated' placement='top' arrow>
																						<AutoAwesome
																							sx={{
																								fontSize: '1rem',
																								marginLeft: '0.5rem',
																								color: '#2196F3',
																								zIndex: 1,
																							}}
																						/>
																					</Tooltip>
																				)}
																			</Box>

																			<Box sx={{ display: 'flex' }}>
																				<Box>
																					<Tooltip title='Clone' placement='top' arrow>
																						<IconButton
																							onClick={() => {
																								openCloneQuestionModal(index);
																							}}>
																							<FileCopy fontSize='small' />
																						</IconButton>
																					</Tooltip>
																				</Box>

																				<CustomDialog
																					openModal={isQuestionCloneModalOpen[index]}
																					closeModal={() => closeCloneQuestionModal(index)}
																					title='Clone Question'
																					content='Are you sure you want to clone the question?'
																					maxWidth='sm'>
																					<CustomDialogActions
																						onSubmit={() => {
																							cloneQuestion(question, index);
																							closeCloneQuestionModal(index);
																						}}
																						onCancel={() => closeCloneQuestionModal(index)}
																						submitBtnText='Clone'
																					/>
																				</CustomDialog>

																				<Box>
																					<Tooltip title='Edit' placement='top' arrow>
																						<IconButton
																							onClick={() => {
																								setOptions(question.options);
																								setCorrectAnswer(question.correctAnswer);
																								const correctAnswerIndex = question.options.indexOf(question.correctAnswer);
																								setCorrectAnswerIndex(correctAnswerIndex);
																								toggleQuestionEditModal(index);
																							}}>
																							<Edit fontSize='small' />
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
																						setHasUnsavedChanges={setHasUnsavedChanges}
																					/>
																				</Box>
																				<Tooltip title='Remove' placement='top' arrow>
																					<IconButton onClick={() => removeQuestion(question)}>
																						<Delete fontSize='small' />
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
									<Box sx={{ margin: '1rem 0' }}>{questionError && <CustomErrorMessage>Add at least one question</CustomErrorMessage>}</Box>
								</>
							)}
							<Box sx={{ margin: '2rem 0 1rem 0' }}>
								<HandleDocUploadURL
									label={singleLessonBeforeSave.type === 'Quiz' ? 'Quiz Materials' : 'Lesson Materials'}
									onDocUploadLogic={(url, docName) => {
										setIsLessonUpdated(true);
										setHasUnsavedChanges(true);

										// Validate document URL immediately after upload
										validateUrlOnChange(url, 'document');

										setSingleLessonBeforeSave((prevData) => {
											if (prevData && user?._id) {
												const maxNumber = prevData?.documents
													.filter((doc) => doc !== null)
													.reduce((max, doc) => {
														const match = doc.name.match(/Untitled Document (\d+)/);
														const num = match ? parseInt(match[1], 10) : 0;
														return num > max ? num : max;
													}, 0);

												const newName = docName || `Untitled Document ${maxNumber + 1}`;
												const newDocument: Document = {
													_id: generateUniqueId('temp_doc_id_'),
													name: newName.trim(),
													documentUrl: url,
													orgId,
													userId: user?._id,
													createdAt: '',
													updatedAt: new Date().toISOString(),
													clonedFromId: '',
													clonedFromTitle: '',
													usedInLessons: lessonId ? [lessonId] : [],
													usedInCourses: [],
													imageUrl: '',
													prices: [
														{ currency: 'gbp', amount: '0' },
														{ currency: 'usd', amount: '0' },
														{ currency: 'try', amount: '0' },
														{ currency: 'eur', amount: '0' },
													],
													description: '',
													samplePageImageUrl: '',
													isOnLandingPage: false,
													isArchived: false,
													pageCount: 0,
													createdBy: '',
													updatedBy: '',
													createdByName: '',
													updatedByName: '',
													createdByImageUrl: '',
													updatedByImageUrl: '',
													createdByRole: '',
													updatedByRole: '',
												};

												return {
													...prevData,
													documents: [...prevData?.documents, newDocument],
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
									setHasUnsavedChanges={setHasUnsavedChanges}
								/>
							</Box>

							<DocumentsListEditBox
								documentsSource={singleLessonBeforeSave?.documents}
								toggleDocRenameModal={toggleDocRenameModal}
								closeDocRenameModal={closeDocRenameModal}
								isDocRenameModalOpen={isDocRenameModalOpen}
								saveDocRename={saveDocRename}
								setIsDocumentUpdated={setIsDocumentUpdated}
								setHasUnsavedChanges={setHasUnsavedChanges}
								removeDocOnClick={(document: Document) => {
									setIsLessonUpdated(true);
									setHasUnsavedChanges(true);
									setSingleLessonBeforeSave((prevData) => {
										if (prevData) {
											const filteredDocuments = prevData?.documents?.filter((thisDoc) => thisDoc._id !== document._id);
											const filteredDocumentsIds = filteredDocuments?.map((doc) => doc._id);

											// Update document's usedInLessons in the documents context
											const updatedDocument = {
												...document,
												usedInLessons: document.usedInLessons.filter((id) => id !== lessonId),
												createdAt: document.createdAt,
												createdByName: document.createdByName,
												createdByImageUrl: document.createdByImageUrl,
												createdByRole: document.createdByRole,
												updatedAt: new Date().toISOString(),
												updatedByName: document.updatedByName,
												updatedByImageUrl: document.updatedByImageUrl,
												updatedByRole: document.updatedByRole,
											};
											updateDocuments(updatedDocument);

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
									setHasUnsavedChanges(true);
									setSingleLessonBeforeSave((prevData) => {
										if (prevData) {
											const updatedDocuments = prevData?.documents
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

			{/* CustomDialog for unsaved changes confirmation */}
			<CustomDialog openModal={!!pendingTx} closeModal={() => setPendingTx(null)} title='Unsaved Changes' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2'>You have unsaved changes. Are you sure you want to leave this page?</Typography>
					<Typography variant='body2' sx={{ mt: '0.75rem' }}>
						If you leave this page, you will lose your unsaved changes.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setPendingTx(null)}
					onSubmit={() => {
						if (nextLocation) {
							setAllowNavigation(true);
							setPendingTx(null);
						}
					}}
					submitBtnText='Leave Page'
					cancelBtnText='Stay'
				/>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default AdminLessonEditPage;
