import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	Box,
	Checkbox,
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
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import theme from '../../../themes';
import { BlankValuePair, QuestionInterface } from '../../../interfaces/question';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import axios from 'axios';
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
import { QuestionType } from '../../../interfaces/enums';
import FlipCard from '../../layouts/flipCard/FlipCard';
import Matching from '../../layouts/matching/Matching';
import { Lesson } from '../../../interfaces/lessons';
import FillInTheBlanksDragDropProps from '../../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import { updateEditorContentAndBlankPairs } from '../../../utils/updateEditorContentAndBlankPairs';
import FillInTheBlanksTyping from '../../layouts/FITBTyping/FillInTheBlanksTyping';

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
}: CreateQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { addNewQuestion, questionTypes } = useContext(QuestionsContext);
	const { resetImageUpload } = useImageUpload();
	const { resetVideoUpload } = useVideoUpload();

	const editorId = generateUniqueId('editor-');
	const editorRef = useRef<any>(null);

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState(true);
	const [blankValuePairs, setBlankValuePairs] = useState<BlankValuePair[]>([]);

	const sortedBlankValuePairs = useMemo(() => {
		return [...blankValuePairs].sort((a, b) => a.blank - b.blank);
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
		matchingPairs: [],
		blankValuePairs,
		createdAt: '',
		updatedAt: '',
	});
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(false);
	const [isQuestionMissing, setIsQuestionMissing] = useState<boolean>(false);
	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState<boolean>(false);
	const [editorContent, setEditorContent] = useState<string>('');
	const [isMinimumTwoMatchingPairs, setIsMinimumTwoMatchingPairs] = useState<boolean>(false);
	const [isMissingPair, setIsMissingPair] = useState<boolean>(false);
	const [isMinimumTwoBlanks, setIsMinimumTwoBlanks] = useState<boolean>(false);

	useEffect(() => {
		resetVideoUpload();
		resetImageUpload();
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	}, []);

	useEffect(() => {
		if (blankValuePairs.length > 1) {
			setIsMinimumTwoBlanks(false);
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
			matchingPairs: [],
			blankValuePairs: [],
			createdAt: '',
			updatedAt: '',
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
		setIsMinimumTwoBlanks(false);
	};

	const createQuestion = async () => {
		try {
			const questionTypeId = questionTypes?.find((type) => type.name === questionType)?._id || '';
			const response = await axios.post(`${base_url}/questions`, {
				questionType: questionTypeId,
				question: isFlipCard ? newQuestion.question : editorContent,
				options,
				correctAnswer,
				imageUrl: newQuestion.imageUrl,
				videoUrl: newQuestion.videoUrl,
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				orgId,
				isActive: true,
			});

			addNewQuestion({
				_id: response.data._id,
				questionType,
				question: isFlipCard ? newQuestion.question : editorContent,
				options,
				correctAnswer,
				imageUrl: newQuestion.imageUrl,
				videoUrl: newQuestion.videoUrl,
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				orgId,
				isActive: true,
			});
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
				question: isFlipCard ? newQuestion.question : editorContent,
				options,
				correctAnswer,
				imageUrl: newQuestion.imageUrl,
				videoUrl: newQuestion.videoUrl,
				orgId,
				audio: newQuestion.audio,
				video: newQuestion.video,
				matchingPairs: newQuestion.matchingPairs,
				blankValuePairs,
				isActive: true,
				createdAt: '',
				updatedAt: '',
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

	const handleSubmit = () => {
		if (!editorContent && !newQuestion.question) {
			setIsQuestionMissing(!isFlipCard || !newQuestion.imageUrl);
			return;
		}

		if (isFlipCard && !correctAnswer) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isAudioVideoQuestion && !newQuestion.audio && !newQuestion.video) {
			setIsAudioVideoSelectionMissing(true);
			return;
		}

		if (isMatching) {
			const nonBlankPairs = newQuestion.matchingPairs.filter((pair) => pair.question.trim() && pair.answer.trim());
			const missingPairExists = newQuestion.matchingPairs.some((pair) => !pair.question.trim() || !pair.answer.trim());

			if (nonBlankPairs.length < 2) {
				setIsMinimumTwoMatchingPairs(true);
				return;
			}
			if (missingPairExists) {
				setIsMissingPair(true);
				return;
			}
		}

		if ((isFITBDragDrop || isFITBTyping) && blankValuePairs.length < 2) {
			setIsMinimumTwoBlanks(true);
			return;
		}

		if (
			!isOpenEndedQuestion &&
			!isFlipCard &&
			!isAudioVideoQuestion &&
			!isMatching &&
			(correctAnswerIndex === -1 || !correctAnswer) &&
			!isFITBDragDrop &&
			!isFITBTyping
		) {
			setIsCorrectAnswerMissing(true);
			return;
		}
		if (isDuplicateOption || !isMinimumOptions) return;

		if (createNewQuestion) createQuestion();
		else createQuestionTemplate();

		setIsQuestionCreateModalOpen(false);
		resetImageUpload();
		resetVideoUpload();
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
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
		<CustomDialog
			openModal={isQuestionCreateModalOpen}
			closeModal={() => {
				setIsQuestionCreateModalOpen(false);
				resetValues();
			}}
			title='Create Question'
			maxWidth='lg'>
			<form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column' }}>
				<DialogContent>
					<FormControl sx={{ mb: '1rem', width: '15rem', backgroundColor: theme.bgColor?.common }}>
						<InputLabel id='type' sx={{ fontSize: '0.9rem' }} required>
							Type
						</InputLabel>
						<Select
							labelId='type'
							id='question_type'
							value={questionType}
							onChange={(event: SelectChangeEvent) => {
								setQuestionType(event.target.value);
								setCorrectAnswer('');
								setOptions(['']);
							}}
							size='medium'
							label='Type'
							required>
							{questionTypes?.map((type) => (
								<MenuItem value={type.name} key={type._id}>
									{type.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Box sx={{ display: 'flex', flexDirection: 'column' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '2rem', width: '100%' }}>
							<Box sx={{ flex: 1, mr: '2rem' }}>
								<HandleImageUploadURL
									label='Question Image'
									onImageUploadLogic={(url) => {
										setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: url }));
										if (isFlipCard) setIsQuestionMissing(false);
									}}
									onChangeImgUrl={(e) => {
										setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: e.target.value }));
										if (isFlipCard) setIsQuestionMissing(false);
										setIsLessonUpdated?.(true);
									}}
									imageUrlValue={newQuestion.imageUrl}
									enterImageUrl={enterImageUrl}
									setEnterImageUrl={setEnterImageUrl}
									imageFolderName='QuestionImages'
								/>
								{!isFlipCard && (
									<ImageThumbnail
										imgSource={newQuestion.imageUrl || 'https://savethefrogs.com/wp-content/uploads/placeholder-wire-image-white.jpg'}
										removeImage={() => {
											setNewQuestion((prevQuestion) => ({ ...prevQuestion, imageUrl: '' }));
											setIsLessonUpdated?.(true);
											resetImageUpload();
										}}
									/>
								)}
							</Box>
							{!isFlipCard && (
								<Box sx={{ flex: 1 }}>
									<HandleVideoUploadURL
										label='Question Video'
										onVideoUploadLogic={(url) => setNewQuestion((prevQuestion) => ({ ...prevQuestion, videoUrl: url }))}
										onChangeVideoUrl={(e) => {
											setNewQuestion((prevQuestion) => ({ ...prevQuestion, videoUrl: e.target.value }));
											setIsLessonUpdated?.(true);
										}}
										videoUrlValue={newQuestion.videoUrl}
										enterVideoUrl={enterVideoUrl}
										setEnterVideoUrl={setEnterVideoUrl}
										videoFolderName='QuestionVideos'
									/>
									<VideoThumbnail
										videoPlayCondition={newQuestion.videoUrl}
										videoUrl={newQuestion.videoUrl}
										videoPlaceholderUrl='https://riggswealth.com/wp-content/uploads/2016/06/Riggs-Video-Placeholder.jpg'
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
								<Typography variant='h6' sx={{ mb: '0.5rem' }}>
									Question
								</Typography>
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
								/>
							</Box>
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
									<Typography variant='h5' sx={{ width: '90%' }}>
										Student View
									</Typography>
									{isFITBDragDrop && (
										<Box sx={{ padding: '1rem 0', width: '100%' }}>
											<FillInTheBlanksDragDropProps textWithBlanks={editorContent} blankValuePairs={sortedBlankValuePairs} />
										</Box>
									)}
									{isFITBTyping && (
										<Box sx={{ padding: '1rem 0', width: '100%' }}>
											<FillInTheBlanksTyping textWithBlanks={editorContent} blankValuePairs={sortedBlankValuePairs} />
										</Box>
									)}
								</Box>
							</>
						)}

						{isAudioVideoQuestion && (
							<Box sx={{ display: 'flex', justifyContent: 'center' }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={newQuestion.audio}
											onChange={(e) => {
												setNewQuestion((prevData) => ({ ...prevData, audio: e.target.checked }));
												setIsAudioVideoSelectionMissing(false);
											}}
										/>
									}
									label='Ask Audio Recording'
									sx={{ margin: '2rem 0 2rem 3rem' }}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={newQuestion.video}
											onChange={(e) => {
												setNewQuestion((prevData) => ({ ...prevData, video: e.target.checked }));
												setIsAudioVideoSelectionMissing(false);
											}}
										/>
									}
									label='Ask Video Recording'
									sx={{ margin: '2rem 0 2rem 3rem' }}
								/>
							</Box>
						)}
						{isMultipleChoiceQuestion && (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
								{options?.map((option, index) => (
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
													<Radio
														checked={index === correctAnswerIndex}
														onChange={() => {
															setIsCorrectAnswerMissing(false);
															handleCorrectAnswerChange(index);
														}}
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
											required
											label={`Option ${index + 1}`}
											value={option}
											onChange={(e) => handleOptionChange?.(index, e.target.value)}
											sx={{ marginTop: '0.75rem', marginRight: index === 0 ? '2.5rem' : 0 }}
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
							/>
						)}
					</Box>
					<Box sx={{ mt: '2rem' }}>
						{isQuestionMissing && (
							<CustomErrorMessage>
								{isFlipCard && !newQuestion.imageUrl ? '- Enter front face text or enter image' : '- Enter question'}
							</CustomErrorMessage>
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
						{(isFITBDragDrop || isFITBTyping) && isMinimumTwoBlanks && <CustomErrorMessage>- Enter at least 2 blanks in the text</CustomErrorMessage>}

						{isMultipleChoiceQuestion && (
							<Box sx={{ mt: '2rem' }}>
								{isDuplicateOption && <CustomErrorMessage>- Options should be unique</CustomErrorMessage>}
								{!isMinimumOptions && <CustomErrorMessage>- At least two options are required</CustomErrorMessage>}
							</Box>
						)}
					</Box>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						setIsQuestionCreateModalOpen(false);
						resetValues();
						resetImageUpload();
						resetVideoUpload();
					}}
					onSubmit={handleSubmit}
					cancelBtnSx={{ margin: '0 0.5rem 1rem 0' }}
					submitBtnSx={{ margin: '0 1rem 1rem 0' }}
					submitBtnType='button'
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateQuestionDialog;
