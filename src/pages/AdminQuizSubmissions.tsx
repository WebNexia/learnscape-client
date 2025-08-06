import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import theme from '../themes';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { truncateText } from '../utils/utilText';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const AdminQuizSubmissions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { courses } = useContext(CoursesContext);

	const mappedCourses = courses.map((course) => ({ courseId: course._id, courseTitle: course.title }));

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		quizSubmissions,
		sortQuizSubmissionsData,
		totalItems,
		loadedPages,
		quizSubmissionsPageNumber,
		setQuizSubmissionsPageNumber,
		fetchMoreQuizSubmissions,
	} = useContext(QuizSubmissionsContext);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<QuizSubmission[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displaySubmissions = isSearchActive ? searchResults : quizSubmissions;

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const submissionsNumberOfPages = isSearchActive ? Math.ceil(displaySubmissions.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedSubmissions = displaySubmissions.slice((quizSubmissionsPageNumber - 1) * pageSize, quizSubmissionsPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof QuizSubmission>('userName');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuizSubmission) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuizSubmissionsData(property, isAsc ? 'desc' : 'asc');
	};

	useEffect(() => {
		setQuizSubmissionsPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		setQuizSubmissionsPageNumber(newPage);

		// Only fetch more data if not searching
		if (!isSearchActive) {
			// Check if we need to fetch more data
			const requiredRecords = newPage * pageSize;
			if (quizSubmissions.length < requiredRecords && newPage <= submissionsNumberOfPages) {
				// Calculate which batch of 150 records we need (context fetches 150 at a time)
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
					await fetchMoreQuizSubmissions(startBatch, endBatch);
				}
			}
		}
	};

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setQuizSubmissionsPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setQuizSubmissionsPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '150',
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

			console.log('Search params:', { searchValue, filterValue, params: params.toString() });
			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params}`);
			console.log('Search response:', response.data.data.length, 'results');
			setSearchResults(response.data.data);
		} catch (error) {
			console.error('Search error:', error);
			// Reset search state on error
			setIsSearchActive(false);
			setSearchResults([]);
		}
	};

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue && !filterValue;

	return (
		<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					width: '100%',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
				}}>
				<Box sx={{ display: 'flex', width: '60%' }}>
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
									Filter Submissions
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
									All Submissions
								</MenuItem>
								<MenuItem
									value='checked'
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Checked
								</MenuItem>
								<MenuItem
									value='unchecked'
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Unchecked
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
									------ Filter by Course ------
								</MenuItem>
								{mappedCourses.map((course) => (
									<MenuItem
										value={course.courseId}
										key={course.courseId}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{truncateText(course.courseTitle, 25)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<CustomTextField
						value={searchValue}
						placeholder='Search in Student Username and Quiz Name'
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
						sx={{
							'backgroundColor': '#fff',
							'& .MuiInputBase-input::placeholder': {
								fontSize: '0.75rem', // Change this to your desired font size
							},
						}}
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
						sx={{
							height: isVerySmallScreen ? '1.75rem' : '2rem',
							marginLeft: '0.5rem',
							fontSize: isMobileSize ? '0.7rem' : undefined,
						}}
						type='button'
						disabled={isSearchDisabled}
						onClick={handleSearch}>
						Search
					</CustomSubmitButton>
					<CustomDeleteButton
						sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'
						onClick={() => {
							setSearchValue('');
							setFilterValue('');
							setSearchResults([]);
							setIsSearchActive(false);
							setQuizSubmissionsPageNumber(1);
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
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'userName', label: isVerySmallScreen ? 'Username' : 'Student Username' },
							{ key: 'lessonName', label: isVerySmallScreen ? 'Quiz' : 'Quiz Name' },
							{ key: 'courseName', label: isVerySmallScreen ? 'Course' : 'Course Name' },
							{ key: 'isChecked', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedSubmissions &&
							paginatedSubmissions?.map((submission: QuizSubmission) => {
								return (
									<TableRow key={submission._id}>
										<CustomTableCell value={submission.userName} />
										<CustomTableCell value={submission.lessonName} />
										<CustomTableCell value={submission.courseName} />
										<CustomTableCell value={submission.isChecked ? 'Checked' : 'Unchecked'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Check Quiz'
												onClick={() => {
													window.open(
														`/admin/check-submission/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
														'_blank'
													);
													window.scrollTo({ top: 0, behavior: 'smooth' });
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={submissionsNumberOfPages} page={quizSubmissionsPageNumber} onChange={handlePageChange} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminQuizSubmissions;
