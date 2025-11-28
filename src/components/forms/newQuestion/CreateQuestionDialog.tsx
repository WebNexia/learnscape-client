import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	MenuItem,
	Radio,
	Select,
	SelectChangeEvent,
	Snackbar,
	Tooltip,
	Typography,
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import theme from '../../../themes';
import { BlankValuePair, QuestionInterface, TranslatePair } from '../../../interfaces/question';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { useAuth } from '../../../hooks/useAuth';
import { Roles } from '../../../interfaces/enums';

import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import useImageUpload from '../../../hooks/useImageUpload';
import useVideoUpload from '../../../hooks/useVideoUpload';
import HandleImageUploadURL from '../uploadImageVideoDocument/HandleImageUploadURL';
import HandleVideoUploadURL from '../uploadImageVideoDocument/HandleVideoUploadURL';
import ImageThumbnail from '../uploadImageVideoDocument/ImageThumbnail';
import VideoThumbnail from '../uploadImageVideoDocument/VideoThumbnail';
import TinyMceEditor from '../../richTextEditor/TinyMceEditor';
import TrueFalseOptions from '../../layouts/questionTypes/TrueFalseOptions';
import { LessonType, QuestionType } from '../../../interfaces/enums';
import FlipCard from '../../layouts/flipCard/FlipCard';
import Matching from '../../layouts/matching/Matching';
import Translate from '../../layouts/translate/Translate';
import { Lesson } from '../../../interfaces/lessons';
import { updateEditorContentAndBlankPairs } from '../../../utils/updateEditorContentAndBlankPairs';
import FillInTheBlanksTyping from '../../layouts/FITBTyping/FillInTheBlanksTyping';
import FillInTheBlanksDragDrop from '../../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import CustomInfoMessageAlignedRight from '../../layouts/infoMessage/CustomInfoMessageAlignedRight';
import axios from '@utils/axiosInstance';
import { validateImageUrl, validateVideoUrl } from '../../../utils/urlValidation';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

declare global {
	interface Window {
		tinymce: any;
	}
}

interface CreateQuestionDialogProps {
	isQuestionCreateModalOpen: boolean;
	questionType: string;
	correctAnswer: string;
	options: string[];
	correctAnswerIndex: number;
	createNewQuestion: boolean;
	isMinimumOptions: boolean;
	isDuplicateOption: boolean;
	singleLessonBeforeSave?: Lesson;
	setIsQuestionCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setQuestionType: React.Dispatch<React.SetStateAction<string>>;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setOptions: React.Dispatch<React.SetStateAction<string[]>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
	handleCorrectAnswerChange: (index: number) => void;
	setCorrectAnswerIndex: React.Dispatch<React.SetStateAction<number>>;
	removeOption: (indexToRemove: number) => void;
	addOption: () => void;
	handleOptionChange?: (index: number, value: string) => void;
	setQuestionsUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMinimumOptions: React.Dispatch<React.SetStateAction<boolean>>;
	setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateQuestionDialog = ({
	isQuestionCreateModalOpen,
	questionType = '',
	correctAnswer = '',
	options = [''],
	correctAnswerIndex = -1,
	createNewQuestion,
	isMinimumOptions,
	isDuplicateOption,
	singleLessonBeforeSave,
	setIsQuestionCreateModalOpen,
	setQuestionType,
	setCorrectAnswer,
	setOptions,
	setSingleLessonBeforeSave,
	setIsLessonUpdated,
	handleCorrectAnswerChange,
	setCorrectAnswerIndex,
	removeOption,
	addOption,
	handleOptionChange,
	setIsMinimumOptions,
	setHasUnsavedChanges,
}: CreateQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { addNewQuestion, questionTypes } = useContext(QuestionsContext);
	const { resetImageUpload } = useImageUpload();
	const { resetVideoUpload } = useVideoUpload();
	const { user } = useAuth();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Role detection
	const isInstructor = user?.role === Roles.INSTRUCTOR;

	const editorId = generateUniqueId('editor-');
	const editorRef = useRef<any>(null);

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState(true);
	const [blankValuePairs, setBlankValuePairs] = useState<BlankValuePair[]>([]);

	const sortedBlankValuePairs = useMemo(() => {
		return [...(blankValuePairs || [])]?.sort((a, b) => a.blank - b.blank) || [];
	}, [blankValuePairs]);

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
		audio: false,
		video: false,
		isAiGenerated: false,
		matchingPairs: [],
		blankValuePairs,
		translatePairs: [],
		createdAt: '',
		updatedAt: '',
		clonedFromId: '',
		clonedFromQuestion: '',
		usedInLessons: [],
		createdBy: '',
		updatedBy: '',
		createdByName: '',
		updatedByName: '',
		createdByImageUrl: '',
		updatedByImageUrl: '',
		createdByRole: '',
		updatedByRole: '',
	});
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(false);
	const [isQuestionMissing, setIsQuestionMissing] = useState<boolean>(false);
	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState<boolean>(false);
	const [editorContent, setEditorContent] = useState<string>('');
	const [isMinimumTwoMatchingPairs, setIsMinimumTwoMatchingPairs] = useState<boolean>(false);
	const [isMissingPair, setIsMissingPair] = useState<boolean>(false);
	const [isMinimumOneBlank, setIsMinimumOneBlank] = useState<boolean>(false);
	const [isMinimumOneTranslatePair, setIsMinimumOneTranslatePair] = useState<boolean>(false);
	const [isMissingTranslatePair, setIsMissingTranslatePair] = useState<boolean>(false);
	const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	useEffect(() => {
		resetVideoUpload();
		resetImageUpload();
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	}, []);

	useEffect(() => {
		if (blankValuePairs && blankValuePairs.length > 0) {
			setIsMinimumOneBlank(false);
		}
	}, [blankValuePairs]);

	const isFlipCard = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion = questionType === QuestionType.AUDIO_VIDEO;
	const isMatching = questionType === QuestionType.MATCHING;
	const isFITBTyping = questionType === QuestionType.FITB_TYPING;
	const isFITBDragDrop = questionType === QuestionType.FITB_DRAG_DROP;
	const isTranslate = questionType === QuestionType.TRANSLATE;

	const resetValues = () => {
		setNewQuestion({
			_id: '',
			questionType: '',
			question: '',
			options: [],
			correctAnswer: '',
			videoUrl: '',
			imageUrl: '',
			orgId,
			isActive: true,
			audio: false,
			video: false,
			isAiGenerated: false,
			matchingPairs: [],
			blankValuePairs: [],
			translatePairs: [],
			createdAt: '',
			updatedAt: '',
			clonedFromId: '',
			clonedFromQuestion: '',
			usedInLessons: [],
			createdBy: '',
			updatedBy: '',
			createdByName: '',
			updatedByName: '',
			createdByImageUrl: '',
			updatedByImageUrl: '',
			createdByRole: '',
			updatedByRole: '',
		});
		setCorrectAnswer('');
		setOptions(['']);
		setEditorContent('');
		setCorrectAnswerIndex(-1);
		resetImageUpload();
		resetVideoUpload();
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
		setIsQuestionMissing(false);
		setIsCorrectAnswerMissing(false);
		setIsMinimumTwoMatchingPairs(false);
		setBlankValuePairs([]);
		setIsMinimumOneBlank(false);
		setIsMinimumOneTranslatePair(false);
		setIsMissingTranslatePair(false);
		// URL errors are now handled by Snackbar
	};

	const createQuestion = async () => {
		try {
			const questionTypeId = questionTypes?.find((type) => type.name === questionType)?._id || '';
			const response = await axios.post(`${base_url}/questions${isInstructor ? '/instructor' : ''}`, {
				questionType: questionTypeId,
				question: isFlipCard ? newQuestion.question.trim() : editorContent.trim(),
				options,
				correctAnswer: correctAnswer.trim(),
				imageUrl: newQuestion.imageUrl.trim(),
				videoUrl: newQuestion.videoUrl.trim(),
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				translatePairs: newQuestion.translatePairs,
				orgId,
				isActive: true,
				isAiGenerated: false,
			});

			const questionResponseData = response.data;

			addNewQuestion({
				_id: questionResponseData._id,
				questionType,
				question: isFlipCard ? newQuestion.question.trim() : editorContent.trim(),
				options,
				correctAnswer: correctAnswer.trim(),
				imageUrl: newQuestion.imageUrl.trim(),
				videoUrl: newQuestion.videoUrl.trim(),
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				translatePairs: newQuestion.translatePairs,
				orgId,
				isActive: true,
				isAiGenerated: false,
				createdAt: questionResponseData.createdAt,
				updatedAt: questionResponseData.updatedAt,
				createdByName: questionResponseData.createdByName,
				updatedByName: questionResponseData.updatedByName,
				createdByImageUrl: questionResponseData.createdByImageUrl,
				updatedByImageUrl: questionResponseData.updatedByImageUrl,
				createdByRole: questionResponseData.createdByRole,
				updatedByRole: questionResponseData.updatedByRole,
			} as QuestionInterface);
			resetValues();
		} catch (error) {
			console.log(error);
		}
	};

	const createQuestionTemplate = () => {
		try {
			const newQuestionBeforeSave = {
				_id: generateUniqueId('temp_question_id_'),
				questionType,
				question: isFlipCard ? newQuestion.question.trim() : editorContent.trim(),
				options,
				correctAnswer: correctAnswer.trim(),
				imageUrl: newQuestion.imageUrl.trim(),
				videoUrl: newQuestion.videoUrl.trim(),
				orgId,
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				translatePairs: newQuestion.translatePairs,
				isActive: true,
				isAiGenerated: false,
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

			setIsLessonUpdated?.(true);
			setSingleLessonBeforeSave?.((prevLesson) => ({
				...prevLesson,
				questions: [...prevLesson.questions, newQuestionBeforeSave],
				questionIds: [...prevLesson.questionIds, newQuestionBeforeSave._id],
			}));

			resetValues();
		} catch (error) {
			console.log(error);
		}
	};

	const validateUrls = async (): Promise<boolean> => {
		setIsValidatingUrl(true);
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (newQuestion.imageUrl.trim()) {
			const imageValidation = await validateImageUrl(newQuestion.imageUrl.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(imageValidation.error || 'Invalid image URL');
				hasErrors = true;
			}
		}

		// Validate video URL if provided
		if (newQuestion.videoUrl.trim()) {
			const videoValidation = await validateVideoUrl(newQuestion.videoUrl.trim());
			if (!videoValidation.isValid) {
				errorMessages.push(videoValidation.error || 'Invalid video URL');
				hasErrors = true;
			}
		}

		setIsValidatingUrl(false);

		// Show error Snackbar if there are validation errors
		if (hasErrors) {
			setUrlErrorMessage(errorMessages.join('\n'));
			setIsUrlErrorOpen(true);
		}

		return !hasErrors;
	};

	// Real-time URL validation (called when user changes URLs)
	const validateUrlOnChange = async (url: string, type: 'image' | 'video'): Promise<void> => {
		if (!url.trim()) return; // Don't validate empty URLs

		try {
			let validation;
			if (type === 'image') {
				validation = await validateImageUrl(url.trim());
			} else {
				validation = await validateVideoUrl(url.trim());
			}

			if (!validation.isValid) {
				setUrlErrorMessage(`${type === 'image' ? 'Image' : 'Video'} URL: ${validation.error}`);
				setIsUrlErrorOpen(true);
			}
		} catch (error) {
			console.error('URL validation error:', error);
		}
	};

	const handleSubmit = async () => {
		if (!editorContent && !newQuestion.question) {
			if (isFlipCard) {
				if (!newQuestion.imageUrl && !newQuestion.question) {
					setIsQuestionMissing(true);
					return;
				}
			} else {
				setIsQuestionMissing(true);
				return;
			}
		}

		if (isMultipleChoiceQuestion && options.length <= 1) {
			setIsMinimumOptions(false);
			return;
		}

		if (isMultipleChoiceQuestion && (isDuplicateOption || !isMinimumOptions)) return;

		if (isFlipCard && !correctAnswer) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isAudioVideoQuestion && !newQuestion.audio && !newQuestion.video) {
			setIsAudioVideoSelectionMissing(true);
			return;
		}

		if (isMatching) {
			const nonBlankPairs = newQuestion.matchingPairs?.filter((pair) => pair.question.trim() && pair.answer.trim()) || [];
			const missingPairExists = newQuestion.matchingPairs?.some((pair) => !pair.question.trim() || !pair.answer.trim()) || false;

			if (nonBlankPairs.length < 2) {
				setIsMinimumTwoMatchingPairs(true);
				return;
			}
			if (missingPairExists) {
				setIsMissingPair(true);
				return;
			}
		}

		if (isTranslate) {
			const nonBlankPairs = newQuestion.translatePairs?.filter((pair) => pair.originalText.trim() && pair.translation.trim()) || [];
			const missingPairExists = newQuestion.translatePairs?.some((pair) => !pair.originalText.trim() || !pair.translation.trim()) || false;

			if (nonBlankPairs.length < 1) {
				setIsMinimumOneTranslatePair(true);
				return;
			}
			if (missingPairExists) {
				setIsMissingTranslatePair(true);
				return;
			}
		}

		if ((isFITBDragDrop || isFITBTyping) && blankValuePairs.length < 1) {
			setIsMinimumOneBlank(true);
			return;
		}

		if (
			!isOpenEndedQuestion &&
			!isFlipCard &&
			!isAudioVideoQuestion &&
			!isMatching &&
			correctAnswerIndex === -1 &&
			!correctAnswer &&
			!isFITBDragDrop &&
			!isFITBTyping &&
			!isTranslate
		) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		// Validate URLs before proceeding with any backend operations
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			// Keep all frontend changes but don't proceed with backend operations
			return;
		}

		if (createNewQuestion) createQuestion();
		else createQuestionTemplate();

		setIsQuestionCreateModalOpen(false);
		resetImageUpload();
		resetVideoUpload();
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
		setHasUnsavedChanges?.(true);
	};

	const returnBlankValues = (pair: BlankValuePair) => {
		const editor = editorRef.current;
		if (!editor) {
			console.error('Editor not found or not initialized');
			return;
		}

		updateEditorContentAndBlankPairs(editor, pair, sortedBlankValuePairs, setBlankValuePairs);
	};

	return (
		<>
			{/* URL validation error Snackbar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={5000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>

			<CustomDialog
				openModal={isQuestionCreateModalOpen}
				closeModal={() => {
					setIsQuestionCreateModalOpen(false);
					resetValues();
				}}
				title='Create Question'
				maxWidth='lg'>
				<form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column' }}>
					<DialogContent sx={{ mt: '-4rem' }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								width: '100%',
								alignItems: 'flex-end',
								mb: '0.75rem',
								mt: isMobileSize ? '0.5rem' : undefined,
							}}>
							{!isMobileSize && (
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: '0.95rem' }}>
									Type
								</Typography>
							)}
							<FormControl sx={{ mb: '1rem', width: isMobileSize ? 'fit-content' : '15rem', backgroundColor: theme.bgColor?.common }}>
								<Select
									value={questionType}
									onChange={(event: SelectChangeEvent) => {
										setQuestionType(event.target.value);
										setCorrectAnswer('');
										setOptions(['']);
									}}
									size='small'
									required
									displayEmpty
									sx={{ color: questionType == '' ? 'gray' : 'inherit', fontSize: '0.8rem' }}>
									<MenuItem disabled value='' sx={{ fontSize: '0.85rem' }}>
										Select Type
									</MenuItem>
									{questionTypes
										?.filter((type) => {
											const questionTypeName = type.name as QuestionType;
											if (singleLessonBeforeSave?.type === LessonType.QUIZ) {
												return [
													QuestionType.MULTIPLE_CHOICE,
													QuestionType.TRUE_FALSE,
													QuestionType.OPEN_ENDED,
													QuestionType.AUDIO_VIDEO,
													QuestionType.MATCHING,
													QuestionType.FITB_TYPING,
													QuestionType.FITB_DRAG_DROP,
												]?.includes(questionTypeName);
											} else if (singleLessonBeforeSave?.type === LessonType.PRACTICE_LESSON) {
												return [
													QuestionType.MULTIPLE_CHOICE,
													QuestionType.TRUE_FALSE,
													QuestionType.OPEN_ENDED,
													QuestionType.MATCHING,
													QuestionType.FITB_TYPING,
													QuestionType.FITB_DRAG_DROP,
													QuestionType.FLIP_CARD,
													QuestionType.TRANSLATE,
												]?.includes(questionTypeName);
											}
											return true;
										})
										?.map((type) => (
											<MenuItem value={type.name} key={type._id} sx={{ fontSize: '0.85rem' }}>
												{type.name}
											</MenuItem>
										))}
								</Select>
							</FormControl>
						</Box>
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: isMobileSize ? 'column' : 'row',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
									mb: '2rem',
									width: '100%',
								}}>
								<Box sx={{ flex: 1, mr: '2rem', width: isMobileSize ? '100%' : undefined, mb: isMobileSize ? '2rem' : undefined }}>
									<HandleImageUploadURL
										label={isMobileSize ? 'Image' : 'Question Image'}
										onImageUploadLogic={(url) => {
											setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: url }));
											if (isFlipCard) setIsQuestionMissing(false);

											// Validate URL immediately after upload
											validateUrlOnChange(url, 'image');
										}}
										onChangeImgUrl={(e) => {
											setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: e.target.value }));
											if (isFlipCard) setIsQuestionMissing(false);
											setIsLessonUpdated?.(true);

											// Validate URL on change (debounced)
											validateUrlOnChange(e.target.value, 'image');
										}}
										imageUrlValue={newQuestion.imageUrl}
										enterImageUrl={enterImageUrl}
										setEnterImageUrl={setEnterImageUrl}
										imageFolderName='QuestionImages'
									/>
									{!isFlipCard && (
										<ImageThumbnail
											imgSource={newQuestion.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'}
											removeImage={() => {
												setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: '' }));
												setIsLessonUpdated?.(true);
												resetImageUpload();
											}}
										/>
									)}
								</Box>
								{!isFlipCard && (
									<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined }}>
										<HandleVideoUploadURL
											label={isMobileSize ? 'Video' : 'Question Video'}
											onVideoUploadLogic={(url) => {
												setNewQuestion((prevQuestion) => ({ ...prevQuestion, videoUrl: url }));

												// Validate URL immediately after upload
												validateUrlOnChange(url, 'video');
											}}
											onChangeVideoUrl={(e) => {
												setNewQuestion((prevQuestion) => ({ ...prevQuestion, videoUrl: e.target.value }));
												setIsLessonUpdated?.(true);

												// Validate URL on change (debounced)
												validateUrlOnChange(e.target.value, 'video');
											}}
											videoUrlValue={newQuestion.videoUrl}
											enterVideoUrl={enterVideoUrl}
											setEnterVideoUrl={setEnterVideoUrl}
											videoFolderName='QuestionVideos'
										/>
										<VideoThumbnail
											videoPlayCondition={newQuestion.videoUrl}
											videoUrl={newQuestion.videoUrl}
											videoPlaceholderUrl='https://placehold.co/600x400/e2e8f0/64748b?text=No+Video'
											removeVideo={() => {
												setNewQuestion((prevQuestion) => ({ ...prevQuestion, videoUrl: '' }));
												setIsLessonUpdated?.(true);
												resetVideoUpload();
											}}
										/>
									</Box>
								)}
							</Box>
							{!isFlipCard && (
								<Box sx={{ width: '100%', margin: '1rem 0' }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
										<Typography variant='h6' sx={{ mb: '0.5rem' }}>
											Question
											<span style={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', color: 'gray' }}>
												{isOpenEndedQuestion
													? ' (Students can enter max 5000 characters while answering)'
													: isFITBTyping
														? ' (Students can enter max 50 characters for each blank)'
														: isAudioVideoQuestion
															? ' (Students can upload up to 2-minute audio or 1-minute video recording)'
															: ''}
											</span>
										</Typography>
										{(isFITBDragDrop || isFITBTyping) && (
											<CustomInfoMessageAlignedRight message='Double-click a word to turn it into a blank' sx={{ marginBottom: '0.5rem' }} />
										)}
									</Box>
									<TinyMceEditor
										handleEditorChange={(content) => {
											setEditorContent(content);
											setIsQuestionMissing(false);
										}}
										initialValue=''
										blankValuePairs={blankValuePairs}
										setBlankValuePairs={setBlankValuePairs}
										editorId={editorId}
										editorRef={editorRef}
										isFITB={questionType === QuestionType.FITB_DRAG_DROP || questionType === QuestionType.FITB_TYPING}
										maxLength={5000}
									/>
									<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '0.5rem 0rem', textAlign: 'right' }}>
										{editorContent.length}/5000 Characters
									</Typography>
								</Box>
							)}

							{(isFITBDragDrop || isFITBTyping) && (
								<Box>
									<Box sx={{ marginTop: '1rem', width: isMobileSize ? '100%' : '90%', margin: isMobileSize ? '1rem auto 0 auto' : '0 auto' }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography variant='h6'>Blank Values</Typography>
											{(isFITBDragDrop || isFITBTyping) && (
												<CustomInfoMessageAlignedRight message='Click a word below to remove it from the blanks' />
											)}
										</Box>
										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												width: '100%',
												margin: '1rem 0',
												boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
												minHeight: '5rem',
												borderRadius: '0.35rem',
												padding: '0.5rem',
											}}>
											{sortedBlankValuePairs?.map((pair: BlankValuePair) => {
												return (
													<Box
														key={pair.id}
														sx={{
															border: `solid 0.1rem ${theme.border.main}`,
															width: 'fit-content',
															height: 'fit-content',
															padding: '0.5rem',
															borderRadius: '0.35rem',
															margin: '0.25rem',
															cursor: 'pointer',
														}}
														onClick={() => returnBlankValues(pair)}>
														<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
															{pair.blank}-{pair.value}
														</Typography>
													</Box>
												);
											})}
										</Box>
									</Box>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											width: '100%',
											minHeight: '4rem',
											margin: '3rem auto 0 auto',
										}}>
										<Box sx={{ display: 'flex', width: isMobileSize ? '100%' : '90%', margin: '1rem 0rem 0rem 0rem' }}>
											<Box sx={{ flex: 1 }}>
												<Typography variant={isMobileSize ? 'h6' : 'h5'}>Student View</Typography>
											</Box>
											<CustomInfoMessageAlignedRight message='View as in a practice lesson' />
										</Box>
										{isFITBDragDrop && (
											<Box sx={{ padding: '1rem 0', width: isMobileSize ? '100%' : '90%', mb: '-3rem' }}>
												<FillInTheBlanksDragDrop textWithBlanks={editorContent} blankValuePairs={sortedBlankValuePairs} />
											</Box>
										)}
										{isFITBTyping && (
											<Box sx={{ padding: '1rem 0', width: isMobileSize ? '100%' : '90%', mb: '-3rem' }}>
												<FillInTheBlanksTyping
													textWithBlanks={editorContent}
													blankValuePairs={sortedBlankValuePairs}
													fromAdminQuestions={createNewQuestion}
												/>
											</Box>
										)}
									</Box>
								</Box>
							)}

							{isAudioVideoQuestion && (
								<Box sx={{ display: 'flex', justifyContent: 'center', mb: '-3rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={newQuestion.audio}
												onChange={(e) => {
													setNewQuestion((prevData) => ({ ...prevData, audio: e.target.checked }));
													setIsAudioVideoSelectionMissing(false);
												}}
												sx={{
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '1rem' : '1.25rem',
													},
												}}
											/>
										}
										label='Ask Audio Recording'
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: isMobileSize ? '0.75rem' : '0.9rem',
											},
											'margin': '2rem 0',
										}}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={newQuestion.video}
												onChange={(e) => {
													setNewQuestion((prevData) => ({ ...prevData, video: e.target.checked }));
													setIsAudioVideoSelectionMissing(false);
												}}
												sx={{
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '1rem' : '1.25rem',
													},
												}}
											/>
										}
										label='Ask Video Recording'
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: isMobileSize ? '0.75rem' : '0.9rem',
											},
											'margin': '2rem 0 2rem 3rem',
										}}
									/>
								</Box>
							)}
							{isMultipleChoiceQuestion && (
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', mb: '-2rem' }}>
									{options?.map((option, index) => (
										<Box
											key={index}
											sx={{
												display: 'flex',
												justifyContent: 'flex-end',
												alignItems: 'center',
												width: isMobileSize ? '95%' : '90%',
												marginLeft: '3rem',
											}}>
											<Tooltip title='Correct Answer' placement='left' arrow>
												<FormControlLabel
													control={
														<Radio
															checked={index === correctAnswerIndex}
															onChange={() => {
																setIsCorrectAnswerMissing(false);
																handleCorrectAnswerChange(index);
															}}
															color='primary'
															size='small'
															sx={{ '& .MuiSvgIcon-root': { fontSize: isMobileSize ? '1.1rem' : undefined } }}
														/>
													}
													label=''
												/>
											</Tooltip>
											{index === options.length - 1 && (
												<Tooltip title='Add Option' placement='top' arrow>
													<IconButton onClick={addOption}>
														<AddCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
													</IconButton>
												</Tooltip>
											)}
											<CustomTextField
												required
												label={`Option ${index + 1}`}
												value={option}
												onChange={(e) => handleOptionChange?.(index, e.target.value)}
												sx={{ marginTop: isMobileSize ? '0.25rem' : '0.75rem', marginRight: index === 0 ? '2.5rem' : 0 }}
												InputProps={{
													inputProps: {
														maxLength: 255,
													},
												}}
											/>
											{index > 0 && (
												<Tooltip title='Remove Option' placement='top' arrow>
													<IconButton onClick={() => removeOption(index)}>
														<RemoveCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
													</IconButton>
												</Tooltip>
											)}
										</Box>
									))}
								</Box>
							)}
							{isTrueFalseQuestion && (
								<TrueFalseOptions
									correctAnswer={correctAnswer}
									setCorrectAnswer={setCorrectAnswer}
									setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
								/>
							)}
							{isFlipCard && (
								<FlipCard
									newQuestion={newQuestion}
									setCorrectAnswer={setCorrectAnswer}
									setNewQuestion={setNewQuestion}
									setIsQuestionMissing={setIsQuestionMissing}
									setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
								/>
							)}
							{isMatching && (
								<Matching
									setNewQuestion={setNewQuestion}
									setIsMinimumTwoMatchingPairs={setIsMinimumTwoMatchingPairs}
									setIsMissingPair={setIsMissingPair}
									lessonType={singleLessonBeforeSave?.type}
								/>
							)}
							{isTranslate && (
								<Translate
									setNewQuestion={setNewQuestion}
									setIsMinimumOneTranslatePair={setIsMinimumOneTranslatePair}
									setIsMissingPair={setIsMissingTranslatePair}
								/>
							)}
						</Box>
						<Box sx={{ mt: '2rem' }}>
							{isQuestionMissing && (
								<CustomErrorMessage>
									{isFlipCard && !newQuestion.imageUrl ? '- Enter front face text and/or image' : '- Enter question'}
								</CustomErrorMessage>
							)}
							{isCorrectAnswerMissing && !isAudioVideoQuestion && !isMatching && !isTranslate && (
								<CustomErrorMessage>{isFlipCard ? '- Enter back face text' : '- Select correct answer'}</CustomErrorMessage>
							)}
							{isAudioVideoQuestion && isAudioVideoSelectionMissing && (
								<CustomErrorMessage>- Select at least one of the recording options</CustomErrorMessage>
							)}

							{isMatching && (
								<>
									{isMinimumTwoMatchingPairs && <CustomErrorMessage>- Enter at least 2 completed pairs</CustomErrorMessage>}
									{isMissingPair && <CustomErrorMessage>- There is at least one incomplete pair</CustomErrorMessage>}
								</>
							)}
							{isTranslate && (
								<>
									{isMinimumOneTranslatePair && <CustomErrorMessage>- Enter at least 1 completed pair</CustomErrorMessage>}
									{isMissingTranslatePair && <CustomErrorMessage>- There is at least one incomplete pair</CustomErrorMessage>}
								</>
							)}
							{(isFITBDragDrop || isFITBTyping) && isMinimumOneBlank && <CustomErrorMessage>- Enter at least 1 blank in the text</CustomErrorMessage>}

							{isMultipleChoiceQuestion && (
								<Box sx={{ mt: '2rem' }}>
									{isDuplicateOption && <CustomErrorMessage>- Options should be unique</CustomErrorMessage>}
									{!isMinimumOptions && <CustomErrorMessage>- At least two options are required</CustomErrorMessage>}
								</Box>
							)}

							{/* URL validation errors - now handled by Snackbar */}
						</Box>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => {
							setIsQuestionCreateModalOpen(false);
							resetValues();
							resetImageUpload();
							resetVideoUpload();
						}}
						disableBtn={questionType == '' || isValidatingUrl}
						onSubmit={handleSubmit}
						cancelBtnSx={{ margin: '0 0.5rem 1rem 0' }}
						submitBtnSx={{ margin: '0 1rem 1rem 0' }}
						submitBtnType='button'
						submitBtnText={isValidatingUrl ? 'Validating...' : 'Create'}
					/>
				</form>
			</CustomDialog>
		</>
	);
};

export default CreateQuestionDialog;
