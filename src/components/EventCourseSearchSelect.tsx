import { useCallback, useContext, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { SearchCourse } from '../interfaces/search';
import { Box, InputAdornment, Typography, CircularProgress } from '@mui/material';
import theme from '../themes';
import { Search } from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import { truncateText } from '../utils/utilText';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomDeleteButton from './forms/customButtons/CustomDeleteButton';
import CustomErrorMessage from './forms/customFields/CustomErrorMessage';
import { useAuth } from '../hooks/useAuth';

interface EventCourseSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (course: SearchCourse) => void;
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
	selectedCourseIds?: string[]; // Array of selected course IDs to exclude from search results
}

const EventCourseSearchSelect = forwardRef<any, EventCourseSearchSelectProps>(
	({ value, onChange, onSelect, placeholder = 'Search courses...', sx = {}, listSx = {}, disabled = false, selectedCourseIds = [] }, ref) => {
		const { hasAdminAccess, isInstructor } = useAuth();

		const {
			data: filtered,
			loading,
			error,
			search,
			loadMore,
			reset,
			pagination,
		} = useSearch<SearchCourse>('courses', 'events', {
			userRole: isInstructor ? 'admin' : hasAdminAccess ? 'admin' : 'admin', // Instructors and admin-level users (admin, owner, super-admin) can search courses
		});

		const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
		const isMobileSize = isSmallScreen || isRotatedMedium;

		// Track if a search has been performed
		const [hasSearched, setHasSearched] = useState(false);

		const handleSearch = useCallback(async () => {
			if (value.trim()) {
				setHasSearched(true);
				await search(value);
			}
		}, [value, search]);

		const handleCourseSelect = useCallback(
			(course: SearchCourse) => {
				onSelect(course);
			},
			[onSelect]
		);

		const filteredCourses = useMemo(() => {
			return filtered?.filter((course) => !selectedCourseIds?.includes(course._id)) || [];
		}, [filtered, selectedCourseIds]);

		const hasResults = filteredCourses && filteredCourses.length > 0;
		const showLoadMore = pagination?.hasNextPage && hasResults;

		// Expose reset function to parent component
		useImperativeHandle(ref, () => ({
			reset: () => {
				reset();
				setHasSearched(false);
			},
		}));

		return (
			<Box
				sx={{
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					mb: hasResults ? '-1rem' : '1.5rem',
					margin: `0 auto ${hasResults ? '-1rem' : '1.5rem'} auto`,
				}}>
				<Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
					<CustomTextField
						sx={{ ...sx, flex: 1 }}
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (!e.target.value.trim()) {
								setHasSearched(false);
							}
						}}
						placeholder={placeholder}
						disabled={disabled || loading}
						InputProps={{
							onKeyDown: (e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									e.stopPropagation();
									if (value.trim() && !disabled && !loading) {
										handleSearch();
									}
								}
							},
							endAdornment: (
								<InputAdornment position='end'>
									{loading ? (
										<CircularProgress size={20} sx={{ mr: '-0.5rem', fontSize: isMobileSize ? '1rem' : undefined }} />
									) : (
										<Search sx={{ mr: '-0.5rem', fontSize: isMobileSize ? '1rem' : undefined }} fontSize='small' />
									)}
								</InputAdornment>
							),
							required: false,
						}}
					/>
					<CustomSubmitButton
						onClick={handleSearch}
						disabled={loading || !value.trim() || disabled}
						sx={{
							minWidth: 'auto',
							padding: '0 0.5rem',
							marginBottom: '1.1rem',
							marginLeft: '0.25rem',
							marginRight: '-0.5rem',
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						}}>
						{loading ? 'Searching...' : 'Search'}
					</CustomSubmitButton>
					<CustomDeleteButton
						onClick={(e) => {
							if (e) {
								e.preventDefault();
								e.stopPropagation();
							}
							onChange('');
							reset();
							setHasSearched(false);
						}}
						sx={{ minWidth: 'auto', padding: '0 0.5rem', marginBottom: '1.1rem', fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
						Reset
					</CustomDeleteButton>
				</Box>

				{error && (
					<Typography variant='body2' sx={{ color: 'error.main', mt: 1, textAlign: 'center' }}>
						{error}
					</Typography>
				)}

				{hasResults ? (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							alignItems: 'flex-start',
							width: isMobileSize ? '60%' : '70%',
							maxHeight: '15rem',
							overflow: 'auto',
							margin: '-0.8rem 0 1.5rem -8rem',
							border: 'solid 0.05rem lightgray',
							mb: showLoadMore ? '1rem' : '3rem',
							...listSx,
						}}>
						{filteredCourses?.map((course) => (
							<Box
								key={course._id}
								sx={{
									'display': 'flex',
									'justifyContent': 'flex-start',
									'alignItems': 'center',
									'width': '100%',
									'padding': '0.5rem',
									'transition': '0.5s',
									'borderRadius': '0.25rem',
									':hover': {
										'backgroundColor': theme.bgColor?.primary,
										'color': '#fff',
										'cursor': 'pointer',
										'& .course-title': {
											color: '#fff',
										},
										'& .course-description': {
											color: '#fff',
										},
									},
								}}
								onClick={() => handleCourseSelect(course)}>
								<Box>
									<Typography className='course-title' variant='body2' sx={{ fontSize: '0.8rem' }}>
										{truncateText(course.title, 30)}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				) : (
					// Show "No courses found" message when there are no results
					hasSearched &&
					value.trim() &&
					!loading && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								width: '70%',
								paddingTop: '0.5rem',
								margin: '-0.8rem 0 1.5rem -8rem',
								border: 'none',
								backgroundColor: 'transparent',
							}}>
							<CustomErrorMessage sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>No courses found matching your search.</CustomErrorMessage>
						</Box>
					)
				)}

				{showLoadMore && (
					<Box sx={{ textAlign: 'center', mt: 1 }}>
						<CustomSubmitButton onClick={loadMore} disabled={loading} sx={{ fontSize: '0.8rem' }}>
							{loading ? 'Loading...' : 'Load More'}
						</CustomSubmitButton>
					</Box>
				)}
			</Box>
		);
	}
);

export default EventCourseSearchSelect;
