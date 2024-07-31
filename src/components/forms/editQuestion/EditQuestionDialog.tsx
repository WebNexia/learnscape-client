import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, Radio, Tooltip, Typography } from '@mui/material';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { QuestionUpdateTrack } from '../../../pages/AdminLessonEditPage';
import { QuestionInterface } from '../../../interfaces/question';
import { Lesson } from '../../../interfaces/lessons';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import axios from 'axios';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { questionLessonUpdateTrack } from '../../../utils/questionLessonUpdateTrack';
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

interface EditQuestionDialogProps {
	fromLessonEditPage: boolean;
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

const EditQuestionDialog = ({
	fromLessonEditPage,
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
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { fetchLessons, lessonsPageNumber } = useContext(LessonsContext);

	const isFlipCard: boolean = questionType === QuestionType.FLIP_CARD;
	const isOpenEndedQuestion: boolean = questionType === QuestionType.OPEN_ENDED;
	const isTrueFalseQuestion: boolean = questionType === QuestionType.TRUE_FALSE;
	const isMultipleChoiceQuestion: boolean = questionType === QuestionType.MULTIPLE_CHOICE;
	const isAudioVideoQuestion: boolean = questionType === QuestionType.AUDIO_VIDEO;

	const [questionAdminQuestions, setQuestionAdminQuestions] = useState<string>(question.question);
	const [imageUrlAdminQuestions, setImageUrlAdminQuestions] = useState<string>(question.imageUrl);
	const [videoUrlAdminQuestions, setVideoUrlAdminQuestions] = useState<string>(question.videoUrl);
	const [correctAnswerAdminQuestions, setCorrectAnswerAdminQuestions] = useState<string>(question.correctAnswer);
	const [isAudioAdminQuestions, setIsAudioAdminQuestions] = useState<boolean>(question.audio);
	const [isVideoAdminQuestions, setIsVideoAdminQuestions] = useState<boolean>(question.video);

	const [isAudioVideoSelectionMissing, setIsAudioVideoSelectionMissing] = useState<boolean>(false);

	const { updateQuestion, fetchQuestions, questionsPageNumber } = useContext(QuestionsContext);
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(
		correctAnswerIndex < 0 && question.correctAnswer === '' && !isOpenEndedQuestion
	);
	const [isQuestionMissing, setIsQuestionMissing] = useState<boolean>(false);

	const { resetImageUpload } = useImageUpload();

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);

	const [editorContent, setEditorContent] = useState<string>(question.question);

	const [questionBeforeSave, setQuestionBeforeSave] = useState<QuestionInterface>(question);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	const { resetVideoUpload } = useVideoUpload();

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

		if ((isFlipCard && !correctAnswer && fromLessonEditPage) || (isFlipCard && !correctAnswerAdminQuestions && !fromLessonEditPage)) {
			setIsCorrectAnswerMissing(true);
			return;
		}

		if (isFlipCard && !fromLessonEditPage && !questionAdminQuestions && !imageUrlAdminQuestions) {
			setIsQuestionMissing(true);
			return;
		}

		if (isFlipCard && fromLessonEditPage && !question.question && !question.imageUrl) {
			setIsQuestionMissing(true);
			return;
		}

		if (isAudioVideoQuestion && !fromLessonEditPage && !isAudioAdminQuestions && !isVideoAdminQuestions) {
			setIsAudioVideoSelectionMissing(true);
			return;
		}

		if (isAudioVideoQuestion && fromLessonEditPage && !question.audio && !question.video) {
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

		if (isDuplicateOption) return;
		if (!isMinimumOptions) return;

		if (fromLessonEditPage && setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question._id) {
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
		} else {
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
				});

				resetImageUpload();
				resetVideoUpload();
				resetEnterImageVideoUrl();
				fetchLessons(lessonsPageNumber);
				fetchQuestions(questionsPageNumber);
			} catch (error) {
				console.error('Failed to update the question:', error);
			}
		}

		closeQuestionEditModal(index);
	};

	const handleInputChange = async (field: 'question' | 'videoUrl' | 'imageUrl', value: string) => {
		if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
		} else {
			if (field === 'question') setQuestionAdminQuestions(value);
			if (field === 'imageUrl') setImageUrlAdminQuestions(value);
			if (field === 'videoUrl') setVideoUrlAdminQuestions(value);
		}
	};

	const imagePlaceHolderUrl = 'https://directmobilityonline.co.uk/assets/img/noimage.png';

	const handleResetQuestion = () => {
		if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
		} else {
			setQuestionAdminQuestions(questionBeforeSave.question);
			setImageUrlAdminQuestions(questionBeforeSave.imageUrl);
			setVideoUrlAdminQuestions(questionBeforeSave.videoUrl);
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
									if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
									} else {
										setImageUrlAdminQuestions(url);
										if (isFlipCard) setIsQuestionMissing(false);
									}
								}}
								onChangeImgUrl={(e) => {
									handleInputChange('imageUrl', e.target.value);
									questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
								}}
								imageUrlValue={fromLessonEditPage ? question.imageUrl : imageUrlAdminQuestions}
								imageFolderName='QuestionImages'
								enterImageUrl={enterImageUrl}
								setEnterImageUrl={setEnterImageUrl}
							/>

							{!isFlipCard && (
								<ImageThumbnail
									imgSource={fromLessonEditPage ? question?.imageUrl || imagePlaceHolderUrl : imageUrlAdminQuestions || imagePlaceHolderUrl}
									removeImage={() => {
										if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
										} else {
											setImageUrlAdminQuestions('');
										}
									}}
								/>
							)}
						</Box>

						{!isFlipCard && (
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
										} else {
											setVideoUrlAdminQuestions(url);
										}
									}}
									onChangeVideoUrl={(e) => handleInputChange('videoUrl', e.target.value)}
									videoUrlValue={fromLessonEditPage ? question.videoUrl : videoUrlAdminQuestions}
									videoFolderName='QuestionVideos'
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
								/>

								<VideoThumbnail
									videoPlayCondition={!(question?.videoUrl === '' && videoUrlAdminQuestions === '')}
									videoUrl={fromLessonEditPage ? question?.videoUrl : videoUrlAdminQuestions}
									videoPlaceholderUrl='https://www.47pitches.com/contents/images/no-video.jpg'
									removeVideo={() => {
										if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
											setVideoUrlAdminQuestions('');
											questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
										} else {
											setVideoUrlAdminQuestions('');
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
							fromLessonEditPage={fromLessonEditPage}
							setSingleLessonBeforeSave={setSingleLessonBeforeSave}
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
									if (fromLessonEditPage) {
										questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
									}
								}}
								initialValue={fromLessonEditPage ? question.question : questionAdminQuestions}
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
								fromLessonEditPage={fromLessonEditPage}
								correctAnswer={correctAnswer}
								correctAnswerAdminQuestions={correctAnswerAdminQuestions}
								setCorrectAnswer={setCorrectAnswer}
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
												checked={fromLessonEditPage ? question.audio : isAudioAdminQuestions}
												onChange={(e) => {
													if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
													} else {
														setIsAudioAdminQuestions(e.target.checked);
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
												checked={fromLessonEditPage ? question.video : isVideoAdminQuestions}
												onChange={(e) => {
													if (fromLessonEditPage && setSingleLessonBeforeSave) {
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
													} else {
														setIsVideoAdminQuestions(e.target.checked);
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
					</Box>
					<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
						{isQuestionMissing &&
							(!isFlipCard ? (
								<CustomErrorMessage>- Enter question</CustomErrorMessage>
							) : (!question.imageUrl && fromLessonEditPage) || (!fromLessonEditPage && !questionAdminQuestions && !imageUrlAdminQuestions) ? (
								<CustomErrorMessage>- Enter front face text or enter image</CustomErrorMessage>
							) : null)}

						{isCorrectAnswerMissing && !isAudioVideoQuestion && (
							<CustomErrorMessage>{isFlipCard ? '- Enter back face text' : '- Select correct answer'}</CustomErrorMessage>
						)}
						{isAudioVideoQuestion && isAudioVideoSelectionMissing && <CustomErrorMessage>- Select one of the recording options</CustomErrorMessage>}
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

export default EditQuestionDialog;
