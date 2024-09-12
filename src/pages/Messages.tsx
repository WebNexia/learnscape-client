import { Alert, Box, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { AddBox, Cancel, Image, InsertEmoticon, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import {
	addDoc,
	updateDoc,
	setDoc,
	serverTimestamp,
	collection,
	query,
	orderBy,
	onSnapshot,
	doc,
	getDoc,
	where,
	getDocs,
	arrayUnion,
	arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import emojiRegex from 'emoji-regex';
import useImageUpload from '../hooks/useImageUpload'; // Import the custom hook
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { User } from '../interfaces/user';
import axios from 'axios';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { debounce } from '../utils/debounce';
import theme from '../themes';

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

export interface Chat {
	chatId: string;
	participants: User[];
	lastMessage: {
		text: string;
		timestamp: Date | null;
	};
	isDeletedBy?: string[];
}

const Messages = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);

	const [messages, setMessages] = useState<Message[]>([]);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');
	const [searchChatValue, setSearchChatValue] = useState<string>('');

	const [chatList, setChatList] = useState<Chat[]>([]); // Storing chats with participants and last message
	const [filteredChatList, setFilteredChatList] = useState<Chat[]>([]);
	const [activeChat, setActiveChat] = useState<Chat | null>(null); // Active chat
	const [activeChatId, setActiveChatId] = useState<string>('');
	const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);

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

	// Function to fetch a single user by Firebase User ID from the MongoDB API
	const fetchUserByFirebaseUserId = async (firebaseUserId: string): Promise<User | null> => {
		try {
			// Fetch user details from your MongoDB API
			const response = await axios.get(`${base_url}/users/${firebaseUserId}`);
			const userData = response.data.data[0]; // Assuming the API returns an array of users (even if it only contains one user)

			// Return the user object mapped to your User interface
			return {
				_id: userData._id,
				username: userData.username || '',
				email: userData.email || '',
				firebaseUserId: userData.firebaseUserId || '',
				role: userData.role || '',
				orgId: userData.orgId || '',
				imageUrl: userData.imageUrl || '',
				isActive: userData.isActive || false,
				createdAt: userData.createdAt || '',
				updatedAt: userData.updatedAt || '',
			};
		} catch (error) {
			console.error('Error fetching user from MongoDB:', error);
			return null;
		}
	};

	// Fetch chats where the user is a participant, ordered by the last message timestamp
	useEffect(() => {
		if (!user?.firebaseUserId) return;

		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId), orderBy('lastMessage.timestamp', 'desc'));

		// Real-time listener for all chats
		const unsubscribe = onSnapshot(q, async (querySnapshot) => {
			const chatsArray: Chat[] = [];

			// Loop through each chat document
			for (const doc of querySnapshot.docs) {
				const data = doc.data();
				const lastMessage = data.lastMessage || { text: 'No messages yet', timestamp: null };

				// Check if the current user has deleted this chat
				if (data.isDeletedBy?.includes(user.firebaseUserId)) {
					// If user has deleted the chat, skip it
					continue;
				}

				// Fetch user details for participants in parallel from MongoDB
				const participantsDetails: User[] = await Promise.all(
					data.participants.map(async (participantId: string) => {
						const user = await fetchUserByFirebaseUserId(participantId); // Fetch each participant's details from MongoDB
						return { ...user, participantId }; // Add the participantId key to the user details
					})
				);

				// Push the chat with its participants and last message
				chatsArray.push({
					chatId: doc.id,
					participants: participantsDetails.filter((p): p is User => p !== null), // Ensure no null participants
					lastMessage: lastMessage,
				});
			}

			// Update the chat list with filtered chats
			setChatList(chatsArray);
		});

		return () => unsubscribe();
	}, [user?.firebaseUserId]);

	useEffect(() => {
		if (!activeChat || !user?.firebaseUserId) return;

		const messagesRef = collection(db, 'chats', activeChat.chatId, 'messages');
		const q = query(messagesRef, orderBy('timestamp', 'asc'));

		const unsubscribe = onSnapshot(q, (querySnapshot) => {
			const messagesArray: Message[] = [];
			querySnapshot.forEach((doc) => {
				const data = doc.data();

				const message: Message = {
					id: doc.id,
					senderId: data.senderId || '',
					receiverId: data.receiverId || '',
					text: data.text || '',
					timestamp: data.timestamp?.toDate() || new Date(),
					isRead: data.isRead || false,
					imageUrl: data.imageUrl || '',
					videoUrl: data.videoUrl || '',
					replyTo: data.replyTo || '',
					quotedText: data.quotedText || '',
				};

				messagesArray.push(message); // Now this matches the Message type
			});

			setMessages(messagesArray);
		});

		if (activeChat === null) setMessages([]);

		return () => unsubscribe();
	}, [activeChat, user?.firebaseUserId]);

	useEffect(() => {
		const savedActiveChatId = localStorage.getItem('activeChatId');

		if (savedActiveChatId && chatList.length > 0) {
			const chat = chatList.find((chat) => chat.chatId === savedActiveChatId);
			if (chat) {
				setActiveChat(chat);
			}
		}

		setFilteredChatList(chatList);
	}, [chatList]);

	useEffect(() => {
		const savedChatList = localStorage.getItem('chatList');
		const savedActiveChatId = localStorage.getItem('activeChatId');

		if (savedChatList) {
			// Restore the chat list from localStorage
			setChatList(JSON.parse(savedChatList));
		} else {
			// Fetch the chat list from Firestore if localStorage is empty
			fetchChatListFromFirestore();
		}

		if (savedActiveChatId) {
			// Restore the active chat ID from localStorage
			setActiveChatId(savedActiveChatId);
		}
	}, []);

	const fetchChatListFromFirestore = async () => {
		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId), orderBy('lastMessage.timestamp', 'desc'));

		const querySnapshot = await getDocs(q);

		// Fetch all chats
		const chatData: Chat[] = querySnapshot.docs.map((doc) => {
			const data = doc.data();

			return {
				chatId: doc.id,
				participants: data.participants || [],
				lastMessage: {
					text: data.lastMessage?.text || 'No messages yet',
					timestamp: data.lastMessage?.timestamp?.toDate() || new Date(),
				},
				isDeletedBy: data.isDeletedBy || [], // Include this field to track deletions
			};
		});

		// Client-side filtering: Remove chats that are deleted by the current user
		const filteredChatData = chatData.filter((chat: Chat) => !chat?.isDeletedBy?.includes(user?.firebaseUserId!));

		// Update the state with the filtered chat list
		setChatList(filteredChatData);
		setFilteredChatList(filteredChatData);

		// Save in localStorage
		localStorage.setItem('chatList', JSON.stringify(filteredChatData));
	};

	const startChatIfNotExists = async (selectedUser: User) => {
		const chatId = [user?.firebaseUserId, selectedUser.firebaseUserId].sort().join('&');
		const chatRef = doc(db, 'chats', chatId);

		const chatDoc = await getDoc(chatRef);

		if (chatDoc.exists()) {
			const chatData = chatDoc.data();

			// Check if the chat is marked as deleted by the current user
			if (chatData.isDeletedBy?.includes(user?.firebaseUserId)) {
				// Remove the user from the `isDeletedBy` array to restore the chat
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(user?.firebaseUserId),
				});

				// Update the chatList to show the restored chat
				const updatedChat = {
					chatId: chatId,
					participants: [user!, selectedUser],
					lastMessage: chatData.lastMessage || { text: 'No messages yet', timestamp: null },
				};

				setChatList((prev) => {
					const updatedChatList = prev.find((chat) => chat.chatId === chatId) ? prev : [updatedChat, ...prev];

					// Also update filtered chat list so it reflects correctly in the UI
					setFilteredChatList(updatedChatList);
					return updatedChatList;
				});

				setActiveChat(updatedChat); // Set the restored chat as active
				setActiveChatId(chatId);
				localStorage.setItem('activeChatId', chatId);
			}
		} else {
			// If chat doesn't exist, create a new one
			await setDoc(chatRef, {
				participants: [user?.firebaseUserId, selectedUser.firebaseUserId], // Add both participants
				lastMessage: {
					text: 'No messages yet', // Initialize with no messages
					timestamp: null,
				},
				isDeletedBy: [], // Initialize with no deletions
			});

			// Set the newly created chat as active
			const newChat: Chat = {
				chatId: chatId,
				participants: [user!, selectedUser],
				lastMessage: { text: 'No messages yet', timestamp: null },
			};

			setChatList((prev) => {
				const updatedChatList = prev.find((chat) => chat.chatId === chatId) ? prev : [newChat, ...prev];
				setFilteredChatList(updatedChatList); // Ensure the filtered list is updated
				return updatedChatList;
			});

			setActiveChat(newChat); // Set the active chat
			setActiveChatId(chatId);
			localStorage.setItem('activeChatId', chatId);
		}
	};

	const handleSetActiveChat = (chat: Chat) => {
		setActiveChat(chat); // Set the active chat in state
		localStorage.setItem('activeChatId', chat.chatId); // Save the active chat ID in localStorage
		setActiveChatId(chat.chatId);
	};

	const handleSendMessage = async () => {
		if ((!currentMessage.trim() && !imageUpload) || !activeChat) return;

		let imageUrl = '';
		if (imageUpload) {
			await handleImageUpload('messages', (url: string) => {
				imageUrl = url;
			});
		}

		// Generate a unique chat ID based on firebaseUserId
		const chatId = activeChat.chatId;

		const newMessage: Message = {
			id: generateUniqueId(''),
			senderId: user?.firebaseUserId!, // Use Firebase user ID as the sender ID
			receiverId: activeChat.participants[0].firebaseUserId, // Use Firebase user ID as the receiver ID
			text: currentMessage || '',
			imageUrl: imageUrl || '',
			timestamp: new Date(),
			isRead: false,
		};

		try {
			const chatRef = doc(db, 'chats', chatId);
			const messageRef = collection(db, 'chats', chatId, 'messages');

			// Add the message to Firestore
			await addDoc(messageRef, {
				...newMessage,
				timestamp: serverTimestamp(),
			});

			// Update the lastMessage field in the chat document
			await updateDoc(chatRef, {
				lastMessage: {
					text: newMessage.text,
					timestamp: serverTimestamp(),
				},
			});

			setCurrentMessage('');
			resetImageUpload();
		} catch (error) {
			console.error('Error sending message: ', error);
		}
	};

	const filterUsers = async (value: string) => {
		if (!value.trim()) {
			setFilteredUsers([]);
			return;
		}

		try {
			const response = await axios.get(`${base_url}/users/search`, {
				params: { searchQuery: value, orgId },
			});

			setFilteredUsers(response.data.data);
		} catch (error) {
			console.log(error);
		}
	};

	const debouncedFilterUsers = debounce((value) => {
		filterUsers(value);
	}, 650);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
		debouncedFilterUsers(e.target.value);
	};

	const handleUserSelection = async (selectedUser: User) => {
		await startChatIfNotExists(selectedUser); // Ensure the chat is started or exists
		setAddUserModalOpen(false); // Close modal
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

	console.log(activeChatId);

	const handleDeleteChat = async (chatId: string) => {
		try {
			const chatRef = doc(db, 'chats', chatId);

			await updateDoc(chatRef, {
				isDeletedBy: arrayUnion(user?.firebaseUserId),
			});

			// Optionally: Remove the chat from the chat list state immediately
			setFilteredChatList((prevChatList) => {
				const filteredChatListAfterDelete = prevChatList.filter((chat) => chat.chatId !== chatId);
				localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterDelete));
				return filteredChatListAfterDelete;
			});

			setMessages([]);

			if (activeChatId === chatId) {
				console.log(activeChatId === chatId);
				setActiveChat(null);
				setActiveChatId('');
				localStorage.setItem('activeChatId', '');
			}
		} catch (error) {
			console.error('Error deleting chat: ', error);
		}
	};

	const handleFilterChats = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSearchValue = e.target.value.trim(); // Capture and trim the new search value
		setSearchChatValue(newSearchValue); // Update the search state

		// If there's a search value, filter the chats
		if (newSearchValue) {
			const filteredList = chatList.filter((chat: Chat) =>
				chat.participants.some(
					(participant: User) => participant.username.includes(newSearchValue) && participant.firebaseUserId !== user?.firebaseUserId
				)
			);
			setFilteredChatList(filteredList); // Update the filtered list
		} else {
			// If the search is cleared, reset the filtered list to the full chat list
			setFilteredChatList(chatList);
		}
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
								value={searchChatValue}
								onChange={handleFilterChats}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<IconButton
								sx={{ ':hover': { backgroundColor: 'transparent' } }}
								onClick={() => {
									setAddUserModalOpen(true);
									setFilteredUsers([]);
									setSearchValue('');
								}}>
								<AddBox />
							</IconButton>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
						{filteredChatList?.map((chat) => {
							const otherParticipant = chat.participants.find((participant) => participant.firebaseUserId !== user?.firebaseUserId);

							if (!otherParticipant) return null;

							return (
								<Box
									key={chat.chatId}
									sx={{
										display: 'flex',
										borderRadius: '0.25rem',
										borderBottom: '0.04rem solid lightgray',
										backgroundColor: chat.chatId === activeChatId ? theme.bgColor?.primary : null,
										':hover': {
											backgroundColor: chat.chatId !== activeChatId ? theme.bgColor?.lessonInProgress : null,
											color: '#fff',
											'& .active-hovered-chat-text-color': {
												color: '#fff',
											},
										},
									}}>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'start',
											padding: '0.5rem',
											cursor: 'pointer',
											flex: 4,
										}}
										onClick={() => {
											handleSetActiveChat(chat);
										}}>
										<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<img
													src={otherParticipant.imageUrl}
													alt='profile_img'
													style={{
														height: '2.5rem',
														width: '2.5rem',
														borderRadius: '100%',
														border: 'solid lightgray 0.1rem',
													}}
												/>
											</Box>
											<Box>
												<Typography
													variant='body2'
													className='active-hovered-chat-text-color'
													sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : null }}>
													{otherParticipant.username}
												</Typography>
											</Box>
										</Box>
										<Box
											sx={{
												marginTop: '0.2rem',
											}}>
											<Typography
												variant='caption'
												sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : 'gray' }}
												className='active-hovered-chat-text-color'>
												{chat.lastMessage.text.length > 20 ? `${chat.lastMessage.text.substring(0, 20)}...` : chat.lastMessage.text}
											</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
										<Tooltip title='Delete Chat' placement='top'>
											<IconButton onClick={() => handleDeleteChat(chat.chatId)}>
												<Cancel
													className='active-hovered-chat-text-color'
													fontSize='small'
													sx={{
														fontSize: '1.1rem',
														color: chat.chatId === activeChatId ? theme.textColor?.common.main : theme.palette.primary.main,
													}}
												/>
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>

				{/* Message Display */}
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: '100%' }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							borderBottom: '0.04rem solid gray',
							width: '100%',
							height: '4rem',
							flexShrink: 0,
						}}>
						{activeChat && (
							<Box sx={{ display: 'flex', alignItems: 'center', marginLeft: '1.5rem' }}>
								{activeChat.participants
									.filter((participant) => participant.firebaseUserId !== user?.firebaseUserId)
									.map((otherParticipant) => (
										<Box key={otherParticipant._id} sx={{ display: 'flex', alignItems: 'center' }}>
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<img
													src={otherParticipant.imageUrl}
													alt='profile_img'
													style={{
														height: '2.5rem',
														width: '2.5rem',
														borderRadius: '100%',
														border: 'solid lightgray 0.1rem',
													}}
												/>
											</Box>
											<Box>
												<Typography className='username' variant='body2'>
													{otherParticipant.username}
												</Typography>
											</Box>
										</Box>
									))}
							</Box>
						)}
					</Box>

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

					{/* Input Box */}
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
										<IconButton size='small' onClick={resetImageUpload} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
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

			{/* Custom Dialog for User Search */}
			<CustomDialog
				openModal={addUserModalOpen}
				closeModal={() => {
					setAddUserModalOpen(false);
					setSearchValue('');
				}}
				title='Find User'
				content='Search users by username or email address to start a chat'
				maxWidth='sm'>
				<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: filteredUsers.length === 0 ? '1.5rem' : null }}>
					<CustomTextField sx={{ width: '50%' }} value={searchValue} onChange={handleSearchChange} />
				</Box>
				{filteredUsers.length !== 0 && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'flex-start',
							width: '50%',
							margin: '0 auto 1.5rem auto',
							border: 'solid 0.05rem lightgray',
						}}>
						{filteredUsers
							?.filter((filteredUser) => filteredUser.firebaseUserId !== user?.firebaseUserId)
							.map((user) => (
								<Box
									key={user._id}
									sx={{
										display: 'flex',
										justifyContent: 'flex-start',
										alignItems: 'center',
										width: '100%',
										padding: '0.5rem',
										transition: '0.5s',
										borderRadius: '0.25rem',
										':hover': {
											backgroundColor: theme.bgColor?.primary,
											color: '#fff',
											cursor: 'pointer',
											'& .username': {
												color: '#fff',
											},
										},
									}}
									onClick={() => handleUserSelection(user)}>
									<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
										<img
											src={user.imageUrl}
											alt='profile_img'
											style={{
												height: '2.5rem',
												width: '2.5rem',
												borderRadius: '100%',
												border: 'solid lightgray 0.1rem',
											}}
										/>
									</Box>
									<Box>
										<Typography className='username' variant='body2'>
											{user.username}
										</Typography>
									</Box>
								</Box>
							))}
					</Box>
				)}
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default Messages;
