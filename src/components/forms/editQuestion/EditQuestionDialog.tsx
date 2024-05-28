import { useContext, useEffect, useState } from 'react';
import { Box, Button, DialogContent, FormControl, FormControlLabel, IconButton, Input, Radio, Tooltip, Typography } from '@mui/material';
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
import theme from '../../../themes';
import useVideoUpload from '../../../hooks/useVideoUplaod';

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

	const [questionAdminQuestions, setQuestionAdminQuestions] = useState<string>(question.question);
	const [imageUrlAdminQuestions, setImageUrlAdminQuestions] = useState<string>(question.imageUrl);
	const [videoUrlAdminQuestions, setVideoUrlAdminQuestions] = useState<string>(question.videoUrl);

	const { updateQuestion } = useContext(QuestionsContext);
	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(correctAnswerIndex < 0);

	const { imageUpload, isImgSizeLarge, handleImageChange, handleImageUpload, resetImageUpload } = useImageUpload();

	const handleCourseImageUpload = () => {
		handleImageUpload('QuestionImages', (url) => {
			if (fromLessonEditPage && setSingleLessonBeforeSave) {
				setSingleLessonBeforeSave((prevData) => {
					if (!prevData.questions) return prevData;

					const updatedQuestions = prevData.questions.map((prevQuestion) => {
						if (prevQuestion._id === question._id) {
							return { ...prevQuestion, imageUrl: url };
						} else {
							return prevQuestion;
						}
					});

					return { ...prevData, questions: updatedQuestions };
				});
				questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
			} else {
				setImageUrlAdminQuestions(url);
			}
		});
	};

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	const { videoUpload, isVideoSizeLarge, handleVideoChange, handleVideoUpload, resetVideoUpload } = useVideoUpload();

	const handleLessonVideoUpload = () => {
		handleVideoUpload('QuestionVideos', (url) => {
			if (fromLessonEditPage && setSingleLessonBeforeSave) {
				setSingleLessonBeforeSave((prevData) => {
					if (!prevData.questions) return prevData;

					const updatedQuestions = prevData.questions.map((prevQuestion) => {
						if (prevQuestion._id === question._id) {
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
		});
	};

	useEffect(() => {
		setIsCorrectAnswerMissing(correctAnswerIndex < 0);
		resetVideoUpload();
		resetImageUpload();
		resetEnterImageVideoUrl();
	}, [correctAnswerIndex]);

	const handleSubmit = async () => {
		if (correctAnswerIndex === -1 || correctAnswer === '' || isDuplicateOption || !isMinimumOptions) {
			setIsCorrectAnswerMissing(correctAnswerIndex === -1 || correctAnswer === '');
			return;
		}

		if (fromLessonEditPage && setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData.questions.map((prevQuestion) => {
					if (prevQuestion._id === question._id) {
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
				const updatedCorrectAnswer = options[correctAnswerIndex];

				const response = await axios.patch(`${base_url}/questions/${question._id}`, {
					orgId,
					question: questionAdminQuestions,
					options,
					correctAnswer: updatedCorrectAnswer,
					videoUrl: videoUrlAdminQuestions,
					imageUrl: imageUrlAdminQuestions,
				});

				updateQuestion({
					_id: question._id,
					orgId,
					question: questionAdminQuestions,
					options,
					correctAnswer: updatedCorrectAnswer,
					videoUrl: videoUrlAdminQuestions,
					imageUrl: imageUrlAdminQuestions,
					updatedAt: response.data.data.updatedAt,
					createdAt: response.data.data.createdAt,
					questionType: question.questionType,
					isActive: true,
				});

				resetImageUpload();
				resetVideoUpload();
			} catch (error) {
				console.error('Failed to update the question:', error);
			}
		}

		closeQuestionEditModal(index);
	};

	const handleInputChange = (field: 'question' | 'videoUrl' | 'imageUrl', value: string) => {
		if (fromLessonEditPage && setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;

				const updatedQuestions = prevData.questions.map((prevQuestion) => {
					if (prevQuestion._id === question._id) {
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

	return (
		<CustomDialog
			openModal={editQuestionModalOpen[index]}
			closeModal={() => {
				closeQuestionEditModal(index);
				setCorrectAnswerIndex(-1);
				setIsDuplicateOption(false);
				setIsMinimumOptions(true);
				resetImageUpload();
				resetVideoUpload();
				resetEnterImageVideoUrl();
				setImageUrlAdminQuestions('');
				setVideoUrlAdminQuestions('');
			}}
			title='Edit Question'>
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
							<FormControl sx={{ display: 'flex' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant='h6'>Image</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Box>
											<Typography
												variant='body2'
												sx={{ textDecoration: !enterImageUrl ? 'underline' : 'none', cursor: 'pointer' }}
												onClick={() => setEnterImageUrl(false)}>
												Upload
											</Typography>
										</Box>
										<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
										<Box>
											<Typography
												variant='body2'
												sx={{ textDecoration: enterImageUrl ? 'underline' : 'none', cursor: 'pointer' }}
												onClick={() => {
													setEnterImageUrl(true);
													resetImageUpload();
												}}>
												Enter URL
											</Typography>
										</Box>
									</Box>
								</Box>
								{!enterImageUrl && (
									<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
										<Input
											type='file'
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												handleImageChange(e);
												console.log('Image Change');
											}}
											inputProps={{ accept: '.jpg, .jpeg, .png' }} // Specify accepted file types
											sx={{ width: '80%', backgroundColor: theme.bgColor?.common, marginTop: '0.5rem', padding: '0.25rem' }}
										/>
										<Button
											onClick={handleCourseImageUpload}
											variant='outlined'
											sx={{ textTransform: 'capitalize', height: '2rem', marginTop: '0.5rem', width: '10%' }}
											disabled={!imageUpload || isImgSizeLarge}
											size='small'>
											Upload
										</Button>
									</Box>
								)}
								{isImgSizeLarge && <CustomErrorMessage>File size exceeds the limit of 1 MB </CustomErrorMessage>}

								{enterImageUrl && (
									<CustomTextField
										placeholder='Image URL'
										required={false}
										sx={{ marginTop: '0.5rem' }}
										value={fromLessonEditPage ? question.imageUrl : imageUrlAdminQuestions}
										onChange={(e) => handleInputChange('imageUrl', e.target.value)}
									/>
								)}
							</FormControl>
						</Box>
						<Box sx={{ flex: 1 }}>
							<FormControl sx={{ display: 'flex' }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant='h6'>Video</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Box>
											<Typography
												variant='body2'
												sx={{ textDecoration: !enterVideoUrl ? 'underline' : 'none', cursor: 'pointer' }}
												onClick={() => setEnterVideoUrl(false)}>
												Upload
											</Typography>
										</Box>
										<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
										<Box>
											<Typography
												variant='body2'
												sx={{ textDecoration: enterVideoUrl ? 'underline' : 'none', cursor: 'pointer' }}
												onClick={() => {
													setEnterVideoUrl(true);
													resetVideoUpload();
												}}>
												Enter URL
											</Typography>
										</Box>
									</Box>
								</Box>

								{!enterVideoUrl && (
									<>
										<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
											<Input
												type='file'
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													handleVideoChange(e);
												}}
												inputProps={{ accept: 'video/*' }} // Specify accepted file types
												sx={{
													width: '80%',
													backgroundColor: theme.bgColor?.common,
													marginTop: '0.5rem',
													padding: '0.25rem',
												}}
											/>
											<Button
												variant='outlined'
												sx={{ textTransform: 'capitalize', height: '2rem', marginTop: '0.5rem', width: '10%' }}
												onClick={handleLessonVideoUpload}
												disabled={!videoUpload || isVideoSizeLarge}>
												Upload
											</Button>
										</Box>
										{isVideoSizeLarge && <CustomErrorMessage> Please upload a video smaller than 30MB.</CustomErrorMessage>}
									</>
								)}

								{enterVideoUrl && (
									<CustomTextField
										placeholder='Video URL'
										required={false}
										sx={{ marginTop: '0.5rem' }}
										value={fromLessonEditPage ? question.videoUrl : videoUrlAdminQuestions}
										onChange={(e) => handleInputChange('videoUrl', e.target.value)}
									/>
								)}
							</FormControl>
						</Box>
					</Box>

					<Box sx={{ width: '100%' }}>
						<CustomTextField
							label='Question'
							value={fromLessonEditPage ? question.question : questionAdminQuestions}
							multiline={true}
							rows={1}
							onChange={(e) => handleInputChange('question', e.target.value)}
						/>
					</Box>
					<Box sx={{ width: '90%' }}>
						{options.map((option, i) => (
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
										<IconButton onClick={() => removeOption(i)}>
											<RemoveCircle />
										</IconButton>
									</Tooltip>
								)}
							</Box>
						))}
					</Box>
					{questionType === 'Multiple Choice' && (
						<Box sx={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}>
							{isCorrectAnswerMissing && <CustomErrorMessage>Select correct answer</CustomErrorMessage>}
							{isDuplicateOption && <CustomErrorMessage>Options should be unique</CustomErrorMessage>}
							{!isMinimumOptions && <CustomErrorMessage>At least two options are required</CustomErrorMessage>}
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
