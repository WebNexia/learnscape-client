import { Badge, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Cancel, Search, AddBox, Chat, DoNotDisturbAlt } from '@mui/icons-material';
import CustomTextField from '../forms/customFields/CustomTextField';
import theme from '../../themes';
import { formatMessageTime } from '../../utils/formatTime';
import { Chat as ChatType } from '../../pages/Messages';
import { useAuth } from '../../hooks/useAuth';

interface ChatListProps {
	filteredChatList: ChatType[];
	activeChatId: string;
	searchChatValue: string;
	isChatsListVisible: boolean;
	isVerySmallScreen: boolean;
	isMobileSize: boolean;
	user: any;
	isLoadingChatList?: boolean;
	onFilterChats: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSetActiveChat: (chat: ChatType) => void;
	onDeleteChat: (chatId: string) => void;
	onAddUserClick: () => void;
	onCreateGroupClick: () => void;
	onChatsListToggle: () => void;
	getChatDisplayName: (chat: ChatType) => string;
	getChatDisplayImage: (chat: ChatType) => string;
	isGroupChat: (chat: ChatType) => boolean;
	globalBlockedUsers?: string[];
}

const ChatList = ({
	filteredChatList,
	activeChatId,
	searchChatValue,
	isChatsListVisible,
	isVerySmallScreen,
	isMobileSize,
	user,
	isLoadingChatList = false,
	onFilterChats,
	onSetActiveChat,
	onDeleteChat,
	onAddUserClick,
	onCreateGroupClick,
	onChatsListToggle,
	getChatDisplayName,
	getChatDisplayImage,
	isGroupChat,
	globalBlockedUsers,
}: ChatListProps) => {
	const { hasAdminAccess } = useAuth();
	return (
		<>
			{!isChatsListVisible && isVerySmallScreen && (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						height: 'calc(100vh - 4rem)',
						width: '1.35rem',
						borderRight: '1px solid rgba(1, 67, 90, 0.1)',
						'&:hover': { backgroundColor: 'rgba(1, 67, 90, 0.03)' },
					}}
					onClick={onChatsListToggle}>
					<IconButton sx={{ '&:hover': { backgroundColor: 'rgba(1, 67, 90, 0.06)' } }}>
						<Search fontSize='medium' />
					</IconButton>
				</Box>
			)}
			{(isChatsListVisible || !isVerySmallScreen) && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						flex: 3,
						borderRight: '1px solid rgba(1, 67, 90, 0.1)',
						padding: isMobileSize ? '0 0rem 0 0.5rem' : '0 0rem 0 1rem',
						boxShadow: '2px 0 12px rgba(1, 67, 90, 0.06)',
					}}>
					<Box sx={{ display: 'flex', margin: '0.5rem auto 0 auto', width: '100%', height: '3rem', paddingTop: '0.5rem' }}>
						<Box sx={{ flex: 8 }}>
							<CustomTextField
								InputProps={{
									sx: {
										'& .MuiInputBase-input': {
											'&::placeholder': {
												color: '#666 !important',
												fontSize: isMobileSize ? '0.6rem !important' : '0.7rem !important',
												opacity: '0.8 !important',
												fontWeight: '300 !important',
											},
										},
									},
									endAdornment: <Search sx={{ mr: '-0.5rem', color: 'gray' }} fontSize='small' />,
								}}
								placeholder='Username or Group Name'
								value={searchChatValue}
								onChange={onFilterChats}
								disabled={!user?.hasRegisteredCourse && !hasAdminAccess && !user?.isSubscribed}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Tooltip title='Find User' placement='top' arrow>
								<IconButton
									disabled={!user?.hasRegisteredCourse && user?.role === 'learner' && !user?.isSubscribed}
									sx={{ '&:hover': { backgroundColor: 'rgba(1, 67, 90, 0.1)' } }}
									onClick={onAddUserClick}>
									<AddBox fontSize={isMobileSize ? 'small' : 'medium'} />
								</IconButton>
							</Tooltip>
						</Box>
						{(hasAdminAccess || user?.role === 'instructor') && (
							<Box sx={{ flex: 1 }}>
								<Tooltip title='Create Group Chat' placement='top' arrow>
									<IconButton sx={{ '&:hover': { backgroundColor: 'rgba(1, 67, 90, 0.1)' } }} onClick={onCreateGroupClick}>
										<Chat fontSize={isMobileSize ? 'small' : 'medium'} />
									</IconButton>
								</Tooltip>
							</Box>
						)}
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem', overflow: 'auto', width: '100%' }}>
						{isLoadingChatList ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
								<Typography variant='body2' sx={{ color: 'text.secondary' }}>
									Loading chats...
								</Typography>
							</Box>
						) : (
							filteredChatList?.map((chat) => {
								const isGroup = isGroupChat(chat);
								const chatDisplayName = getChatDisplayName(chat);
								const chatDisplayImage = getChatDisplayImage(chat);
								const participantCount = chat.participants.length;

								return (
									<Box
										key={`${chat.chatId}-${chat.participants[0].firebaseUserId}`}
										sx={{
											'display': 'flex',
											'border': '1px solid rgba(1, 67, 90, 0.06)',
											'borderRight': 'none',
											'borderBottom': 'none',
											'transition': 'background-color 0.2s ease',
											'&:hover': {
												backgroundColor: chat.chatId === activeChatId ? undefined : 'rgba(1, 67, 90, 0.03)',
											},
											'&:last-of-type': {
												borderBottom: '1px solid rgba(1, 67, 90, 0.06)',
												borderBottomLeftRadius: '0.5rem',
											},
											'&:first-of-type': {
												borderTopLeftRadius: '0.5rem',
											},
											'backgroundImage': chat.chatId === activeChatId ? `url(/msg-bg.png)` : null,
											'backgroundRepeat': 'no-repeat',
											'backgroundSize': 'cover',
											'backgroundPosition': 'center',
										}}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'start',
												padding: isMobileSize ? '0.35rem' : '0.5rem',
												cursor: 'pointer',
												flex: 6,
											}}
											onClick={() => {
												onSetActiveChat(chat);
											}}>
											<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
												<Box sx={{ borderRadius: '100%', marginRight: '0.25rem' }}>
													<Badge
														color='error'
														variant='dot'
														invisible={!chat.hasUnreadMessages}
														sx={{
															'margin': '0 0.5rem 0 0',
															'& .MuiBadge-badge': {
																fontSize: '0.6rem',
																height: '0.65rem',
																width: '0.65rem',
																borderRadius: '50%',
																right: 7,
																top: 2,
															},
														}}>
														<img
															src={chatDisplayImage || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
															alt='profile_img'
															onError={(e) => {
																e.currentTarget.src = 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg';
															}}
															style={{
																height: isMobileSize ? '1.75rem' : '2.5rem',
																width: isMobileSize ? '1.75rem' : '2.5rem',
																borderRadius: '100%',
																border: '2px solid rgba(1, 67, 90, 0.12)',
																boxShadow: '0 2px 8px rgba(1, 67, 90, 0.08)',
															}}
														/>
													</Badge>
												</Box>
												<Box>
													<Typography
														variant='body2'
														sx={{
															display: 'flex',
															alignItems: 'center',
															color: chat.chatId === activeChatId ? theme.textColor?.common.main : null,
															fontSize: isMobileSize ? '0.65rem' : '0.8rem',
														}}>
														{chatDisplayName}
														{(() => {
															if (isGroup) return null;

															// Check if current user has blocked any participant in this chat
															const hasBlockedParticipant =
																chat.participants?.some(
																	(participant) =>
																		participant.firebaseUserId !== user?.firebaseUserId && globalBlockedUsers?.includes(participant.firebaseUserId)
																) || false;

															return hasBlockedParticipant ? <DoNotDisturbAlt fontSize='small' sx={{ color: 'gray', marginLeft: '0.5rem' }} /> : null;
														})()}
														{isGroup && (
															<Typography
																variant='caption'
																sx={{
																	color: chat.chatId === activeChatId ? theme.textColor?.common.main : 'gray',
																	fontSize: isMobileSize ? '0.55rem' : '0.7rem',
																	marginLeft: '0.5rem',
																}}>
																({participantCount} members)
															</Typography>
														)}
													</Typography>
												</Box>
											</Box>
											<Box
												sx={{
													marginTop: '0.2rem',
												}}>
												<Typography
													variant='caption'
													sx={{
														color: chat.chatId === activeChatId ? theme.textColor?.common.main : 'gray',
														fontSize: isMobileSize ? '0.6rem' : undefined,
													}}>
													{chat.lastMessage.text.length > 20 ? `${chat.lastMessage.text.substring(0, 20)}...` : chat.lastMessage.text}
												</Typography>
											</Box>
										</Box>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
												flex: 1,
												mr: isMobileSize ? '0rem' : '0.2rem',
											}}>
											<Tooltip title='Remove Chat' placement='top' arrow>
												<IconButton
													onClick={() => onDeleteChat(chat.chatId)}
													sx={{
														'&:hover': {
															backgroundColor: 'rgba(1, 67, 90, 0.1)',
														},
													}}>
													<Cancel
														fontSize='small'
														sx={{
															color: chat.chatId === activeChatId ? theme.textColor?.common.main : theme.palette.primary.main,
															fontSize: isMobileSize ? '0.8rem' : undefined,
														}}
													/>
												</IconButton>
											</Tooltip>
											<Typography
												variant='caption'
												sx={{
													color: chat.chatId !== activeChatId ? 'gray' : '#fff',
													fontSize: isMobileSize ? '0.55rem' : '0.65rem',
													mt: '0.25rem',
												}}>
												{chat.lastMessage.timestamp ? formatMessageTime(chat.lastMessage.timestamp) : null}
											</Typography>
										</Box>
									</Box>
								);
							})
						)}
					</Box>
				</Box>
			)}
		</>
	);
};

export default ChatList;
