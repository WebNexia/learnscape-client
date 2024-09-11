import { Alert, Box, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { AddBox, Cancel, Image, InsertEmoticon, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import emojiRegex from 'emoji-regex';
import useImageUpload from '../hooks/useImageUpload'; // Import the custom hook

export interface Message {
	id: string;
	senderId: string;
	receiverId?: string;
	text: string;
	timestamp: Date;
	isRead: boolean;
	imageUrl?: string;
	videoUrl?: string;
	replyTo?: string; // This stores the ID of the message being replied to
	quotedText?: string; // Optional: Store a snippet of the original message being replied to
}

const Messages = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);

	const vertical = 'top';
	const horizontal = 'center';

	const { user } = useContext(UserAuthContext);

	const { imageUpload, imagePreview, handleImageChange, handleImageUpload, resetImageUpload, isUploading, isImgSizeLarge } = useImageUpload();

	const handleEmojiSelect = (emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	};

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (isImgSizeLarge) setIsLargeImgMessageOpen(true);
	}, [isImgSizeLarge]);

	useEffect(() => {
		const messagesRef = collection(db, 'chats', 'general', 'messages'); // Replace 'general' with dynamic chat ID
		const q = query(messagesRef, orderBy('timestamp', 'asc'));

		const unsubscribe = onSnapshot(q, (querySnapshot) => {
			const messagesArray: Message[] = [];
			querySnapshot.forEach((doc) => {
				const data = doc.data();

				messagesArray.push({
					id: doc.id, // Firestore document ID
					senderId: data.senderId,
					receiverId: data.receiverId,
					text: data.text,
					timestamp: data.timestamp?.toDate() || new Date(),
					isRead: data.isRead,
					imageUrl: data.imageUrl,
					videoUrl: data.videoUrl,
					replyTo: data.replyTo,
					quotedText: data.quotedText,
				});
			});

			setMessages(messagesArray);
		});

		return () => unsubscribe();
	}, [user?.firebaseUserId]);

	// Handle sending messages and optional image upload
	const handleSendMessage = async () => {
		if (!currentMessage.trim() && !imageUpload) return;

		let imageUrl = '';
		if (imageUpload) {
			await handleImageUpload('messages', (url: string) => {
				imageUrl = url;
			});
		}

		// Prepare the message payload
		const newMessage: Message = {
			id: generateUniqueId(''),
			senderId: user?.firebaseUserId!,
			receiverId: 'N40GCIP1WSSFPMVV4vpbFncQK292', // Replace with dynamic receiver ID
			text: currentMessage || '',
			imageUrl: imageUrl || '',
			timestamp: new Date(),
			isRead: false,
		};

		try {
			await addDoc(collection(db, 'chats', 'general', 'messages'), {
				senderId: newMessage.senderId,
				receiverId: newMessage.receiverId,
				text: newMessage.text,
				imageUrl: newMessage.imageUrl,
				timestamp: serverTimestamp(),
				isRead: newMessage.isRead,
			});

			// Clear input fields after sending
			setCurrentMessage('');
			resetImageUpload(); // Reset the image upload hook after sending the message
		} catch (error) {
			console.error('Error sending message: ', error);
		}
	};

	// Function to render message text with emojis and custom font sizes
	const renderMessageWithEmojis = (message: string) => {
		const regex = emojiRegex();
		const parts = message.split(regex); // Split the message based on where the emojis are
		const emojis = [...message.matchAll(regex)]; // Match all emojis

		return parts.reduce((acc: any[], part: string, index: number) => {
			if (part) {
				acc.push(
					<span key={`text-${index}`} style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>
						{part}
					</span>
				);
			}

			if (emojis[index]) {
				acc.push(
					<span key={`emoji-${index}`} style={{ fontSize: '1.75rem', verticalAlign: 'middle' }}>
						{emojis[index][0]}
					</span>
				);
			}

			return acc;
		}, []);
	};

	return (
		<DashboardPagesLayout pageName='Messages' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 4rem)' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 3, borderRight: '0.04rem solid gray', padding: '0 0.5rem 0 1rem' }}>
					<Box sx={{ display: 'flex', margin: '1rem auto 0 auto', width: '100%' }}>
						<Box sx={{ flex: 9 }}>
							<CustomTextField
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search />
										</InputAdornment>
									),
								}}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<IconButton sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<AddBox />
							</IconButton>
						</Box>
					</Box>
				</Box>

				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: '100%' }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							borderBottom: '0.04rem solid gray',
							width: '100%',
							height: '4rem',
							flexShrink: 0,
						}}></Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							flexGrow: 1,
							overflowY: 'auto',
							padding: '1rem',
							backgroundImage: `linear-gradient(rgba(80, 144, 166, 0.9), rgba(103, 180, 207, 0.95)), url('https://img.freepik.com/premium-vector/dialogue-balloon-chat-bubble-icons-seamless-pattern-textile-pattern-wrapping-paper-linear-vector-print-fabric-seamless-background-wallpaper-backdrop-with-speak-bubbles-chat-message-frame_8071-58894.jpg?w=1060')`,
							backgroundRepeat: 'repeat',
							backgroundSize: 'contain',
							backgroundPosition: 'center',
							maxHeight: '70vh',
						}}>
						{messages.map((msg) => (
							<Box
								key={msg.id}
								sx={{
									display: 'flex',
									flexDirection: 'column',
									padding: '0.5rem 1rem',
									borderRadius: '0.75rem',
									margin: '0.5rem 0',
									backgroundColor: msg.senderId === user?.firebaseUserId ? '#DCF8C6' : '#FFF',
									alignSelf: msg.senderId === user?.firebaseUserId ? 'flex-end' : 'flex-start',
									maxWidth: '60%',
									minWidth: '15%',
									wordWrap: 'break-word',
									wordBreak: 'break-all',
								}}>
								{msg.imageUrl ? (
									<img
										src={msg.imageUrl}
										alt='uploaded'
										style={{ height: '6rem', maxHeight: '8rem', objectFit: 'contain', maxWidth: '100%', borderRadius: '0.35rem' }}
									/>
								) : (
									<Box sx={{ alignSelf: 'flex-start' }}>
										<Typography sx={{ fontSize: '0.85rem' }}>{renderMessageWithEmojis(msg.text)}</Typography>
									</Box>
								)}
								<Box sx={{ alignSelf: 'flex-end' }}>
									<Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
										{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</Typography>
								</Box>
							</Box>
						))}
						<div ref={messagesEndRef} />
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', borderTop: '0.04rem solid gray', padding: '1rem', flexShrink: 0, position: 'relative' }}>
						<input
							type='file'
							accept='image/*'
							onChange={(e) => {
								handleImageChange(e);
								setCurrentMessage('');
							}}
							style={{ display: 'none' }}
							id='image-upload'
						/>
						<label htmlFor='image-upload'>
							<IconButton component='span' disabled={isUploading}>
								<Image />
							</IconButton>
						</label>

						<Box sx={{ width: '100%', mt: '0.5rem', position: 'relative' }}>
							<CustomTextField
								fullWidth
								placeholder={imageUpload ? '' : 'Type a message...'}
								multiline
								rows={3}
								value={currentMessage}
								onChange={(e) => {
									if (imageUpload) {
										setCurrentMessage('');
									} else {
										setCurrentMessage(e.target.value);
									}
									resetImageUpload();
								}}
								InputProps={{
									sx: {
										padding: '0.5rem 1rem',
									},
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton onClick={() => setShowPicker(!showPicker)} edge='end'>
												<InsertEmoticon color={showPicker ? 'success' : 'disabled'} />
											</IconButton>
										</InputAdornment>
									),
								}}
								sx={{ overflowY: 'auto' }}
								disabled={!!imageUpload}
							/>

							<Snackbar
								open={isLargeImgMessageOpen}
								autoHideDuration={3000}
								anchorOrigin={{ vertical, horizontal }}
								sx={{ mt: '5rem' }}
								onClose={() => {
									setIsLargeImgMessageOpen(false);
									resetImageUpload();
								}}>
								<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
									Image size exceeds the limit of 1 MB
								</Alert>
							</Snackbar>

							{imagePreview && (
								<Box sx={{ display: 'flex', position: 'absolute', bottom: '1rem', left: '1rem', maxHeight: '5rem' }}>
									<img src={imagePreview} alt='Preview' style={{ maxHeight: '5rem', objectFit: 'contain' }} />
									<Tooltip title='Remove Preview' placement='right'>
										<IconButton size='small' onClick={resetImageUpload}>
											<Cancel fontSize='small' />
										</IconButton>
									</Tooltip>
								</Box>
							)}
						</Box>

						{showPicker && (
							<Box sx={{ position: 'absolute', bottom: '6rem', right: '3rem', zIndex: 10 }}>
								<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
							</Box>
						)}

						<CustomSubmitButton sx={{ margin: '0 0 1rem 1rem' }} size='small' onClick={handleSendMessage} disabled={isUploading}>
							Send
						</CustomSubmitButton>
					</Box>
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Messages;
