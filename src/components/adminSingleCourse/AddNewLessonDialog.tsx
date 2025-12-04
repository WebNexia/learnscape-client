import { Box, Checkbox, DialogContent, FormControlLabel, Table, TableBody, TableCell, TableRow } from '@mui/material';

import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import StickyFilterSearchRow from '../layouts/StickyFilterSearchRow';
import { Lesson } from '../../interfaces/lessons';
import { useContext, useEffect, useState } from 'react';
import { LessonsContext } from '../../contexts/LessonsContextProvider';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { ChapterLessonData, ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTableCell from '../layouts/table/CustomTableCell';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import { chapterUpdateTrack } from '../../utils/chapterUpdateTrack';
import theme from '../../themes';
import { useParams } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import axios from '@utils/axiosInstance';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface AddNewLessonDialogProps {
	addNewLessonModalOpen: boolean;
	setAddNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	chapter: ChapterLessonData;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
	onLessonAdded?: () => void;
}

const AddNewLessonDialog = ({
	addNewLessonModalOpen,
	setAddNewLessonModalOpen,
	chapter,
	setIsChapterUpdated,
	setChapterLessonDataBeforeSave,
	setHasUnsavedChanges,
	onLessonAdded,
}: AddNewLessonDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { sortLessonsData, lessons, fetchMoreLessons, loadedPages } = useContext(LessonsContext);
	const { courseId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Lesson[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const pageSize = 25;

	const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);
	const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	// Use search results if active, otherwise use context data (filtered to exclude already added lessons)
	const filteredLessons = isSearchActive ? searchResults : lessons?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

	// Apply client-side sorting
	const sortedLessons = [...filteredLessons].sort((a, b) => {
		if (!orderBy) return 0;

		let aValue = a[orderBy];
		let bValue = b[orderBy];

		// Handle undefined/null values
		if (aValue === undefined || aValue === null) return 1;
		if (bValue === undefined || bValue === null) return -1;

		// Handle different data types
		if (typeof aValue === 'string' && typeof bValue === 'string') {
			aValue = aValue.toLowerCase();
			bValue = bValue.toLowerCase();
		}

		if (aValue < bValue) return order === 'asc' ? -1 : 1;
		if (aValue > bValue) return order === 'asc' ? 1 : -1;
		return 0;
	});

	const displayLessons = sortedLessons;

	// Calculate total pages based on filtered results when searching, otherwise use available lessons count
	const lessonsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(displayLessons.length / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : lessonsPageNumber;
	const paginatedLessons = displayLessons?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	useEffect(() => {
		if (addNewLessonModalOpen) {
			setLessonsPageNumber(1);
			setSearchResultsPage(1);
		}
	}, [addNewLessonModalOpen]);

	const handleSort = (property: keyof Lesson) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If search is active, trigger server-side sort
		if (isSearchActive) {
			handleSearch();
		} else {
			// Client-side sort for context data
			sortLessonsData(property, isAsc ? 'desc' : 'asc');
		}
	};

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setLessonsPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '300',
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
				const targetPage = Math.ceil((newPage * pageSize) / 300);

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
			if (lessons.length < requiredRecords && newPage <= lessonsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 300);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreLessons(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?${searchParams.toString()}`);

			// Filter out already added lessons from search results
			const filteredResults = response.data.data?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

			if (page === 1) {
				// First page - replace all data
				setSearchResults(filteredResults);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...filteredResults];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			// Update total based on accumulated filtered results
			setSearchResultsTotalItems((prev) => {
				if (page === 1) {
					return filteredResults.length;
				} else {
					return prev + filteredResults.length;
				}
			});
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setLessonsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '300',
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

				const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?${params.toString()}`);

				// Filter out already added lessons from search results
				const filteredResults = response.data.data?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

				setSearchResults(filteredResults);
				setSearchResultsTotalItems(filteredResults.length);
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

	const handleCheckboxChange = (lesson: Lesson) => {
		const selectedIndex = selectedLessonIds?.indexOf(lesson._id) || -1;
		let newSelectedLessonIds: string[] = [];
		let newSelectedLessons: Lesson[] = [];

		if (selectedIndex === -1) {
			newSelectedLessonIds = [...selectedLessonIds, lesson._id];
			newSelectedLessons = [...selectedLessons, lesson];
		} else {
			newSelectedLessonIds = selectedLessonIds?.filter((id) => id !== lesson._id) || [];
			newSelectedLessons = selectedLessons?.filter((selectedLesson) => selectedLesson._id !== lesson._id) || [];
		}

		setSelectedLessonIds(newSelectedLessonIds);
		setSelectedLessons(newSelectedLessons);

		chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
		setHasUnsavedChanges(true);
	};
	const handleAddLessons = () => {
		if (!courseId || !user) return;

		setChapterLessonDataBeforeSave((prevData) => {
			if (prevData) {
				const updatedSelectedLessons = selectedLessons?.map((lesson) => ({
					...lesson,
					usedInCourses: lesson.usedInCourses ? [...lesson.usedInCourses, courseId] : [courseId],
					updatedAt: new Date().toISOString(),
					updatedByName: `${user.firstName} ${user.lastName}`,
					updatedByImageUrl: user.imageUrl,
					updatedByRole: user.role,
				}));

				return prevData?.map((currentChapter) => {
					if (currentChapter.chapterId === chapter?.chapterId) {
						return {
							...currentChapter,
							lessons: currentChapter?.lessons?.concat(updatedSelectedLessons),
							lessonIds: currentChapter?.lessonIds?.concat(selectedLessonIds),
						};
					}
					return currentChapter;
				});
			}
			return [
				{
					chapterId: chapter?.chapterId,
					title: chapter?.title,
					lessons: selectedLessons?.map((lesson) => ({
						...lesson,
						usedInCourses: lesson.usedInCourses ? [...lesson.usedInCourses, courseId] : [courseId],
						updatedAt: new Date().toISOString(),
						updatedByName: `${user.firstName} ${user.lastName}`,
						updatedByImageUrl: user.imageUrl,
						updatedByRole: user.role,
					})),
					lessonIds: selectedLessonIds,
				},
			];
		});

		setAddNewLessonModalOpen(false);
		setSelectedLessons([]);
		setSelectedLessonIds([]);
		setHasUnsavedChanges(true);

		// Auto-expand chapter when lessons are added
		onLessonAdded?.();
	};

	const handleResetCheckboxes = () => {
		setSelectedLessons([]);
		setSelectedLessonIds([]);
	};

	const closeAddNewLessonModalOpen = () => {
		setAddNewLessonModalOpen(false);
		setSearchValue('');
		setFilterValue('');
		setSearchResults([]);
		setIsSearchActive(false);
		setLessonsPageNumber(1);
		setSearchResultsPage(1);
		setSearchedValue('');
		setSearchButtonClicked(false);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
	};
	return (
		<CustomDialog openModal={addNewLessonModalOpen} closeModal={closeAddNewLessonModalOpen} title='Add New Lesson'>
			<DialogContent>
				<StickyFilterSearchRow
					filterValue={filterValue}
					setFilterValue={async (newFilterValue) => {
						setFilterValue(newFilterValue);

						// Auto-search when filter is selected
						if (newFilterValue && newFilterValue.trim()) {
							setLessonsPageNumber(1);
							setSearchResultsPage(1);
							setIsSearchActive(true);
							setSearchResultsLoadedPages([]);

							try {
								const params = new URLSearchParams({
									limit: '300',
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

								const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?${params.toString()}`);

								// Filter out already added lessons from search results
								const filteredResults = response.data.data?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

								setSearchResults(filteredResults);
								setSearchResultsTotalItems(filteredResults.length);
								setSearchResultsLoadedPages([1]);
							} catch (error) {
								console.error('Filter search error:', error);
							}
						} else {
							// If filter is cleared but search value exists, auto-search with search value
							if (searchValue && searchValue.trim()) {
								setLessonsPageNumber(1);
								setSearchResultsPage(1);
								setIsSearchActive(true);
								setSearchResultsLoadedPages([]);

								try {
									const params = new URLSearchParams({
										limit: '300',
										search: searchValue.trim(),
									});

									if (orderBy) {
										params.append('sortBy', orderBy);
									}
									if (order) {
										params.append('sortOrder', order);
									}

									const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?${params.toString()}`);

									// Filter out already added lessons from search results
									const filteredResults = response.data.data?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

									setSearchResults(filteredResults);
									setSearchResultsTotalItems(filteredResults.length);
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
						setLessonsPageNumber(1);
						setSearchResultsPage(1);
					}}
					filterOptions={['Published Lessons', 'Unpublished Lessons', 'Instructional Lessons', 'Practice Lessons', 'Quizzes']}
					searchPlaceholder={'Search Lesson in Title'}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={displayLessons.length}
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
						stickyHeader
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
							},
						}}
						size='small'
						aria-label='a dense table'>
						<CustomTableHead<Lesson>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'title', label: 'Title' },
								{ key: 'type', label: 'Type' },
								{ key: 'isActive', label: 'Status' },
								{ key: 'actions', label: isMobileSize ? 'Add' : 'Add Lessons' },
							]}
						/>
						<TableBody sx={{ width: '100%' }}>
							{paginatedLessons &&
								paginatedLessons?.map((lesson: Lesson) => {
									const isSelected = selectedLessonIds?.indexOf(lesson._id) !== -1;
									return (
										<TableRow key={lesson._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
											<CustomTableCell value={lesson.title} />
											<CustomTableCell value={lesson.type?.charAt?.(0)?.toUpperCase?.() + lesson.type?.slice(1)} />
											<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<FormControlLabel
													control={<Checkbox checked={isSelected} onChange={() => handleCheckboxChange(lesson)} />}
													label=''
													sx={{
														'& .MuiSvgIcon-root': {
															fontSize: isMobileSize ? '0.9rem' : '1.25rem',
														},
													}}
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={lessonsNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewLessonModalOpen(false);
					handleResetCheckboxes();
					setSearchValue('');
					setFilterValue('');
					setSearchResults([]);
					setIsSearchActive(false);
					setLessonsPageNumber(1);
					setSearchResultsPage(1);
					setSearchedValue('');
					setSearchButtonClicked(false);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
				}}
				onSubmit={handleAddLessons}
				submitBtnText='Add'
				actionSx={{ margin: '0rem 1rem 1.5rem 0' }}>
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

export default AddNewLessonDialog;
