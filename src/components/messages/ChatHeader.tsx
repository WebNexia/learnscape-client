import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Person, PersonOff, Edit } from '@mui/icons-material';
import { Chat as ChatType } from '../../pages/Messages';

interface ChatHeaderProps {
	activeChat: ChatType | null;
	user: any;
	isMobileSize: boolean;
	isVerySmallScreen: boolean;
	isBlockingUser: boolean;
	blockedUsers: string[];
	getChatDisplayName: (chat: ChatType) => string;
	getChatDisplayImage: (chat: ChatType) => string;
	isGroupChat: (chat: ChatType) => boolean;
	onBlockUnblockUser: (firebaseUserId: string) => void;
	onEditGroupChat?: () => void;
	onViewGroupMembers?: () => void;
}

const ChatHeader = ({
	activeChat,
	user,
	isMobileSize,
	isVerySmallScreen,
	isBlockingUser,
	blockedUsers,
	getChatDisplayName,
	getChatDisplayImage,
	isGroupChat,
	onBlockUnblockUser,
	onEditGroupChat,
	onViewGroupMembers,
}: ChatHeaderProps) => {
	if (!activeChat) return null;

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				borderBottom: '0.04rem solid lightgray',
				width: '100%',
				height: '4rem',
				flexShrink: 0,
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', margin: isMobileSize ? '0 0.5rem' : '0 1.5rem', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flex: 3 }}>
						<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
							<img
								src={getChatDisplayImage(activeChat) || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
								alt='profile_img'
								style={{
									height: isMobileSize ? '2.25rem' : '3rem',
									width: isMobileSize ? '2.25rem' : '3rem',
									borderRadius: '100%',
									border: 'solid lightgray 0.1rem',
								}}
							/>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{getChatDisplayName(activeChat)}
								{isGroupChat(activeChat) && (
									<Typography
										variant='caption'
										sx={{
											color: 'gray',
											fontSize: isMobileSize ? '0.6rem' : '0.7rem',
											marginLeft: '0.5rem',
											cursor: 'pointer',
											textDecoration: 'underline',
										}}
										onClick={onViewGroupMembers}>
										({activeChat.participants.length} members)
									</Typography>
								)}
							</Typography>
						</Box>
						{isGroupChat(activeChat) && user?.role === 'admin' && onEditGroupChat && (
							<Tooltip title='Edit Group' placement='top' arrow>
								<IconButton size='small' onClick={onEditGroupChat} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
									<Edit fontSize='small' />
								</IconButton>
							</Tooltip>
						)}
					</Box>
					{!isGroupChat(activeChat) && (
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 2 }}>
							{isBlockingUser && (
								<Typography sx={{ fontSize: isMobileSize ? '0.6rem' : '0.75rem' }}>
									{isVerySmallScreen ? 'Blocked' : 'You have blocked this user'}
								</Typography>
							)}
							{activeChat.participants
								?.filter((participant) => participant.firebaseUserId !== user?.firebaseUserId)
								?.map((otherParticipant) => {
									if (otherParticipant.role !== 'admin') {
										const isBlocked = blockedUsers.includes(otherParticipant.firebaseUserId);

										return (
											<IconButton
												key={otherParticipant.firebaseUserId}
												size='small'
												onClick={() => onBlockUnblockUser(otherParticipant.firebaseUserId)}
												sx={{ ':hover': { backgroundColor: 'transparent' }, 'marginLeft': '0.5rem' }}>
												{isBlocked ? (
													<Tooltip title='Unblock User' placement='top' arrow>
														<PersonOff color='error' fontSize={isMobileSize ? 'small' : 'medium'} />
													</Tooltip>
												) : (
													<Tooltip title='Block User' placement='top' arrow>
														<Person color='success' fontSize={isMobileSize ? 'small' : 'medium'} />
													</Tooltip>
												)}
											</IconButton>
										);
									}
								})}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default ChatHeader;
