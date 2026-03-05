import { Box, Dialog, DialogActions, DialogContent, IconButton, Tooltip, Typography } from '@mui/material';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import { Delete, Edit, Flag, OpenInFullOutlined, TurnLeftOutlined, Verified } from '@mui/icons-material';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useContext, useEffect, useState } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import { CustomAudioPlayer } from '../../../../components/audio';

import CustomDialog from '../../dialog/CustomDialog';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import EditMessageDialog from './EditMessageDialog';
import { renderMessageWithEmojis } from '../../../../utils/renderMessageWithEmojis';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import { CommunityMessagesContext } from '../../../../contexts/CommunityMessagesContextProvider';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { truncateText } from '../../../../utils/utilText';
import { db } from '../../../../firebase';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import CustomCancelButton from '../../../../components/forms/customButtons/CustomCancelButton';
import { stripHtml } from '@utils/stripHtml';
import { decode } from 'html-entities';
import { useAuth } from '../../../../hooks/useAuth';

interface MessageProps {
	message: CommunityMessage;
	isFirst?: boolean;
	isLast?: boolean;
	isTopicLocked: boolean;
	topicTitle: string;
	setReplyToMessage: React.Dispatch<React.SetStateAction<CommunityMessage | null>>;
	messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setHighlightedMessageId: React.Dispatch<React.SetStateAction<string>>;
	renderMessageContent: (text: string) => (string | JSX.Element | undefined)[];
}

const Message = ({
	message,
	isFirst,
	isLast,
	isTopicLocked,
	topicTitle,
	setReplyToMessage,
	messageRefs,
	setPageNumber,
	setHighlightedMessageId,
	renderMessageContent,
}: MessageProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { adminUsers } = useContext(OrganisationContext);
	const { removeMessage, updateMessage } = useContext(CommunityMessagesContext);
	const { hasAdminAccess } = useAuth();
	const isAdmin: boolean = hasAdminAccess;
	const isMessageWriter: boolean = user?._id === message?.userId?._id;

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [deleteMessageModalOpen, setDeleteMessageModalOpen] = useState<boolean>(false);
	const [isDeletingMessage, setIsDeletingMessage] = useState<boolean>(false);
	const [reportMsgModalOpen, setReportMsgModalOpen] = useState<boolean>(false);
	const [resolveReportModalOpen, setResolveReportModalOpen] = useState<boolean>(false);
	const [editMsgModalOpen, setEditMsgModalOpen] = useState<boolean>(false);

	const [zoomedImage, setZoomedImage] = useState<string | undefined>('');
	const [isMessageScrollable, setIsMessageScrollable] = useState<boolean>(false);
	const [isFullViewOpen, setIsFullViewOpen] = useState<boolean>(false);

	const [isMsgEdited, setIsMsgEdited] = useState<boolean>(message.updatedAt > message.createdAt);

	useEffect(() => {
		if (messageRefs.current) {
			messageRefs.current[message._id] = messageRefs.current[message._id] || null;
		}
	}, [message._id, messageRefs]);

	// Function to check if message content is scrollable
	const checkMessageScrollable = () => {
		const messageElement = messageRefs.current[message._id];
		if (messageElement) {
			const element = messageElement;

			// Check if content is actually scrollable (overflow detected)
			const isScrollable = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
			setIsMessageScrollable(isScrollable);
		}
	};

	// Check scrollability when message changes
	useEffect(() => {
		// Use a delay to ensure content is fully rendered
		const timer = setTimeout(() => {
			checkMessageScrollable();
		}, 300);

		return () => clearTimeout(timer);
	}, [message.text, message.imageUrl]);

	// Check scrollability on window resize
	useEffect(() => {
		const handleResize = () => {
			checkMessageScrollable();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const deleteMessage = async () => {
		setIsDeletingMessage(true);
		try {
			await axios.delete(`${base_url}/communityMessages/${message._id}`);

			removeMessage(message._id);
			setDeleteMessageModalOpen(false);
		} catch (error) {
			console.log(error);
		} finally {
			setIsDeletingMessage(false);
		}
	};

	const scrollToParentMessage = async (parentMessageId: string) => {
		const parentMessageElement = messageRefs.current[parentMessageId];

		if (parentMessageElement) {
			// Scroll the element into view on the current page
			parentMessageElement.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});

			// Highlight the message temporarily
			parentMessageElement.classList.add('highlight-community-message');
			setTimeout(() => {
				parentMessageElement.classList.remove('highlight-community-message');
			}, 2500);
		} else {
			// If the message is not found on the current page, navigate to the page where it's located
			try {
				const response = await axios.get(`${base_url}/communityMessages/message/${parentMessageId}?limit=30`);
				const { page } = response.data;
				setPageNumber(page);
				setHighlightedMessageId(parentMessageId);
			} catch (error) {
				console.error('Failed to fetch the parent message details', error);
			}
		}
	};

	const reportMessage = async () => {
		try {
			await axios.patch(`${base_url}/communityMessages/${message?._id}`, {
				isReported: true,
			});

			setReportMsgModalOpen(false);

			updateMessage(message._id, { isReported: true });

			// Send notifications AFTER message is marked as reported (non-blocking)
			const notificationData = {
				title: 'Message Reported',
				message: `${user?.username} reported the message "${truncateText(message.text, 30)}" in ${truncateText(topicTitle, 25)} in community topics`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'ReportMessage',
				userImageUrl: user?.imageUrl,
				communityTopicId: message.topicId,
				communityMessageId: message._id,
			};

			// Use batch operation with content-based deduplication (non-blocking)
			const batch = writeBatch(db);
			const usersAlreadyNotified = new Set<string>();

			// Send notifications to each admin
			for (const admin of adminUsers) {
				if (admin.firebaseUserId && !usersAlreadyNotified.has(admin.firebaseUserId)) {
					const notificationDocRef = doc(db, 'notifications', admin.firebaseUserId, 'userNotifications', `message-report-${message._id}`);
					batch.set(notificationDocRef, notificationData, { merge: true });
					usersAlreadyNotified.add(admin.firebaseUserId);
				}
			}

			// Non-blocking notification - message reporting success is not dependent on notification success
			batch.commit().catch((error) => {
				console.warn('Failed to send message report notifications:', error);
			});
		} catch (error) {
			console.log(error);
		}
	};

	const resolveReport = async () => {
		try {
			await axios.patch(`${base_url}/communityMessages/${message?._id}`, {
				isReported: false,
			});

			setResolveReportModalOpen(false);
			updateMessage(message._id, { isReported: false });
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'flex-end',
				width: '100%',
				minHeight: '3.5rem',
				border: '1px solid rgba(1, 67, 90, 0.06)',
				borderBottom: isLast ? '1px solid rgba(1, 67, 90, 0.06)' : 'none',
				borderRadius: 'none',
				backgroundColor: '#fff',
				transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
				'&:hover': {
					backgroundColor: 'rgba(1, 67, 90, 0.05)',
					boxShadow: '0 2px 12px rgba(1, 67, 90, 0.1)',
				},
				...(isFirst && {
					borderTopLeftRadius: '0.75rem',
					borderTopRightRadius: '0.75rem',
				}),
				...(isLast && {
					borderBottomLeftRadius: '0.75rem',
					borderBottomRightRadius: '0.75rem',
				}),
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					flex: 1,
					padding: isMobileSize ? '0.5rem 0.35rem' : '0.75rem 0.5rem',
					borderRight: '1px solid rgba(1, 67, 90, 0.06)',
					minWidth: isMobileSize ? '5rem' : '7rem',
					maxWidth: isMobileSize ? '5rem' : '7rem',
					gap: '0.25rem',
				}}>
				<Box
					sx={{
						'& img': {
							height: isMobileSize ? '2rem' : '2.5rem',
							width: isMobileSize ? '2rem' : '2.5rem',
							borderRadius: '50%',
							objectFit: 'cover',
							border: '2px solid rgba(1, 67, 90, 0.18)',
							boxShadow: '0 2px 12px rgba(1, 67, 90, 0.14)',
						},
					}}>
					<img
						src={message?.userId?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
						alt='profile'
						onError={(e) => {
							e.currentTarget.src = 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg';
						}}
					/>
				</Box>
				<Box>
					<Typography
						sx={{
							fontSize: isMobileSize ? '0.65rem' : '0.8rem',
							fontWeight: 600,
							color: 'rgba(1, 67, 90, 0.9)',
							letterSpacing: '0.01em',
						}}>
						{message?.userId?.username}
					</Typography>
				</Box>
				<Box>
					<Typography
						variant='caption'
						sx={{
							fontSize: isMobileSize ? '0.5rem' : '0.6rem',
							color: 'rgba(1, 67, 90, 0.5)',
							letterSpacing: '0.02em',
						}}>
						{formatMessageTime(message?.createdAt)}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 8 }}>
				<Box>
					{message.parentMessageId && (
						<Box
							sx={{
								margin: isMobileSize ? '0.35rem' : '0.5rem',
								borderLeft: '3px solid rgba(1, 67, 90, 0.18)',
								minHeight: isMobileSize ? '3rem' : '4rem',
								maxHeight: isMobileSize ? '5.5rem' : '7rem',
								overflow: 'auto',
								backgroundColor: 'rgba(1, 67, 90, 0.05)',
								borderRadius: '0 0.35rem 0.35rem 0',
								transition: 'background-color 0.2s ease',
								'&:hover': { backgroundColor: 'rgba(1, 67, 90, 0.09)' },
							}}>
							{typeof message.parentMessageId === 'object' && message.parentMessageId.userId && (
								<Box
									onClick={() => {
										if (typeof message.parentMessageId === 'object' && message.parentMessageId !== null && 'userId' in message.parentMessageId) {
											scrollToParentMessage(message.parentMessageId._id);
										}
									}}
									sx={{ cursor: 'pointer' }}>
									<Box sx={{ padding: '0.2rem 0.6rem' }}>
										<Typography
											sx={{
												fontSize: isMobileSize ? '0.6rem' : '0.7rem',
												fontWeight: 500,
												fontStyle: 'italic',
												mb: '0.25rem',
												color: 'rgba(1, 67, 90, 0.65)',
											}}>
											{message.parentMessageId.userId.username}
										</Typography>
									</Box>
									<Box sx={{ padding: '0.35rem 0.6rem' }}>
										<Box>
											<Typography
												sx={{
													fontSize: isMobileSize ? '0.55rem' : '0.75rem',
													lineHeight: 1.5,
													fontStyle: 'italic',
													color: 'rgba(1, 67, 90, 0.6)',
												}}>
												{renderMessageWithEmojis(message.parentMessageId.text, '1rem', isMobileSize)}
											</Typography>
										</Box>
										{message.parentMessageId.imageUrl && (
											<Box>
												<img
													src={message.parentMessageId.imageUrl}
													alt='img'
													style={{ maxHeight: isMobileSize ? '5rem' : '7rem', objectFit: 'contain', borderRadius: '0.15rem', margin: '0.5rem 0' }}
												/>
											</Box>
										)}
										{message.parentMessageId.audioUrl && (
											<Box sx={{ mt: 1 }}>
												<CustomAudioPlayer
													audioUrl={message.parentMessageId.audioUrl}
													title={`Reply to ${message.parentMessageId.userId?.username || 'User'}`}
													sx={{ maxWidth: isMobileSize ? '90%' : '300px' }}
												/>
											</Box>
										)}
									</Box>
								</Box>
							)}
						</Box>
					)}

					<Box
						ref={(el: HTMLDivElement | null) => (messageRefs.current[message._id] = el)}
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'space-between',
							minHeight: isMobileSize ? '3rem' : '5rem',
							maxHeight: isMobileSize ? '5rem' : '10rem',
							overflow: 'auto',
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 9 }}>
							<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
								<Box>
									<Typography
										sx={{
											lineHeight: 1.65,
											margin: isMobileSize ? '0.2rem 0' : '0.5rem 0',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-word',
											fontSize: isMobileSize ? '0.8rem' : '0.9rem',
											padding: isMobileSize ? '0 0.6rem' : '0 0.75rem',
											color: 'rgba(1, 67, 90, 0.88)',
											letterSpacing: '0.01em',
										}}>
										{renderMessageContent(message?.text || '')}
									</Typography>
								</Box>
								{message.imageUrl && (
									<Box sx={{ padding: '0.25rem 0.6rem', '& img': { borderRadius: '0.35rem', boxShadow: '0 2px 14px rgba(1, 67, 90, 0.14)' } }}>
										<img
											src={message.imageUrl}
											alt='img'
											style={{ maxHeight: isMobileSize ? '8rem' : '12rem', objectFit: 'contain', cursor: 'pointer' }}
											onClick={() => setZoomedImage(message.imageUrl)}
										/>
									</Box>
								)}

								{zoomedImage && (
									<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
										<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.25rem' }} />
									</Dialog>
								)}

								{message?.audioUrl && (
									<Box sx={{ padding: '0.15rem 0.5rem' }}>
										<CustomAudioPlayer
											audioUrl={message.audioUrl}
											title={message.userId?.username || 'Community User'}
											sx={{ maxWidth: isMobileSize ? '85%' : '400px' }}
										/>
									</Box>
								)}
							</Box>
							{isMessageScrollable && (
								<Box>
									<Tooltip title='Full View' placement='top' arrow>
										<IconButton
											onClick={() => setIsFullViewOpen(true)}
											sx={{
												'&:hover': {
													backgroundColor: 'rgba(1, 67, 90, 0.1)',
												},
											}}>
											<OpenInFullOutlined fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
										</IconButton>
									</Tooltip>
								</Box>
							)}
							<Box>
								<Tooltip title='Reply to Message' placement='right' arrow>
									<IconButton
										onClick={() => {
											setReplyToMessage(message);
										}}
										disabled={isTopicLocked}
										sx={{
											'&:hover': {
												backgroundColor: 'rgba(1, 67, 90, 0.1)',
											},
										}}>
										<TurnLeftOutlined fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
									</IconButton>
								</Tooltip>
							</Box>
						</Box>

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								width: '100%',
								justifyContent: 'space-between',
								alignItems: 'flex-end',
								mt: isMobileSize ? '1rem' : '0.5rem',
								flex: 2,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box>
									{(message.updatedAt > message.createdAt || isMsgEdited) && (
										<Typography
											sx={{
												color: 'rgba(1, 67, 90, 0.5)',
												ml: '0.5rem',
												fontStyle: 'italic',
												fontSize: isMobileSize ? '0.55rem' : '0.65rem',
												letterSpacing: '0.02em',
											}}>
											Edited
										</Typography>
									)}
								</Box>

								{!isMessageWriter && !isAdmin && (
									<Tooltip title='Report Message' placement='right' arrow>
										<IconButton
											onClick={() => setReportMsgModalOpen(true)}
											disabled={message.isReported}
											sx={{
												'&:hover': {
													backgroundColor: 'rgba(1, 67, 90, 0.1)',
												},
											}}>
											<Flag
												fontSize='small'
												color={message.isReported ? 'error' : 'inherit'}
												sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}
											/>
											{message.isReported && (
												<Typography sx={{ color: 'red', ml: '0.5rem', fontSize: '0.65rem' }}>Reported (Under Review)</Typography>
											)}
										</IconButton>
									</Tooltip>
								)}

								<CustomDialog
									openModal={reportMsgModalOpen}
									closeModal={() => setReportMsgModalOpen(false)}
									title='Report Message'
									content='Are you sure you want to report the message?'
									maxWidth='xs'>
									<CustomDialogActions deleteBtn onDelete={reportMessage} onCancel={() => setReportMsgModalOpen(false)} deleteBtnText='Report' />
								</CustomDialog>

								{!isMessageWriter && isAdmin && (
									<Tooltip title='Delete Message' placement='top' arrow>
										<IconButton
											onClick={() => setDeleteMessageModalOpen(true)}
											sx={{
												borderRadius: '50%',
												'&:hover': {
													backgroundColor: 'rgba(1, 67, 90, 0.1)',
												},
											}}>
											<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
										</IconButton>
									</Tooltip>
								)}

								{isMessageWriter && (
									<Box>
										<Tooltip title='Edit Message' placement='top' arrow>
											<IconButton
												onClick={() => setEditMsgModalOpen(true)}
												disabled={isTopicLocked}
												sx={{
													'&:hover': {
														backgroundColor: 'rgba(1, 67, 90, 0.1)',
													},
													'mr': '-0.5rem',
												}}>
												<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
											</IconButton>
										</Tooltip>
										<Tooltip title='Delete Message' placement='top' arrow>
											<IconButton
												onClick={() => setDeleteMessageModalOpen(true)}
												sx={{
													borderRadius: '50%',
													'&:hover': {
														backgroundColor: 'rgba(1, 67, 90, 0.1)',
													},
												}}>
												<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
											</IconButton>
										</Tooltip>
									</Box>
								)}

								<EditMessageDialog
									editMsgModalOpen={editMsgModalOpen}
									setEditMsgModalOpen={setEditMsgModalOpen}
									message={message}
									setIsMsgEdited={setIsMsgEdited}
								/>

								{message.isReported && isAdmin && (
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Tooltip title='Resolve Report' placement='top' arrow>
											<IconButton
												onClick={() => setResolveReportModalOpen(true)}
												sx={{
													'&:hover': {
														backgroundColor: 'rgba(1, 67, 90, 0.1)',
													},
												}}>
												<Verified fontSize='small' />
											</IconButton>
										</Tooltip>
										<Typography sx={{ color: 'red', mr: '0.5rem', fontStyle: 'italic', fontSize: '0.65rem' }}>Reported</Typography>
									</Box>
								)}

								<CustomDialog
									openModal={resolveReportModalOpen}
									closeModal={() => setResolveReportModalOpen(false)}
									title='Resolve Report'
									content='Are you sure you want to resolve the report?'
									maxWidth='xs'>
									<CustomDialogActions
										onSubmit={resolveReport}
										onCancel={() => setResolveReportModalOpen(false)}
										submitBtnText='Resolve'
										actionSx={{ mb: '0.5rem' }}
									/>
								</CustomDialog>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
			{/* Full View Message Modal */}
			<CustomDialog openModal={isFullViewOpen} closeModal={() => setIsFullViewOpen(false)} maxWidth='sm'>
				<DialogContent>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
						<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, mb: '0.75rem', color: 'gray' }}>
							{message?.userId?.username} - {formatMessageTime(message?.createdAt)}
						</Typography>
					</Box>
					<Box sx={{ padding: '0rem 1rem' }}>
						{message.parentMessageId && (
							<Box
								sx={{
									backgroundColor: '#f1f1f1',
									borderLeft: '0.25rem solid #aaa',
									padding: '0.5rem',
									marginBottom: '0.5rem',
									borderRadius: '0.25rem',
								}}>
								<Typography sx={{ color: 'gray', fontSize: isMobileSize ? '0.6rem' : '0.75rem' }}>
									Replying to: {typeof message.parentMessageId === 'object' ? message.parentMessageId.text : 'Original message'}
								</Typography>
							</Box>
						)}

						{message.text && (
							<Typography
								sx={{
									lineHeight: isMobileSize ? 1.2 : 1.7,
									margin: isMobileSize ? '0.15rem 0' : '0.5rem 0',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									fontSize: '0.85rem',
									padding: '0rem',
								}}>
								{renderMessageContent(message?.text || '')}
							</Typography>
						)}

						{message.imageUrl ? (
							<img
								src={message.imageUrl}
								alt='uploaded'
								style={{
									height: isMobileSize ? '8rem' : '12rem',
									maxHeight: isMobileSize ? '12rem' : '16rem',
									objectFit: 'contain',
									maxWidth: '100%',
									borderRadius: '0.35rem',
									cursor: 'pointer',
								}}
								onClick={() => setZoomedImage(message.imageUrl)}
							/>
						) : (
							<Box sx={{ alignSelf: 'flex-start' }}>
								<Typography sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
									{renderMessageWithEmojis(message.text, isMobileSize ? '1.5rem' : '2rem', isMobileSize)}
								</Typography>
							</Box>
						)}

						{message.audioUrl && (
							<Box sx={{ padding: '0.15rem 0rem', mt: 2 }}>
								<CustomAudioPlayer
									audioUrl={message.audioUrl}
									title={message.userId?.username || 'Community User'}
									sx={{ maxWidth: isMobileSize ? '85%' : '400px' }}
								/>
							</Box>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton onClick={() => setIsFullViewOpen(false)} sx={{ margin: '0 1rem 0.5rem 0' }}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>

			{zoomedImage && (
				<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
					<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.25rem' }} />
				</Dialog>
			)}

			<CustomDialog
				openModal={deleteMessageModalOpen}
				closeModal={() => setDeleteMessageModalOpen(false)}
				title='Delete Message'
				content={`Are you sure you want to delete "${truncateText(stripHtml(decode(message.text)), 25)}"?`}
				maxWidth='xs'>
				<CustomDialogActions deleteBtn onDelete={deleteMessage} onCancel={() => setDeleteMessageModalOpen(false)} actionSx={{ mb: '0.5rem' }} isDeleting={isDeletingMessage} />
			</CustomDialog>
		</Box>
	);
};

export default Message;
