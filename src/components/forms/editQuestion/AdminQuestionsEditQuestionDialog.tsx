import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { BlankValuePair, MatchingPair, QuestionInterface, TranslatePair } from '../../../interfaces/question';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import CustomErrorMessage from '../customFields/CustomErrorMessage';

import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import useImageUpload from '../../../hooks/useImageUpload';
import { useAuth } from '../../../hooks/useAuth';
import { Roles } from '../../../interfaces/enums';
import useVideoUpload from '../../../hooks/useVideoUpload';
import HandleImageUploadURL from '../uploadImageVideoDocument/HandleImageUploadURL';
import HandleVideoUploadURL from '../uploadImageVideoDocument/HandleVideoUploadURL';
import ImageThumbnail from '../uploadImageVideoDocument/ImageThumbnail';
import VideoThumbnail from '../uploadImageVideoDocument/VideoThumbnail';
import TinyMceEditor from '../../richTextEditor/TinyMceEditor';
import TrueFalseOptions from '../../layouts/questionTypes/TrueFalseOptions';

import { QuestionType } from '../../../interfaces/enums';
import FlipCard from '../../layouts/flipCard/FlipCard';
import Matching from '../../layouts/matching/Matching';
import Translate from '../../layouts/translate/Translate';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import theme from '../../../themes';
import { updateEditorContentAndBlankPairs } from '../../../utils/updateEditorContentAndBlankPairs';
import FillInTheBlanksDragDropProps from '../../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../../layouts/FITBTyping/FillInTheBlanksTyping';
import CustomInfoMessageAlignedRight from '../../layouts/infoMessage/CustomInfoMessageAlignedRight';
import axios from '@utils/axiosInstance';
import { validateImageUrl, validateVideoUrl } from '../../../utils/urlValidation';
import { decode } from 'html-entities';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface EditQuestionDialogProps {
	index: number;
	question: QuestionInterface;
	correctAnswerIndex: number;
	editQuestionModalOpen: boolean[];
	options: string[];
	correctAnswer: string;
	questionType: string;
	isMinimumOptions: boolean;
	isDuplicateOption: boolean;
	setCorrectAnswerIndex: React.Dispatch<React.SetStateAction<number>>;
	handleCorrectAnswerChange: (index: number) => void;
	handleOptionChange: (index: number, value: string) => void;
	closeQuestionEditModal: (index: number) => void;
	addOption: () => void;
	removeOption: (indexToRemove: number) => void;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setIsDuplicateOption: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMinimumOptions: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminQuestionsEditQuestionDialog = ({
	index,
	question,
	correctAnswerIndex,
	editQuestionModalOpen,
	options,
	correctAnswer,
	questionType,
	isMinimumOptions,
	isDuplicateOption,
	handleCorrectAnswerChange,
	setCorrectAnswerIndex,
	handleOptionChange,
	closeQuestionEditModal,
	addOption,
	removeOption,
	setCorrectAnswer,
	setIsDuplicateOption,
	setIsMinimumOptions,
}: EditQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { updateQuestion, fetchQuestions, questionsPageNumber } = useContext(QuestionsContext);
	const { user } = useAuth();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Role detection
	const isInstructor = user?.role === Roles.INSTRUCTOR;

	const editorId = generateUniqueId('editor-');
	const editorRef = useRef<any>(null);

	const isFlipCard = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion = questionType === QuestionType.AUDIO_VIDEO;
	const isMatching = questionType === QuestionType.MATCHING;
	const isFITBTyping = questionType === QuestionType.FITB_TYPING;
	const isFITBDragDrop = questionType === QuestionType.FITB_DRAG_DROP;
	const isTranslate = questionType === QuestionType.TRANSLATE;

	const [questionAdminQuestions, setQuestionAdminQuestions] = useState(question.question);
	const [imageUrlAdminQuestions, setImageUrlAdminQuestions] = useState(question.imageUrl);
	const [videoUrlAdminQuestions, setVideoUrlAdminQuestions] = useState(question.videoUrl);
	const [correctAnswerAdminQuestions, setCorrectAnswerAdminQuestions] = useState(question.correctAnswer);
	const [isAudioAdminQuestions, setIsAudioAdminQuestions] = useState(question.audio);
	const [isVideoAdminQuestions, setIsVideoAdminQuestions] = useState(question.video);
	const [matchingPairsAdminQuestions, setMatchingPairsAdminQuestions] = useState<MatchingPair[]>(question.matchingPairs);
	const [blankValuePairsAdminQuestions, setBlankValuePairsAdminQuestions] = useState<BlankValuePair[]>(question.blankValuePairs);
	const [translatePairsAdminQuestions, setTranslatePairsAdminQuestions] = useState<TranslatePair[]>(question.translatePairs || []);

	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState(false);
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState(
		correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion && !isMatching
	);
	const [isQuestionMissing, setIsQuestionMissing] = useState(false);

	const { resetImageUpload } = useImageUpload();
	const { resetVideoUpload } = useVideoUpload();

	const [isMinimumTwoMatchingPairs, setIsMinimumTwoMatchingPairs] = useState(false);
	const [isMissingPair, setIsMissingPair] = useState(false);
	const [isMinimumOneBlank, setIsMinimumOneBlank] = useState<boolean>(false);
	const [isMinimumOneTranslatePair, setIsMinimumOneTranslatePair] = useState<boolean>(false);
	const [isMissingTranslatePair, setIsMissingTranslatePair] = useState<boolean>(false);

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState(true);
	const [editorContent, setEditorContent] = useState(question.question);
	const [questionBeforeSave, setQuestionBeforeSave] = useState<QuestionInterface>(question);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

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
		if (blankValuePairsAdminQuestions?.length > 0) {
			setIsMinimumOneBlank(false);
		}
	}, [blankValuePairsAdminQuestions]);

	// Sync all question data when question prop changes (when dialog opens with different question)
	useEffect(() => {
		setQuestionAdminQuestions(question.question);
		setImageUrlAdminQuestions(question.imageUrl);
		setVideoUrlAdminQuestions(question.videoUrl);
		setCorrectAnswerAdminQuestions(question.correctAnswer);
		setIsAudioAdminQuestions(question.audio);
		setIsVideoAdminQuestions(question.video);
		setMatchingPairsAdminQuestions(question.matchingPairs || []);
		setBlankValuePairsAdminQuestions(question.blankValuePairs || []);
		setTranslatePairsAdminQuestions(question.translatePairs || []);
		setEditorContent(question.question);
		setQuestionBeforeSave(question);
	}, [question._id]);

	const handleSubmit = async () => {
		if (!isFlipCard) await handleInputChange('question', editorContent);

		// Validate URLs before proceeding
		let hasUrlErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (imageUrlAdminQuestions?.trim()) {
			const imageValidation = await validateImageUrl(imageUrlAdminQuestions.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(imageValidation.error || 'Invalid image URL');
				hasUrlErrors = true;
			}
		}

		// Validate video URL if provided
		if (videoUrlAdminQuestions?.trim()) {
			const videoValidation = await validateVideoUrl(videoUrlAdminQuestions.trim());
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

		if (isFlipCard && !correctAnswerAdminQuestions) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isFlipCard && !questionAdminQuestions && !imageUrlAdminQuestions) {
			setIsQuestionMissing(true);
			return;
		}

		if (isAudioVideoQuestion && !isAudioAdminQuestions && !isVideoAdminQuestions) {
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
			const nonBlankPairs = matchingPairsAdminQuestions?.filter((pair) => pair.question.trim() !== '' && pair.answer.trim() !== '') || [];
			const missingPairExists = matchingPairsAdminQuestions?.some((pair) => pair.question.trim() === '' || pair.answer.trim() === '') || false;

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
			const nonBlankPairs = translatePairsAdminQuestions?.filter((pair) => pair.originalText.trim() !== '' && pair.translation.trim() !== '') || [];
			const missingPairExists =
				translatePairsAdminQuestions?.some((pair) => pair.originalText.trim() === '' || pair.translation.trim() === '') || false;

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
			if (blankValuePairsAdminQuestions.length < 1) {
				setIsMinimumOneBlank(true);
				return;
			}
			setIsMinimumOneBlank(false);
		}

		if (isMultipleChoiceQuestion && (isDuplicateOption || !isMinimumOptions)) return;

		try {
			const updatedCorrectAnswer = isMultipleChoiceQuestion ? options[correctAnswerIndex] : correctAnswerAdminQuestions;

			const response = await axios.patch(`${base_url}/questions${isInstructor ? '/instructor' : ''}/${question._id}`, {
				orgId,
				question: !isFlipCard ? editorContent.trim() : questionAdminQuestions.trim(),
				options,
				correctAnswer: updatedCorrectAnswer.trim(),
				videoUrl: videoUrlAdminQuestions.trim(),
				imageUrl: imageUrlAdminQuestions.trim(),
				audio: isAudioVideoQuestion ? isAudioAdminQuestions : false,
				video: isAudioVideoQuestion ? isVideoAdminQuestions : false,
				matchingPairs: matchingPairsAdminQuestions,
				blankValuePairs: blankValuePairsAdminQuestions,
				translatePairs: translatePairsAdminQuestions,
			});

			const questionResponseData = response.data.data;

			const updatedQuestion = {
				...question,
				question: !isFlipCard ? editorContent.trim() : questionAdminQuestions.trim(),
				correctAnswer: updatedCorrectAnswer.trim(),
				videoUrl: videoUrlAdminQuestions.trim(),
				imageUrl: imageUrlAdminQuestions.trim(),
				updatedAt: questionResponseData.updatedAt,
				createdAt: questionResponseData.createdAt,
				audio: isAudioVideoQuestion ? isAudioAdminQuestions : false,
				video: isAudioVideoQuestion ? isVideoAdminQuestions : false,
				matchingPairs: matchingPairsAdminQuestions,
				blankValuePairs: blankValuePairsAdminQuestions,
				translatePairs: translatePairsAdminQuestions,
				updatedByName: questionResponseData.updatedByName,
				createdByName: questionResponseData.createdByName,
				updatedByImageUrl: questionResponseData.updatedByImageUrl,
				createdByImageUrl: questionResponseData.createdByImageUrl,
				updatedByRole: questionResponseData.updatedByRole,
				createdByRole: questionResponseData.createdByRole,
			};

			updateQuestion(updatedQuestion);
			setQuestionBeforeSave(updatedQuestion);

			resetImageUpload();
			resetVideoUpload();
			resetEnterImageVideoUrl();
			fetchQuestions(questionsPageNumber);
		} catch (error) {
			console.error('Failed to update the question:', error);
		}

		closeQuestionEditModal(index);
	};

	const handleInputChange = (field: 'question' | 'videoUrl' | 'imageUrl', value: string) => {
		if (field === 'question') setQuestionAdminQuestions(value);
		if (field === 'imageUrl') setImageUrlAdminQuestions(value);
		if (field === 'videoUrl') setVideoUrlAdminQuestions(value);
	};

	const imagePlaceHolderUrl = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

	const handleResetQuestion = () => {
		setQuestionAdminQuestions(questionBeforeSave.question);
		setImageUrlAdminQuestions(questionBeforeSave.imageUrl);
		setVideoUrlAdminQuestions(questionBeforeSave.videoUrl);
		setIsAudioAdminQuestions(questionBeforeSave.audio);
		setIsVideoAdminQuestions(questionBeforeSave.video);
		setMatchingPairsAdminQuestions(questionBeforeSave.matchingPairs);
		setBlankValuePairsAdminQuestions(questionBeforeSave.blankValuePairs);
		setTranslatePairsAdminQuestions(questionBeforeSave.translatePairs || []);
		setEditorContent(questionBeforeSave.question);
	};

	const returnBlankValues = (pair: BlankValuePair) => {
		const editor = editorRef.current;
		if (!editor) {
			console.error('Editor not found or not initialized');
			return;
		}

		updateEditorContentAndBlankPairs(editor, pair, blankValuePairsAdminQuestions, setBlankValuePairsAdminQuestions);
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
									setImageUrlAdminQuestions(url);
									if (isFlipCard) setIsQuestionMissing(false);
									// Validate URL immediately after upload
									validateUrlOnChange(url, 'image');
								}}
								onChangeImgUrl={(e) => {
									handleInputChange('imageUrl', e.target.value);
									// Validate URL on change (debounced)
									validateUrlOnChange(e.target.value, 'image');
								}}
								imageUrlValue={imageUrlAdminQuestions}
								imageFolderName='QuestionImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>
							{!isFlipCard && (
								<ImageThumbnail imgSource={imageUrlAdminQuestions || imagePlaceHolderUrl} removeImage={() => setImageUrlAdminQuestions('')} />
							)}
						</Box>
						{!isFlipCard && (
							<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined, mt: isMobileSize ? '2rem' : undefined }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										setVideoUrlAdminQuestions(url);
										// Validate URL immediately after upload
										validateUrlOnChange(url, 'video');
									}}
									onChangeVideoUrl={(e) => {
										handleInputChange('videoUrl', e.target.value);
										// Validate URL on change (debounced)
										validateUrlOnChange(e.target.value, 'video');
									}}
									videoUrlValue={videoUrlAdminQuestions}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>
								<VideoThumbnail
									videoPlayCondition={videoUrlAdminQuestions !== ''}
									videoUrl={videoUrlAdminQuestions}
									videoPlaceholderUrl='https://placehold.co/600x400/e2e8f0/64748b?text=No+Video'
									removeVideo={() => setVideoUrlAdminQuestions('')}
								/>
							</Box>
						)}
					</Box>

					{isFlipCard ? (
						<FlipCard
							question={question}
							setCorrectAnswer={setCorrectAnswer}
							setIsQuestionMissing={setIsQuestionMissing}
							setQuestionAdminQuestions={setQuestionAdminQuestions}
							setCorrectAnswerAdminQuestions={setCorrectAnswerAdminQuestions}
							setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
							imageUrlAdminQuestions={imageUrlAdminQuestions}
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
											: isAudioVideoQuestion
												? 'Students can upload up to 2-minute audio or 1-minute video recording'
												: ''}
								</span>
							</Typography>
							<TinyMceEditor
								handleEditorChange={(content) => {
									setEditorContent(content);
									setIsQuestionMissing(false);
								}}
								initialValue={decode(questionAdminQuestions)}
								blankValuePairs={blankValuePairsAdminQuestions}
								setBlankValuePairs={setBlankValuePairsAdminQuestions}
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
								fromLessonEditPage={false}
								correctAnswerAdminQuestions={correctAnswerAdminQuestions}
								setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
								setCorrectAnswerAdminQuestions={setCorrectAnswerAdminQuestions}
							/>
						)}

						{(isFITBDragDrop || isFITBTyping) && (
							<>
								<Box sx={{ marginTop: '1rem', width: isMobileSize ? '100%' : '90%' }}>
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
										{blankValuePairsAdminQuestions
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
									<Box sx={{ display: 'flex', width: '100%', margin: isMobileSize ? '0rem' : '1rem 0rem 0rem 0rem' }}>
										<Box sx={{ flex: 1 }}>
											<Typography variant={isMobileSize ? 'h6' : 'h5'}>Student View</Typography>
										</Box>
										<CustomInfoMessageAlignedRight message='View as in a practice lesson' />
									</Box>
									{isFITBDragDrop && (
										<Box sx={{ padding: '1rem 0', width: '100%', mb: '-2rem' }}>
											<FillInTheBlanksDragDropProps textWithBlanks={editorContent} blankValuePairs={blankValuePairsAdminQuestions} />
										</Box>
									)}

									{isFITBTyping && (
										<Box sx={{ padding: '1rem 0', width: '100%', mb: '-2rem' }}>
											<FillInTheBlanksTyping
												textWithBlanks={editorContent}
												blankValuePairs={blankValuePairsAdminQuestions}
												fromAdminQuestions={true}
											/>
										</Box>
									)}
								</Box>
							</>
						)}

						{isAudioVideoQuestion && (
							<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
								<Box sx={{ margin: isMobileSize ? '2rem 0' : '2rem 2rem 2rem 0rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={isAudioAdminQuestions}
												onChange={(e) => {
													setIsAudioAdminQuestions(e.target.checked);
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
								<Box sx={{ margin: '2rem 0 ' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={isVideoAdminQuestions}
												onChange={(e) => {
													setIsVideoAdminQuestions(e.target.checked);
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
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<Matching
									matchingPairs={matchingPairsAdminQuestions}
									setIsMissingPair={setIsMissingPair}
									existingQuestion={true}
									setMatchingPairsAdminQuestions={setMatchingPairsAdminQuestions}
								/>
							</Box>
						)}
						{isTranslate && (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<Translate
									key={question._id}
									question={question}
									translatePairs={translatePairsAdminQuestions}
									setIsMinimumOneTranslatePair={setIsMinimumOneTranslatePair}
									setIsMissingPair={setIsMissingTranslatePair}
									existingQuestion={true}
									setTranslatePairsAdminQuestions={setTranslatePairsAdminQuestions}
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

export default AdminQuestionsEditQuestionDialog;
