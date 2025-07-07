import React, { useEffect, useState } from 'react';
import CustomTextField from './forms/customFields/CustomTextField';
import { filterUsers } from '../utils/userSearch';
import { User } from '../interfaces/user';
import { Box, InputAdornment, Typography } from '@mui/material';
import theme from '../themes';
import { Search } from '@mui/icons-material';

interface UserSearchSelectProps {
	users: User[];
	value: string;
	onChange: (value: string) => void;
	onSelect: (user: User) => void;
	currentUserId?: string;
	placeholder?: string;
	sx?: object;
	listSx?: object;
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
	users,
	value,
	onChange,
	onSelect,
	currentUserId,
	placeholder = 'Search users...',
	sx = {},
	listSx = {},
}) => {
	const [filtered, setFiltered] = useState<User[]>([]);

	useEffect(() => {
		if (!value.trim()) {
			setFiltered([]); // Hide the list when input is empty
		} else {
			setFiltered(filterUsers(users, value));
		}
	}, [users, value]);

	return (
		<Box
			sx={{
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				mb: filtered.length === 0 ? '1.5rem' : '-1rem',
				margin: `0 auto ${filtered.length === 0 ? '1.5rem' : '-1rem'} auto`,
			}}>
			<CustomTextField
				sx={sx}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				InputProps={{
					endAdornment: (
						<InputAdornment position='end'>
							<Search sx={{ mr: '-0.5rem' }} fontSize='small' />
						</InputAdornment>
					),
					required: false,
				}}
			/>
			{filtered.length > 0 && (
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
					{filtered
						.filter((user) => user.firebaseUserId !== currentUserId)
						.map((user) => (
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
								onClick={() => onSelect(user)}>
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
								</Box>
							</Box>
						))}
				</Box>
			)}
		</Box>
	);
};

export default UserSearchSelect;
