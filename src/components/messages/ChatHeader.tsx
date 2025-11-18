import { Box, IconButton, Tooltip, Typography, Menu, MenuItem, DialogContent } from '@mui/material';
import { Person, PersonOff, Edit, FileDownload, Info } from '@mui/icons-material';
import { Chat as ChatType } from '../../pages/Messages';
import { useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { useAuth } from '../../hooks/useAuth';

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
	onDownloadChatHistoryAsPDF?: () => void;
	onDownloadChatHistoryAsTXT?: () => void;
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
	onDownloadChatHistoryAsPDF,
	onDownloadChatHistoryAsTXT,
	onEditGroupChat,
	onViewGroupMembers,
}: ChatHeaderProps) => {
	const { hasAdminAccess } = useAuth();
	const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
	const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
	const [userToBlock, setUserToBlock] = useState<string>('');
	const [isBlocking, setIsBlocking] = useState(false);
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);

	const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setDownloadMenuAnchor(event.currentTarget);
	};

	const handleDownloadMenuClose = () => {
		setDownloadMenuAnchor(null);
	};

	const handleDownloadPDF = () => {
		onDownloadChatHistoryAsPDF?.();
		handleDownloadMenuClose();
	};

	const handleDownloadTXT = () => {
		onDownloadChatHistoryAsTXT?.();
		handleDownloadMenuClose();
	};

	const handleBlockUnblockClick = (firebaseUserId: string) => {
		const isCurrentlyBlocked = blockedUsers?.includes(firebaseUserId) || false;
		setUserToBlock(firebaseUserId);
		setIsBlocking(!isCurrentlyBlocked);
		setBlockConfirmOpen(true);
	};

	const handleConfirmBlockUnblock = () => {
		onBlockUnblockUser(userToBlock);
		setBlockConfirmOpen(false);
		setUserToBlock('');
	};

	const handleCancelBlockUnblock = () => {
		setBlockConfirmOpen(false);
		setUserToBlock('');
	};

	if (!activeChat) return null;

	return (
		<>
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
										// Determine if current user can block this participant
										const canBlock =
											(hasAdminAccess &&
												otherParticipant.role !== 'admin' &&
												otherParticipant.role !== 'owner' &&
												otherParticipant.role !== 'super-admin') ||
											(user?.role === 'instructor' && otherParticipant.role === 'learner');

										if (canBlock) {
											const isBlocked = blockedUsers?.includes(otherParticipant.firebaseUserId) || false;

											return (
												<IconButton
													key={otherParticipant.firebaseUserId}
													size='small'
													onClick={() => handleBlockUnblockClick(otherParticipant.firebaseUserId)}
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
								{/* Download Menu for 1-1 Chats - positioned after block button */}
								{(onDownloadChatHistoryAsPDF || onDownloadChatHistoryAsTXT) && (
									<Tooltip title='Download Chat History' placement='top' arrow>
										<IconButton
											size='small'
											onClick={handleDownloadMenuOpen}
											sx={{ ':hover': { backgroundColor: 'transparent' }, 'marginLeft': '0.5rem' }}>
											<FileDownload fontSize='small' />
										</IconButton>
									</Tooltip>
								)}
								{/* Info Dialog for 1-1 Chats */}
								<Tooltip title='Chat History Info' placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => setInfoDialogOpen(true)}
										sx={{ ':hover': { backgroundColor: 'transparent' }, 'marginLeft': '0.5rem' }}>
										<Info fontSize='small' color='action' />
									</IconButton>
								</Tooltip>
							</Box>
						)}
						{isGroupChat(activeChat) && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								{/* Download Menu for Group Chats */}
								{(onDownloadChatHistoryAsPDF || onDownloadChatHistoryAsTXT) && (
									<Tooltip title='Download Chat History' placement='top' arrow>
										<IconButton size='small' onClick={handleDownloadMenuOpen} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
											<FileDownload fontSize='small' />
										</IconButton>
									</Tooltip>
								)}
								{(hasAdminAccess || (user?.role === 'instructor' && activeChat.createdBy === user?.firebaseUserId)) && onEditGroupChat && (
									<Tooltip title='Edit Group' placement='top' arrow>
										<IconButton size='small' onClick={onEditGroupChat} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
											<Edit fontSize='small' />
										</IconButton>
									</Tooltip>
								)}
								{/* Info Dialog for Group Chats */}
								<Tooltip title='Chat History Info' placement='top' arrow>
									<IconButton size='small' onClick={() => setInfoDialogOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
										<Info fontSize='small' color='action' />
									</IconButton>
								</Tooltip>
							</Box>
						)}
					</Box>
				</Box>
			</Box>

			{/* Download Menu */}
			<Menu
				anchorEl={downloadMenuAnchor}
				open={Boolean(downloadMenuAnchor)}
				onClose={handleDownloadMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}>
				{onDownloadChatHistoryAsPDF && (
					<MenuItem onClick={handleDownloadPDF}>
						<FileDownload sx={{ mr: 1 }} fontSize='small' />
						<Typography variant='body2'>Download as PDF</Typography>
					</MenuItem>
				)}
				{onDownloadChatHistoryAsTXT && (
					<MenuItem onClick={handleDownloadTXT}>
						<FileDownload sx={{ mr: 1 }} fontSize='small' />
						<Typography variant='body2'>Download as TXT</Typography>
					</MenuItem>
				)}
			</Menu>

			{/* Block/Unblock Confirmation Dialog */}
			<CustomDialog
				openModal={blockConfirmOpen}
				closeModal={handleCancelBlockUnblock}
				maxWidth='xs'
				title={isBlocking ? 'Block User' : 'Unblock User'}>
				<DialogContent>
					<Typography variant='body2' sx={{ mb: 2 }}>
						{isBlocking ? 'Are you sure you want to block this user?' : 'Are you sure you want to unblock this user?'}
					</Typography>

					<Typography variant='body2' sx={{ mb: 1, fontWeight: 'bold' }}>
						{isBlocking ? 'When you block a user:' : 'When you unblock a user:'}
					</Typography>

					<Box component='ul' sx={{ pl: 5, m: 0 }}>
						{isBlocking ? (
							<>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem', lineHeight: '1.7' }}>
									They will NOT know that you have blocked them
								</Typography>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem', lineHeight: '1.7' }}>
									They can send you messages, but you will not receive them
								</Typography>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem', lineHeight: '1.7' }}>
									You cannot send them messages
								</Typography>

								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem', lineHeight: '1.7' }}>
									You can unblock them later to resume communication. Then you will receive their messages which are sent after you blocked them
								</Typography>
							</>
						) : (
							<>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
									They can send you messages again
								</Typography>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
									You can send them messages again
								</Typography>
								<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
									Previous messages will be available to view
								</Typography>
							</>
						)}
					</Box>
				</DialogContent>
				<CustomDialogActions
					deleteBtn={isBlocking}
					deleteBtnText={isBlocking ? 'Block User' : ''}
					onCancel={handleCancelBlockUnblock}
					onDelete={isBlocking ? handleConfirmBlockUnblock : undefined}
					onSubmit={!isBlocking ? handleConfirmBlockUnblock : undefined}
					actionSx={{ mb: '0.5rem' }}
					submitBtnText={!isBlocking ? 'Unblock User' : ''}
				/>
			</CustomDialog>

			{/* Chat History Info Dialog */}
			<CustomDialog openModal={infoDialogOpen} closeModal={() => setInfoDialogOpen(false)} maxWidth='xs' title='Chat History Information'>
				<DialogContent>
					<Typography variant='body2' sx={{ mb: 2 }}>
						Important information about chat history retention:
					</Typography>

					<Box component='ul' sx={{ pl: 5, m: 0 }}>
						<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
							Messages older than 21 days will be automatically deleted
						</Typography>

						<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
							You can download chat history before it gets deleted
						</Typography>
						<Typography component='li' variant='body2' sx={{ mb: '0.5rem', fontSize: '0.8rem' }}>
							Recent messages (within 21 days) will always be available
						</Typography>
					</Box>
				</DialogContent>
				<CustomDialogActions
					onSubmit={() => setInfoDialogOpen(false)}
					submitBtnText='Got It'
					actionSx={{ mb: '0.5rem', mr: '1rem', mt: '-1rem' }}
					showCancelBtn={false}
				/>
			</CustomDialog>
		</>
	);
};

export default ChatHeader;
