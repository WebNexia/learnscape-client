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

interface PromoCodeCourseSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (course: SearchCourse) => void;
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
	selectedCourseIds?: string[];
}

const PromoCodeCourseSearchSelect = forwardRef<any, PromoCodeCourseSearchSelectProps>(
	({ value, onChange, onSelect, placeholder = 'Search courses...', sx = {}, listSx = {}, disabled = false, selectedCourseIds = [] }, ref) => {
		const {
			data: filtered,
			loading,
			error,
			search,
			loadMore,
			reset,
			pagination,
		} = useSearch<SearchCourse>('courses', 'events', {
			userRole: 'admin', // Only owner and super-admin can create/edit promoCodes (paymentsAccessCheck on backend)
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
				// Don't clear search input or reset results - keep them open
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
					position: 'relative',

					...sx,
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: theme.palette.secondary.main }}>
					<CustomTextField
						label=''
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						disabled={disabled}
						sx={{
							flex: 1,
							backgroundColor: disabled ? 'transparent' : '#fff',
							...sx,
						}}
						required={false}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Search
										sx={{
											mr: '-0.5rem',
											color: disabled ? 'lightgray' : null,
										}}
									/>
								</InputAdornment>
							),
						}}
					/>
					<CustomSubmitButton
						onClick={handleSearch}
						disabled={!value.trim() || loading || disabled}
						sx={{
							minWidth: 'auto',
							padding: isMobileSize ? '0 0.25rem' : '0 0.5rem',
							marginBottom: '1.1rem',
							marginLeft: '0.25rem',
							marginRight: '-0.5rem',
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						}}>
						{loading ? <CircularProgress size={16} color='inherit' /> : 'Search'}
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
						sx={{
							minWidth: 'auto',
							padding: isMobileSize ? '0 0.25rem' : '0 0.5rem',
							marginBottom: '1.1rem',
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						}}>
						Reset
					</CustomDeleteButton>
				</Box>
				{/* Error Message */}
				{error && <CustomErrorMessage>{error}</CustomErrorMessage>}
				{/* Search Results */}
				{hasSearched && (
					<Box
						sx={{
							position: 'absolute',
							top: '2rem',
							left: 0,
							right: 0,
							zIndex: 1000,
							backgroundColor: theme.bgColor?.common,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: 1,
							boxShadow: 2,
							maxHeight: isMobileSize ? '10rem' : '12rem',
							overflowY: 'auto',
							mt: 1,
							...listSx,
						}}>
						{loading && !hasResults && (
							<Box sx={{ p: 2, textAlign: 'center' }}>
								<CircularProgress size={20} />
								<Typography variant='body2' sx={{ mt: 1 }}>
									Searching courses...
								</Typography>
							</Box>
						)}

						{!loading && !hasResults && hasSearched && (
							<Box sx={{ p: 2, textAlign: 'center' }}>
								<Typography variant='body2' color='text.secondary'>
									No courses found matching "{value}"
								</Typography>
							</Box>
						)}

						{hasResults && (
							<>
								{filteredCourses.map((course) => (
									<Box
										key={course._id}
										sx={{
											'display': 'flex',
											'alignItems': 'center',
											'p': 1,
											'cursor': 'pointer',
											'borderBottom': '1px solid',
											'borderBottomColor': 'divider',
											'&:hover': {
												'backgroundColor': theme.bgColor?.primary,
												'color': '#fff',
												'& .course-title': {
													color: '#fff',
												},
												'& .course-description': {
													color: '#fff',
												},
											},
											'&:last-child': {
												borderBottom: 'none',
											},
										}}
										onClick={() => handleCourseSelect(course)}>
										{/* Course Info */}
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												variant='body2'
												className='course-title'
												sx={{
													fontWeight: 500,
													mb: 0.5,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													fontSize: isMobileSize ? '0.7rem' : '0.8rem',
												}}>
												{truncateText(course.title, 50)}
											</Typography>
										</Box>
									</Box>
								))}

								{/* Load More Button */}
								{showLoadMore && (
									<Box sx={{ p: 1, borderTop: '1px solid', borderTopColor: 'divider' }}>
										<CustomSubmitButton
											onClick={loadMore}
											disabled={loading}
											sx={{
												width: '100%',
												padding: isMobileSize ? '0 0.25rem' : '0 0.5rem',
												marginBottom: '1.1rem',
												fontSize: isMobileSize ? '0.7rem' : '0.8rem',
											}}>
											{loading ? <CircularProgress size={16} color='inherit' /> : 'Load More'}
										</CustomSubmitButton>
									</Box>
								)}
							</>
						)}
					</Box>
				)}
			</Box>
		);
	}
);

PromoCodeCourseSearchSelect.displayName = 'PromoCodeCourseSearchSelect';

export default PromoCodeCourseSearchSelect;
