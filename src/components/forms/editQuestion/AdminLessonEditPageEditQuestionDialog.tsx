import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { QuestionUpdateTrack } from '../../../pages/AdminLessonEditPage';
import { BlankValuePair, QuestionInterface } from '../../../interfaces/question';
import { Lesson } from '../../../interfaces/lessons';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import { questionLessonUpdateTrack } from '../../../utils/questionLessonUpdateTrack';
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
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { updateEditorContentAndBlankPairs } from '../../../utils/updateEditorContentAndBlankPairs';
import theme from '../../../themes';
import FillInTheBlanksDragDropProps from '../../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../../layouts/FITBTyping/FillInTheBlanksTyping';
import CustomInfoMessageAlignedRight from '../../layouts/infoMessage/CustomInfoMessageAlignedRight';
import { validateImageUrl, validateVideoUrl } from '../../../utils/urlValidation';
import { decode } from 'html-entities';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface AdminLessonEditPageEditQuestionDialogProps {
	index: number;
	question: QuestionInterface;
	correctAnswerIndex: number;
	editQuestionModalOpen: boolean[];
	options: string[];
	correctAnswer: string;
	questionType: string;
	isMinimumOptions: boolean;
	isDuplicateOption: boolean;
	lessonType?: string;
	singleLessonBeforeSave?: Lesson;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>>;
	setCorrectAnswerIndex: React.Dispatch<React.SetStateAction<number>>;
	handleCorrectAnswerChange: (index: number) => void;
	handleOptionChange: (index: number, value: string) => void;
	closeQuestionEditModal: (index: number) => void;
	setIsQuestionUpdated?: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
	addOption: () => void;
	removeOption: (indexToRemove: number) => void;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setIsDuplicateOption: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMinimumOptions: React.Dispatch<React.SetStateAction<boolean>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminLessonEditPageEditQuestionDialog = ({
	index,
	question,
	correctAnswerIndex,
	editQuestionModalOpen,
	options,
	correctAnswer,
	questionType,
	isMinimumOptions,
	isDuplicateOption,
	lessonType,
	singleLessonBeforeSave,
	setSingleLessonBeforeSave,
	handleCorrectAnswerChange,
	setCorrectAnswerIndex,
	handleOptionChange,
	closeQuestionEditModal,
	setIsQuestionUpdated,
	setIsLessonUpdated,
	addOption,
	removeOption,
	setCorrectAnswer,
	setIsDuplicateOption,
	setIsMinimumOptions,
	setHasUnsavedChanges,
}: AdminLessonEditPageEditQuestionDialogProps) => {
	const editorId = generateUniqueId('editor-');
	const editorRef = useRef<any>(null);

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

	const isFlipCard = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion = questionType === QuestionType.AUDIO_VIDEO;
	const isMatching = questionType === QuestionType.MATCHING;
	const isFITBTyping = questionType === QuestionType.FITB_TYPING;
	const isFITBDragDrop = questionType === QuestionType.FITB_DRAG_DROP;
	const isTranslate = questionType === QuestionType.TRANSLATE;

	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState(false);
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState(
		correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion && !isMatching
	);
	const [isQuestionMissing, setIsQuestionMissing] = useState<boolean>(false);
	const { resetImageUpload } = useImageUpload();
	const { resetVideoUpload } = useVideoUpload();
	const [isMinimumTwoMatchingPairs, setIsMinimumTwoMatchingPairs] = useState<boolean>(false);
	const [isMinimumOneBlank, setIsMinimumOneBlank] = useState<boolean>(false);
	const [isMissingPair, setIsMissingPair] = useState<boolean>(false);
	const [isMinimumOneTranslatePair, setIsMinimumOneTranslatePair] = useState<boolean>(false);
	const [isMissingTranslatePair, setIsMissingTranslatePair] = useState<boolean>(false);
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);
	const [editorContent, setEditorContent] = useState(question.question);
	const [questionBeforeSave, setQuestionBeforeSave] = useState<QuestionInterface>(question);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	const [blankValuePairs, setBlankValuePairs] = useState<BlankValuePair[]>(question.blankValuePairs);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	// URL validation functions
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
				const typeLabel = type === 'image' ? 'Image' : 'Video';
				setUrlErrorMessage(`${typeLabel} URL: ${validation.error}`);
				setIsUrlErrorOpen(true);
			}
		} catch (error) {
			console.error('URL validation error:', error);
		}
	};

	useEffect(() => {
		setIsCorrectAnswerMissing(
			correctAnswerIndex < 0 &&
				question.correctAnswer === '' &&
				!isOpenEndedQuestion &&
				!isFITBDragDrop &&
				!isMatching &&
				!isFITBTyping &&
				!isTranslate
		);
		resetVideoUpload();
		resetImageUpload();
		resetEnterImageVideoUrl();
		setIsDuplicateOption(false);
		setIsMinimumOptions(true);
		setIsMinimumOneBlank(false);
	}, [correctAnswerIndex]);

	useEffect(() => {
		if (blankValuePairs?.length > 0) {
			setIsMinimumOneBlank(false);
		}
	}, [blankValuePairs]);

	const handleSubmit = async () => {
		if (!isFlipCard) await handleInputChange('question', editorContent);

		// Validate URLs before proceeding
		let hasUrlErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (question.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(question.imageUrl.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(imageValidation.error || 'Invalid image URL');
				hasUrlErrors = true;
			}
		}

		// Validate video URL if provided
		if (question.videoUrl?.trim()) {
			const videoValidation = await validateVideoUrl(question.videoUrl.trim());
			if (!videoValidation.isValid) {
				errorMessages.push(videoValidation.error || 'Invalid video URL');
				hasUrlErrors = true;
			}
		}

		// Show error SnackBar if there are validation errors
		if (hasUrlErrors) {
			setUrlErrorMessage(errorMessages.join('\n'));
			setIsUrlErrorOpen(true);
			return;
		}

		if (isFlipCard && !correctAnswer) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isFlipCard && !question.question && !question.imageUrl) {
			setIsQuestionMissing(true);
			return;
		}

		if (isAudioVideoQuestion && !question.audio && !question.video) {
			setIsAudioVideoSelectionMissing(true);
			return;
		}

		if (!editorContent && !isFlipCard) {
			setIsQuestionMissing(true);
			return;
		}

		if (isMultipleChoiceQuestion && (correctAnswerIndex === -1 || !correctAnswer)) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isTrueFalseQuestion && !correctAnswer) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isOpenEndedQuestion || isMatching || isFITBDragDrop || isFITBTyping || isTranslate) {
			setIsCorrectAnswerMissing(false);
		}

		if (isMatching) {
			const nonBlankPairs = question.matchingPairs?.filter((pair) => pair.question.trim() !== '' && pair.answer.trim() !== '') || [];
			const missingPairExists = question.matchingPairs?.some((pair) => pair.question.trim() === '' || pair.answer.trim() === '') || false;

			if (nonBlankPairs.length < 2) {
				setIsMinimumTwoMatchingPairs(true);
				return;
			}
			if (missingPairExists) {
				setIsMissingPair(true);
				return;
			}
			setIsMinimumTwoMatchingPairs(false);
			setIsMissingPair(false);
		}

		if (isTranslate) {
			// Read translatePairs from singleLessonBeforeSave (most up-to-date) since Translate component updates it directly
			const currentQuestion = singleLessonBeforeSave?.questions?.find((q) => q?._id === question._id);
			const currentTranslatePairs = currentQuestion?.translatePairs || question.translatePairs || [];
			const nonBlankPairs = currentTranslatePairs?.filter((pair) => pair.originalText.trim() !== '' && pair.translation.trim() !== '') || [];
			const missingPairExists = currentTranslatePairs?.some((pair) => pair.originalText.trim() === '' || pair.translation.trim() === '') || false;

			if (nonBlankPairs.length < 1) {
				setIsMinimumOneTranslatePair(true);
				return;
			}
			if (missingPairExists) {
				setIsMissingTranslatePair(true);
				return;
			}
			setIsMinimumOneTranslatePair(false);
			setIsMissingTranslatePair(false);
		}

		if (isFITBDragDrop || isFITBTyping) {
			if (blankValuePairs.length < 1) {
				setIsMinimumOneBlank(true);
				return;
			}
			setIsMinimumOneBlank(false);
		}
		if (isMultipleChoiceQuestion && (isDuplicateOption || !isMinimumOptions)) return;

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				// Read translatePairs from prevData (most up-to-date) since Translate component updates it directly
				const currentQuestion = prevData.questions?.find((q) => q?._id === question._id);
				const currentTranslatePairs = currentQuestion?.translatePairs || question.translatePairs || [];

				const updatedQuestions = prevData.questions?.map((prevQuestion) => {
					if (prevQuestion && prevQuestion._id === question._id) {
						const updatedQuestion = {
							...prevQuestion,
							options: options?.filter((option) => option !== '') || [],
							correctAnswer,
							blankValuePairs,
							translatePairs: currentTranslatePairs,
						};
						setQuestionBeforeSave(updatedQuestion);
						return updatedQuestion;
					}
					return prevQuestion;
				});

				return { ...prevData, questions: updatedQuestions };
			});
			questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
			resetImageUpload();
			resetVideoUpload();
			resetEnterImageVideoUrl();
			setHasUnsavedChanges(true);
		}

		closeQuestionEditModal(index);
	};

	const handleInputChange = async (field: 'question' | 'videoUrl' | 'imageUrl' | 'audio' | 'video', value: string | boolean) => {
		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData.questions?.map((prevQuestion) => {
					if (prevQuestion && prevQuestion._id === question._id) {
						return { ...prevQuestion, [field]: value };
					}
					return prevQuestion;
				});
				return { ...prevData, questions: updatedQuestions };
			});
			questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
		}
	};

	const imagePlaceHolderUrl = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

	const handleResetQuestion = () => {
		setEditorContent(questionBeforeSave.question);
		setBlankValuePairs(questionBeforeSave.blankValuePairs);
		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData.questions?.map((prevQuestion) => {
					if (prevQuestion && prevQuestion._id === question._id) {
						return questionBeforeSave;
					}
					return prevQuestion;
				});

				return { ...prevData, questions: updatedQuestions };
			});
		}
	};

	const returnBlankValues = (pair: BlankValuePair) => {
		const editor = editorRef.current;
		if (!editor) {
			console.error('Editor not found or not initialized');
			return;
		}
		questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);

		updateEditorContentAndBlankPairs(editor, pair, blankValuePairs, setBlankValuePairs);
	};

	return (
		<CustomDialog
			openModal={editQuestionModalOpen[index]}
			closeModal={() => {
				closeQuestionEditModal(index);
				setIsDuplicateOption(false);
				setIsMinimumOptions(true);
				resetImageUpload();
				resetVideoUpload();
				resetEnterImageVideoUrl();
				setCorrectAnswerIndex(-1);
				handleResetQuestion();
				setIsMinimumOneBlank(false);
				setIsMinimumOneTranslatePair(false);
				setIsMissingTranslatePair(false);
				setIsUrlErrorOpen(false);
			}}
			title={`Edit Question (${questionType})`}
			maxWidth='lg'>
			<form onSubmit={(e) => e.preventDefault()}>
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
							display: 'flex',
							flexDirection: isMobileSize ? 'column' : 'row',
							justifyContent: 'space-between',
							alignItems: isMobileSize ? 'center' : 'flex-start',
							mb: '2rem',
							width: '100%',
						}}>
						<Box sx={{ flex: 1, mr: isMobileSize ? '0rem' : '2rem', width: isMobileSize ? '100%' : undefined }}>
							<HandleImageUploadURL
								onImageUploadLogic={(url) => {
									handleInputChange('imageUrl', url);
									// Validate URL immediately after upload
									validateUrlOnChange(url, 'image');
								}}
								onChangeImgUrl={(e) => {
									handleInputChange('imageUrl', e.target.value);
									// Validate URL on change (debounced)
									validateUrlOnChange(e.target.value, 'image');
								}}
								imageUrlValue={question.imageUrl}
								imageFolderName='QuestionImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>
							{!isFlipCard && (
								<ImageThumbnail imgSource={question.imageUrl || imagePlaceHolderUrl} removeImage={() => handleInputChange('imageUrl', '')} />
							)}
						</Box>
						{!isFlipCard && (
							<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined, mt: isMobileSize ? '2rem' : undefined }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										handleInputChange('videoUrl', url);
										// Validate URL immediately after upload
										validateUrlOnChange(url, 'video');
									}}
									onChangeVideoUrl={(e) => {
										handleInputChange('videoUrl', e.target.value);
										// Validate URL on change (debounced)
										validateUrlOnChange(e.target.value, 'video');
									}}
									videoUrlValue={question.videoUrl}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>
								<VideoThumbnail
									videoPlayCondition={question.videoUrl !== ''}
									videoUrl={question.videoUrl}
									videoPlaceholderUrl='https://placehold.co/600x400/e2e8f0/64748b?text=No+Video'
									removeVideo={() => handleInputChange('videoUrl', '')}
								/>
							</Box>
						)}
					</Box>

					{isFlipCard ? (
						<FlipCard
							question={question}
							setCorrectAnswer={setCorrectAnswer}
							setIsQuestionMissing={setIsQuestionMissing}
							setSingleLessonBeforeSave={setSingleLessonBeforeSave}
							setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
							fromLessonEditPage={true}
						/>
					) : (
						<Box sx={{ width: '100%', margin: '1rem 0' }}>
							<Typography variant='h6' sx={{ mb: '0.5rem' }}>
								Question{' '}
								<span style={{ fontSize: '0.8rem', color: 'gray' }}>
									{isOpenEndedQuestion
										? '(Students can enter max 5000 characters while answering)'
										: isFITBTyping
											? '(Students can enter max 50 characters for each blank)'
											: ''}
								</span>
							</Typography>
							<TinyMceEditor
								handleEditorChange={(content) => {
									setEditorContent(content);
									setIsQuestionMissing(false);
									questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
								}}
								initialValue={decode(question.question)}
								blankValuePairs={blankValuePairs}
								setBlankValuePairs={setBlankValuePairs}
								editorId={editorId}
								editorRef={editorRef}
								isFITB={isFITBDragDrop || isFITBTyping}
								maxLength={5000}
							/>
							<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '0.5rem 0rem', textAlign: 'right' }}>
								{editorContent.length}/5000 Characters
							</Typography>
						</Box>
					)}

					<Box sx={{ width: isMobileSize ? '100%' : '90%', mb: isOpenEndedQuestion ? '-1rem' : '-2rem' }}>
						{isMultipleChoiceQuestion &&
							options?.map((option, i) => (
								<Box
									key={i}
									sx={{
										display: 'flex',
										justifyContent: 'flex-end',
										alignItems: 'center',
										width: '100%',
										marginLeft: isMobileSize ? '0.5rem' : '3rem',
									}}>
									<Tooltip title='Correct Answer' placement='left' arrow>
										<FormControlLabel
											control={
												<Radio
													checked={i === correctAnswerIndex}
													onChange={() => {
														handleCorrectAnswerChange(i);
														setIsCorrectAnswerMissing(false);
														questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
													}}
													color='primary'
													size='small'
													sx={{ '& .MuiSvgIcon-root': { fontSize: isMobileSize ? '1.1rem' : undefined } }}
												/>
											}
											label=''
										/>
									</Tooltip>
									{i === options.length - 1 && (
										<Tooltip title='Add Option' placement='top' arrow>
											<IconButton onClick={addOption}>
												<AddCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
											</IconButton>
										</Tooltip>
									)}
									<CustomTextField
										label={`Option ${i + 1}`}
										value={option}
										onChange={(e) => {
											handleOptionChange(i, e.target.value);
											if (i === correctAnswerIndex) setCorrectAnswer(e.target.value);
											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										}}
										sx={{
											marginTop: '0.75rem',
											marginRight: i === 0 ? '2.5rem' : 0,
											borderBottom: option === question.correctAnswer ? 'solid 0.2rem green' : 'inherit',
										}}
									/>
									{i > 0 && (
										<Tooltip title='Remove Option' placement='top' arrow>
											<IconButton onClick={() => removeOption(i)}>
												<RemoveCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
											</IconButton>
										</Tooltip>
									)}
								</Box>
							))}

						{isTrueFalseQuestion && (
							<TrueFalseOptions
								fromLessonEditPage={true}
								correctAnswer={correctAnswer}
								setCorrectAnswer={setCorrectAnswer}
								setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
							/>
						)}

						{(isFITBDragDrop || isFITBTyping) && (
							<Box sx={{ width: '100%' }}>
								<Box sx={{ marginTop: '1rem' }}>
									<Typography variant='h6'>Blank Values</Typography>
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
										{blankValuePairs
											?.sort((a, b) => a.blank - b.blank)
											?.map((pair: BlankValuePair) => {
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
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											width: '100%',
										}}>
										<Box>
											<Typography variant={isMobileSize ? 'h6' : 'h5'}>Student View </Typography>
										</Box>
										<CustomInfoMessageAlignedRight message={`View as in a ${lessonType === LessonType.QUIZ ? 'quiz' : 'practice lesson'}`} />
									</Box>
									{isFITBDragDrop && (
										<Box sx={{ padding: '1rem 0', width: '100%', mb: '-2rem' }}>
											<FillInTheBlanksDragDropProps textWithBlanks={editorContent} blankValuePairs={blankValuePairs} lessonType={lessonType} />
										</Box>
									)}
									{isFITBTyping && (
										<Box sx={{ padding: '1rem 0', width: '100%', mb: '-2rem' }}>
											<FillInTheBlanksTyping textWithBlanks={editorContent} blankValuePairs={blankValuePairs} lessonType={lessonType} />
										</Box>
									)}
								</Box>
							</Box>
						)}

						{isAudioVideoQuestion && (
							<Box sx={{ display: 'flex', justifyContent: 'center' }}>
								<Box sx={{ margin: isMobileSize ? '2rem 0' : '2rem 2rem 2rem 0rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={question.audio}
												onChange={(e) => {
													handleInputChange('audio', e.target.checked);
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
												fontSize: isMobileSize ? '0.8rem' : '0.9rem',
											},
										}}
									/>
								</Box>
								<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={question.video}
												onChange={(e) => {
													handleInputChange('video', e.target.checked);
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
												fontSize: isMobileSize ? '0.8rem' : '0.9rem',
											},
										}}
									/>
								</Box>
							</Box>
						)}

						{isMatching && (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
								<Matching
									question={question}
									existingQuestion={true}
									matchingPairs={question.matchingPairs}
									lessonType={lessonType}
									setIsMissingPair={setIsMissingPair}
									setSingleLessonBeforeSave={setSingleLessonBeforeSave}
									setIsLessonUpdated={setIsLessonUpdated}
									setIsQuestionUpdated={setIsQuestionUpdated}
								/>
							</Box>
						)}
						{isTranslate && (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
								<Translate
									question={question}
									existingQuestion={true}
									translatePairs={question.translatePairs || []}
									setIsMinimumOneTranslatePair={setIsMinimumOneTranslatePair}
									setIsMissingPair={setIsMissingTranslatePair}
									setSingleLessonBeforeSave={setSingleLessonBeforeSave}
									setIsLessonUpdated={setIsLessonUpdated}
									setIsQuestionUpdated={setIsQuestionUpdated}
								/>
							</Box>
						)}
					</Box>
					<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
						{isQuestionMissing && (
							<CustomErrorMessage>{isFlipCard ? '- Enter front face text or enter image' : '- Enter question'}</CustomErrorMessage>
						)}

						{isCorrectAnswerMissing && !isAudioVideoQuestion && !isMatching && !isTranslate && (
							<CustomErrorMessage>{isFlipCard ? '- Enter back face text' : '- Select correct answer'}</CustomErrorMessage>
						)}
						{isAudioVideoQuestion && isAudioVideoSelectionMissing && <CustomErrorMessage>- Select one of the recording options</CustomErrorMessage>}

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
					</Box>

					{isMultipleChoiceQuestion && (
						<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
							{isDuplicateOption && <CustomErrorMessage>- Options should be unique</CustomErrorMessage>}
							{!isMinimumOptions && <CustomErrorMessage>- At least two options are required</CustomErrorMessage>}
						</Box>
					)}
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						closeQuestionEditModal(index);
						setIsDuplicateOption(false);
						setIsMinimumOptions(true);
						resetImageUpload();
						resetVideoUpload();
						resetEnterImageVideoUrl();
						handleResetQuestion();
						setIsMinimumOneBlank(false);
						setIsMinimumOneTranslatePair(false);
						setIsMissingTranslatePair(false);
						setIsUrlErrorOpen(false);
					}}
					cancelBtnText='Cancel'
					onSubmit={handleSubmit}
					submitBtnText='Save'
					submitBtnType='button'
					actionSx={{ marginTop: isMobileSize ? '-3rem' : '-2rem' }}
				/>
			</form>

			{/* URL validation error SnackBar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</CustomDialog>
	);
};

export default AdminLessonEditPageEditQuestionDialog;
