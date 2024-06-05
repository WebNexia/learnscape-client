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
import useVideoUpload from '../../../hooks/useVideoUpload';
import HandleImageUploadURL from '../uploadImageVideo/HandleImageUploadURL';
import HandleVideoUploadURL from '../uploadImageVideo/HandleVideoUploadURL';
import ImageThumbnail from '../uploadImageVideo/ImageThumbnail';
import VideoThumbnail from '../uploadImageVideo/VideoThumbnail';

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

	const { resetImageUpload } = useImageUpload();

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [enterVideoUrl, setEnterVideoUrl] = useState<boolean>(true);

	const resetEnterImageVideoUrl = () => {
		setEnterVideoUrl(true);
		setEnterImageUrl(true);
	};

	const { resetVideoUpload } = useVideoUpload();

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
			title='Create Question'
			maxWidth='lg'>
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
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '2rem', width: '100%' }}>
							<Box sx={{ flex: 1, mr: '2rem' }}>
								<HandleImageUploadURL
									onImageUploadLogic={(url) => {
										setNewQuestion((prevQuestion) => {
											if (prevQuestion?.imageUrl !== undefined) {
												return {
													...prevQuestion,
													imageUrl: url,
												};
											}
											return prevQuestion;
										});
									}}
									onChangeImgUrl={(e) => {
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
									imageUrlValue={newQuestion?.imageUrl}
									enterImageUrl={enterImageUrl}
									setEnterImageUrl={setEnterImageUrl}
									imageFolderName='QuestionImages'
								/>

								<ImageThumbnail
									imgSource={newQuestion?.imageUrl || 'https://savethefrogs.com/wp-content/uploads/placeholder-wire-image-white.jpg'}
									removeImage={() => {
										setNewQuestion((prevQuestion) => {
											if (prevQuestion?.imageUrl !== undefined) {
												return {
													...prevQuestion,
													imageUrl: '',
												};
											}
											return prevQuestion;
										});
										setIsLessonUpdated(true);
										resetImageUpload();
									}}
								/>
							</Box>
							<Box sx={{ flex: 1 }}>
								<HandleVideoUploadURL
									onVideoUploadLogic={(url) => {
										setNewQuestion((prevQuestion) => {
											if (prevQuestion?.videoUrl !== undefined) {
												return {
													...prevQuestion,
													videoUrl: url,
												};
											}
											return prevQuestion;
										});
									}}
									onChangeVideoUrl={(e) => {
										setNewQuestion((prevQuestion) => {
											if (prevQuestion?.videoUrl !== undefined) {
												return {
													...prevQuestion,
													videoUrl: e.target.value,
												};
											}
											return prevQuestion;
										});
										setIsLessonUpdated(true);
									}}
									videoUrlValue={newQuestion?.videoUrl}
									enterVideoUrl={enterVideoUrl}
									setEnterVideoUrl={setEnterVideoUrl}
									videoFolderName='QuestionVideos'
								/>

								<VideoThumbnail
									videoPlayCondition={newQuestion?.videoUrl}
									videoUrl={newQuestion?.videoUrl}
									videoPlaceholderUrl='https://riggswealth.com/wp-content/uploads/2016/06/Riggs-Video-Placeholder.jpg'
									removeVideo={() => {
										setNewQuestion((prevQuestion) => {
											if (prevQuestion?.imageUrl !== undefined) {
												return {
													...prevQuestion,
													videoUrl: '',
												};
											}
											return prevQuestion;
										});
										setIsLessonUpdated(true);
										resetImageUpload();
									}}
								/>
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
