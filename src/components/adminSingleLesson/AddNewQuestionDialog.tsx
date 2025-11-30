import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../../interfaces/question';
import { Lesson } from '../../interfaces/lessons';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Box, Checkbox, DialogContent, FormControlLabel, Table, TableBody, TableCell, TableRow } from '@mui/material';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomTableCell from '../layouts/table/CustomTableCell';
import StickyFilterSearchRow from '../layouts/StickyFilterSearchRow';
import { stripHtml } from '../../utils/stripHtml';
import { truncateText } from '../../utils/utilText';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import { LessonType, QuestionType } from '../../interfaces/enums';

import theme from '../../themes';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface AddNewQuestionDialogProps {
	addNewQuestionModalOpen: boolean;
	singleLessonBeforeSave: Lesson;
	setAddNewQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddNewQuestionDialog = ({
	addNewQuestionModalOpen,
	singleLessonBeforeSave,
	setAddNewQuestionModalOpen,
	setIsLessonUpdated,
	setSingleLessonBeforeSave,
	setIsQuestionUpdated,
	setHasUnsavedChanges,
}: AddNewQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const lessonId = singleLessonBeforeSave._id;

	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const {
		sortQuestionsData,
		questions,
		fetchMoreQuestions,
		loadedPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		fetchQuestions,
		questionTypes,
		updateQuestion,
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

	const pageSize = 25;

	const [selectedQuestions, setSelectedQuestions] = useState<QuestionInterface[]>([]);
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	// Helper function to filter questions by lesson type compatibility
	const filterQuestionsByLessonType = (questions: QuestionInterface[]) => {
		return questions?.filter((question: QuestionInterface) => {
			const questionTypeName = question.questionType as QuestionType;
			if (singleLessonBeforeSave.type === LessonType.QUIZ) {
				return [
					QuestionType.MULTIPLE_CHOICE,
					QuestionType.TRUE_FALSE,
					QuestionType.OPEN_ENDED,
					QuestionType.AUDIO_VIDEO,
					QuestionType.MATCHING,
					QuestionType.FITB_TYPING,
					QuestionType.FITB_DRAG_DROP,
				]?.includes(questionTypeName);
			} else if (singleLessonBeforeSave.type === LessonType.PRACTICE_LESSON) {
				return [
					QuestionType.MULTIPLE_CHOICE,
					QuestionType.TRUE_FALSE,
					QuestionType.OPEN_ENDED,
					QuestionType.MATCHING,
					QuestionType.FITB_TYPING,
					QuestionType.FITB_DRAG_DROP,
					QuestionType.FLIP_CARD,
					QuestionType.TRANSLATE,
				]?.includes(questionTypeName);
			}
			return true;
		});
	};

	// Use search results if active, otherwise use context data (filtered to exclude already added questions)
	const filteredQuestions = isSearchActive
		? searchResults
		: questions?.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id)) || [];

	// Apply client-side sorting
	const sortedQuestions = [...filteredQuestions].sort((a, b) => {
		if (!orderBy) return 0;

		let aValue = a[orderBy];
		let bValue = b[orderBy];

		// Handle different data types
		if (typeof aValue === 'string' && typeof bValue === 'string') {
			aValue = aValue.toLowerCase();
			bValue = bValue.toLowerCase();
		}

		if (aValue < bValue) return order === 'asc' ? -1 : 1;
		if (aValue > bValue) return order === 'asc' ? 1 : -1;
		return 0;
	});

	const displayQuestions = sortedQuestions;

	// Filter questions by lesson type compatibility
	const compatibleQuestions = filterQuestionsByLessonType(displayQuestions);

	// Calculate total pages based on filtered results when searching, otherwise use available questions count
	const questionsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(compatibleQuestions.length / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : questionsPageNumber;
	const paginatedQuestions = compatibleQuestions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	useEffect(() => {
		if (addNewQuestionModalOpen) {
			setQuestionsPageNumber(1);
			setSearchResultsPage(1);
		}
	}, [addNewQuestionModalOpen]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchQuestions(questionsPageNumber);
		}
	}, [questionsPageNumber]);

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If search is active, trigger server-side sort
		if (isSearchActive) {
			handleSearch();
		} else {
			// Client-side sort for context data
			sortQuestionsData(property, isAsc ? 'desc' : 'asc');
		}
	};

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
				const currentLoadedPages = searchResultsLoadedPages && searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (questions.length < requiredRecords) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreQuestions(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${searchParams.toString()}`);

			// Filter out already added questions from search results
			const filteredResults =
				response.data.data?.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id)) || [];

			// Filter by lesson type compatibility
			const compatibleResults = filterQuestionsByLessonType(filteredResults);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(compatibleResults);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...compatibleResults];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			// Update total based on accumulated compatible results
			setSearchResultsTotalItems((prev) => {
				if (page === 1) {
					return compatibleResults.length;
				} else {
					return prev + compatibleResults.length;
				}
			});
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
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

				// Filter out already added questions from search results
				const filteredResults =
					response.data.data?.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id)) || [];

				// Filter by lesson type compatibility
				const compatibleResults = filterQuestionsByLessonType(filteredResults);

				setSearchResults(compatibleResults);
				setSearchResultsTotalItems(compatibleResults.length);
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
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const handleCheckboxChange = (question: QuestionInterface) => {
		const selectedIndex = selectedQuestionIds?.indexOf(question._id) || -1;
		let newSelectedQuestionIds: string[] = [];
		let newSelectedQuestions: QuestionInterface[] = [];

		if (selectedIndex === -1) {
			newSelectedQuestionIds = [...selectedQuestionIds, question._id];
			newSelectedQuestions = [...selectedQuestions, question];
		} else {
			newSelectedQuestionIds = selectedQuestionIds?.filter((id) => id !== question._id) || [];
			newSelectedQuestions = selectedQuestions?.filter((selectedQuestion) => selectedQuestion._id !== question._id) || [];
		}

		setSelectedQuestionIds(newSelectedQuestionIds);
		setSelectedQuestions(newSelectedQuestions);

		setIsLessonUpdated(true);
		setHasUnsavedChanges(true);
	};

	const handleAddQuestions = () => {
		const updatedSelectedQuestions = selectedQuestions?.map((question) => ({
			...question,
			usedInLessons: question.usedInLessons ? [...question.usedInLessons, lessonId] : [lessonId],
			updatedAt: new Date().toISOString(),
			updatedByName: user ? `${user.firstName} ${user.lastName}` : '',
			updatedByImageUrl: user?.imageUrl || '',
			updatedByRole: user?.role || '',
		}));

		setSingleLessonBeforeSave((prevData) => {
			return {
				...prevData,
				questions: prevData.questions?.concat(updatedSelectedQuestions),
				questionIds: prevData.questionIds?.concat(selectedQuestionIds),
			};
		});

		// Update questions in the context
		updatedSelectedQuestions?.forEach((question) => {
			updateQuestion(question);
		});

		const addedQuestionsUpdateData: QuestionUpdateTrack[] = selectedQuestions?.reduce((acc: QuestionUpdateTrack[], value: QuestionInterface) => {
			acc.push({ questionId: value?._id, isUpdated: false });
			return acc;
		}, []);

		setIsQuestionUpdated((prevData) => {
			return [...prevData, ...addedQuestionsUpdateData];
		});

		setIsLessonUpdated(true);

		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
		closeAddNewQuestionModal();
		setHasUnsavedChanges(true);
	};

	const handleResetCheckboxes = () => {
		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
	};

	const closeAddNewQuestionModal = () => {
		setAddNewQuestionModalOpen(false);
		setSearchValue('');
		setFilterValue('');
		setSearchResults([]);
		setIsSearchActive(false);
		setQuestionsPageNumber(1);
		setSearchResultsPage(1);
		setSearchedValue('');
		setSearchButtonClicked(false);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
	};

	return (
		<CustomDialog openModal={addNewQuestionModalOpen} closeModal={closeAddNewQuestionModal} title='Add New Question'>
			<DialogContent>
				<StickyFilterSearchRow
					filterValue={filterValue}
					setFilterValue={async (newFilterValue) => {
						setFilterValue(newFilterValue);

						// Auto-search when filter is selected
						if (newFilterValue && newFilterValue.trim()) {
							setQuestionsPageNumber(1);
							setSearchResultsPage(1);
							setIsSearchActive(true);
							setSearchResultsLoadedPages([]);

							try {
								const params = new URLSearchParams({
									limit: '200',
									filter: newFilterValue.trim(),
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

								const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${params.toString()}`);

								// Filter out already added questions from search results
								const filteredResults =
									response.data.data?.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id)) || [];

								// Filter by lesson type compatibility
								const compatibleResults = filterQuestionsByLessonType(filteredResults);

								setSearchResults(compatibleResults);
								setSearchResultsTotalItems(compatibleResults.length);
								setSearchResultsLoadedPages([1]);
							} catch (error) {
								console.error('Filter search error:', error);
							}
						} else {
							// If filter is cleared but search value exists, auto-search with search value
							if (searchValue && searchValue.trim()) {
								setQuestionsPageNumber(1);
								setSearchResultsPage(1);
								setIsSearchActive(true);
								setSearchResultsLoadedPages([]);

								try {
									const params = new URLSearchParams({
										limit: '200',
										search: searchValue.trim(),
									});

									if (orderBy) {
										params.append('sortBy', orderBy);
									}
									if (order) {
										params.append('sortOrder', order);
									}

									const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${params.toString()}`);

									// Filter out already added questions from search results
									const filteredResults =
										response.data.data?.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id)) || [];

									// Filter by lesson type compatibility
									const compatibleResults = filterQuestionsByLessonType(filteredResults);

									setSearchResults(compatibleResults);
									setSearchResultsTotalItems(compatibleResults.length);
									setSearchResultsLoadedPages([1]);
								} catch (error) {
									console.error('Auto-search error:', error);
								}
							} else {
								// If no search value, reset to context data
								setIsSearchActive(false);
								setSearchResults([]);
								setSearchResultsLoadedPages([]);
								setSearchResultsTotalItems(0);
							}
						}
					}}
					searchValue={searchValue}
					setSearchValue={setSearchValue}
					onSearch={handleSearch}
					onReset={() => {
						setSearchValue('');
						setFilterValue('');
						setSearchedValue('');
						setSearchButtonClicked(false);
						setSearchResults([]);
						setSearchResultsLoadedPages([]);
						setSearchResultsTotalItems(0);
						setIsSearchActive(false);
						setQuestionsPageNumber(1);
						setSearchResultsPage(1);
					}}
					filterOptions={questionTypes?.map((type) => type.name) || []}
					searchPlaceholder={'Search in question text'}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={compatibleQuestions.length}
					searchedValue={searchedValue}
					searchButtonClicked={searchButtonClicked}
					onResetFilter={() => {
						setFilterValue('');
						// Auto-search with existing search value if it exists
						if (searchValue && searchValue.trim()) {
							handleSearch();
						} else {
							setIsSearchActive(false);
							setSearchResults([]);
							setSearchResultsLoadedPages([]);
							setSearchResultsTotalItems(0);
						}
					}}
					onResetSearch={() => {
						setSearchedValue('');
						setSearchButtonClicked(false);
						setSearchValue('');
						// Auto-search with existing filter if it exists
						if (filterValue && filterValue.trim()) {
							// Trigger filter change
							setFilterValue(filterValue);
						} else {
							setIsSearchActive(false);
							setSearchResults([]);
							setSearchResultsLoadedPages([]);
							setSearchResultsTotalItems(0);
						}
					}}
				/>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						width: '100%',
						height: '22.5rem',
						overflow: 'auto',
					}}>
					<Table
						sx={{
							'mb': '2rem',
							'width': '100%',
							'tableLayout': 'fixed',
							'minWidth': '100%',
							'& .MuiTableHead-root': {
								position: 'sticky',
								top: '0rem',
								left: 0,
								right: 0,
								zIndex: 98,
								backgroundColor: theme.bgColor?.secondary,
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							},
							'& .MuiTableHead-root .MuiTableCell-root': {
								backgroundColor: theme.bgColor?.secondary,
								padding: '0.25rem 1rem',
								width: '33.33%',
							},
							'& .MuiTableBody-root .MuiTableCell-root': {
								padding: '0.25rem 1rem',
								width: '33.33%',
							},
							'& .MuiTable-root': {
								width: '100%',
								minWidth: '100%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<CustomTableHead<QuestionInterface>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'questionType', label: isMobileSize ? 'Type' : 'Question Type' },
								{ key: 'question', label: 'Question' },
								{ key: 'actions', label: isMobileSize ? 'Add' : 'Add Questions' },
							]}
						/>
						<TableBody>
							{paginatedQuestions &&
								paginatedQuestions?.map((question: QuestionInterface) => {
									const isSelected = selectedQuestionIds?.indexOf(question._id) !== -1;
									return (
										<TableRow key={question._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
											<CustomTableCell value={question.questionType} />
											<CustomTableCell value={truncateText(stripHtml(question.question), 35)} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<FormControlLabel
													control={
														<Checkbox
															checked={isSelected}
															onChange={() => handleCheckboxChange(question)}
															sx={{
																'& .MuiSvgIcon-root': {
																	fontSize: '1.25rem',
																},
															}}
														/>
													}
													label=''
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={questionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewQuestionModalOpen(false);
					handleResetCheckboxes();
					setSearchValue('');
					setFilterValue('');
					setSearchResults([]);
					setIsSearchActive(false);
					setQuestionsPageNumber(1);
					setSearchResultsPage(1);
					setSearchedValue('');
					setSearchButtonClicked(false);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
				}}
				onSubmit={handleAddQuestions}
				submitBtnText='Add'
				actionSx={{ margin: '1.5rem 1rem 1.5rem 0' }}>
				<CustomCancelButton
					onClick={() => {
						handleResetCheckboxes();
					}}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Deselect All
				</CustomCancelButton>
			</CustomDialogActions>
		</CustomDialog>
	);
};

export default AddNewQuestionDialog;
