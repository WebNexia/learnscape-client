import React, { useCallback, useMemo } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { SearchUser } from '../interfaces/search';
import { Box, InputAdornment, Typography, CircularProgress } from '@mui/material';
import theme from '../themes';
import { Search } from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';

interface CommunityUserSearchSelectProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (user: SearchUser) => void;
	topicId: string;
	currentUserId?: string;
	placeholder?: string;
	sx?: object;
	listSx?: object;
	disabled?: boolean;
}

const CommunityUserSearchSelect: React.FC<CommunityUserSearchSelectProps> = ({
	value,
	onChange,
	onSelect,
	topicId,
	currentUserId,
	placeholder = 'Search users...',
	sx = {},
	listSx = {},
	disabled = false,
}) => {
	const {
		data: filtered,
		loading,
		error,
		search,
		loadMore,
		pagination,
	} = useSearch<SearchUser>('users', 'community', {
		userRole: 'admin',
		topicId,
	});

	const handleSearch = useCallback(async () => {
		if (value.trim()) {
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

	const filteredUsers = useMemo(() => {
		return filtered.filter((user) => user.firebaseUserId !== currentUserId);
	}, [filtered, currentUserId]);

	const hasResults = filteredUsers.length > 0;
	const showLoadMore = pagination?.hasNextPage && hasResults;

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
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled || loading}
					InputProps={{
						endAdornment: (
							<InputAdornment position='end'>
								{loading ? <CircularProgress size={20} sx={{ mr: '-0.5rem' }} /> : <Search sx={{ mr: '-0.5rem' }} fontSize='small' />}
							</InputAdornment>
						),
						required: false,
					}}
				/>
				<CustomSubmitButton onClick={handleSearch} disabled={loading || !value.trim() || disabled} sx={{ minWidth: 'auto', padding: '0 1rem' }}>
					{loading ? 'Searching...' : 'Search'}
				</CustomSubmitButton>
			</Box>

			{error && (
				<Typography variant='body2' sx={{ color: 'error.main', mt: 1, textAlign: 'center' }}>
					{error}
				</Typography>
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
					{filteredUsers.map((user) => (
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
									'& .username': {
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
								<Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
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
