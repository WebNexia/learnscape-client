import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Cancel, Chat, TurnLeftOutlined } from '@mui/icons-material';
import { Chat as ChatType, Message } from '../../pages/Messages';
import { formatMessageTime } from '../../utils/formatTime';
import { renderMessageWithEmojis } from '../../utils/renderMessageWithEmojis';

interface MessageListProps {
	messages: Message[];
	activeChat: ChatType | null;
	user: any;
	isMobileSize: boolean;
	messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
	onReplyMessage: (message: Message) => void;
	onDeleteMessage: (messageId: string) => void;
	onZoomImage: (imageUrl: string) => void;
	onScrollToOriginalMessage: (messageId: string) => void;
	isGroupChat: (chat: ChatType) => boolean;
	globalBlockedUsers?: string[];
}

const MessageList = ({
	messages,
	activeChat,
	user,
	isMobileSize,
	messageRefs,
	onReplyMessage,
	onDeleteMessage,
	onZoomImage,
	onScrollToOriginalMessage,
	isGroupChat,
	globalBlockedUsers,
}: MessageListProps) => {
	if (!activeChat) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					textAlign: 'center',
					height: '100%',
					width: '100%',
				}}>
				<Box>
					{user?.hasRegisteredCourse || user?.isSubscribed || user?.role !== 'learner' ? (
						<>
							<Chat sx={{ fontSize: '5rem', color: '#fff' }} />
							<Typography sx={{ color: '#fff' }}>Select an existing chat or start a new chat by adding a user</Typography>
						</>
					) : (
						<Typography sx={{ color: '#fff' }}>To use messages, you must first enroll in a paid course or subscribe</Typography>
					)}
				</Box>
			</Box>
		);
	}

	// Memoize filtered messages to prevent expensive re-computations
	const filteredMessages = useMemo(() => {
		if (!messages || !activeChat || !user) return [];

		const currentUserId = user.firebaseUserId;

		return (
			messages?.filter((msg: Message) => {
				// Always show system messages
				if (msg.isSystemMessage) {
					return true;
				}

				// If the current user is the sender, show their own messages
				if (msg.senderId === currentUserId) {
					return true;
				}

				// ✅ Only filter blocked messages in 1-1 chats, not group chats
				if (!isGroupChat(activeChat) && globalBlockedUsers?.includes(msg.senderId)) {
					return false; // Filter out messages from blocked users in 1-1 chats only
				}

				// Show all other messages
				return true;
			}) || []
		);
	}, [messages, globalBlockedUsers, user?.firebaseUserId, activeChat]);

	return (
		<>
			{filteredMessages?.map((msg) => {
				// Render system messages
				if (msg.isSystemMessage) {
					return (
						<Box
							key={msg.id}
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								width: '100%',
								margin: '0.5rem 0',
							}}>
							<Box
								sx={{
									backgroundColor: '#f0f0f0',
									padding: '0.5rem 1rem',
									borderRadius: '1rem',
									border: '1px solid #e0e0e0',
								}}>
								<Typography
									variant='caption'
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										color: '#666',
										fontStyle: 'italic',
									}}>
									{msg.text}
								</Typography>
							</Box>
						</Box>
					);
				}

				// Render regular messages
				return (
					<Box
						key={msg.id}
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-end',
							alignItems: 'center',
							width: '100%',
						}}>
						<Box
							ref={(el) => {
								messageRefs.current[msg.id] = el as HTMLDivElement | null;
							}}
							sx={{
								display: 'flex',
								flexDirection: msg.senderId === user?.firebaseUserId ? 'row-reverse' : 'row',
								justifyContent: 'flex-start',
								alignItems: 'center',
								width: '100%',
								borderRadius: '0.35rem',
							}}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									padding: '0.5rem 1rem',
									borderRadius: '0.75rem',
									margin: '0.5rem 0',
									transition: 'background-color 0.5s ease',
									backgroundColor: msg.senderId === user?.firebaseUserId ? '#DCF8C6' : '#FFF',
									alignSelf: msg.senderId === user?.firebaseUserId ? 'flex-end' : 'flex-start',
									maxWidth: '40%',
									minWidth: '12.5%',
									wordWrap: 'break-word',
									wordBreak: 'break-all',
								}}>
								{/* Sender name for group chats */}
								{isGroupChat(activeChat) && msg.senderId !== user?.firebaseUserId && (
									<Box sx={{ mb: 0.5 }}>
										<Typography
											variant='caption'
											sx={{
												fontSize: isMobileSize ? '0.6rem' : '0.7rem',
												color: '#666',
											}}>
											{msg.senderId === 'system'
												? 'System'
												: activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || 'Unknown User'}
										</Typography>
									</Box>
								)}
								{msg.replyTo && (
									<Box
										sx={{
											backgroundColor: '#f1f1f1',
											borderLeft: '0.25rem solid #aaa',
											padding: '0.5rem',
											marginBottom: '0.5rem',
											borderRadius: '0.25rem',
											cursor: 'pointer',
										}}
										onClick={() => onScrollToOriginalMessage(msg.replyTo)}>
										<Typography sx={{ color: 'gray', fontSize: isMobileSize ? '0.6rem' : '0.75rem' }}>{msg.quotedText}</Typography>
									</Box>
								)}

								{msg.imageUrl ? (
									<img
										src={msg.imageUrl}
										alt='uploaded'
										style={{
											height: isMobileSize ? '4rem' : '6rem',
											maxHeight: isMobileSize ? '6rem' : '8rem',
											objectFit: 'contain',
											maxWidth: '100%',
											borderRadius: '0.35rem',
											cursor: 'pointer',
										}}
										onClick={() => onZoomImage(msg.imageUrl || '')}
									/>
								) : (
									<Box sx={{ alignSelf: 'flex-start' }}>
										<Typography sx={{ fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
											{renderMessageWithEmojis(msg.text, isMobileSize ? '1.15rem' : '1.75rem', isMobileSize)}
										</Typography>
									</Box>
								)}

								<Box sx={{ alignSelf: 'flex-end' }}>
									<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.5rem' : '0.65rem', color: 'gray' }}>
										{formatMessageTime(msg.timestamp)}
									</Typography>
								</Box>
							</Box>

							<Box>
								<Tooltip title='Reply' placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => onReplyMessage(msg)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<TurnLeftOutlined sx={{ fontSize: isMobileSize ? '0.95rem' : '1.25rem' }} />
									</IconButton>
								</Tooltip>
							</Box>
							<Box
								sx={{
									marginRight: isMobileSize ? '-0.35rem' : 0,
								}}>
								{msg.senderId === user?.firebaseUserId && (
									<Tooltip title='Delete' placement='top' arrow>
										<IconButton
											size='small'
											onClick={() => onDeleteMessage(msg.id)}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.9rem' : '1.15rem' }} />
										</IconButton>
									</Tooltip>
								)}
							</Box>
						</Box>
					</Box>
				);
			})}
		</>
	);
};

export default MessageList;
