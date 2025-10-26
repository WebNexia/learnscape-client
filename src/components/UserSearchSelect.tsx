import React, { useCallback, useContext, useMemo, useEffect, useState } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { SearchUser } from '../interfaces/search';
import { Box, InputAdornment, Typography, CircularProgress, Tooltip } from '@mui/material';
import theme from '../themes';
import { Search, DoNotDisturbAlt } from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from './forms/customButtons/CustomDeleteButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomErrorMessage from './forms/customFields/CustomErrorMessage';

interface UserSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (user: SearchUser) => void;
	currentUserId?: string;
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
	context?: 'messages' | 'community' | 'events';
	userRole?: 'admin' | 'learner';
	fromGroupChatSettings?: boolean;
	fromEditInstructorDialog?: boolean;
	allowCurrentUser?: boolean;
	excludeUserIds?: string[];
	blockedUsers?: string[];
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
	value,
	onChange,
	onSelect,
	currentUserId,
	placeholder = 'Search users...',
	sx = {},
	listSx = {},
	disabled = false,
	context = 'messages',
	userRole = 'admin',
	fromGroupChatSettings = false,
	fromEditInstructorDialog = false,
	allowCurrentUser = false,
	excludeUserIds = [],
	blockedUsers = [],
}) => {
	const {
		data: filtered,
		loading,
		error,
		search,
		loadMore,
		reset,
		pagination,
	} = useSearch<SearchUser>('users', context, {
		userRole,
		allowCurrentUser,
	});

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [noUserFound, setNoUserFound] = useState<boolean>(false);
	const [hasSearched, setHasSearched] = useState<boolean>(false);

	const handleSearch = useCallback(async () => {
		if (value.trim()) {
			setNoUserFound(false); // Reset noUserFound when starting new search
			setHasSearched(true); // Mark that a search has been performed
			await search(value);
		}
	}, [value, search]);

	// Reset hasSearched when search is reset
	useEffect(() => {
		if (!value.trim()) {
			setHasSearched(false);
		}
	}, [value]);

	// Refresh search results when excludeUserIds changes (for group chat scenarios)
	useEffect(() => {
		if (value.trim() && filtered && filtered.length > 0 && !loading) {
			// If we have search results but they're all filtered out, try to load more
			const visibleResults =
				filtered?.filter((user) => user.firebaseUserId !== currentUserId && !excludeUserIds?.includes(user.firebaseUserId)) || [];
			if (visibleResults && visibleResults.length === 0 && pagination?.hasNextPage) {
				// All current results are filtered out, load more to get new results
				loadMore();
			}
		}
	}, [excludeUserIds, value, filtered.length, currentUserId, pagination?.hasNextPage, loadMore, loading]);

	// Update noUserFound state based on search results
	useEffect(() => {
		if (value.trim() && !loading && hasSearched) {
			// Check if we have any search results
			if (filtered && filtered.length === 0 && !error) {
				setNoUserFound(true);
			} else if (filtered && filtered.length > 0) {
				// Check if all results are filtered out
				const visibleResults =
					filtered?.filter((user) => user.firebaseUserId !== currentUserId && !excludeUserIds?.includes(user.firebaseUserId)) || [];
				setNoUserFound(visibleResults && visibleResults.length === 0);
			} else {
				setNoUserFound(false);
			}
		} else {
			setNoUserFound(false);
		}
	}, [value, filtered, loading, error, currentUserId, excludeUserIds, hasSearched]);

	const handleUserSelect = useCallback(
		(user: SearchUser) => {
			// Allow selection of all users, including blocked ones
			// Blocking will be handled in the chat interface itself
			onSelect(user);
			if (!fromGroupChatSettings) {
				onChange(''); // Clear search input after selection
				reset(); // Reset search results
				setNoUserFound(false);
				setHasSearched(false);
			}
			if (fromEditInstructorDialog) {
				onChange(''); // Clear search input after selection
				reset(); // Reset search results
				setNoUserFound(false);
				setHasSearched(false);
			}
		},
		[onSelect, onChange, fromGroupChatSettings, fromEditInstructorDialog, reset]
	);

	const filteredUsers = useMemo(() => {
		return (
			filtered?.filter(
				(user) => (fromEditInstructorDialog ? true : user.firebaseUserId !== currentUserId) && !excludeUserIds?.includes(user.firebaseUserId)
			) || []
		);
	}, [filtered, currentUserId, excludeUserIds, fromEditInstructorDialog]);

	const hasResults = filteredUsers && filteredUsers.length > 0;
	// Show Load More if there are more pages available, regardless of current filtered results
	const showLoadMore = pagination?.hasNextPage && value.trim();

	// Add a "Refresh Search" button when all results are filtered out
	const allResultsFiltered = value.trim() && filtered && filtered.length > 0 && !hasResults && pagination?.hasNextPage;

	return (
		<Box
			sx={{
				width: fromGroupChatSettings ? '100%' : '90%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				mb: hasResults ? '-1rem' : '1.5rem',
				margin: `0 auto ${hasResults ? '-1rem' : '1.5rem'} auto`,
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					width: '100%',
					alignItems: 'center',
					justifyContent: isMobileSize ? 'center' : 'space-between',
				}}>
				<Box sx={{ width: '100%' }}>
					<CustomTextField
						sx={{ ...sx, flex: 1, width: isMobileSize ? '100%' : '100%' }}
						value={value}
						onChange={useCallback(
							(e: React.ChangeEvent<HTMLInputElement>) => {
								const newValue = e.target.value;
								onChange(newValue);
								if (!newValue.trim()) {
									reset();
									setNoUserFound(false);
									setHasSearched(false);
								}
							},
							[onChange, reset]
						)}
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
							inputProps: {
								maxLength: 50,
							},
							endAdornment: (
								<InputAdornment position='end'>
									{loading ? <CircularProgress size={20} sx={{ mr: '-0.5rem' }} /> : <Search sx={{ mr: '-0.5rem' }} fontSize='small' />}
								</InputAdornment>
							),
							required: false,
						}}
					/>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
					<CustomSubmitButton
						onClick={handleSearch}
						disabled={loading || !value.trim() || disabled}
						sx={{ minWidth: 'auto', padding: '0 0.5rem', marginBottom: '1.1rem', marginLeft: '1rem', fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
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
							setNoUserFound(false);
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
			</Box>

			{error && (
				<Typography variant='body2' sx={{ color: 'error.main', mt: 1, textAlign: 'center' }}>
					{error}
				</Typography>
			)}

			{/* Show "No users found" message */}
			{noUserFound && value.trim() && !loading && !error && hasSearched && (
				<Box sx={{ textAlign: 'center', margin: '1rem 0 0rem 0' }}>
					<CustomErrorMessage sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>No users found matching your search</CustomErrorMessage>
				</Box>
			)}

			{/* Show message when all results are filtered out but more pages exist */}
			{allResultsFiltered && (
				<Box sx={{ textAlign: 'center', margin: '1rem 0' }}>
					<Typography variant='body2' sx={{ color: 'text.secondary', mb: 1 }}>
						All current results are already selected. Load more to see additional users.
					</Typography>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
						<CustomSubmitButton onClick={loadMore} disabled={loading} sx={{ fontSize: '0.8rem' }}>
							{loading ? 'Loading...' : 'Load More'}
						</CustomSubmitButton>
						<CustomSubmitButton
							onClick={() => {
								reset();
								handleSearch();
							}}
							disabled={loading}
							sx={{ fontSize: '0.8rem' }}>
							Refresh Search
						</CustomSubmitButton>
					</Box>
				</Box>
			)}

			{hasResults && value.trim() && filteredUsers && filteredUsers.length > 0 && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'flex-start',
						width: '100%',
						maxHeight: '16rem',
						overflow: 'auto',
						margin: '-0.8rem 0 1.5rem -5.5rem',
						border: 'solid 0.05rem lightgray',
						mb: showLoadMore ? '1rem' : '2rem',
						marginLeft: 0,

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
								'padding': isMobileSize ? '0.25rem' : '0.5rem',
								'transition': '0.5s',
								'borderRadius': '0.25rem',
								'cursor': 'pointer',
								'opacity': blockedUsers?.includes(user.firebaseUserId) ? 0.6 : 1,
								':hover': {
									'backgroundColor': theme.bgColor?.primary,
									'color': '#fff',
									'cursor': 'pointer',
									'& .username, & .email, & .name': {
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
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
								<Box>
									<Typography className='username' variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
										{user.username}{' '}
										<span style={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
											{userRole === 'admin' ? `(${user.firstName} ${user.lastName})` : ''}
										</span>
									</Typography>
									{userRole === 'admin' ? (
										<Typography className='email' variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
											{user.email}
										</Typography>
									) : (
										<Typography className='name' variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
											{user.firstName} {user.lastName}
										</Typography>
									)}
								</Box>
								{blockedUsers?.includes(user.firebaseUserId) && (
									<Tooltip title='This user is blocked' placement='top' arrow>
										<DoNotDisturbAlt
											sx={{
												color: 'error.main',
												fontSize: isMobileSize ? '1rem' : '1.2rem',
												marginLeft: '0.5rem',
											}}
										/>
									</Tooltip>
								)}
							</Box>
						</Box>
					))}
				</Box>
			)}

			{showLoadMore && !allResultsFiltered && (
				<Box sx={{ textAlign: 'center', margin: '1rem 0 2rem 0' }}>
					<CustomSubmitButton onClick={loadMore} disabled={loading} sx={{ fontSize: '0.8rem' }}>
						{loading ? 'Loading...' : 'Load More'}
					</CustomSubmitButton>
				</Box>
			)}
		</Box>
	);
};

export default UserSearchSelect;
