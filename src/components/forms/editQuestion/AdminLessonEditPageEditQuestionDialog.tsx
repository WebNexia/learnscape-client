import { useEffect, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { QuestionUpdateTrack } from '../../../pages/AdminLessonEditPage';
import { MatchingPair, QuestionInterface } from '../../../interfaces/question';
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
}: EditQuestionDialogProps) => {
	const isFlipCard: boolean = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion: boolean = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion: boolean = questionType === QuestionType.AUDIO_VIDEO;
	const isMatching: boolean = questionType === QuestionType.MATCHING;

	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState<boolean>(false);

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

			if (checkPairs(question.matchingPairs)) return;
		}

		if (isDuplicateOption) return;
		if (!isMinimumOptions) return;

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question._id) {
						setQuestionBeforeSave({ ...prevQuestion, options: options.filter((option) => option !== ''), correctAnswer });
						return { ...prevQuestion, options: options.filter((option) => option !== ''), correctAnswer };
					} else {
						return prevQuestion;
					}
				});

				return { ...prevData, questions: updatedQuestions };
			});
			questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
			resetImageUpload();
			resetVideoUpload();
			resetEnterImageVideoUrl();
		}

		closeQuestionEditModal(index);
	};

	const handleInputChange = async (field: 'question' | 'videoUrl' | 'imageUrl', value: string) => {
		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question._id) {
						return { ...prevQuestion, [field]: value };
					} else {
						return prevQuestion;
					}
				});
				return { ...prevData, questions: updatedQuestions };
			});
			questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
		}
	};

	const imagePlaceHolderUrl = 'https://directmobilityonline.co.uk/assets/img/noimage.png';

	const handleResetQuestion = () => {
		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question._id) {
						return questionBeforeSave;
					} else {
						return prevQuestion;
					}
				});

				return { ...prevData, questions: updatedQuestions };
			});
		}
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
									if (setSingleLessonBeforeSave) {
										setSingleLessonBeforeSave((prevData) => {
											if (!prevData.questions) return prevData;

											const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
												if (prevQuestion !== null && prevQuestion._id === question._id) {
													return { ...prevQuestion, imageUrl: url };
												} else {
													return prevQuestion;
												}
											});

											return { ...prevData, questions: updatedQuestions };
										});
										questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										if (isFlipCard) setIsQuestionMissing(false);
									}
								}}
								onChangeImgUrl={(e) => {
									handleInputChange('imageUrl', e.target.value);
									questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
								}}
								imageUrlValue={question.imageUrl}
								imageFolderName='QuestionImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>

							{!isFlipCard && (
								<ImageThumbnail
									imgSource={question?.imageUrl || imagePlaceHolderUrl}
									removeImage={() => {
										if (setSingleLessonBeforeSave) {
											setSingleLessonBeforeSave((prevData) => {
												if (!prevData.questions) return prevData;

												const updatedQuestions = prevData.questions?.map((prevQuestion) => {
													if (prevQuestion !== null && prevQuestion._id === question._id) {
														return { ...prevQuestion, imageUrl: '' };
													} else {
														return prevQuestion;
													}
												});

												return { ...prevData, questions: updatedQuestions };
											});
											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										}
									}}
								/>
							)}
						</Box>

						{!isFlipCard && (
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										if (setSingleLessonBeforeSave) {
											setSingleLessonBeforeSave((prevData) => {
												if (!prevData.questions) return prevData;

												const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
													if (prevQuestion !== null && prevQuestion._id === question._id) {
														return { ...prevQuestion, videoUrl: url };
													} else {
														return prevQuestion;
													}
												});

												return { ...prevData, questions: updatedQuestions };
											});
											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										}
									}}
									onChangeVideoUrl={(e) => handleInputChange('videoUrl', e.target.value)}
									videoUrlValue={question.videoUrl}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>

								<VideoThumbnail
									videoPlayCondition={!(question?.videoUrl === '')}
									videoUrl={question?.videoUrl}
									videoPlaceholderUrl='https://www.47pitches.com/contents/images/no-video.jpg'
									removeVideo={() => {
										if (setSingleLessonBeforeSave) {
											setSingleLessonBeforeSave((prevData) => {
												if (!prevData.questions) return prevData;

												const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
													if (prevQuestion !== null && prevQuestion._id === question._id) {
														return { ...prevQuestion, videoUrl: '' };
													} else {
														return prevQuestion;
													}
												});

												return { ...prevData, questions: updatedQuestions };
											});

											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										}
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
							setSingleLessonBeforeSave={setSingleLessonBeforeSave}
							setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
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

									questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
								}}
								initialValue={question.question}
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
														questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
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
											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
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
								fromLessonEditPage={true}
								correctAnswer={correctAnswer}
								setCorrectAnswer={setCorrectAnswer}
								setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
							/>
						)}

						{isAudioVideoQuestion && (
							<Box sx={{ display: 'flex', justifyContent: 'center' }}>
								<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={question.audio}
												onChange={(e) => {
													if (setSingleLessonBeforeSave) {
														setSingleLessonBeforeSave((prevData) => {
															if (!prevData.questions) return prevData;

															const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
																if (prevQuestion !== null && prevQuestion._id === question._id) {
																	return { ...prevQuestion, audio: e.target.checked };
																} else {
																	return prevQuestion;
																}
															});

															return { ...prevData, questions: updatedQuestions };
														});
														questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
													}
													setIsAudioVideoSelectionMissing(false);
													questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
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
												checked={question.video}
												onChange={(e) => {
													if (setSingleLessonBeforeSave) {
														setSingleLessonBeforeSave((prevData) => {
															if (!prevData.questions) return prevData;
															const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
																if (prevQuestion !== null && prevQuestion._id === question._id) {
																	return { ...prevQuestion, video: e.target.checked };
																} else {
																	return prevQuestion;
																}
															});

															return { ...prevData, questions: updatedQuestions };
														});
														questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
													}
													setIsAudioVideoSelectionMissing(false);
													questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
												}}
											/>
										}
										label='Ask Video Recording'
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
									setIsMissingPair={setIsMissingPair}
									setSingleLessonBeforeSave={setSingleLessonBeforeSave}
									setIsLessonUpdated={setIsLessonUpdated}
									setIsQuestionUpdated={setIsQuestionUpdated}
								/>
							</Box>
						)}
					</Box>
					<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
						{isQuestionMissing &&
							(!isFlipCard ? (
								<CustomErrorMessage>- Enter question</CustomErrorMessage>
							) : !question.imageUrl ? (
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

export default AdminLessonEditPageEditQuestionDialog;
