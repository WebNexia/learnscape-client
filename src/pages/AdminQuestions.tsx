import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { AutoAwesome, Delete, Edit, Info, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../interfaces/question';
import useNewQuestion from '../hooks/useNewQuestion';
import CreateQuestionDialog from '../components/forms/newQuestion/CreateQuestionDialog';
import { stripHtml } from '../utils/stripHtml';
import { truncateText } from '../utils/utilText';
import AdminQuestionsEditQuestionDialog from '../components/forms/editQuestion/AdminQuestionsEditQuestionDialog';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { dateFormatter } from '../utils/dateFormatter';
import QuestionInfoModal from '../components/questions/QuestionInfoModal';

const AdminQuestions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		sortQuestionsData,
		sortedQuestionsData,
		removeQuestion,
		numberOfPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		setNumberOfPages,
		fetchQuestions,
		questionTypes,
	} = useContext(QuestionsContext);

	const [filteredQuestions, setFilteredQuestions] = useState<QuestionInterface[]>(sortedQuestionsData);
	const [originalQuestions, setOriginalQuestions] = useState<QuestionInterface[]>(sortedQuestionsData);
	const [numberOfPagesOfAllQuestions, setNumberOfPagesOfAllQuestions] = useState<number>(numberOfPages);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuestionsData(property, isAsc ? 'desc' : 'asc');
	};

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean[]>([]);
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<boolean[]>([]);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [isQuestionInfoModalOpen, setIsQuestionInfoModalOpen] = useState<boolean[]>([]);

	const {
		options,
		setOptions,
		correctAnswerIndex,
		setCorrectAnswerIndex,
		correctAnswer,
		setCorrectAnswer,
		isDuplicateOption,
		setIsDuplicateOption,
		setIsMinimumOptions,
		isMinimumOptions,
		addOption,
		removeOption,
		handleCorrectAnswerChange,
		handleOptionChange,
	} = useNewQuestion();

	useEffect(() => {
		setQuestionsPageNumber(1);
	}, []);

	useEffect(() => {
		setIsQuestionDeleteModalOpen(Array(filteredQuestions.length).fill(false));
		setEditQuestionModalOpen(Array(filteredQuestions.length).fill(false));
		setIsQuestionInfoModalOpen(Array(filteredQuestions.length).fill(false));
		setFilteredQuestions(sortedQuestionsData);
	}, [sortedQuestionsData, questionsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			if (!searchValue && !filterValue) {
				fetchQuestions(questionsPageNumber);
			}
		}
	}, [questionsPageNumber]);

	const openDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = true;
		setIsQuestionDeleteModalOpen(updatedState);
	};
	const closeDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = false;
		setIsQuestionDeleteModalOpen(updatedState);
	};

	const deleteQuestion = async (questionId: string): Promise<void> => {
		try {
			removeQuestion(questionId);
			await axios.delete(`${base_url}/questions/${questionId}`);
			fetchQuestions(questionsPageNumber);
		} catch (error) {
			console.log(error);
		}
	};

	// Function to toggle edit modal for a specific question
	const toggleQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setEditQuestionModalOpen(newEditModalOpen);
	};
	const closeQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = false;
		setEditQuestionModalOpen(newEditModalOpen);
	};

	const handleSearchQuestions = async (page: number) => {
		if (!searchValue) {
			setNumberOfPages(numberOfPagesOfAllQuestions);
			setFilteredQuestions(originalQuestions);

			return;
		}

		try {
			const response = await axios.post(`${base_url}/questions/search`, {
				orgId,
				page,
				limit: 75,
				search: searchValue,
			});
			setFilteredQuestions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	const handleFilterQuestions = async (page: number, filterValue: string) => {
		if (!filterValue) {
			setNumberOfPages(numberOfPagesOfAllQuestions);
			setFilteredQuestions(originalQuestions);
			return;
		}

		try {
			// Check if it's an AI filter
			if (filterValue === 'aiGenerated' || filterValue === 'nonAiGenerated') {
				const response = await axios.post(`${base_url}/questions/filter/ai`, {
					orgId,
					page,
					limit: 75,
					aiStatus: filterValue,
				});
				setFilteredQuestions(response.data.data);
				setNumberOfPages(response.data.pages);
			} else {
				// Regular question type filter
				const response = await axios.post(`${base_url}/questions/filter`, {
					orgId,
					page,
					limit: 75,
					questionTypeName: filterValue,
				});
				setFilteredQuestions(response.data.data);
				setNumberOfPages(response.data.pages);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const openQuestionInfoModal = (index: number) => {
		const updatedState = [...isQuestionInfoModalOpen];
		updatedState[index] = true;
		setIsQuestionInfoModalOpen(updatedState);
	};

	const closeQuestionInfoModal = (index: number) => {
		const updatedState = [...isQuestionInfoModalOpen];
		updatedState[index] = false;
		setIsQuestionInfoModalOpen(updatedState);
	};

	return (
		<DashboardPagesLayout pageName='Questions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: isVerySmallScreen ? 'space-between' : 'flex-end',
					alignItems: 'center',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for search & filter' />}
				{!isVerySmallScreen && (
					<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={async (e) => {
										setFilterValue(e.target.value);
										setSearchValue('');
										if (e.target.value !== '') {
											await handleFilterQuestions(1, e.target.value);
										} else {
											setFilteredQuestions(originalQuestions);
										}
									}}
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: isMobileSizeSmall ? '8rem' : '12rem',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										textTransform: 'capitalize',
									}}>
									<MenuItem
										disabled
										value='filter'
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											fontStyle: 'italic',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Filter Questions
									</MenuItem>
									<MenuItem
										value=''
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										All Questions
									</MenuItem>
									<MenuItem
										value='aiGenerated'
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										AI Generated
									</MenuItem>
									<MenuItem
										value='nonAiGenerated'
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Non-AI Generated
									</MenuItem>
									<MenuItem
										disabled
										value='types'
										selected
										sx={{
											fontSize: isMobileSize ? '0.6rem' : '0.7rem',
											textTransform: 'inherit',
											fontWeight: 'lighter',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										------ Filter by Type ------
									</MenuItem>
									{questionTypes.map((type) => (
										<MenuItem
											value={type.name.toLowerCase()}
											key={type._id}
											sx={{
												fontSize: isMobileSize ? '0.65rem' : '0.85rem',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											{type.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
						<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '7rem' : isMobileSize ? '20rem' : '30rem' }}>
							<CustomTextField
								value={searchValue}
								placeholder='Search Question'
								onChange={(e) => {
									setSearchValue(e.target.value);
									setFilterValue('filter');
									if (e.target.value === '') {
										setFilterValue('');
									}
									setFilteredQuestions(originalQuestions);
								}}
								sx={{ backgroundColor: '#fff' }}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search
												sx={{
													mr: '-0.5rem',
												}}
												fontSize={isMobileSize ? 'small' : 'medium'}
											/>
										</InputAdornment>
									),
								}}
							/>
							<CustomSubmitButton
								sx={{ height: '2rem', marginLeft: '0.5rem' }}
								type='button'
								onClick={async () => {
									await handleSearchQuestions(1);
								}}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								sx={{ height: '2rem' }}
								type='button'
								onClick={async () => {
									setFilterValue('');
									setSearchValue('');
									setFilteredQuestions(originalQuestions);
									setQuestionsPageNumber(1);
									setNumberOfPages(numberOfPagesOfAllQuestions);
								}}>
								Reset
							</CustomDeleteButton>
						</Box>
					</Box>
				)}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						mb: '1.25rem',
						width: isVerySmallScreen ? '5%' : isMobileSize ? '20%' : '25%',
						height: isVerySmallScreen ? '1.5rem' : '2rem',
					}}>
					<CustomSubmitButton
						onClick={() => {
							setIsQuestionCreateModalOpen(true);
							setQuestionType('');
							setOptions(['']);
							setCorrectAnswer('');
							setIsDuplicateOption(false);
							setCorrectAnswerIndex(-1);
						}}
						type='button'
						sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
						{isVerySmallScreen ? 'New' : 'New Question'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<CreateQuestionDialog
				createNewQuestion={true}
				isQuestionCreateModalOpen={isQuestionCreateModalOpen}
				questionType={questionType}
				options={options}
				correctAnswer={correctAnswer}
				correctAnswerIndex={correctAnswerIndex}
				setQuestionType={setQuestionType}
				setOptions={setOptions}
				setCorrectAnswer={setCorrectAnswer}
				setCorrectAnswerIndex={setCorrectAnswerIndex}
				setIsQuestionCreateModalOpen={setIsQuestionCreateModalOpen}
				addOption={addOption}
				removeOption={removeOption}
				handleCorrectAnswerChange={handleCorrectAnswerChange}
				handleOptionChange={handleOptionChange}
				setIsMinimumOptions={setIsMinimumOptions}
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<QuestionInterface>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'clone', label: '' },
							{ key: 'questionType', label: 'Question Type' },
							{ key: 'question', label: 'Question' },
							{ key: 'createdAt', label: 'Created At' },
							{ key: 'updatedAt', label: 'Updated At' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{filteredQuestions &&
							filteredQuestions?.map((question: QuestionInterface, index) => {
								return (
									<TableRow key={question._id} sx={{ bgcolor: question.isAiGenerated ? '#E3F2FD' : undefined }}>
										<TableCell sx={{ textAlign: 'center', width: '0px' }}>
											{question.clonedFromId && (
												<Box
													sx={{
														backgroundColor: theme.palette.info.main,
														color: 'white',
														borderRadius: '50%',
														width: '15px',
														height: '15px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '0.65rem',
														margin: '0 auto',
													}}>
													C
												</Box>
											)}
										</TableCell>
										<CustomTableCell value={question.questionType}>
											{question.isAiGenerated && (
												<AutoAwesome
													sx={{
														fontSize: '1rem',
														color: '#2196F3',
														marginLeft: '0.5rem',
													}}
												/>
											)}
										</CustomTableCell>
										<CustomTableCell
											value={isVerySmallScreen ? truncateText(stripHtml(question.question), 25) : truncateText(stripHtml(question.question), 45)}
										/>
										<CustomTableCell value={dateFormatter(question.createdAt)} />
										<CustomTableCell value={dateFormatter(question.updatedAt)} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													setOptions(question.options);
													setCorrectAnswer(question.correctAnswer);
													const correctAnswerIndex = question.options.indexOf(question.correctAnswer);
													setCorrectAnswerIndex(correctAnswerIndex);
													toggleQuestionEditModal(index);
													setIsDuplicateOption(false);
													setIsMinimumOptions(true);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											<AdminQuestionsEditQuestionDialog
												question={question}
												correctAnswerIndex={correctAnswerIndex}
												index={index}
												options={options}
												correctAnswer={question.correctAnswer}
												questionType={question.questionType}
												isMinimumOptions={isMinimumOptions}
												isDuplicateOption={isDuplicateOption}
												handleCorrectAnswerChange={handleCorrectAnswerChange}
												setCorrectAnswerIndex={setCorrectAnswerIndex}
												handleOptionChange={handleOptionChange}
												closeQuestionEditModal={closeQuestionEditModal}
												editQuestionModalOpen={editQuestionModalOpen}
												addOption={addOption}
												removeOption={removeOption}
												setCorrectAnswer={setCorrectAnswer}
												setIsDuplicateOption={setIsDuplicateOption}
												setIsMinimumOptions={setIsMinimumOptions}
											/>

											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteQuestionModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											<CustomActionBtn
												title='More Info'
												onClick={() => {
													openQuestionInfoModal(index);
												}}
												icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											{isQuestionDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isQuestionDeleteModalOpen[index]}
													closeModal={() => closeDeleteQuestionModal(index)}
													title='Delete Question'
													content='Are you sure you want to delete this question?'
													maxWidth='sm'>
													<CustomDialogActions
														onCancel={() => closeDeleteQuestionModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteQuestion(question._id);
															closeDeleteQuestionModal(index);
														}}
													/>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination
					count={numberOfPages}
					page={questionsPageNumber}
					onChange={(newPage) => {
						setQuestionsPageNumber(newPage);
						if (searchValue) {
							handleSearchQuestions(newPage); // Search with pagination
						} else if (filterValue) {
							handleFilterQuestions(newPage, filterValue); // Filter with pagination
						}
					}}
				/>
			</Box>

			{isQuestionInfoModalOpen.map(
				(isOpen, index) =>
					isOpen && (
						<CustomDialog key={index} openModal={isOpen} closeModal={() => closeQuestionInfoModal(index)} title='Question Information' maxWidth='sm'>
							<QuestionInfoModal question={filteredQuestions[index]} onClose={() => closeQuestionInfoModal(index)} />
						</CustomDialog>
					)
			)}
		</DashboardPagesLayout>
	);
};

export default AdminQuestions;
