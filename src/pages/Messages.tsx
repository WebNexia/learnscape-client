import { Box, IconButton, Typography, Dialog, DialogContent, DialogActions } from '@mui/material';
import { Cancel, Chat, KeyboardDoubleArrowDown } from '@mui/icons-material';

import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import UserSearchSelect from '../components/UserSearchSelect';
import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useUploadLimit } from '../contexts/UploadLimitContextProvider';
import { User } from '../interfaces/user';
import { debounce } from 'lodash';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import ChatList from '../components/messages/ChatList';
import ChatHeader from '../components/messages/ChatHeader';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import GroupChatModal from '../components/messages/GroupChatModal';
import GroupChatEditModal from '../components/messages/GroupChatEditModal';
import GroupMembersModal from '../components/messages/GroupMembersModal';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';

import { useChatList } from '../hooks/useChatList';
import { useMessages } from '../hooks/useMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatExport } from '../hooks/useChatExport';
import { useUserBlocking } from '../hooks/useUserBlocking';
import { useGroupChatManagement } from '../hooks/useGroupChatManagement';
import { useChatNavigation } from '../hooks/useChatNavigation';
import { useAuth } from '../hooks/useAuth';

export interface Message {
	id: string;
	senderId: string;
	receiverId?: string;
	text: string;
	timestamp: Date;
	isRead: boolean;
	imageUrl?: string;
	videoUrl?: string;
	replyTo: string; // This stores the ID of the message being replied to
	quotedText: string; // Optional: Store a snippet of the original message being replied to
	isSystemMessage?: boolean; // For system messages like "User left"
	systemMessageType?: 'user_left' | 'user_joined' | 'group_created'; // Type of system message
}

export interface ParticipantData {
	firebaseUserId: string;
	username: string;
	imageUrl: string;
	role: string;
}

export interface Chat {
	chatId: string;
	participants: ParticipantData[];
	lastMessage: {
		text: string;
		timestamp: Date | null;
	};
	isDeletedBy?: string[]; // For hiding chats
	removedParticipants?: string[]; // For permanently removed participants
	blockedUsers?: {
		[blockedUserId: string]: {
			blockedSince: Date | null; // The timestamp when the user was blocked
			blockedUntil: Date | null; // The timestamp when the user was unblocked (or null if still blocked)
		};
	};
	hasUnreadMessages?: boolean;
	unreadMessagesCount?: number;
	unreadBy?: string[];
	// Group chat fields
	chatType?: '1-1' | 'group';
	groupName?: string;
	groupImageUrl?: string;
	createdBy?: string;
}

const Messages = () => {
	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [isDeleteMessageOpen, setIsDeleteMessageOpen] = useState<boolean>(false);
	const [messageIdToDelete, setMessageIdToDelete] = useState<string>('');

	const [errorMsg, setErrorMsg] = useState<string>('');

	const [isChatsListVisible, setIsChatsListVisible] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');
	const [searchChatValue, setSearchChatValue] = useState<string>('');

	const [replyToMessage, setReplyToMessage] = useState<Message | null>(null); // To store the message being replied to

	const [activeChat, setActiveChat] = useState<Chat | null>(null); // Active chat
	const [activeChatId, setActiveChatId] = useState<string | null>(null);

	// ✅ NEW: Use useChatList hook
	const { chatList, setChatList, filteredChatList, setFilteredChatList, isLoadingChatList, refreshChatList, restoredChat } = useChatList({
		userFirebaseId: user?.firebaseUserId,
		activeChat,
	});

	// ✅ NEW: Use useMessages hook
	const {
		messages,
		setMessages,
		hasMoreMessages,
		setHasMoreMessages,
		isLoadingMore,
		setIsLoadingMore,
		loadMoreMessages,
		scrollToBottom,
		messagesEndRef,
		messagesContainerRef,
		setIsUserScrolledUp,
		showNewMessageIndicator,
		setShowNewMessageIndicator,
		showScrollToBottom,
		setShowScrollToBottom,
	} = useMessages({
		activeChatId: activeChat?.chatId,
		userFirebaseId: user?.firebaseUserId,
		refreshChatList,
		isMobileSize,
	});

	useEffect(() => {
		if (restoredChat) {
			setActiveChat(restoredChat);
			setActiveChatId(restoredChat.chatId);
		}
	}, [restoredChat]);

	const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
	const [createGroupModalOpen, setCreateGroupModalOpen] = useState<boolean>(false);
	const [editGroupModalOpen, setEditGroupModalOpen] = useState<boolean>(false);
	const [membersModalOpen, setMembersModalOpen] = useState<boolean>(false);

	// Delete chat dialog state
	const [isDeleteChatDialogOpen, setIsDeleteChatDialogOpen] = useState<boolean>(false);
	const [chatIdToDelete, setChatIdToDelete] = useState<string>('');

	const [zoomedImage, setZoomedImage] = useState<string | undefined>('');

	// Group chat helper functions - defined early to avoid initialization errors
	const isGroupChat = useMemo(
		() =>
			(chat: Chat): boolean => {
				return chat?.chatType === 'group' || chat?.participants?.length > 2;
			},
		[]
	);

	// ✅ NEW: Use useUserBlocking hook
	const { globalBlockedUsers, setGlobalBlockedUsers, blockedUsers, setBlockedUsers, isBlockingUser, hasLeftParticipants } = useUserBlocking({
		user,
		activeChat,
		isGroupChat,
	});

	// ✅ NEW: Use useChatActions hook
	const {
		createNewChat,
		createGroupChat,
		handleHideChat,
		handleLeaveChat,
		handleBlockUnblockUser,
		updateGroupChat,
		deleteGroupChat,
		isDeleteGroupDialogOpen,
		setIsDeleteGroupDialogOpen,
	} = useChatActions({
		user: user || null,
		activeChat,
		activeChatId,
		chatList,
		setChatList,
		setFilteredChatList,
		setMessages,
		setReplyToMessage,
		setActiveChat,
		setActiveChatId,
		refreshChatList,
		globalBlockedUsers,
		setGlobalBlockedUsers,
		setBlockedUsers,
		setIsDeleteChatDialogOpen,
		setChatIdToDelete,
		setHasMoreMessages,
		setIsLoadingMore,
	});

	// ✅ NEW: Use useChatExport hook
	const { downloadChatHistoryAsPDF, downloadChatHistoryAsTXT } = useChatExport({
		activeChat,
		messages,
		user,
	});

	// ✅ NEW: Use useGroupChatManagement hook
	const {
		groupName,
		setGroupName,
		selectedGroupUsers,
		setSelectedGroupUsers,
		groupSearchValue,
		setGroupSearchValue,
		groupImageUrl,
		setGroupImageUrl,
		enterGroupImageUrl,
		setEnterGroupImageUrl,
		removedMembers,
		setRemovedMembers,
		handleGroupUserSelection,
		removeGroupUser,
		removeExistingGroupMember,
		restoreExistingGroupMember,
		resetGroupChatForm,
		resetGroupChatEditForm,
	} = useGroupChatManagement({
		activeChat,
		globalBlockedUsers,
	});

	// Upload limit management - for all roles
	const {
		uploadInfo,
		checkCanUploadImage,
		checkCanUploadAudio,
		getRemainingImageUploads,
		getImageLimit,
		getFormattedResetTime,
		refreshUploadStats,
		incrementImageUpload,
	} = useUploadLimit();

	// ✅ NEW: Use useChatNavigation hook
	const {
		messageRefs,
		scrollToOriginalMessage,
		handleSetActiveChat,
		handleReplyMessage,
		handleSearchUserSelection,
		getChatDisplayName,
		getChatDisplayImage,
	} = useChatNavigation({
		user,
		activeChatId,
		globalBlockedUsers,
		isVerySmallScreen,
		createNewChat,
		setActiveChat,
		setActiveChatId,
		setMessages,
		setReplyToMessage,
		setHasMoreMessages,
		setIsLoadingMore,
		setChatList,
		setFilteredChatList,
		setIsChatsListVisible,
		setErrorMsg,
		setAddUserModalOpen,
		setSearchValue,
		isGroupChat,
		refreshChatList,
	});

	const confirmDeleteGroupChat = async () => {
		if (!activeChat || (!hasAdminAccess && !(user?.role === 'instructor' && activeChat.createdBy === user?.firebaseUserId))) return;

		try {
			await deleteGroupChat(activeChat.chatId);

			// ✅ Reset UI/form state
			setEditGroupModalOpen(false);
			resetGroupChatEditForm();
		} catch (error) {
			console.error('Error deleting group chat:', error);
		}

		setIsDeleteGroupDialogOpen(false);
	};

	const handleDeleteMessage = async (messageId: string) => {
		if (!activeChat) return;

		try {
			const chatRef = doc(db, 'chats', activeChat.chatId);
			const messageRef = doc(db, 'chats', activeChat.chatId, 'messages', messageId);

			// ✅ Compute new lastMessage BEFORE Firestore operation
			const remainingMessages = messages?.filter((msg) => msg.id !== messageId);
			const newLastMsg = remainingMessages?.slice(-1)[0];

			const batch = writeBatch(db);

			// ✅ Delete this message
			batch.delete(messageRef);

			// ✅ Update last message (fallback logic preserved)
			batch.update(chatRef, {
				lastMessage: newLastMsg
					? {
							text: newLastMsg.text || 'Image sent',
							timestamp: newLastMsg.timestamp,
						}
					: {
							text: 'No messages yet',
							timestamp: null,
						},
			});

			await batch.commit(); // ✅ ONE atomic write for both actions

			// ✅ Instant UI update
			setMessages(remainingMessages);
		} catch (error) {
			console.error('Error deleting message:', error);
		}
	};

	// Memoized chat filtering logic
	const filteredChatsMemo = useMemo(() => {
		if (!searchChatValue) {
			return chatList;
		}

		return (
			chatList?.filter((chat: Chat) =>
				chat.participants?.some(
					(participant: ParticipantData) =>
						(participant.username?.toLowerCase().includes(searchChatValue.toLowerCase()) ||
							chat.groupName?.toLowerCase().includes(searchChatValue.toLowerCase())) &&
						participant.firebaseUserId !== user?.firebaseUserId
				)
			) || []
		);
	}, [chatList, searchChatValue, user?.firebaseUserId]);

	const debouncedFilterChats = useMemo(
		() =>
			debounce(() => {
				setFilteredChatList(filteredChatsMemo);
			}, 250),
		[filteredChatsMemo]
	);

	const handleFilterChats = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newSearchValue = e.target.value.trim(); // Capture and trim the new search value
			setSearchChatValue(newSearchValue); // Update the search state
			debouncedFilterChats(); // Call the debounced function
		},
		[debouncedFilterChats]
	);

	return (
		<DashboardPagesLayout pageName='Messages' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 4rem)' }}>
				<ChatList
					filteredChatList={filteredChatList}
					activeChatId={activeChatId || ''}
					searchChatValue={searchChatValue}
					isChatsListVisible={isChatsListVisible}
					isVerySmallScreen={isVerySmallScreen}
					isMobileSize={isMobileSize}
					user={user}
					isLoadingChatList={isLoadingChatList}
					onFilterChats={handleFilterChats}
					onSetActiveChat={handleSetActiveChat}
					onDeleteChat={(chatId: string) => {
						setChatIdToDelete(chatId);
						setIsDeleteChatDialogOpen(true);
					}}
					onAddUserClick={() => {
						setAddUserModalOpen(true);
						setFilteredUsers([]);
						setSearchValue('');
					}}
					onCreateGroupClick={async () => {
						// Clear active chat when creating a new group to avoid conflicts
						setActiveChat(null);
						setActiveChatId('');
						setCreateGroupModalOpen(true);
						setGroupName('');
						setSelectedGroupUsers([]);
						setGroupSearchValue('');
						setGroupImageUrl('');
						setEnterGroupImageUrl(false);
					}}
					onChatsListToggle={() => {
						setIsChatsListVisible(true);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					getChatDisplayName={getChatDisplayName}
					getChatDisplayImage={getChatDisplayImage}
					isGroupChat={isGroupChat}
					globalBlockedUsers={globalBlockedUsers}
				/>

				{/* Message Display */}
				{(!isChatsListVisible || !isVerySmallScreen) && (
					<Box
						sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: 'calc(100vh - 4rem)', marginLeft: '-0.04rem', position: 'relative' }}>
						<ChatHeader
							activeChat={activeChat}
							user={user}
							isMobileSize={isMobileSize}
							isVerySmallScreen={isVerySmallScreen}
							isBlockingUser={isBlockingUser || false}
							blockedUsers={blockedUsers}
							getChatDisplayName={getChatDisplayName}
							getChatDisplayImage={getChatDisplayImage}
							isGroupChat={isGroupChat}
							onBlockUnblockUser={handleBlockUnblockUser}
							onDownloadChatHistoryAsPDF={downloadChatHistoryAsPDF}
							onDownloadChatHistoryAsTXT={downloadChatHistoryAsTXT}
							onEditGroupChat={() => {
								if (activeChat && isGroupChat(activeChat)) {
									setGroupName(activeChat.groupName || '');
									setGroupImageUrl(activeChat.groupImageUrl || '');
									setSelectedGroupUsers([]);
									setGroupSearchValue('');
									setEnterGroupImageUrl(false);
									setRemovedMembers([]); // Reset removed members when opening edit modal
									setEditGroupModalOpen(true);
								}
							}}
							onViewGroupMembers={() => {
								if (activeChat && isGroupChat(activeChat)) {
									setMembersModalOpen(true);
								}
							}}
						/>

						<Box
							ref={messagesContainerRef}
							onScroll={(e) => {
								const el = e.currentTarget;
								const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 350;

								setIsUserScrolledUp(!isNearBottom);
								setShowScrollToBottom(!isNearBottom); // Show button whenever NOT at bottom
								if (isNearBottom) setShowNewMessageIndicator(false);
							}}
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
								maxHeight: '85vh',
								position: 'relative',
								borderLeft: 'none',
							}}>
							{hasMoreMessages && (
								<CustomSubmitButton onClick={loadMoreMessages} disabled={isLoadingMore} sx={{ margin: '0 auto' }}>
									{isLoadingMore ? 'Loading…' : 'Load More'}
								</CustomSubmitButton>
							)}

							<MessageList
								messages={messages}
								activeChat={activeChat}
								user={user}
								isMobileSize={isMobileSize}
								messageRefs={messageRefs}
								onReplyMessage={handleReplyMessage}
								onDeleteMessage={(messageId) => {
									setIsDeleteMessageOpen(true);
									setMessageIdToDelete(messageId);
								}}
								onZoomImage={setZoomedImage}
								onScrollToOriginalMessage={scrollToOriginalMessage}
								isGroupChat={isGroupChat}
								globalBlockedUsers={globalBlockedUsers}
							/>
							<div ref={messagesEndRef} />
						</Box>
						{showScrollToBottom && (
							<IconButton
								sx={{
									'position': 'absolute',
									'top': { xs: '8rem', sm: '8rem', md: '8rem' },
									'left': '50%',
									'transform': 'translateX(-50%)',
									'backgroundColor': 'white',
									'boxShadow': '0 2px 10px rgba(0,0,0,0.2)',
									'zIndex': 1000,
									'&:hover': { backgroundColor: '#f0f0f0' },
								}}
								onClick={scrollToBottom}>
								<KeyboardDoubleArrowDown fontSize='small' />
							</IconButton>
						)}

						{showNewMessageIndicator && (
							<button
								onClick={() => {
									setShowNewMessageIndicator(false);

									requestAnimationFrame(() => {
										const el = messagesContainerRef.current;
										if (el) {
											el.scrollTo({
												top: el.scrollHeight,
												behavior: 'instant',
											});
										}
									});
								}}
								style={{
									position: 'absolute',
									bottom: isMobileSize ? '100px' : '140px',
									left: '50%',
									transform: 'translateX(-50%)',
									padding: '6px 12px',
									fontSize: isMobileSize ? '12px' : '14px',
									background: '#007bff',
									color: 'white',
									borderRadius: '20px',
									cursor: 'pointer',
									boxShadow: '0 0 10px rgba(0,0,0,0.2)',
									zIndex: 200,
								}}>
								New Messages ↓
							</button>
						)}

						<CustomDialog
							openModal={isDeleteMessageOpen}
							closeModal={() => {
								setIsDeleteMessageOpen(false);
								setMessageIdToDelete('');
							}}
							maxWidth='xs'
							title='Delete Message'
							content={`Are you sure you want to delete this message?`}>
							<CustomDialogActions
								deleteBtn
								deleteBtnText='Delete'
								onCancel={() => {
									setIsDeleteMessageOpen(false);
									setMessageIdToDelete('');
								}}
								onDelete={() => {
									handleDeleteMessage(messageIdToDelete);
									setIsDeleteMessageOpen(false);
									setMessageIdToDelete('');
								}}
								actionSx={{ mb: '0.5rem' }}
							/>
						</CustomDialog>

						{zoomedImage && (
							<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
								<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.25rem' }} />
							</Dialog>
						)}

						{replyToMessage && activeChat && (
							<Box
								sx={{
									border: '0.01rem solid lightgray',
									padding: isMobileSize ? '0.5rem' : '0.75rem',
									position: 'relative',
								}}>
								<Typography
									variant='body2'
									sx={{ color: 'gray', mb: isMobileSize ? '0.15rem' : '0.35rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
									Replying to:
								</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.8rem', lineHeight: isMobileSize ? '1.6' : '1.8' }}>
									{replyToMessage.text}
								</Typography>
								<IconButton size='small' sx={{ position: 'absolute', top: '0.2rem', right: '0.2rem' }} onClick={() => setReplyToMessage(null)}>
									<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
								</IconButton>
							</Box>
						)}

						{/* Input Box */}
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								borderTop: '0.04rem solid gray',
								padding: isMobileSize ? '0.25rem' : '0.75rem',
								flexShrink: 0,
								position: 'relative',
							}}>
							<MessageInput
								activeChat={activeChat}
								user={user}
								refreshChatList={refreshChatList}
								refreshUploadStats={refreshUploadStats}
								hasLeftParticipants={hasLeftParticipants}
								isGroupChat={isGroupChat}
								isBlockingUser={isBlockingUser || false}
								messagesEndRef={messagesEndRef}
								setChatList={setChatList}
								setFilteredChatList={setFilteredChatList}
								replyToMessage={replyToMessage}
								setReplyToMessage={setReplyToMessage}
								isMobileSize={isMobileSize}
								isRotatedMedium={isRotatedMedium}
								isVerySmallScreen={isVerySmallScreen}
								isRotated={isRotated}
								uploadInfo={uploadInfo}
								getRemainingImageUploads={getRemainingImageUploads}
								getImageLimit={getImageLimit}
								getFormattedResetTime={getFormattedResetTime}
								checkCanUploadImage={checkCanUploadImage}
								checkCanUploadAudio={checkCanUploadAudio}
								incrementImageUpload={incrementImageUpload}
							/>
						</Box>
					</Box>
				)}
			</Box>

			{/* Custom Dialog for User Search */}
			<CustomDialog
				openModal={addUserModalOpen}
				closeModal={() => {
					setAddUserModalOpen(false);
					setSearchValue('');
					setErrorMsg('');
				}}
				title='Find User'
				maxWidth='sm'>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						mb: filteredUsers && filteredUsers.length === 0 ? '1rem' : '0rem',
					}}>
					<UserSearchSelect
						key={`search-${errorMsg ? 'error' : 'normal'}`}
						context='messages'
						userRole={user?.role === 'instructor' ? 'admin' : hasAdminAccess ? 'admin' : 'learner'}
						value={searchValue}
						onChange={(value) => {
							setSearchValue(value);
							// Clear error message when user starts typing
							if (errorMsg) {
								setErrorMsg('');
							}
						}}
						onSelect={handleSearchUserSelection}
						currentUserId={user?.firebaseUserId}
						blockedUsers={globalBlockedUsers}
						placeholder={hasAdminAccess ? 'Search by username, name, or email' : 'Search users by username or name'}
						sx={{ width: '80%' }}
						listSx={{
							margin: '-0.85rem auto 0 0.5rem',
							width: isMobileSize ? '90%' : '70%',
							paddingTop: isMobileSize ? '0' : filteredUsers.length < 6 ? '0rem' : '2.5rem',
						}}
					/>
					{errorMsg && (
						<Box sx={{ mt: '-1rem', width: '90%' }}>
							<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
						</Box>
					)}
				</Box>

				<DialogActions sx={{ mt: '-1rem' }}>
					<CustomCancelButton
						onClick={() => setAddUserModalOpen(false)}
						sx={{ margin: '0rem 1.25rem 0.75rem 0', fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>

			<GroupChatModal
				createGroupModalOpen={createGroupModalOpen}
				groupName={groupName}
				groupImageUrl={groupImageUrl}
				enterGroupImageUrl={enterGroupImageUrl}
				selectedGroupUsers={selectedGroupUsers}
				groupSearchValue={groupSearchValue}
				user={user}
				blockedUsers={globalBlockedUsers}
				onCloseModal={() => {
					setCreateGroupModalOpen(false);
					resetGroupChatForm();
				}}
				onGroupNameChange={(e) => setGroupName(e.target.value)}
				onGroupImageUpload={(url) => setGroupImageUrl(url)}
				onGroupImageUrlChange={(e) => setGroupImageUrl(e.target.value)}
				onEnterGroupImageUrlChange={setEnterGroupImageUrl}
				onGroupUserSelection={handleGroupUserSelection}
				onRemoveGroupUser={removeGroupUser}
				onGroupSearchChange={setGroupSearchValue}
				onCreateGroupChat={() => {
					if (!groupName.trim() || selectedGroupUsers.length === 0) return;
					createGroupChat(groupName.trim(), groupImageUrl.trim() || '', selectedGroupUsers);
					// Reset form fields
					resetGroupChatForm();
					setCreateGroupModalOpen(false);
				}}
			/>

			<GroupChatEditModal
				editGroupModalOpen={editGroupModalOpen}
				activeChat={activeChat}
				groupName={groupName}
				groupImageUrl={groupImageUrl}
				selectedGroupUsers={selectedGroupUsers}
				groupSearchValue={groupSearchValue}
				removedMembers={removedMembers}
				user={user}
				blockedUsers={globalBlockedUsers}
				onCloseModal={() => {
					setEditGroupModalOpen(false);
					resetGroupChatEditForm();
				}}
				onGroupNameChange={(e) => setGroupName(e.target.value)}
				onGroupImageUpload={(url) => setGroupImageUrl(url)}
				onGroupImageUrlChange={(e) => setGroupImageUrl(e.target.value)}
				onGroupUserSelection={handleGroupUserSelection}
				onRemoveGroupUser={removeGroupUser}
				onRemoveExistingMember={removeExistingGroupMember}
				onRestoreExistingMember={restoreExistingGroupMember}
				onGroupSearchChange={setGroupSearchValue}
				onUpdateGroupChat={() => {
					if (!groupName.trim() || !activeChat || !isGroupChat(activeChat)) return;
					updateGroupChat(activeChat.chatId, groupName.trim(), groupImageUrl.trim() || '', selectedGroupUsers, removedMembers);
					// Reset form/UI
					resetGroupChatEditForm();
					setEditGroupModalOpen(false);
				}}
				onDeleteGroupChat={() => {
					if (!activeChat || (!hasAdminAccess && !(user?.role === 'instructor' && activeChat.createdBy === user?.firebaseUserId))) return;
					setIsDeleteGroupDialogOpen(true);
				}}
			/>

			<GroupMembersModal membersModalOpen={membersModalOpen} activeChat={activeChat} onCloseModal={() => setMembersModalOpen(false)} />

			{/* Delete Chat Dialog */}
			<CustomDialog
				openModal={isDeleteChatDialogOpen}
				closeModal={() => {
					setIsDeleteChatDialogOpen(false);
					setChatIdToDelete('');
				}}
				title='Remove Chat'
				maxWidth='sm'>
				<Box sx={{ p: 2, mt: '-1rem' }}>
					<Typography variant='body2' sx={{ mb: 2, textAlign: 'center', fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Choose how to remove this chat:
					</Typography>

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{/* Hide Chat Option - Available for all users */}
						<Box
							sx={{
								'p': 2,
								'border': '1px solid #e0e0e0',
								'borderRadius': 1,
								'cursor': 'pointer',
								'transition': 'background-color 0.3s ease',
								'&:hover': {
									backgroundColor: 'lightblue',
								},
							}}
							onClick={async () => {
								try {
									await handleHideChat(chatIdToDelete);
								} catch (error) {
									console.error('Error hiding chat:', error);
								}
								setIsDeleteChatDialogOpen(false);
								setChatIdToDelete('');
							}}>
							<Typography variant='h6' sx={{ mb: 1, color: 'primary.main', fontSize: isMobileSize ? '0.8rem' : undefined }}>
								Hide Chat
							</Typography>
							<Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: '1.7', fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Chat will be hidden from your list but can be restored later. You can still receive messages from this chat.
							</Typography>
							{activeChat?.chatType !== 'group' && (
								<Typography
									variant='body2'
									sx={{ color: 'text.secondary', lineHeight: '1.7', mt: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}>
									You can also resume chatting after using "Find User" dialog.
								</Typography>
							)}
						</Box>

						{/* Leave Chat Option - Available for learners, not for admins in group chats */}
						{(() => {
							const chatToDelete = chatList?.find((chat) => chat.chatId === chatIdToDelete);
							const isGroupChat = chatToDelete?.chatType === 'group';
							// Show leave option for learners, or for admins/owner/super-admin in 1-1 chats
							if (!hasAdminAccess || !isGroupChat) {
								return (
									<Box
										sx={{
											'p': 2,
											'border': '1px solid #ff6b6b',
											'borderRadius': 1,
											'cursor': 'pointer',
											'transition': 'background-color 0.3s ease',
											'&:hover': {
												backgroundColor: '#FFB6C1',
											},
										}}
										onClick={async () => {
											if (!user?.firebaseUserId) return;
											try {
												await handleLeaveChat(chatIdToDelete);
											} catch (err) {
												console.error('Error leaving chat:', err);
												alert('Failed to leave chat. Please try again.');
											}
											setIsDeleteChatDialogOpen(false);
											setChatIdToDelete('');
										}}>
										<Typography variant='h6' sx={{ mb: 1, color: 'error.main', fontSize: isMobileSize ? '0.8rem' : undefined }}>
											Leave Chat Permanently
										</Typography>
										<Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: '1.7', fontSize: isMobileSize ? '0.7rem' : undefined }}>
											You will be removed from this conversation. You won't receive future messages from this chat.
										</Typography>
										{!isGroupChat && (
											<Typography
												variant='caption'
												sx={{
													mt: 2,
													color: 'text.secondary',
													textAlign: 'center',
													display: 'block',
													lineHeight: '1.7',
													fontSize: isMobileSize ? '0.65rem' : undefined,
												}}>
												Note: You can start a new conversation with this person later if neither of you has blocked the other.
											</Typography>
										)}
									</Box>
								);
							}
							return null;
						})()}
					</Box>
				</Box>
			</CustomDialog>

			{/* Delete Group Chat Confirmation Dialog */}
			<CustomDialog openModal={isDeleteGroupDialogOpen} closeModal={() => setIsDeleteGroupDialogOpen(false)} title='Delete Group Chat' maxWidth='xs'>
				<DialogContent>
					<Box sx={{ mt: '-0rem', p: 1 }}>
						<Typography variant='body2' sx={{ mb: 2 }}>
							Are you sure you want to delete the group "{activeChat?.groupName}"?
						</Typography>
						<Typography variant='body2' sx={{ textAlign: 'center', color: 'error.main', fontSize: '0.75rem' }}>
							This action cannot be undone and will permanently delete all messages and data for all participants.
						</Typography>
					</Box>
				</DialogContent>
				<CustomDialogActions
					deleteBtn
					deleteBtnText='Delete Group'
					onCancel={() => setIsDeleteGroupDialogOpen(false)}
					onDelete={confirmDeleteGroupChat}
					actionSx={{ mb: '0.5rem' }}
				/>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default Messages;
