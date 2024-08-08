import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { MatchingPair, QuestionInterface } from '../../../interfaces/question';
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

	const isFlipCard: boolean = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion: boolean = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion: boolean = questionType === QuestionType.AUDIO_VIDEO;
	const isMatching: boolean = questionType === QuestionType.MATCHING;

	const [questionAdminQuestions, setQuestionAdminQuestions] = useState<string>(question.question);
	const [imageUrlAdminQuestions, setImageUrlAdminQuestions] = useState<string>(question.imageUrl);
	const [videoUrlAdminQuestions, setVideoUrlAdminQuestions] = useState<string>(question.videoUrl);
	const [correctAnswerAdminQuestions, setCorrectAnswerAdminQuestions] = useState<string>(question.correctAnswer);
	const [isAudioAdminQuestions, setIsAudioAdminQuestions] = useState<boolean>(question.audio);
	const [isVideoAdminQuestions, setIsVideoAdminQuestions] = useState<boolean>(question.video);
	const [matchingPairsAdminQuestions, setMatchingPairsAdminQuestions] = useState<MatchingPair[]>(question.matchingPairs);

	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState<boolean>(false);

	const { updateQuestion, fetchQuestions, questionsPageNumber } = useContext(QuestionsContext);
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(
		correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion && !isMatching
	);
	const [isQuestionMissing, setIsQuestionMissing] = useState<boolean>(false);

	const { resetImageUpload } = useImageUpload();
	const { resetVideoUpload } = useVideoUpload();

	const [isMinimumTwoMatchingPairs, setIsMinimumTwoMatchingPairs] = useState<boolean>(false);
	const [isMissingPair, setIsMissingPair] = useState<boolean>(false);

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);

	const [editorContent, setEditorContent] = useState<string>(question.question);

	const [questionBeforeSave, setQuestionBeforeSave] = useState<QuestionInterface>(question);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	useEffect(() => {
		setIsCorrectAnswerMissing(correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion);
		resetVideoUpload();
		resetImageUpload();
		resetEnterImageVideoUrl();
		setIsDuplicateOption(false);
		setIsMinimumOptions(true);
	}, [correctAnswerIndex]);

	const handleSubmit = async () => {
		if (!isFlipCard) {
			await handleInputChange('question', editorContent);
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

		if (isMultipleChoiceQuestion) {
			if (correctAnswerIndex === -1 || !correctAnswer) {
				setIsCorrectAnswerMissing(true);
				return;
			}
		}

		if (isTrueFalseQuestion) {
			if (!correctAnswer) {
				setIsCorrectAnswerMissing(true);
				return;
			}
		}

		if (isOpenEndedQuestion) {
			setIsCorrectAnswerMissing(false);
		}

		if (isMatching) {
			setIsCorrectAnswerMissing(false);
		}

		if (isMatching) {
			let nonBlankPairs: MatchingPair[];
			let missingPairExists: boolean;

			const checkPairs = (pairs: MatchingPair[]) => {
				nonBlankPairs = pairs.filter((pair) => pair.question.trim() !== '' && pair.answer.trim() !== '');
				missingPairExists = pairs.some((pair) => pair.question.trim() === '' || pair.answer.trim() === '');

				if (nonBlankPairs.length < 2) {
					setIsMinimumTwoMatchingPairs(true);
					return true;
				} else if (missingPairExists) {
					setIsMissingPair(true);
					return true;
				} else {
					setIsMinimumTwoMatchingPairs(false);
					return false;
				}
			};

			if (checkPairs(matchingPairsAdminQuestions)) return;
		}

		if (isDuplicateOption) return;
		if (!isMinimumOptions) return;

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
			});

			updateQuestion({
				_id: question._id,
				orgId,
				question: !isFlipCard ? editorContent : questionAdminQuestions,
				options,
				correctAnswer: updatedCorrectAnswer,
				videoUrl: videoUrlAdminQuestions,
				imageUrl: imageUrlAdminQuestions,
				updatedAt: response.data.data.updatedAt,
				createdAt: response.data.data.createdAt,
				questionType: question.questionType,
				isActive: true,
				audio: response.data.data.audio,
				video: response.data.data.video,
				matchingPairs: response.data.data.matchingPairs,
			});

			setQuestionBeforeSave({
				_id: question._id,
				orgId,
				question: !isFlipCard ? editorContent : questionAdminQuestions,
				options,
				correctAnswer: updatedCorrectAnswer,
				videoUrl: videoUrlAdminQuestions,
				imageUrl: imageUrlAdminQuestions,
				updatedAt: response.data.data.updatedAt,
				createdAt: response.data.data.createdAt,
				questionType: question.questionType,
				isActive: true,
				audio: isAudioAdminQuestions,
				video: isVideoAdminQuestions,
				matchingPairs: matchingPairsAdminQuestions,
			});

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

	const handleInputChange = async (field: 'question' | 'videoUrl' | 'imageUrl', value: string) => {
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
								onChangeImgUrl={(e) => {
									handleInputChange('imageUrl', e.target.value);
								}}
								imageUrlValue={imageUrlAdminQuestions}
								imageFolderName='QuestionImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>

							{!isFlipCard && (
								<ImageThumbnail
									imgSource={imageUrlAdminQuestions || imagePlaceHolderUrl}
									removeImage={() => {
										setImageUrlAdminQuestions('');
									}}
								/>
							)}
						</Box>

						{!isFlipCard && (
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										setVideoUrlAdminQuestions(url);
									}}
									onChangeVideoUrl={(e) => handleInputChange('videoUrl', e.target.value)}
									videoUrlValue={videoUrlAdminQuestions}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>

								<VideoThumbnail
									videoPlayCondition={!(question?.videoUrl === '' && videoUrlAdminQuestions === '')}
									videoUrl={videoUrlAdminQuestions}
									videoPlaceholderUrl='https://www.47pitches.com/contents/images/no-video.jpg'
									removeVideo={() => {
										setVideoUrlAdminQuestions('');
									}}
								/>
							</Box>
						)}
					</Box>

					{isFlipCard && (
						<FlipCard
							question={question}
							setCorrectAnswer={setCorrectAnswer}
							setIsQuestionMissing={setIsQuestionMissing}
							setQuestionAdminQuestions={setQuestionAdminQuestions}
							setCorrectAnswerAdminQuestions={setCorrectAnswerAdminQuestions}
							setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
							imageUrlAdminQuestions={imageUrlAdminQuestions}
						/>
					)}

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
								initialValue={questionAdminQuestions}
							/>
						</Box>
					)}

					<Box sx={{ width: '90%' }}>
						{isMultipleChoiceQuestion &&
							options?.map((option, i) => (
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
											<IconButton
												onClick={() => {
													removeOption(i);
												}}>
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
						{isQuestionMissing &&
							(!isFlipCard ? (
								<CustomErrorMessage>- Enter question</CustomErrorMessage>
							) : !questionAdminQuestions && !imageUrlAdminQuestions ? (
								<CustomErrorMessage>- Enter front face text or enter image</CustomErrorMessage>
							) : null)}

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
