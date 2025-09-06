import {
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	Chip,
} from '@mui/material';

import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
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
import CustomTextField from '../forms/customFields/CustomTextField';
import { Search } from '@mui/icons-material';
import theme from '../../themes';
import { useParams } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import axios from '@utils/axiosInstance';

interface AddNewLessonDialogProps {
	addNewLessonModalOpen: boolean;
	setAddNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	chapter: ChapterLessonData;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddNewLessonDialog = ({
	addNewLessonModalOpen,
	setAddNewLessonModalOpen,
	chapter,
	setIsChapterUpdated,
	setChapterLessonDataBeforeSave,
	setHasUnsavedChanges,
}: AddNewLessonDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { sortLessonsData, lessons, fetchMoreLessons, loadedPages } = useContext(LessonsContext);
	const { courseId } = useParams();
	const { user } = useContext(UserAuthContext);

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

	// Use search results if active, otherwise use context data (filtered to exclude already added lessons)
	const displayLessons = isSearchActive ? searchResults : lessons?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];

	// Calculate total pages based on filtered results when searching, otherwise use available lessons count
	const lessonsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(displayLessons.length / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : lessonsPageNumber;
	const paginatedLessons = displayLessons?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);
	const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
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
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
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
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '1rem 2rem 0 2rem' }}>
					<Box sx={{ display: 'flex', width: '85%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={async (e) => {
										const newFilterValue = e.target.value;
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
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: '12rem',
										fontSize: '0.85rem',
										textTransform: 'capitalize',
									}}>
									<MenuItem disabled value='filter' selected sx={{ fontSize: '0.85rem', fontStyle: 'italic', textTransform: 'capitalize' }}>
										Filter Lessons
									</MenuItem>
									<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										All Lessons
									</MenuItem>
									{['Published Lessons', 'Unpublished Lessons']?.map((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type}
										</MenuItem>
									))}
									<MenuItem disabled value='types' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
										----- Filter by Type -----
									</MenuItem>
									{['Instructional Lessons', 'Practice Lessons', 'Quizzes']?.map((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>

						<CustomTextField
							value={searchValue}
							placeholder={'Search Lesson in Title'}
							onChange={(e) => {
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
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							onClick={() => {
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
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.8rem', alignItems: 'center' }}>
						{isSearchActive ? (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
									whiteSpace: 'nowrap',
								}}>
								{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
							</Typography>
						) : (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
									whiteSpace: 'nowrap',
								}}>
								{displayLessons.length} {displayLessons.length === 1 ? 'item' : 'items'}
							</Typography>
						)}
					</Box>
				</Box>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '1rem 2rem',
						width: '100%',
						height: '22.5rem',
					}}>
					{/* Chips for active search and filter */}
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'center',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search value exists, auto-search with search value
										if (searchValue && searchValue.trim()) {
											handleSearch();
										} else {
											// Clear search results
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchButtonClicked(false);
											setSearchedValue('');
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
												limit: '300',
												filter: filterValue,
											});
											if (orderBy) {
												params.append('sortBy', orderBy);
											}
											if (order) {
												params.append('sortOrder', order);
											}
											axios
												.get(`${base_url}/lessons/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													// Filter out already added lessons from search results
													const filteredResults = response.data.data?.filter((lesson: Lesson) => !chapter.lessonIds?.includes(lesson._id)) || [];
													setSearchResults(filteredResults);
													setSearchResultsTotalItems(filteredResults.length);
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
						<CustomTableHead<Lesson>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'title', label: 'Title' },
								{ key: 'type', label: 'Type' },
								{ key: 'isActive', label: 'Status' },
								{ key: 'actions', label: 'Add Lessons' },
							]}
						/>
						<TableBody>
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
												<FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleCheckboxChange(lesson)} />} label='' />
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
