import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { BlankValuePair, MatchingPair, QuestionInterface } from '../../../interfaces/question';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import axios from 'axios';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import useImageUpload from '../../../hooks/useImageUpload';
import useVideoUpload from '../../../hooks/useVideoUpload';
import HandleImageUploadURL from '../uploadImageVideoDocument/HandleImageUploadURL';
import HandleVideoUploadURL from '../uploadImageVideoDocument/HandleVideoUploadURL';
import ImageThumbnail from '../uploadImageVideoDocument/ImageThumbnail';
import VideoThumbnail from '../uploadImageVideoDocument/VideoThumbnail';
import TinyMceEditor from '../../richTextEditor/TinyMceEditor';
import TrueFalseOptions from '../../layouts/questionTypes/TrueFalseOptions';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';
import { QuestionType } from '../../../interfaces/enums';
import FlipCard from '../../layouts/flipCard/FlipCard';
import Matching from '../../layouts/matching/Matching';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import theme from '../../../themes';
import { updateEditorContentAndBlankPairs } from '../../../utils/updateEditorContentAndBlankPairs';
import FillInTheBlanksDragDropProps from '../../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../../layouts/FITBTyping/FillInTheBlanksTyping';
import CustomInfoMessageAlignedRight from '../../layouts/infoMessage/CustomInfoMessageAlignedRight';

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
	const { fetchLessons, lessonsPageNumber } = useContext(LessonsContext);
	const { updateQuestion, fetchQuestions, questionsPageNumber } = useContext(QuestionsContext);

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

	const [questionAdminQuestions, setQuestionAdminQuestions] = useState(question.question);
	const [imageUrlAdminQuestions, setImageUrlAdminQuestions] = useState(question.imageUrl);
	const [videoUrlAdminQuestions, setVideoUrlAdminQuestions] = useState(question.videoUrl);
	const [correctAnswerAdminQuestions, setCorrectAnswerAdminQuestions] = useState(question.correctAnswer);
	const [isAudioAdminQuestions, setIsAudioAdminQuestions] = useState(question.audio);
	const [isVideoAdminQuestions, setIsVideoAdminQuestions] = useState(question.video);
	const [matchingPairsAdminQuestions, setMatchingPairsAdminQuestions] = useState<MatchingPair[]>(question.matchingPairs);
	const [blankValuePairsAdminQuestions, setBlankValuePairsAdminQuestions] = useState<BlankValuePair[]>(question.blankValuePairs);

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

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState(true);
	const [editorContent, setEditorContent] = useState(question.question);
	const [questionBeforeSave, setQuestionBeforeSave] = useState<QuestionInterface>(question);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	useEffect(() => {
		setIsCorrectAnswerMissing(
			correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion && !isFITBDragDrop && !isMatching && !isFITBTyping
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

	const handleSubmit = async () => {
		if (!isFlipCard) await handleInputChange('question', editorContent);

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

		if (isOpenEndedQuestion || isMatching || isFITBDragDrop || isFITBTyping) {
			setIsCorrectAnswerMissing(false);
		}

		if (isMatching) {
			const nonBlankPairs = matchingPairsAdminQuestions.filter((pair) => pair.question.trim() !== '' && pair.answer.trim() !== '');
			const missingPairExists = matchingPairsAdminQuestions.some((pair) => pair.question.trim() === '' || pair.answer.trim() === '');

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

			const response = await axios.patch(`${base_url}/questions/${question._id}`, {
				orgId,
				question: !isFlipCard ? editorContent : questionAdminQuestions,
				options,
				correctAnswer: updatedCorrectAnswer,
				videoUrl: videoUrlAdminQuestions,
				imageUrl: imageUrlAdminQuestions,
				audio: isAudioVideoQuestion ? isAudioAdminQuestions : false,
				video: isAudioVideoQuestion ? isVideoAdminQuestions : false,
				matchingPairs: matchingPairsAdminQuestions,
				blankValuePairs: blankValuePairsAdminQuestions,
			});

			const updatedQuestion = {
				...question,
				question: !isFlipCard ? editorContent : questionAdminQuestions,
				correctAnswer: updatedCorrectAnswer,
				videoUrl: videoUrlAdminQuestions,
				imageUrl: imageUrlAdminQuestions,
				updatedAt: response.data.data.updatedAt,
				createdAt: response.data.data.createdAt,
				audio: isAudioVideoQuestion ? isAudioAdminQuestions : false,
				video: isAudioVideoQuestion ? isVideoAdminQuestions : false,
				matchingPairs: matchingPairsAdminQuestions,
				blankValuePairs: blankValuePairsAdminQuestions,
			};

			updateQuestion(updatedQuestion);
			setQuestionBeforeSave(updatedQuestion);

			resetImageUpload();
			resetVideoUpload();
			resetEnterImageVideoUrl();
			fetchLessons(lessonsPageNumber);
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

	const imagePlaceHolderUrl = 'https://directmobilityonline.co.uk/assets/img/noimage.png';

	const handleResetQuestion = () => {
		setQuestionAdminQuestions(questionBeforeSave.question);
		setImageUrlAdminQuestions(questionBeforeSave.imageUrl);
		setVideoUrlAdminQuestions(questionBeforeSave.videoUrl);
		setIsAudioAdminQuestions(questionBeforeSave.audio);
		setIsVideoAdminQuestions(questionBeforeSave.video);
		setMatchingPairsAdminQuestions(questionBeforeSave.matchingPairs);
		setBlankValuePairsAdminQuestions(questionBeforeSave.blankValuePairs);
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
			}}
			title='Edit Question'
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
					<Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: '2rem', width: '100%' }}>
						{question && <Typography>{questionType}</Typography>}
					</Box>

					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '2rem', width: '100%' }}>
						<Box sx={{ flex: 1, mr: '2rem' }}>
							<HandleImageUploadURL
								onImageUploadLogic={(url) => {
									setImageUrlAdminQuestions(url);
									if (isFlipCard) setIsQuestionMissing(false);
								}}
								onChangeImgUrl={(e) => handleInputChange('imageUrl', e.target.value)}
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
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => setVideoUrlAdminQuestions(url)}
									onChangeVideoUrl={(e) => handleInputChange('videoUrl', e.target.value)}
									videoUrlValue={videoUrlAdminQuestions}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>
								<VideoThumbnail
									videoPlayCondition={videoUrlAdminQuestions !== ''}
									videoUrl={videoUrlAdminQuestions}
									videoPlaceholderUrl='https://www.47pitches.com/contents/images/no-video.jpg'
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
								Question
							</Typography>
							<TinyMceEditor
								handleEditorChange={(content) => {
									setEditorContent(content);
									setIsQuestionMissing(false);
								}}
								initialValue={questionAdminQuestions}
								blankValuePairs={blankValuePairsAdminQuestions}
								setBlankValuePairs={setBlankValuePairsAdminQuestions}
								editorId={editorId}
								editorRef={editorRef}
							/>
						</Box>
					)}

					<Box sx={{ width: '90%' }}>
						{isMultipleChoiceQuestion &&
							options.map((option, i) => (
								<Box
									key={i}
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
													checked={i === correctAnswerIndex}
													onChange={() => {
														handleCorrectAnswerChange(i);
														setIsCorrectAnswerMissing(false);
													}}
													color='primary'
												/>
											}
											label=''
										/>
									</Tooltip>
									{i === options.length - 1 && (
										<Tooltip title='Add Option' placement='top'>
											<IconButton onClick={addOption}>
												<AddCircle />
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
										<Tooltip title='Remove Option' placement='top'>
											<IconButton onClick={() => removeOption(i)}>
												<RemoveCircle />
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
										{blankValuePairsAdminQuestions
											?.sort((a, b) => a.blank - b.blank)
											.map((pair: BlankValuePair) => {
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
														<Typography>
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
									<Box sx={{ display: 'flex', width: '100%', margin: '1rem 0rem 0rem 0rem' }}>
										<Box sx={{ flex: 1 }}>
											<Typography variant='h5'>Student View</Typography>
										</Box>
										<CustomInfoMessageAlignedRight message='View as in a practice lesson' />
									</Box>
									{isFITBDragDrop && (
										<Box sx={{ padding: '1rem 0', width: '100%' }}>
											<FillInTheBlanksDragDropProps textWithBlanks={editorContent} blankValuePairs={blankValuePairsAdminQuestions} />
										</Box>
									)}

									{isFITBTyping && (
										<Box sx={{ padding: '1rem 0' }}>
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
							<Box sx={{ display: 'flex', justifyContent: 'center' }}>
								<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={isAudioAdminQuestions}
												onChange={(e) => {
													setIsAudioAdminQuestions(e.target.checked);
													setIsAudioVideoSelectionMissing(false);
												}}
											/>
										}
										label='Ask Audio Recording'
									/>
								</Box>
								<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={isVideoAdminQuestions}
												onChange={(e) => {
													setIsVideoAdminQuestions(e.target.checked);
													setIsAudioVideoSelectionMissing(false);
												}}
											/>
										}
										label='Ask Video Recording'
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
					</Box>
					<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
						{isQuestionMissing && (
							<CustomErrorMessage>{isFlipCard ? '- Enter front face text or enter image' : '- Enter question'}</CustomErrorMessage>
						)}

						{isCorrectAnswerMissing && !isAudioVideoQuestion && !isMatching && (
							<CustomErrorMessage>{isFlipCard ? '- Enter back face text' : '- Select correct answer'}</CustomErrorMessage>
						)}
						{isAudioVideoQuestion && isAudioVideoSelectionMissing && <CustomErrorMessage>- Select one of the recording options</CustomErrorMessage>}

						{isMatching && (
							<>
								{isMinimumTwoMatchingPairs && <CustomErrorMessage>- Enter at least 2 completed pairs</CustomErrorMessage>}
								{isMissingPair && <CustomErrorMessage>- There is at least one incomplete pair</CustomErrorMessage>}
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
					}}
					cancelBtnText='Cancel'
					onSubmit={handleSubmit}
					submitBtnText='Save'
					submitBtnType='button'
				/>
			</form>
		</CustomDialog>
	);
};

export default AdminQuestionsEditQuestionDialog;
