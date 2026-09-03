import { isLearnerRole } from '../../interfaces/enums';
import { Badge, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Cancel, Search, AddBox, Chat, DoNotDisturbAlt } from '@mui/icons-material';
import CustomTextField from '../forms/customFields/CustomTextField';
import theme from '../../themes';
import { formatMessageTime } from '../../utils/formatTime';
import { Chat as ChatType } from '../../pages/Messages';
import { useAuth } from '../../hooks/useAuth';
import { useLearnerPlatformAccess } from '../../hooks/useLearnerPlatformAccess';
import { LEARNER_SAAS } from '../../constants/learnerSaasUi';

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
	const hasPlatformAccess = useLearnerPlatformAccess();
	const isActiveChat = (chatId: string) => chatId === activeChatId;
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
						backgroundColor: LEARNER_SAAS.chatListPanelBg,
						borderRight: `1px solid ${LEARNER_SAAS.border}`,
						padding: isMobileSize ? '0 0.5rem 0 0.5rem' : '0 0.75rem 0 0.75rem',
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
								disabled={!hasPlatformAccess && !hasAdminAccess}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Tooltip title='Find User' placement='top' arrow>
								<IconButton
									disabled={!hasPlatformAccess && isLearnerRole(user?.role)}
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

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: '0.35rem',
							marginTop: '0.5rem',
							paddingBottom: '0.5rem',
							overflow: 'auto',
							width: '100%',
						}}>
						{isLoadingChatList && filteredChatList.length === 0 ? (
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
								const participants = Array.isArray(chat.participants) ? chat.participants.filter(Boolean) : [];
								const participantCount = participants.length;
								const firstParticipantId = participants[0]?.firebaseUserId || 'unknown';
								const lastMessageText = chat.lastMessage?.text || '';

								return (
									<Box
										key={`${chat.chatId}-${firstParticipantId}`}
										sx={{
											'display': 'flex',
											'borderRadius': '0.5rem',
											'border': `1px solid ${isActiveChat(chat.chatId) ? 'rgba(1, 67, 90, 0.18)' : LEARNER_SAAS.border}`,
											'transition': 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
											'&:hover': {
												backgroundColor: isActiveChat(chat.chatId) ? LEARNER_SAAS.chatListItemActiveBg : LEARNER_SAAS.chatListItemHoverBg,
												borderColor: isActiveChat(chat.chatId) ? 'rgba(1, 67, 90, 0.22)' : LEARNER_SAAS.border,
											},
											'backgroundColor': isActiveChat(chat.chatId) ? LEARNER_SAAS.chatListItemActiveBg : LEARNER_SAAS.chatListItemBg,
											'borderLeft': isActiveChat(chat.chatId) ? `3px solid ${LEARNER_SAAS.chatListActiveAccent}` : `1px solid ${LEARNER_SAAS.border}`,
											'boxShadow': isActiveChat(chat.chatId) ? '0 2px 8px rgba(1, 67, 90, 0.08)' : 'none',
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
															color: isActiveChat(chat.chatId) ? LEARNER_SAAS.pageTitleColor : undefined,
															fontSize: isMobileSize ? '0.65rem' : '0.8rem',
															fontWeight: isActiveChat(chat.chatId) ? 600 : 500,
														}}>
														{chatDisplayName}
														{(() => {
															if (isGroup) return null;

															// Check if current user has blocked any participant in this chat
															const hasBlockedParticipant =
																participants.some(
																	(participant) =>
																		participant?.firebaseUserId &&
																		participant.firebaseUserId !== user?.firebaseUserId &&
																		globalBlockedUsers?.includes(participant.firebaseUserId)
																) || false;

															return hasBlockedParticipant ? <DoNotDisturbAlt fontSize='small' sx={{ color: 'gray', marginLeft: '0.5rem' }} /> : null;
														})()}
														{isGroup && (
															<Typography
																variant='caption'
																sx={{
																	color: LEARNER_SAAS.secondaryText,
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
														color: LEARNER_SAAS.secondaryText,
														fontSize: isMobileSize ? '0.6rem' : undefined,
													}}>
													{lastMessageText.length > 20 ? `${lastMessageText.substring(0, 20)}...` : lastMessageText}
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
															color: isActiveChat(chat.chatId) ? LEARNER_SAAS.secondaryText : theme.palette.primary.main,
															fontSize: isMobileSize ? '0.8rem' : undefined,
														}}
													/>
												</IconButton>
											</Tooltip>
											<Typography
												variant='caption'
												sx={{
													color: LEARNER_SAAS.secondaryText,
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
