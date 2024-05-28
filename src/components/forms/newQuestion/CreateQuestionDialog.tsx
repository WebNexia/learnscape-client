import CustomDialog from '../../layouts/dialog/CustomDialog';
import {
	Box,
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
} from '@mui/material';
import CustomTextField from '../customFields/CustomTextField';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import theme from '../../../themes';
import { useContext, useEffect, useState } from 'react';
import { QuestionInterface } from '../../../interfaces/question';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { Lesson } from '../../../interfaces/lessons';
import axios from 'axios';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import useImageUpload from '../../../hooks/useImageUpload';
import { Typography } from '@mui/material';
import { Button } from '@mui/material';
import { Input } from '@mui/material';
import useVideoUpload from '../../../hooks/useVideoUplaod';

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
	setQuestionType = () => {},
	setCorrectAnswer = () => {},
	setOptions = () => {},
	setSingleLessonBeforeSave = () => {},
	setIsLessonUpdated = () => {},
	handleCorrectAnswerChange = () => {},
	setCorrectAnswerIndex = () => {},
	removeOption = () => {},
	addOption = () => {},
	handleOptionChange = () => {},
}: CreateQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { addNewQuestion, questionTypes } = useContext(QuestionsContext);

	const { imageUpload, isImgSizeLarge, handleImageChange, handleImageUpload, resetImageUpload } = useImageUpload();

	const handleCourseImageUpload = () => {
		handleImageUpload('CourseImages', (url) => {
			setNewQuestion((prevQuestion) => {
				if (prevQuestion?.imageUrl !== undefined) {
					return {
						...prevQuestion,
						imageUrl: url,
					};
				}
				return prevQuestion;
			});
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
			setSingleLessonBeforeSave((prevCourse) => ({
				...prevCourse,
				videoUrl: url,
			}));
		});
	};

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
		createdAt: '',
		updatedAt: '',
	});

	const [isCorrectAnswerMissing, setIsCorrectAnswerMissing] = useState<boolean>(false);

	useEffect(() => {
		resetVideoUpload();
		resetImageUpload();
		resetEnterImageVideoUrl();
	}, []);

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
			createdAt: '',
			updatedAt: '',
		});

		setCorrectAnswer('');
		setOptions(['']);
	};

	const createQuestion = async () => {
		let questionTypeId: string = '';

		if (questionTypes) {
			questionTypeId = questionTypes?.filter((type) => type.name === questionType)[0]._id;
		}
		try {
			const response = await axios.post(`${base_url}/questions`, {
				questionType: questionTypeId,
				question: newQuestion?.question,
				options,
				correctAnswer,
				imageUrl: newQuestion?.imageUrl,
				videoUrl: newQuestion?.videoUrl,
				orgId,
				isActive: true,
			});

			addNewQuestion({
				_id: response.data._id,
				questionType: questionTypes?.filter((type) => type.name === questionType)[0].name,
				question: newQuestion?.question,
				options,
				correctAnswer,
				imageUrl: newQuestion?.imageUrl,
				videoUrl: newQuestion?.videoUrl,
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
			const newQuestionBeforeSave: QuestionInterface = {
				_id: generateUniqueId('temp_question_id_'),
				questionType,
				question: newQuestion?.question,
				options,
				correctAnswer,
				imageUrl: newQuestion?.imageUrl,
				videoUrl: newQuestion?.videoUrl,
				orgId,
				isActive: true,
				createdAt: '',
				updatedAt: '',
			};

			setIsLessonUpdated(true);

			setSingleLessonBeforeSave((prevLesson) => {
				return {
					...prevLesson,
					questions: [newQuestionBeforeSave, ...prevLesson.questions],
					questionIds: [newQuestionBeforeSave._id, ...prevLesson.questionIds],
				};
			});

			resetValues();
		} catch (error) {
			console.log(error);
		}
	};

	const handleSubmit = () => {
		if (correctAnswerIndex === -1) {
			setIsCorrectAnswerMissing(true);
			return;
		}
		if (isDuplicateOption) {
			return;
		}
		if (!isMinimumOptions) {
			return;
		}

		setIsCorrectAnswerMissing(false);

		if (createNewQuestion) {
			createQuestion();
		} else {
			createQuestionTemplate();
		}
		setIsQuestionCreateModalOpen(false);
		resetImageUpload();
		resetVideoUpload();
		resetEnterImageVideoUrl();
	};
	return (
		<CustomDialog
			openModal={isQuestionCreateModalOpen}
			closeModal={() => {
				setIsQuestionCreateModalOpen(false);
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
					createdAt: '',
					updatedAt: '',
				});
				setCorrectAnswer('');
				setOptions(['']);
				setCorrectAnswerIndex(-1);
				resetImageUpload();
				resetVideoUpload();
				resetEnterImageVideoUrl();
			}}
			title='Create Question'>
			<form
				style={{ display: 'flex', flexDirection: 'column' }}
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}>
				<DialogContent>
					<FormControl sx={{ mb: '1rem', width: '15rem', backgroundColor: theme.bgColor?.common }}>
						<InputLabel id='type' sx={{ fontSize: '0.9rem' }} required>
							Type
						</InputLabel>
						<Select
							labelId='type'
							id='lesson_type'
							value={questionType}
							onChange={(event: SelectChangeEvent) => {
								setQuestionType(event.target.value);
							}}
							size='medium'
							label='Type'
							required>
							{questionTypes &&
								questionTypes.map((type) => (
									<MenuItem value={type.name} key={type._id}>
										{type.name}
									</MenuItem>
								))}
						</Select>
					</FormControl>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
						}}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								width: '100%',
								mt: '1rem',
							}}>
							<Box sx={{ flex: 1, margin: '0 2rem 2rem 0' }}>
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
										<>
											<Box
												sx={{
													display: 'flex',
													width: '100%',
													justifyContent: 'space-between',
													marginBottom: '0.25rem',
													alignItems: 'center',
												}}>
												<Input
													type='file'
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e)}
													inputProps={{ accept: '.jpg, .jpeg, .png' }} // Specify accepted file types
													sx={{ width: '80%', backgroundColor: theme.bgColor?.common, marginTop: '0.5rem', padding: '0.25rem' }}
												/>
												<Button
													onClick={handleCourseImageUpload}
													variant='outlined'
													sx={{ textTransform: 'capitalize', height: '2rem', marginTop: '0.5rem' }}
													disabled={!imageUpload || isImgSizeLarge}>
													Upload
												</Button>
											</Box>
											{isImgSizeLarge && <CustomErrorMessage>File size exceeds the limit of 1 MB </CustomErrorMessage>}
										</>
									)}

									{enterImageUrl && (
										<CustomTextField
											value={newQuestion?.imageUrl}
											placeholder='Image URL'
											required={false}
											sx={{ marginTop: '0.5rem' }}
											onChange={(e) => {
												setNewQuestion((prevQuestion) => {
													if (prevQuestion?.imageUrl !== undefined) {
														return {
															...prevQuestion,
															imageUrl: e.target.value,
														};
													}
													return prevQuestion;
												});
												setIsLessonUpdated(true);
											}}
										/>
									)}
								</FormControl>
							</Box>
							<Box sx={{ flex: 1, mb: '2rem' }}>
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
											<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
												<Input
													type='file'
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
														handleVideoChange(e);
														setIsLessonUpdated(true);
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
													sx={{ textTransform: 'capitalize', height: '2rem', marginTop: '0.5rem' }}
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
											value={newQuestion?.videoUrl}
											required={false}
											placeholder='Video URL'
											sx={{ marginTop: '0.5rem' }}
											onChange={(e) => {
												setNewQuestion((prevQuestion) => {
													if (prevQuestion?.videoUrl !== undefined) {
														return {
															...prevQuestion,
															videoUrl: e.target.value,
														};
													}
													return prevQuestion;
												});
											}}
										/>
									)}
								</FormControl>
							</Box>
						</Box>
						<Box>
							<CustomTextField
								value={newQuestion?.question}
								label='Question'
								onChange={(e) => {
									setNewQuestion((prevQuestion) => {
										if (prevQuestion?.question !== undefined) {
											return {
												...prevQuestion,
												question: e.target.value,
											};
										}
										return prevQuestion;
									});
								}}
							/>
						</Box>
						{questionType === 'Multiple Choice' && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									width: '100%',
								}}>
								{options &&
									options.map((option, index) => (
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
												label={`Option ${index + 1}`}
												value={option}
												onChange={(e) => {
													handleOptionChange(index, e.target.value);
												}}
												sx={{
													marginTop: '0.75rem',
													marginRight: index === 0 ? '2.5rem' : 0,
												}}
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
					</Box>

					{questionType === 'Multiple Choice' && (
						<>
							{isCorrectAnswerMissing && <CustomErrorMessage>Select correct answer</CustomErrorMessage>}
							{isDuplicateOption && <CustomErrorMessage>Options should be unique</CustomErrorMessage>}
							{!isMinimumOptions && <CustomErrorMessage>At least two options are required</CustomErrorMessage>}
						</>
					)}
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						setIsQuestionCreateModalOpen(false);
						setIsCorrectAnswerMissing(false);
						resetImageUpload();
						resetVideoUpload();
						resetEnterImageVideoUrl();
						resetValues();
					}}
					cancelBtnSx={{ margin: '0 0.5rem 1rem 0' }}
					submitBtnSx={{ margin: '0 1rem 1rem 0' }}
					submitBtnType='submit'
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateQuestionDialog;
