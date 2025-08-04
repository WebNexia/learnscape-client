import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	FormControlLabel,
	Checkbox,
	Tooltip,
	Typography,
	FormControl,
	Select,
	MenuItem,
	InputAdornment,
	DialogContent,
	Snackbar,
	Alert,
	DialogActions,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Price, SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy, Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';

const AdminCourses = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const {
		courses,
		loading,
		error,
		fetchCourses,
		fetchMoreCourses,
		addNewCourse,
		removeCourse,
		sortCoursesData,
		totalItems,
		loadedPages,
		coursesPageNumber,
		setCoursesPageNumber,
	} = useContext(CoursesContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<SingleCourse[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [GBP, setGBP] = useState<Price | null>(null);
	const [USD, setUSD] = useState<Price | null>(null);
	const [EUR, setEUR] = useState<Price | null>(null);
	const [TRY, setTRY] = useState<Price | null>(null);

	const [checked, setChecked] = useState<boolean>(false);
	const [isExternal, setIsExternal] = useState<boolean>(false);

	const pageSize = 25;

	// Use search results if active, otherwise use context data
	const displayCourses = isSearchActive ? searchResults : courses;

	// For pagination, use total items from server when not searching
	const coursesNumberOfPages = isSearchActive ? Math.ceil(displayCourses.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedCourses = displayCourses.slice((coursesPageNumber - 1) * pageSize, coursesPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof SingleCourse>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	if (loading) return <Typography>Loading...</Typography>;
	if (error) return <Typography color='error'>{error}</Typography>;

	// Modal states
	const [isCourseCreateModalOpen, setIsCourseCreateModalOpen] = useState<boolean>(false);

	const openNewCourseModal = () => {
		setIsCourseCreateModalOpen(true);
		setTitle('');
		setDescription('');
		setChecked(false);

		setGBP({ amount: '', currency: 'gbp' });
		setUSD({ amount: '', currency: 'usd' });
		setEUR({ amount: '', currency: 'eur' });
		setTRY({ amount: '', currency: 'try' });
	};
	const closeNewCourseModal = () => setIsCourseCreateModalOpen(false);

	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);
	const [isCourseCloneModalOpen, setIsCourseCloneModalOpen] = useState<boolean[]>([]);

	const [isCourseCloned, setIsCourseCloned] = useState<boolean>(false);

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedCourses && paginatedCourses.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedCourses.length;
			setIsCourseDeleteModalOpen(Array(paginatedCourses.length).fill(false));
			setIsCourseCloneModalOpen(Array(paginatedCourses.length).fill(false));
		}
	}, [displayCourses, coursesPageNumber]);

	useEffect(() => {
		fetchCourses(1); // Always fetch initial data
	}, []); // Only on mount

	const handlePageChange = async (newPage: number) => {
		setCoursesPageNumber(newPage);

		// Check if we need to fetch more data
		const requiredRecords = newPage * pageSize;
		if (courses.length < requiredRecords && newPage <= coursesNumberOfPages) {
			// Calculate which batch of 300 records we need (context fetches 300 at a time)
			const startBatch = Math.floor(((newPage - 1) * pageSize) / 150) + 1;
			const endBatch = Math.ceil((newPage * pageSize) / 150);

			// Check if we already have the required batches loaded
			const batchesNeeded = [];
			for (let batch = startBatch; batch <= endBatch; batch++) {
				if (!loadedPages.includes(batch)) {
					batchesNeeded.push(batch);
				}
			}

			if (batchesNeeded.length > 0) {
				await fetchMoreCourses(startBatch, endBatch);
			}
		}
	};

	const handleSort = (property: keyof SingleCourse) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortCoursesData(property, isAsc ? 'desc' : 'asc');
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setCoursesPageNumber(1);

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

				const response = await axios.get(`${base_url}/courses/organisation/${orgId}?${params.toString()}`);

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

	const openCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = true;
		setIsCourseCloneModalOpen(updatedState);
	};

	const closeCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = false;
		setIsCourseCloneModalOpen(updatedState);
	};

	const openDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = true;
		setIsCourseDeleteModalOpen(updatedState);
	};
	const closeDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = false;
		setIsCourseDeleteModalOpen(updatedState);
	};

	const createCourse = async (): Promise<void> => {
		const prices: Price[] = [
			{ amount: checked ? 'Free' : GBP?.amount!, currency: 'gbp' },
			{ amount: checked ? 'Free' : USD?.amount!, currency: 'usd' },
			{ amount: checked ? 'Free' : EUR?.amount!, currency: 'eur' },
			{ amount: checked ? 'Free' : TRY?.amount!, currency: 'try' },
		];
		try {
			const response = await axios.post(`${base_url}/courses`, {
				title: title.trim(),
				description: description.trim(),
				prices,
				startingDate: '',
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: `${(user?.firstName ?? '').charAt(0).toUpperCase()}${(user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase()}${(user?.lastName ?? '').slice(1)}`,
					userId: user?._id,
					imageUrl: user?.imageUrl,
					email: user?.email,
				},
			});

			// Notify context provider to update sortedCoursesData with the new course
			addNewCourse({
				_id: response.data._id,
				title: title.trim(),
				description: description.trim(),
				prices,
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				createdAt: response.data.createdAt,
				updatedAt: response.data.updatedAt,
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: user?.firstName.toUpperCase() + ' ' + user?.lastName.toUpperCase(),
					userId: user?._id,
					imageUrl: user?.imageUrl,
					email: user?.email,
				},
			});
		} catch (error) {
			console.log(error);
		}
	};

	const handleClone = async (courseId: string, index: number) => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}/courses/${courseId}/clone`, { courseId });
			closeCloneCourseModal(index);

			addNewCourse({
				_id: response.data.clonedCourse._id,
				title: response.data.clonedCourse.title,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				clonedFromTitle: response.data.clonedCourse.clonedFromTitle,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
			});

			setIsCourseCloned(true);
		} catch (error) {
			console.log(error);
		} finally {
			setIsCloning(false);
		}
	};

	const deleteCourse = async (courseId: string): Promise<void> => {
		try {
			removeCourse(courseId);
			await axios.delete(`${base_url}/courses/${courseId}`);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<CustomDialog openModal={isCourseCreateModalOpen} closeModal={closeNewCourseModal} title='Create New Course' maxWidth='sm'>
				<form
					onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						createCourse();
						closeNewCourseModal();
					}}
					style={{ display: 'flex', flexDirection: 'column', marginTop: '-1rem' }}>
					<Tooltip title='Max 50 Characters' placement='top' arrow>
						<CustomTextField
							fullWidth={false}
							label='Title'
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							sx={{ margin: '1rem 2rem' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
							InputProps={{ inputProps: { maxLength: 50 } }}
						/>
					</Tooltip>

					<Tooltip title='Max 500 characters' placement='top' arrow>
						<CustomTextField
							fullWidth={false}
							label='Description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							sx={{ margin: '1rem 2rem' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
							InputProps={{ inputProps: { maxLength: 500 } }}
							multiline
							rows={5}
							resizable
						/>
					</Tooltip>

					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Box sx={{ margin: '1rem 2rem 1rem 2rem', flex: 2 }}>
							<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
									Prices
								</Typography>
								<Tooltip title='Check to make this course free in all currencies.' placement='top' arrow>
									<FormControlLabel
										control={
											<Checkbox
												checked={checked}
												onChange={(e) => {
													setChecked(e.target.checked);
													setTRY((prevData) => ({ ...prevData!, amount: '' }));
													setEUR((prevData) => ({ ...prevData!, amount: '' }));
													setUSD((prevData) => ({ ...prevData!, amount: '' }));
													setGBP((prevData) => ({ ...prevData!, amount: '' }));
												}}
												sx={{
													'& .MuiSvgIcon-root': {
														fontSize: '1rem',
													},
												}}
											/>
										}
										label='Free Course'
										sx={{
											'mr': '0rem',
											'& .MuiFormControlLabel-label': {
												fontSize: '0.75rem',
											},
										}}
									/>
								</Tooltip>
							</Box>

							<CustomTextField
								label='GBP'
								value={checked ? '' : GBP?.amount}
								onChange={(e) => setGBP((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
							<CustomTextField
								label='USD'
								value={checked ? '' : USD?.amount}
								onChange={(e) => setUSD((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
							<CustomTextField
								label='EUR'
								value={checked ? '' : EUR?.amount}
								onChange={(e) => setEUR((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
							<CustomTextField
								label='TRY'
								value={checked ? '' : TRY?.amount}
								onChange={(e) => setTRY((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
						</Box>
					</Box>
					<Box sx={{ margin: '0 2rem', display: 'flex', alignItems: 'center' }}>
						<Tooltip title='This course will be managed outside the platform.' placement='top' arrow>
							<FormControlLabel
								control={
									<Checkbox
										checked={isExternal}
										onChange={(e) => {
											setIsExternal(e.target.checked);
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: '1.25rem',
											},
										}}
									/>
								}
								label='External Course'
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: '0.85rem',
									},
								}}
							/>
						</Tooltip>
					</Box>
					<CustomDialogActions onCancel={closeNewCourseModal} actionSx={{ width: '95%', margin: '0.75rem auto' }} />
				</form>
			</CustomDialog>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
					<Box>
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
									width: isMobileSizeSmall ? '8rem' : '12rem',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									textTransform: 'capitalize',
									mr: '1rem',
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
									Filter Courses
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
									All Courses
								</MenuItem>
								{[
									'Published Courses',
									'Unpublished Courses',
									'Paid Courses',
									'Free Courses',
									'Open Courses',
									'Closed Courses',
									'External Courses',
									'Platform Courses',
								].map((type) => (
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
							setCoursesPageNumber(1);
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
					<CustomSubmitButton onClick={openNewCourseModal} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
						{isVerySmallScreen ? 'New' : 'New Course'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<SingleCourse>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'clone', label: 'Cloned' },
										{ key: 'title', label: 'Title' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'startingDate', label: 'Starting Date' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'clone', label: 'Cloned' },
										{ key: 'title', label: 'Title' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'startingDate', label: 'Starting Date' },
										{ key: 'durationWeeks', label: 'Weeks #' },
										{ key: 'createdAt', label: 'Created At' },
										{ key: 'updatedAt', label: 'Updated At' },
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedCourses &&
							paginatedCourses?.map((course: SingleCourse, index) => {
								return (
									<TableRow key={course._id}>
										<TableCell sx={{ textAlign: 'center', width: '0px' }}>
											{course.clonedFromId && (
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
										<CustomTableCell value={course.title} />
										<CustomTableCell
											value={
												course.isActive
													? course.isExpired
														? 'Published - Closed'
														: 'Published - Open'
													: course.isExpired
														? 'Unpublished - Closed'
														: 'Unpublished - Open'
											}
										/>

										<CustomTableCell value={dateFormatter(course.startingDate)} />
										{!isVerySmallScreen && <CustomTableCell value={course.durationWeeks} />}
										{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.createdAt)} />}
										{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.updatedAt)} />}

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Clone'
												onClick={() => openCloneCourseModal(index)}
												icon={<FileCopy fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											{!course.isExpired ? (
												<CustomActionBtn
													title='Edit'
													onClick={() => {
														navigate(`/admin/course-edit/course/${course._id}`);
													}}
													icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											) : (
												<CustomActionBtn
													title='View'
													onClick={() => {
														navigate(`/admin/course-edit/course/${course._id}`);
													}}
													icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											)}
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteCourseModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											{isCourseDeleteModalOpen[index] !== undefined && !course.isActive && (
												<CustomDialog
													openModal={isCourseDeleteModalOpen[index]}
													closeModal={() => closeDeleteCourseModal(index)}
													title='Delete'
													content='Are you sure you want to delete this course?'
													maxWidth='sm'>
													<CustomDialogActions
														onCancel={() => closeDeleteCourseModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteCourse(course._id);
															closeDeleteCourseModal(index);
														}}
													/>
												</CustomDialog>
											)}

											{isCourseDeleteModalOpen[index] !== undefined && course.isActive && (
												<CustomDialog
													openModal={isCourseDeleteModalOpen[index]}
													closeModal={() => closeDeleteCourseModal(index)}
													title='Unpublish Course'
													content='You cannot delete published course. Please unpublish it first.'
													maxWidth='sm'>
													<DialogActions>
														<CustomCancelButton
															onClick={() => closeDeleteCourseModal(index)}
															sx={{
																margin: '0 0.5rem 0.5rem 0',
															}}>
															Cancel
														</CustomCancelButton>
													</DialogActions>
												</CustomDialog>
											)}

											{isCourseCloneModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isCourseCloneModalOpen[index]}
													closeModal={() => closeCloneCourseModal(index)}
													title='Clone Course'
													content='Are you sure you want to clone the course?'
													maxWidth='sm'>
													<DialogContent sx={{ mt: '-0.75rem' }}>
														<Typography variant='body2'>Cloning this course will:</Typography>
														<ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
															<li>
																<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																	Create a new course with a copy of all its chapters, lessons, questions, and documents
																</Typography>
															</li>
															<li>
																<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																	Preserve the original course and its content without any changes
																</Typography>
															</li>
															<li>
																<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																	Allow you to safely edit the new course without affecting previous versions
																</Typography>
															</li>
															<li>
																<Typography variant='body2'>Mark the cloned course as unpublished by default</Typography>
															</li>
														</ul>
														<Typography variant='body2' sx={{ marginTop: '1rem' }}>
															You can customize the cloned course before publishing it.
														</Typography>
													</DialogContent>

													<CustomDialogActions
														onCancel={() => closeCloneCourseModal(index)}
														submitBtnText={isCloning ? 'Cloning...' : 'Clone'}
														onSubmit={() => handleClone(course._id, index)}
													/>
												</CustomDialog>
											)}
											<Snackbar
												open={isCourseCloned}
												autoHideDuration={2250}
												anchorOrigin={{ vertical, horizontal }}
												sx={{ mt: '5rem' }}
												onClose={() => setIsCourseCloned(false)}>
												<Alert severity='success' variant='filled' sx={{ width: '100%', color: theme.textColor?.common.main }}>
													Course is cloned successfully!
												</Alert>
											</Snackbar>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={coursesNumberOfPages} page={coursesPageNumber} onChange={handlePageChange} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminCourses;
