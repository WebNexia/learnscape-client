import { Box, DialogActions, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Lesson } from '../interfaces/lessons';
import { Delete, Edit, Info, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';

import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import LessonInfoModal from '../components/lessons/LessonInfoModal';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const {
		lessons,
		error,
		fetchLessons,
		fetchMoreLessons,
		removeLesson,
		totalItems,
		loadedPages,
		lessonsPageNumber,
		setLessonsPageNumber,
		sortLessonsData,
	} = useContext(LessonsContext);
	const { orgId } = useContext(OrganisationContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Lesson[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayLessons = isSearchActive ? searchResults : lessons;

	// For pagination, use total items from server when not searching
	const lessonsNumberOfPages = isSearchActive ? Math.ceil(displayLessons.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedLessons = displayLessons.slice((lessonsPageNumber - 1) * pageSize, lessonsPageNumber * pageSize);

	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handlePageChange = async (newPage: number) => {
		setLessonsPageNumber(newPage);

		// Check if we need to fetch more data
		const requiredRecords = newPage * pageSize;
		if (lessons.length < requiredRecords && newPage <= lessonsNumberOfPages) {
			// Calculate which batch of 200 records we need (context fetches 200 at a time)
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
				await fetchMoreLessons(startBatch, endBatch);
			}
		}
	};

	const handleSort = (property: keyof Lesson) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortLessonsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setLessonsPageNumber(1);

			// Make API call to search entire database
			if (searchValue || filterValue) {
				// Build query parameters
				const params = new URLSearchParams({
					limit: '250',
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

				const response = await axios.get(`${base_url}/lessons/organisation/${orgId}?${params.toString()}`);

				setSearchResults(response.data.data);
				setIsSearchActive(true);
			} else {
				// If no search/filter, clear search results
				setSearchResults([]);
				setIsSearchActive(false);
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const [isLessonDeleteModalOpen, setIsLessonDeleteModalOpen] = useState<boolean[]>([]);
	const [isLessonInfoModalOpen, setIsLessonInfoModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsLessonDeleteModalOpen(Array(paginatedLessons.length).fill(false));
		setIsLessonInfoModalOpen(Array(paginatedLessons.length).fill(false));
	}, [displayLessons, lessonsPageNumber]);

	if (error) return <Typography color='error'>{error}</Typography>;

	useEffect(() => {
		fetchLessons(1); // Always fetch initial data
	}, []); // Only on mount

	const openDeleteLessonModal = (index: number) => {
		const updatedState = [...isLessonDeleteModalOpen];
		updatedState[index] = true;
		setIsLessonDeleteModalOpen(updatedState);
	};
	const closeDeleteLessonModal = (index: number) => {
		const updatedState = [...isLessonDeleteModalOpen];
		updatedState[index] = false;
		setIsLessonDeleteModalOpen(updatedState);
	};

	const deleteLesson = async (lessonId: string): Promise<void> => {
		try {
			removeLesson(lessonId);
			await axios.delete(`${base_url}/lessons/${lessonId}`);
			fetchLessons(1);
		} catch (error) {
			console.log(error);
		}
	};

	const openLessonInfoModal = (index: number) => {
		const updatedState = [...isLessonInfoModalOpen];
		updatedState[index] = true;
		setIsLessonInfoModalOpen(updatedState);
	};

	const closeLessonInfoModal = (index: number) => {
		const updatedState = [...isLessonInfoModalOpen];
		updatedState[index] = false;
		setIsLessonInfoModalOpen(updatedState);
	};

	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									setSearchValue('');
									setFilterValue(e.target.value);
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
									Filter Lessons
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
									All Lessons
								</MenuItem>
								{['Published Lessons', 'Unpublished Lessons'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
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
									----- Filter by Type -----
								</MenuItem>
								{['Instructional Lessons', 'Practice Lessons', 'Quizzes'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<CustomTextField
						value={searchValue}
						placeholder={'Search in Title and Description'}
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
							setLessonsPageNumber(1);
						}}>
						Reset
					</CustomDeleteButton>
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
					<CustomSubmitButton onClick={() => setIsNewLessonModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
						{isVerySmallScreen ? 'New' : 'New Lesson'}
					</CustomSubmitButton>
				</Box>
			</Box>
			<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<Lesson>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'clone', label: 'Cloned' },
							{ key: 'title', label: 'Title' },
							{ key: 'type', label: 'Type' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'createdAt', label: 'Created At' },
							{ key: 'updatedAt', label: 'Updated At' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedLessons &&
							paginatedLessons?.map((lesson: Lesson, index) => {
								return (
									<TableRow key={lesson._id}>
										<TableCell sx={{ textAlign: 'center', width: '0px' }}>
											{lesson.clonedFromId && (
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
										<CustomTableCell value={lesson.title} />
										<CustomTableCell value={lesson.type} />
										<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />
										<CustomTableCell value={dateFormatter(lesson.createdAt)} />
										<CustomTableCell value={dateFormatter(lesson.updatedAt)} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													navigate(`/admin/lesson-edit/lesson/${lesson._id}`);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteLessonModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<CustomActionBtn
												title='More Info'
												onClick={() => {
													openLessonInfoModal(index);
												}}
												icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											{isLessonDeleteModalOpen[index] !== undefined && !lesson.isActive && (
												<CustomDialog
													openModal={isLessonDeleteModalOpen[index]}
													closeModal={() => closeDeleteLessonModal(index)}
													title='Delete Lesson'
													content='Are you sure you want to delete this lesson?'
													maxWidth='xs'>
													<CustomDialogActions
														onCancel={() => closeDeleteLessonModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteLesson(lesson._id);
															closeDeleteLessonModal(index);
														}}
													/>
												</CustomDialog>
											)}

											{isLessonDeleteModalOpen[index] !== undefined && lesson.isActive && (
												<CustomDialog
													openModal={isLessonDeleteModalOpen[index]}
													closeModal={() => closeDeleteLessonModal(index)}
													title='Unpublish Lesson'
													content='You cannot delete published lesson. Please unpublish it first.'
													maxWidth='sm'>
													<DialogActions>
														<CustomCancelButton
															onClick={() => closeDeleteLessonModal(index)}
															sx={{
																margin: '0 0.5rem 0.5rem 0',
															}}>
															Cancel
														</CustomCancelButton>
													</DialogActions>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={lessonsNumberOfPages} page={lessonsPageNumber} onChange={handlePageChange} />
			</Box>

			{isLessonInfoModalOpen.map(
				(isOpen, index) =>
					isOpen && (
						<CustomDialog
							key={index}
							openModal={isOpen}
							closeModal={() => closeLessonInfoModal(index)}
							title={paginatedLessons[index].title}
							maxWidth='sm'>
							<LessonInfoModal lesson={paginatedLessons[index]} onClose={() => closeLessonInfoModal(index)} />
						</CustomDialog>
					)
			)}
		</DashboardPagesLayout>
	);
};

export default AdminLessons;
