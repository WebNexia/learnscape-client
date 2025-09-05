import {
	Box,
	FormControl,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Tooltip,
	Typography,
	Chip,
	Snackbar,
	Alert,
} from '@mui/material';
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
		fetchMoreQuestions,
		removeQuestion,
		totalItems,
		loadedPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		questionTypes,
	} = useContext(QuestionsContext);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<QuestionInterface[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('updatedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayQuestions = isSearchActive ? searchResults : questions;

	// For pagination, use total items from server when not searching
	const questionsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : questionsPageNumber;

	const sortedQuestions = [...displayQuestions].sort((a, b) => {
		const aValue = a[orderBy] ?? '';
		const bValue = b[orderBy] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedQuestions = isSearchActive
		? searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
		: sortedQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean[]>([]);
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<boolean[]>([]);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [isQuestionInfoModalOpen, setIsQuestionInfoModalOpen] = useState<boolean[]>([]);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setQuestionsPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '200',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (questions.length < requiredRecords && newPage <= questionsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreQuestions(currentLoadedPages + 1, targetPage);
				}
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
			const response = await axios.delete(`${base_url}/questions/${questionId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				// If search is active, also remove from search results
				if (isSearchActive) {
					setSearchResults((prev) => prev.filter((question) => question._id !== questionId));
					setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
				}

				removeQuestion(questionId);

				// Show success message
				setSnackbarMessage('Question deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete question failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete question');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete question error:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
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
		try {
			// Reset to first page when searching
			setQuestionsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '200',
					search: searchValue.trim(),
				});

				// Add filter if it exists
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
				setSearchedValue('');
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
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
											const newFilterValue = e.target.value;
											setFilterValue(newFilterValue);

											// Auto-search when filter changes
											if (newFilterValue) {
												// Build query parameters
												const params = new URLSearchParams({
													limit: '200',
													filter: newFilterValue,
												});

												// Include existing search value if it exists
												if (searchValue && searchValue.trim()) {
													params.append('search', searchValue.trim());
												}
												if (orderBy) {
													params.append('sortBy', orderBy);
												}
												if (order) {
													params.append('sortOrder', order);
												}

												// Trigger search immediately
												axios
													.get(`${base_url}/questions/organisation/${orgId}?${params.toString()}`)
													.then((response) => {
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
														setIsSearchActive(true);
														setSearchResultsPage(1);
													})
													.catch((error) => {
														console.error('Filter error:', error);
													});
											} else {
												// If filter is cleared but search value exists, auto-search with search value
												if (searchValue && searchValue.trim()) {
													handleSearch();
												} else {
													// Clear search results and go back to context data
													setSearchResults([]);
													setSearchResultsLoadedPages([]);
													setSearchResultsTotalItems(0);
													setIsSearchActive(false);
													setSearchResultsPage(1);
												}
											}
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
							<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								onClick={() => {
									setSearchValue('');
									setFilterValue('');
									setSearchResults([]);
									setIsSearchActive(false);
									setQuestionsPageNumber(1);
									setSearchResultsPage(1);
									setSearchResultsLoadedPages([]);
									setSearchResultsTotalItems(0);
									setSearchButtonClicked(false);
									setSearchedValue('');
								}}>
								Reset
							</CustomDeleteButton>
							<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
								{isSearchActive ? (
									<Typography
										variant='body2'
										sx={{
											color: 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											whiteSpace: 'nowrap',
										}}>
										{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
									</Typography>
								) : (
									<Typography
										variant='body2'
										sx={{
											color: 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											whiteSpace: 'nowrap',
										}}>
										{totalItems} {totalItems === 1 ? 'item' : 'items'}
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
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
					{/* Chips for active search and filter */}
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'flex-start',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
								marginTop: '-1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search value exists, keep search results
										if (searchValue && searchValue.trim()) {
											handleSearch();
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}}
									variant='outlined'
									color='secondary'
									size='small'
									sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
							{isSearchActive && searchedValue && searchButtonClicked && (
								<Chip
									label={`Search: "${searchedValue}"`}
									onDelete={() => {
										setSearchValue('');
										setSearchedValue('');
										setSearchButtonClicked(false);
										// If filter is still active, keep filter results
										if (filterValue) {
											// Re-trigger filter search without search value
											const params = new URLSearchParams({
												limit: '200',
												filter: filterValue,
											});
											if (orderBy) {
												params.append('sortBy', orderBy);
											}
											if (order) {
												params.append('sortOrder', order);
											}
											axios
												.get(`${base_url}/questions/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setSearchResultsPage(1);
												})
												.catch((error) => {
													console.error('Filter error:', error);
												});
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}}
									color='primary'
									variant='filled'
									size='small'
									sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
						</Box>
					)}
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<QuestionInterface>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'clone', label: 'Cloned' },
								{ key: 'questionType', label: 'Question Type' },
								{ key: 'question', label: 'Question' },
								{ key: 'createdAt', label: 'Created On' },
								{ key: 'updatedAt', label: 'Updated On' },
								{ key: 'actions', label: 'Actions' },
							]}
						/>
						<TableBody>
							{paginatedQuestions &&
								paginatedQuestions?.map((question: QuestionInterface, index) => {
									return (
										<TableRow key={question._id} hover>
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
														content={`Are you sure you want to delete "${truncateText(stripHtml(decode(question.question)), 25)}"?`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => closeDeleteQuestionModal(index)}
															deleteBtn={true}
															onDelete={() => {
																deleteQuestion(question._id);
																closeDeleteQuestionModal(index);
															}}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												)}
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={questionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
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

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={5000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: '4rem' }}
				onClose={() => setSnackbarOpen(false)}>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={snackbarSeverity}
					sx={{
						'width': '100%',
						'backgroundColor': theme.bgColor?.greenSecondary,
						'color': theme.textColor?.common.main,
						'& .MuiAlert-icon': {
							color: 'white',
						},
					}}>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default AdminQuestions;
