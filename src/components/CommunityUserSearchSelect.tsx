import React, { useCallback, useContext, useMemo, useState } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { SearchUser } from '../interfaces/search';
import { Box, InputAdornment, Typography, CircularProgress } from '@mui/material';
import theme from '../themes';
import { Search } from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomDeleteButton from './forms/customButtons/CustomDeleteButton';
import { useAuth } from '../hooks/useAuth';

interface CommunityUserSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (user: SearchUser) => void;
	onReset?: () => void;
	onSearchChange?: (searchValue: string) => void;
	topicId: string;
	currentUserId?: string;
	excludeUsernames?: string[];
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
}

const CommunityUserSearchSelect: React.FC<CommunityUserSearchSelectProps> = ({
	value,
	onChange,
	onSelect,
	onReset,
	onSearchChange,
	topicId,
	currentUserId,
	excludeUsernames = [],
	placeholder = 'Search users...',
	sx = {},
	listSx = {},
	disabled = false,
}) => {
	const { user } = useAuth();

	// Determine userRole based on actual user role - memoized to prevent hook recreation
	const userRole = useMemo(() => {
		if (!user) return 'learner'; // fallback
		switch (user.role) {
			case 'admin':
			case 'super_admin':
				return 'admin';
			case 'instructor':
				return 'instructor';
			default:
				return 'learner';
		}
	}, [user?.role]);

	const {
		data: filtered,
		loading,
		error,
		search,
		loadMore,
		reset,
		pagination,
	} = useSearch<SearchUser>('users', 'community', {
		userRole,
		topicId,
	});

	const handleSearch = useCallback(async () => {
		if (value.trim()) {
			setNoUserFound(false); // Reset noUserFound when starting new search
			setHasSearched(true); // Mark that a search has been performed
			await search(value);
		}
	}, [value, search]);

	const handleUserSelect = useCallback(
		(user: SearchUser) => {
			onSelect(user);
			onChange(''); // Clear search input after selection
		},
		[onSelect, onChange]
	);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [noUserFound, setNoUserFound] = useState<boolean>(false);
	const [hasSearched, setHasSearched] = useState<boolean>(false);

	const filteredUsers = useMemo(() => {
		return filtered?.filter((user) => user.firebaseUserId !== currentUserId && !excludeUsernames?.includes(user.username)) || [];
	}, [filtered, currentUserId, excludeUsernames]);

	const hasResults = filteredUsers && filteredUsers.length > 0;
	const showLoadMore = pagination?.hasNextPage && hasResults;

	// Reset hasSearched when search is reset
	React.useEffect(() => {
		if (!value.trim()) {
			setHasSearched(false);
		}
	}, [value]);

	// Update noUserFound state based on search results
	React.useEffect(() => {
		if (value.trim() && !loading && hasSearched) {
			// Check if we have any search results
			if (filtered && filtered.length === 0 && !error) {
				setNoUserFound(true);
			} else if (filtered && filtered.length > 0) {
				// Check if all results are filtered out
				const visibleResults = filtered?.filter((user) => user.firebaseUserId !== currentUserId) || [];
				setNoUserFound(visibleResults && visibleResults.length === 0);
			} else {
				setNoUserFound(false);
			}
		} else {
			setNoUserFound(false);
		}
	}, [value, filtered.length, loading, hasSearched, error, currentUserId]);

	return (
		<Box
			sx={{
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				mb: hasResults ? '-1rem' : '1.5rem',
				margin: `0 auto ${hasResults ? '-1rem' : '1.5rem'} auto`,
				padding: '0.5rem',
			}}>
			<Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
				<CustomTextField
					sx={{ ...sx, flex: 1 }}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						onSearchChange?.(e.target.value);
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
								{loading ? <CircularProgress size={20} sx={{ mr: '-0.5rem' }} /> : <Search sx={{ mr: '-0.5rem' }} fontSize='small' />}
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
						marginLeft: '0.5rem',
						fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						marginRight: '-0.5rem',
					}}>
					{loading ? 'Searching...' : 'Search'}
				</CustomSubmitButton>
				<CustomDeleteButton
					onClick={() => {
						onChange('');
						reset();
						onReset?.();
					}}
					sx={{
						minWidth: 'auto',
						padding: isMobileSize ? '0 0.25rem' : '0 0.5rem',
						marginBottom: '1.1rem',
						fontSize: isMobileSize ? '0.7rem' : '0.8rem',
					}}>
					Close
				</CustomDeleteButton>
			</Box>

			{error && (
				<Typography variant='body2' sx={{ color: 'error.main', mt: 1, textAlign: 'center' }}>
					{error}
				</Typography>
			)}

			{/* Show "No users found" message */}
			{noUserFound && value.trim() && !loading && !error && hasSearched && (
				<Box sx={{ textAlign: 'center', margin: '1rem 0' }}>
					<Typography variant='body2' sx={{ color: 'text.secondary', fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
						No users found matching your search.
					</Typography>
				</Box>
			)}

			{hasResults && (
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
								<Typography className='username' variant='body2' sx={{ fontSize: '0.8rem' }}>
									{user.username}
								</Typography>
								<Typography className='email' variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
									{user.email}
								</Typography>
							</Box>
						</Box>
					))}
				</Box>
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
};

export default CommunityUserSearchSelect;
