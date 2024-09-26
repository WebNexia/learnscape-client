import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import { useParams } from 'react-router-dom';
import { Delete, Edit, Flag } from '@mui/icons-material';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useContext } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';

interface MessageProps {
	message: CommunityMessage;
}

const Message = ({ message }: MessageProps) => {
	const { userId } = useParams();
	const { user } = useContext(UserAuthContext);
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	const isMessageWriter: boolean = userId === message?.userId._id;

	return (
		<Box
			sx={{
				display: 'flex',
				width: '100%',
				minHeight: '5rem',
				border: 'solid lightgray 0.1rem',
				borderBottom: 'none',
				borderRadius: 'none',
				'&:last-child': {
					borderBottom: '0.1rem solid lightgray',
					borderBottomLeftRadius: '0.35rem',
					borderBottomRightRadius: '0.35rem',
				},
				'&:first-child': {
					borderTopLeftRadius: '0.35rem',
					borderTopRightRadius: '0.35rem',
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					alignItems: 'center',
					flex: 1,
					padding: '0.5rem',
					borderRight: 'solid lightgray 0.1rem',
				}}>
				<Box>
					<img src={message?.userId.imageUrl} alt='profile' style={{ height: '2.75rem', width: '2.75rem', borderRadius: '50%' }} />
				</Box>
				<Box>
					<Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
						{message?.userId.username}
					</Typography>
				</Box>
				<Box>
					<Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'gray' }}>
						{formatMessageTime(message?.createdAt)}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 8, padding: '0.5rem' }}>
				<Box>
					<Typography variant='body2' sx={{ lineHeight: 1.7, margin: '0.5rem 0' }}>
						{message?.text}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
					{!isMessageWriter && !isAdmin ? (
						<Tooltip title='Report Message' placement='left'>
							<IconButton
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<Flag fontSize='small' />
							</IconButton>
						</Tooltip>
					) : !isMessageWriter && isAdmin ? (
						<Tooltip title='Delete Message' placement='right'>
							<IconButton
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<Delete fontSize='small' />
							</IconButton>
						</Tooltip>
					) : isMessageWriter ? (
						<Box>
							<Tooltip title='Edit Message' placement='left'>
								<IconButton
									sx={{
										':hover': {
											backgroundColor: 'transparent',
										},
									}}>
									<Edit fontSize='small' />
								</IconButton>
							</Tooltip>
							<Tooltip title='Delete Message' placement='top'>
								<IconButton
									sx={{
										':hover': {
											backgroundColor: 'transparent',
										},
									}}>
									<Delete fontSize='small' />
								</IconButton>
							</Tooltip>
						</Box>
					) : null}
				</Box>
			</Box>
		</Box>
	);
};

export default Message;
