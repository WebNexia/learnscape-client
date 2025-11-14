import { Alert, Box, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import { Cancel, Image, InsertEmoticon, Send } from '@mui/icons-material';
import CustomTextField from '../forms/customFields/CustomTextField';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Message } from 'pages/Messages';
import { useState, useCallback, useEffect } from 'react';
import { doc, collection, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';
import useImageUpload from '../../hooks/useImageUpload';

interface MessageInputProps {
	activeChat: any;
	user: any;
	refreshChatList: () => Promise<void>;
	refreshUploadStats: () => Promise<void>;
	hasLeftParticipants: (chat: any) => boolean;
	isGroupChat: (chat: any) => boolean;
	isBlockingUser: boolean;
	messagesEndRef: React.RefObject<HTMLDivElement>;
	setChatList: React.Dispatch<React.SetStateAction<any[]>>;
	setFilteredChatList: React.Dispatch<React.SetStateAction<any[]>>;
	// Reply functionality
	replyToMessage: Message | null;
	setReplyToMessage: React.Dispatch<React.SetStateAction<Message | null>>;
	// UI props
	isMobileSize: boolean;
	isRotatedMedium: boolean;
	isVerySmallScreen: boolean;
	isRotated: boolean;
	uploadInfo: any;
	getRemainingImageUploads: () => number;
	getImageLimit: () => number;
	getFormattedResetTime: () => string;
	checkCanUploadImage: () => boolean;
	checkCanUploadAudio: () => boolean;
	// Optimistic update methods
	incrementImageUpload: () => void;
}

const MessageInput = ({
	activeChat,
	user,
	refreshChatList,
	refreshUploadStats,
	hasLeftParticipants,
	isGroupChat,
	isBlockingUser,
	messagesEndRef,
	setChatList,
	setFilteredChatList,
	// Reply functionality
	replyToMessage,
	setReplyToMessage,
	// UI props
	isMobileSize,
	isRotatedMedium,
	isVerySmallScreen,
	isRotated,
	uploadInfo,
	getRemainingImageUploads,
	getImageLimit,
	getFormattedResetTime,
	checkCanUploadImage,
	checkCanUploadAudio,
	// Optimistic update methods
	incrementImageUpload,
}: MessageInputProps) => {
	// ✅ Internal state (moved from Messages.tsx)
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);

	// ✅ Image upload logic (moved from Messages.tsx)
	const { imageUpload, imagePreview, handleImageChange, handleImageUpload, resetImageUpload, isUploading, isImgSizeLarge } = useImageUpload({
		maxSizeInMB: 1,
	});

	// ✅ Handle large image size detection (moved from Messages.tsx)
	useEffect(() => {
		if (isImgSizeLarge) {
			setIsLargeImgMessageOpen(true);
		}
	}, [isImgSizeLarge]);

	// ✅ Event handlers (moved from Messages.tsx)
	const handleEmojiSelect = useCallback((emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	}, []);

	// Note: Reply functionality is handled by the parent component via onReplyMessage prop

	const handleSendMessage = useCallback(async () => {
		if ((!currentMessage.trim() && !imageUpload) || !activeChat) return;
		if (hasLeftParticipants(activeChat)) return;

		// ✅ Only check blocking for 1-1 chats, not group chats
		if (!isGroupChat(activeChat) && isBlockingUser) {
			return; // Don't send message in 1-1 chats if blocked
		}

		const chatId = activeChat.chatId;
		const chatRef = doc(db, 'chats', chatId);
		const messageRef = collection(db, 'chats', chatId, 'messages');

		try {
			// ✅ Upload image first (if any)
			let imageUrl = '';
			if (imageUpload) {
				await handleImageUpload('messages', (url: string) => {
					imageUrl = url;
				});
			}

			const isGroup = isGroupChat(activeChat);
			const receiverIds =
				activeChat.participants?.filter((p: any) => p.firebaseUserId !== user?.firebaseUserId).map((p: any) => p.firebaseUserId) || [];

			const newMessageId = generateUniqueId('');
			const timestamp = new Date();

			const newMessage: Message = {
				id: newMessageId,
				senderId: user?.firebaseUserId!,
				receiverId: isGroup ? '' : receiverIds[0] || '',
				text: currentMessage.trim() || '',
				imageUrl: imageUrl.trim() || '',
				timestamp,
				isRead: false,
				replyTo: replyToMessage?.id || '',
				quotedText: replyToMessage?.text || '',
			};

			// ✅ One atomic batch — no reads needed
			const batch = writeBatch(db);

			// Always restore visibility (super cheap, always correct)
			batch.set(
				chatRef,
				{
					participants: activeChat.participants?.map((p: any) => p.firebaseUserId) || [],
					isDeletedBy: [],
					blockedUsers: {},
					lastMessage: {
						text: newMessage.text.trim() || 'Image sent',
						timestamp,
					},
					hasUnreadMessages: true,
					unreadBy: arrayUnion(...receiverIds),
				},
				{ merge: true } // ✅ No need to check existence — merge handles both cases
			);

			// ✅ Add message in same batch
			const newMessageRef = doc(messageRef, newMessageId);
			batch.set(newMessageRef, {
				...newMessage,
				timestamp,
			});

			await batch.commit();

			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
			}, 50);

			// ✅ Instantly update last message preview in UI (before Firestore sync)
			setChatList((prev) => {
				const updated = prev?.map((c) =>
					c.chatId === activeChat.chatId
						? {
								...c,
								lastMessage: {
									text: newMessage.text || 'Image sent',
									timestamp: new Date(), // show instantly
								},
								hasUnreadMessages: false,
								unreadMessagesCount: 0,
							}
						: c
				);
				// Sort by last message timestamp (most recent first)
				return updated?.sort((a, b) => {
					const aTime = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
					const bTime = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
					return bTime - aTime;
				});
			});
			setFilteredChatList((prev) => {
				const updated = prev?.map((c) =>
					c.chatId === activeChat.chatId
						? {
								...c,
								lastMessage: {
									text: newMessage.text || 'Image sent',
									timestamp: new Date(),
								},
								hasUnreadMessages: false,
								unreadMessagesCount: 0,
							}
						: c
				);
				// Sort by last message timestamp (most recent first)
				return updated?.sort((a, b) => {
					const aTime = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
					const bTime = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
					return bTime - aTime;
				});
			});

			// ✅ UI stays instant
			setReplyToMessage(null);
			setCurrentMessage('');
			if (imageUpload) {
				// Use optimistic update for instant UI feedback
				incrementImageUpload();
			}

			// ✅ BACKGROUND REFRESH: Refresh chat list after sending message
			refreshChatList();
		} catch (error) {
			console.error('Error sending message:', error);
			setCurrentMessage('');
			setReplyToMessage(null);
		} finally {
			resetImageUpload();
		}
	}, [
		currentMessage,
		imageUpload,
		activeChat,
		hasLeftParticipants,
		isGroupChat,
		isBlockingUser,
		handleImageUpload,
		user?.firebaseUserId,
		replyToMessage,
		messagesEndRef,
		setChatList,
		setFilteredChatList,
		refreshChatList,
		refreshUploadStats,
		resetImageUpload,
	]);

	const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (imageUpload) {
			setCurrentMessage('');
		} else {
			setCurrentMessage(e.target.value);
		}
		resetImageUpload();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Enter sends message, Shift+Enter creates new line
		if (e.key === 'Enter') {
			if (e.shiftKey) {
				// Allow default behavior for Shift+Enter (creates new line)
				return;
			} else {
				// Prevent default and send message for Enter alone
				e.preventDefault();
				handleSendMessage();
			}
		}
	};

	const handleTogglePicker = () => {
		setShowPicker(!showPicker);
	};

	const handleImageChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleImageChange(e);
		setCurrentMessage('');
	};
	const vertical = 'top';
	const horizontal = 'center';

	return (
		<>
			{/* Upload limit info - show for all users when limit is low */}
			{uploadInfo && getRemainingImageUploads() <= 5 && (
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						mb: 1,
						p: 1,
						borderRadius: 1,
						backgroundColor: getRemainingImageUploads() <= 5 ? 'success.light' : 'error.light',
						color: getRemainingImageUploads() <= 5 ? 'success.dark' : 'error.dark',
						position: 'absolute',
						top: '-3rem',
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 10,
					}}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : undefined }}>
						{getRemainingImageUploads() <= 0
							? `Daily limit reached`
							: `${getRemainingImageUploads()} of ${getImageLimit()} image uploads remaining today`}
						{getRemainingImageUploads() > 0 && ` • Resets ${getFormattedResetTime()}`}
					</Typography>
				</Box>
			)}

			<input
				type='file'
				accept='image/*'
				onChange={handleImageChangeWrapper}
				style={{ display: 'none' }}
				id='image-upload'
				disabled={isUploading || isBlockingUser || !activeChat || !checkCanUploadImage() || !checkCanUploadAudio() || hasLeftParticipants(activeChat)}
			/>
			<label htmlFor='image-upload'>
				<IconButton
					component='span'
					disabled={
						isUploading || isBlockingUser || !activeChat || !checkCanUploadImage() || !checkCanUploadAudio() || hasLeftParticipants(activeChat)
					}
					sx={{
						':hover': {
							backgroundColor: 'transparent',
						},
						'marginBottom': isMobileSize ? '0.5rem' : '1rem',
					}}>
					<Image fontSize={isMobileSize ? 'small' : 'medium'} />
				</IconButton>
			</label>

			<Box sx={{ width: '100%', mt: '0.5rem', position: 'relative' }}>
				<CustomTextField
					fullWidth
					placeholder={
						imageUpload
							? ''
							: isBlockingUser
								? 'Can not send message to a blocked contact'
								: hasLeftParticipants(activeChat)
									? 'Can not send message to a user who has left the chat'
									: 'Type a message...'
					}
					multiline={true}
					rows={isRotatedMedium ? 1 : 2}
					value={currentMessage}
					onChange={handleMessageChange}
					onKeyDown={handleKeyDown}
					InputProps={{
						sx: {
							padding: '0.5rem 1rem',
						},
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton onClick={handleTogglePicker} edge='end' disabled={isUploading || isBlockingUser || !activeChat}>
									<InsertEmoticon color={showPicker ? 'success' : 'disabled'} sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
								</IconButton>
							</InputAdornment>
						),
						inputProps: {
							maxLength: 1000,
						},
					}}
					sx={{ overflowY: 'auto' }}
					disabled={!!imageUpload || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)}
				/>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', margin: isMobileSize ? '-0.25rem 0' : '0' }}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
						{currentMessage.length}/1000 Characters
					</Typography>
				</Box>

				<Snackbar
					open={isLargeImgMessageOpen}
					autoHideDuration={3000}
					anchorOrigin={{ vertical, horizontal }}
					sx={{ mt: isMobileSize ? '3rem' : '5rem' }}
					onClose={() => {
						setIsLargeImgMessageOpen(false);
						resetImageUpload();
					}}>
					<Alert
						severity='error'
						variant='filled'
						sx={{ width: isMobileSize ? '90%' : '100%', fontSize: isMobileSize ? '0.8rem' : undefined, textAlign: 'center' }}>
						Image size exceeds the limit of 1 MB
					</Alert>
				</Snackbar>

				{imagePreview && (
					<Box
						sx={{
							display: 'flex',
							position: 'absolute',
							bottom: '1.75rem',
							left: isRotatedMedium ? '0.5rem' : '1rem',
							maxHeight: isRotatedMedium ? '2rem' : isMobileSize ? '3.25rem' : '3.75rem',
						}}>
						<img
							src={imagePreview}
							alt='Preview'
							style={{ maxHeight: isRotatedMedium ? '2rem' : isMobileSize ? '3.25rem' : '3.75rem', objectFit: 'contain' }}
						/>
						<Tooltip title='Remove Preview' placement='right' arrow>
							<IconButton size='small' onClick={resetImageUpload} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</Box>

			{showPicker && !(isUploading || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)) && (
				<Box
					sx={{
						position: 'absolute',
						bottom: isVerySmallScreen ? '2.75rem' : isRotated ? '-2.75rem' : isRotatedMedium ? '-1rem' : '6rem',
						right: isVerySmallScreen ? '1rem' : isRotated ? '-0.5rem' : isRotatedMedium ? '1rem' : '6rem',
						zIndex: 10,
						transform: isVerySmallScreen ? 'scale(0.8)' : isRotated ? 'scale(0.55)' : isRotatedMedium ? 'scale(0.65)' : 'scale(1)',
					}}>
					<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
				</Box>
			)}

			<IconButton
				onClick={handleSendMessage}
				disabled={isUploading || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)}
				sx={{
					':hover': {
						backgroundColor: 'transparent',
					},
					'marginBottom': isMobileSize ? '0.5rem' : '1rem',
				}}>
				<Send fontSize='small' />
			</IconButton>
		</>
	);
};

export default MessageInput;
