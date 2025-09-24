import { useCallback, useContext, useMemo, forwardRef, useImperativeHandle, useState } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { SearchUser } from '../interfaces/search';
import { Box, InputAdornment, Typography, CircularProgress } from '@mui/material';
import theme from '../themes';
import { Search } from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomDeleteButton from './forms/customButtons/CustomDeleteButton';
import CustomErrorMessage from './forms/customFields/CustomErrorMessage';

interface EventInstructorSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (user: SearchUser) => void;
	currentUserId?: string;
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
	selectedUserIds?: string[]; // Array of selected user IDs to exclude from search results
}

const EventInstructorSearchSelect = forwardRef<any, EventInstructorSearchSelectProps>(
	({ value, onChange, onSelect, placeholder = 'Search instructors...', listSx = {}, disabled = false, selectedUserIds = [], sx = {} }, ref) => {
		const { user } = useContext(UserAuthContext);

		const {
			data: filtered,
			loading,
			error,
			search,
			loadMore,
			reset,
			pagination,
		} = useSearch<SearchUser>('users', 'events', {
			userRole: 'admin', // Only admins can search instructors
			allowCurrentUser: false, // Never include current user in instructor search
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

		const handleUserSelect = useCallback(
			(user: SearchUser) => {
				onSelect(user);
			},
			[onSelect]
		);

		const filteredUsers = useMemo(() => {
			let currentFiltered = filtered || [];

			// Exclude already selected users
			currentFiltered = currentFiltered.filter((user) => !selectedUserIds?.includes(user._id));

			return currentFiltered;
		}, [filtered, selectedUserIds, user, value]);

		const hasResults = filteredUsers && filteredUsers.length > 0;
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
					margin: `0 auto ${hasResults ? '-1rem' : '-0.5rem'} auto`,
				}}>
				<Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center', mt: '0.5rem' }}>
					<CustomTextField
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (!e.target.value.trim()) {
								setHasSearched(false);
							}
						}}
						placeholder={placeholder}
						disabled={disabled || loading}
						sx={{ ...sx, flex: 1 }}
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
									{loading ? <CircularProgress size={20} sx={{ mr: '-0.5rem' }} /> : <Search sx={{ mr: '-0.5rem' }} fontSize='small' />}
								</InputAdornment>
							),
							required: false,
						}}
					/>
					<CustomSubmitButton
						onClick={handleSearch}
						disabled={disabled || !value.trim() || loading}
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
							alignItems: 'flex-start',
							width: isMobileSize ? '60%' : '70%',
							maxHeight: '15rem',
							overflow: 'auto',
							margin: '-0.8rem 0 1.5rem -8rem',
							border: 'solid 0.05rem lightgray',
							mb: showLoadMore ? '1rem' : '2rem',
							...listSx,
						}}>
						{filteredUsers?.map((user) => (
							<Box
								key={user.firebaseUserId}
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
										'& .username, & .email': {
											color: '#fff',
										},
									},
								}}
								onClick={() => handleUserSelect(user)}>
								<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
									<img
										src={user.imageUrl}
										alt='profile_img'
										style={{
											height: '2rem',
											width: '2rem',
											borderRadius: '100%',
											border: 'solid lightgray 0.1rem',
										}}
									/>
								</Box>
								<Box>
									<Typography className='username' variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
										{user.username}{' '}
										<span style={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: 'text.secondary' }}>
											{user.firstName && user.lastName && `(${user.firstName} ${user.lastName})`}
										</span>
									</Typography>
									<Typography className='email' variant='caption' sx={{ fontSize: isMobileSize ? '0.6rem' : '0.7rem', color: 'text.secondary' }}>
										{user.email}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				) : (
					// Show "No instructors found" message when there are no results
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
							<CustomErrorMessage sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
								No instructors found matching your search.
							</CustomErrorMessage>
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

EventInstructorSearchSelect.displayName = 'EventInstructorSearchSelect';

export default EventInstructorSearchSelect;
