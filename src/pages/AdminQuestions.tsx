import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Delete, Edit, FileCopy, Search } from '@mui/icons-material';
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

const AdminQuestions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

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
		setIsQuestionDeleteModalOpen(Array(sortedQuestionsData.length).fill(false));
		setEditQuestionModalOpen(Array(sortedQuestionsData.length).fill(false));
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
			const response = await axios.post(`${base_url}/questions/filter`, {
				orgId,
				page,
				limit: 75,
				questionTypeName: filterValue,
			});
			setFilteredQuestions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<DashboardPagesLayout pageName='Questions' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton
					onClick={() => {
						setIsQuestionCreateModalOpen(true);
						setQuestionType('');
						setOptions(['']);
						setCorrectAnswer('');
						setIsDuplicateOption(false);
						setCorrectAnswerIndex(-1);
					}}
					type='button'>
					New Question
				</CustomSubmitButton>
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
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
			/>

			<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 1rem 0 2rem' }}>
				<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: '35%' }}>
					<CustomTextField
						value={searchValue}
						placeholder='Search Question'
						onChange={(e) => {
							setFilterValue('');
							setSearchValue(e.target.value);
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
									/>
								</InputAdornment>
							),
						}}
					/>
					<CustomSubmitButton
						sx={{ height: '2.1rem', marginLeft: '0.5rem' }}
						type='button'
						onClick={async () => {
							await handleSearchQuestions(1);
						}}>
						Search
					</CustomSubmitButton>
					<CustomDeleteButton
						sx={{ height: '2.1rem', marginLeft: '0.5rem' }}
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
				<Box>
					<FormControl>
						<Select
							size='small'
							value={filterValue}
							onChange={async (e) => {
								setSearchValue('');
								setFilterValue(e.target.value);
								if (e.target.value !== '') {
									await handleFilterQuestions(1, e.target.value);
								} else {
									setFilteredQuestions(originalQuestions);
								}
							}}
							displayEmpty
							sx={{
								backgroundColor: theme.bgColor?.common,
								width: '13.25rem',
								mr: '0.75rem',
								ml: '1.5rem',
								fontSize: '0.85rem',
								textTransform: 'capitalize',
							}}>
							<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
								All Questions
							</MenuItem>
							{questionTypes.map((type) => (
								<MenuItem value={type.name.toLowerCase()} key={type._id} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
									{type.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<QuestionInterface>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'questionType', label: 'Question Type' },
							{ key: 'question', label: 'Question' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{filteredQuestions &&
							filteredQuestions?.map((question: QuestionInterface, index) => {
								return (
									<TableRow key={question._id}>
										<CustomTableCell value={question.questionType} />
										<CustomTableCell value={truncateText(stripHtml(question.question), 30)} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy fontSize='small' />} />
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
												icon={<Edit fontSize='small' />}
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
												icon={<Delete fontSize='small' />}
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
		</DashboardPagesLayout>
	);
};

export default AdminQuestions;
