import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
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
import { decode } from 'html-entities';

const AdminQuestions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		questions,
		error,
		fetchQuestions,
		fetchMoreQuestions,
		removeQuestion,
		totalItems,
		loadedPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		sortQuestionsData,
		questionTypes,
	} = useContext(QuestionsContext);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<QuestionInterface[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayQuestions = isSearchActive ? searchResults : questions;

	// For pagination, use total items from server when not searching
	const questionsNumberOfPages = isSearchActive ? Math.ceil(displayQuestions.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedQuestions = displayQuestions.slice((questionsPageNumber - 1) * pageSize, questionsPageNumber * pageSize);

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
		fetchQuestions(1); // Always fetch initial data
	}, []); // Only on mount

	const handlePageChange = async (newPage: number) => {
		setQuestionsPageNumber(newPage);

		// Check if we need to fetch more data
		const requiredRecords = newPage * pageSize;
		if (questions.length < requiredRecords && newPage <= questionsNumberOfPages) {
			// Calculate which batch of 50 records we need (context fetches 50 at a time)
			const startBatch = Math.floor(((newPage - 1) * pageSize) / 200) + 1;
			const endBatch = Math.ceil((newPage * pageSize) / 200);

			// Check if we already have the required batches loaded
			const batchesNeeded = [];
			for (let batch = startBatch; batch <= endBatch; batch++) {
				if (!loadedPages.includes(batch)) {
					batchesNeeded.push(batch);
				}
			}

			if (batchesNeeded.length > 0) {
				await fetchMoreQuestions(startBatch, endBatch);
			}
		}
	};

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedQuestions && paginatedQuestions.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedQuestions.length;
			setIsQuestionDeleteModalOpen(Array(paginatedQuestions.length).fill(false));
			setEditQuestionModalOpen(Array(paginatedQuestions.length).fill(false));
			setIsQuestionInfoModalOpen(Array(paginatedQuestions.length).fill(false));
		}
	}, [displayQuestions, questionsPageNumber]);

	if (error) return <Typography color='error'>{error}</Typography>;

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

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setQuestionsPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setQuestionsPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '300',
			});

			if (searchValue) {
				params.append('search', searchValue);
			}

			if (filterValue) {
				params.append('filter', filterValue);
			}

			if (orderBy && order) {
				params.append('sortBy', orderBy.toString());
				params.append('sortOrder', order);
			}

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${params}`);
			setSearchResults(response.data.data);
		} catch (error) {
			console.error('Search error:', error);
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
			<Box sx={{ width: '100%', height: '100%' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
					}}>
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for search & filter' />}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: 4 }}>
						<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
							<Box sx={{ mr: '1rem' }}>
								<FormControl>
									<Select
										size='small'
										value={filterValue}
										onChange={(e) => {
											setFilterValue(e.target.value);
										}}
										displayEmpty
										sx={{
											backgroundColor: theme.bgColor?.common,
											width: isMobileSizeSmall ? '7rem' : '12rem',
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
											value='ai generated'
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
											value='non ai generated'
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
											value='cloned'
											selected
											sx={{
												fontSize: isMobileSize ? '0.65rem' : '0.85rem',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											Cloned
										</MenuItem>
										<MenuItem
											value='original'
											selected
											sx={{
												fontSize: isMobileSize ? '0.65rem' : '0.85rem',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											Original
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
							<CustomTextField
								value={searchValue}
								placeholder={'Search in question, type'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
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
							<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue && !filterValue}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								onClick={() => {
									setSearchValue('');
									setFilterValue('');
									setSearchResults([]);
									setIsSearchActive(false);
									setQuestionsPageNumber(1);
								}}>
								Reset
							</CustomDeleteButton>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
						{isSearchActive && (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									mr: 1,
								}}>
								{searchResults.length} results
							</Typography>
						)}
						<CustomSubmitButton
							onClick={() => {
								setIsQuestionCreateModalOpen(true);
								setQuestionType('');
								setOptions(['']);
								setCorrectAnswer('');
								setIsDuplicateOption(false);
								setCorrectAnswerIndex(-1);
							}}
							sx={{ height: isVerySmallScreen ? '1.75rem' : '2.1rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
							type='button'>
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
								{ key: 'clone', label: 'Cloned' },
								{ key: 'questionType', label: 'Question Type' },
								{ key: 'question', label: 'Question' },
								{ key: 'createdAt', label: 'Created At' },
								{ key: 'updatedAt', label: 'Updated At' },
								{ key: 'actions', label: 'Actions' },
							]}
						/>
						<TableBody>
							{paginatedQuestions &&
								paginatedQuestions?.map((question: QuestionInterface, index) => {
									return (
										<TableRow key={question._id}>
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
													<Tooltip title='AI Generated' placement='top' arrow>
														<AutoAwesome
															sx={{
																fontSize: '1rem',
																color: '#2196F3',
																marginLeft: '0.5rem',
															}}
														/>
													</Tooltip>
												)}
											</CustomTableCell>
											<CustomTableCell
												value={
													isVerySmallScreen
														? truncateText(stripHtml(decode(question.question)), 25)
														: truncateText(stripHtml(decode(question.question)), 45)
												}
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
														maxWidth='xs'>
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
					<CustomTablePagination count={questionsNumberOfPages} page={questionsPageNumber} onChange={handlePageChange} />
				</Box>

				{isQuestionInfoModalOpen.map(
					(isOpen, index) =>
						isOpen && (
							<CustomDialog
								key={index}
								openModal={isOpen}
								closeModal={() => closeQuestionInfoModal(index)}
								title='Question Information'
								maxWidth='sm'>
								<QuestionInfoModal question={paginatedQuestions[index]} onClose={() => closeQuestionInfoModal(index)} />
							</CustomDialog>
						)
				)}
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminQuestions;
