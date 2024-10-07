import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import { Delete, Edit, Flag, TurnLeftOutlined, Verified } from '@mui/icons-material';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useContext, useEffect, useState } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import axios from 'axios';
import CustomDialog from '../../dialog/CustomDialog';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import EditMessageDialog from './EditMessageDialog';
import { renderMessageWithEmojis } from '../../../../utils/renderMessageWithEmojis';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { truncateText } from '../../../../utils/utilText';
import { db } from '../../../../firebase';

interface MessageProps {
	message: CommunityMessage;
	isFirst?: boolean;
	isLast?: boolean;
	isTopicLocked: boolean;
	topicTitle: string;
	setMessages: React.Dispatch<React.SetStateAction<CommunityMessage[]>>;
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
	setMessages,
	setReplyToMessage,
	messageRefs,
	setPageNumber,
	setHighlightedMessageId,
	renderMessageContent,
}: MessageProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { adminUsers } = useContext(OrganisationContext);
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	const isMessageWriter: boolean = user?._id === message?.userId?._id;

	const [deleteMessageModalOpen, setDeleteMessageModalOpen] = useState<boolean>(false);
	const [reportMsgModalOpen, setReportMsgModalOpen] = useState<boolean>(false);
	const [resolveReportModalOpen, setResolveReportModalOpen] = useState<boolean>(false);
	const [editMsgModalOpen, setEditMsgModalOpen] = useState<boolean>(false);

	const [isMsgEdited, setIsMsgEdited] = useState<boolean>(message.updatedAt > message.createdAt);

	useEffect(() => {
		if (messageRefs.current) {
			messageRefs.current[message._id] = messageRefs.current[message._id] || null;
		}
	}, [message._id, messageRefs]);

	const deleteMessage = async () => {
		try {
			await axios.delete(`${base_url}/communityMessages/${message._id}`);

			setMessages((prevData) => prevData.filter((data) => data._id !== message._id));
		} catch (error) {
			console.log(error);
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
				const response = await axios.get(`${base_url}/communityMessages/message/${parentMessageId}?limit=5`);
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

			setMessages((prevData) => {
				return prevData.map((data) => {
					if (data._id === message._id) {
						return { ...data, isReported: true };
					}
					return data;
				});
			});

			// Create the notification data
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

			// Send notifications to each admin
			for (const admin of adminUsers) {
				const notificationRef = collection(db, 'notifications', admin.firebaseUserId, 'userNotifications');
				await addDoc(notificationRef, notificationData);
			}
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
			setMessages((prevData) => {
				return prevData.map((data) => {
					if (data._id === message._id) {
						return { ...data, isReported: false };
					}
					return data;
				});
			});
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Box
			ref={(el) => (messageRefs.current[message._id] = el as HTMLDivElement | null)}
			sx={{
				display: 'flex',
				justifyContent: 'flex-end',
				width: '95%',
				minHeight: '3.5rem',
				border: 'solid lightgray 0.1rem',
				borderBottom: isLast ? '0.1rem solid lightgray' : 'none',
				borderRadius: 'none',
				...(isFirst && {
					borderTopLeftRadius: '0.35rem',
					borderTopRightRadius: '0.35rem',
				}),
				...(isLast && {
					borderBottomLeftRadius: '0.35rem',
					borderBottomRightRadius: '0.35rem',
				}),
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'center',
					flex: 1,
					padding: '0.35rem',
					borderRight: 'solid lightgray 0.1rem',
				}}>
				<Box>
					<img src={message?.userId?.imageUrl} alt='profile' style={{ height: '2.25rem', width: '2.25rem', borderRadius: '50%' }} />
				</Box>
				<Box>
					<Typography sx={{ fontSize: '0.75rem' }}>{message?.userId?.username}</Typography>
				</Box>
				<Box>
					<Typography variant='caption' sx={{ fontSize: '0.55rem', color: 'gray' }}>
						{formatMessageTime(message?.createdAt)}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 8 }}>
				<Box>
					{message.parentMessageId && (
						<Box
							sx={{
								margin: '0.35rem',
								borderLeft: 'solid gray 0.3rem',
								minHeight: '4rem',
								maxHeight: '7rem',
								overflow: 'auto',
								backgroundColor: '#E8E8E8',
							}}>
							{typeof message.parentMessageId === 'object' && message.parentMessageId.userId && (
								<Box
									onClick={() => {
										if (typeof message.parentMessageId === 'object' && message.parentMessageId !== null && 'userId' in message.parentMessageId) {
											scrollToParentMessage(message.parentMessageId._id);
										}
									}}
									sx={{ cursor: 'pointer' }}>
									<Box sx={{ padding: '0.15rem 0.5rem' }}>
										<Typography sx={{ fontSize: '0.7rem', fontStyle: 'italic', mb: '0.35rem', color: 'gray' }}>
											{message.parentMessageId.userId.username}
										</Typography>
									</Box>
									<Box sx={{ padding: '0.5rem' }}>
										<Box>
											<Typography sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'gray' }}>
												{renderMessageWithEmojis(message.parentMessageId.text, '1rem')}
											</Typography>
										</Box>
										{message.parentMessageId.imageUrl && (
											<Box>
												<img
													src={message.parentMessageId.imageUrl}
													alt='img'
													style={{ maxHeight: '7rem', objectFit: 'contain', borderRadius: '0.15rem', margin: '0.5rem 0' }}
												/>
											</Box>
										)}
										{message.parentMessageId.audioUrl && (
											<Box>
												<audio
													src={message.parentMessageId.audioUrl}
													controls
													style={{
														margin: '0.25rem 0',
														boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
														borderRadius: '0.35rem',
														width: '30%',
														height: '1.5rem',
													}}
												/>
											</Box>
										)}
									</Box>
								</Box>
							)}
						</Box>
					)}

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'space-between', minHeight: '6rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 9 }}>
							<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
								<Box>
									<Typography
										sx={{
											lineHeight: 1.7,
											margin: '0.5rem 0',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-word',
											fontSize: '0.85rem',
											padding: '0 0.5rem',
										}}>
										{renderMessageContent(message?.text || '')}
									</Typography>
								</Box>
								{message.imageUrl && (
									<Box sx={{ padding: '0.15rem 0.5rem' }}>
										<img src={message.imageUrl} alt='img' style={{ maxHeight: '12rem', objectFit: 'contain', borderRadius: '0.15rem' }} />
									</Box>
								)}
								{message?.audioUrl && (
									<Box sx={{ padding: '0.15rem 0.5rem' }}>
										<audio
											src={message.audioUrl}
											controls
											style={{
												margin: '1rem 0',
												boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
												borderRadius: '0.35rem',
												width: '50%',
												height: '2rem',
											}}
										/>
									</Box>
								)}
							</Box>
							<Box>
								<Tooltip title='Reply to Message' placement='right'>
									<IconButton
										onClick={() => {
											setReplyToMessage(message);
										}}
										disabled={isTopicLocked}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<TurnLeftOutlined fontSize='small' />
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
								mt: '0.5rem',
								flex: 2,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box>
									{(message.updatedAt > message.createdAt || isMsgEdited) && (
										<Typography sx={{ color: 'gray', ml: '0.5rem', fontStyle: 'italic', fontSize: '0.65rem' }}>Edited</Typography>
									)}
								</Box>

								{!isMessageWriter && !isAdmin && (
									<Tooltip title='Report Message' placement='top'>
										<IconButton
											onClick={() => setReportMsgModalOpen(true)}
											disabled={message.isReported}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<Flag fontSize='small' color={message.isReported ? 'error' : 'inherit'} />
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
									maxWidth='sm'>
									<CustomDialogActions deleteBtn onDelete={reportMessage} onCancel={() => setReportMsgModalOpen(false)} deleteBtnText='Report' />
								</CustomDialog>

								{!isMessageWriter && isAdmin && (
									<Tooltip title='Delete Message' placement='right'>
										<IconButton
											onClick={() => setDeleteMessageModalOpen(true)}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<Delete fontSize='small' />
										</IconButton>
									</Tooltip>
								)}

								{isMessageWriter && (
									<Box>
										<Tooltip title='Edit Message' placement='top'>
											<IconButton
												onClick={() => setEditMsgModalOpen(true)}
												disabled={isTopicLocked}
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
													mr: '-0.5rem',
												}}>
												<Edit fontSize='small' />
											</IconButton>
										</Tooltip>
										<Tooltip title='Delete Message' placement='top'>
											<IconButton
												onClick={() => setDeleteMessageModalOpen(true)}
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
												}}>
												<Delete fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								)}

								<EditMessageDialog
									editMsgModalOpen={editMsgModalOpen}
									setEditMsgModalOpen={setEditMsgModalOpen}
									message={message}
									setMessages={setMessages}
									setIsMsgEdited={setIsMsgEdited}
								/>

								{message.isReported && isAdmin && (
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<Tooltip title='Resolve Report' placement='top'>
											<IconButton
												onClick={() => setResolveReportModalOpen(true)}
												sx={{
													':hover': {
														backgroundColor: 'transparent',
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
									maxWidth='sm'>
									<CustomDialogActions onSubmit={resolveReport} onCancel={() => setResolveReportModalOpen(false)} submitBtnText='Resolve' />
								</CustomDialog>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
			<CustomDialog
				openModal={deleteMessageModalOpen}
				closeModal={() => setDeleteMessageModalOpen(false)}
				title='Delete Message'
				content='Are you sure you want to delete the message?'
				maxWidth='sm'>
				<CustomDialogActions deleteBtn onDelete={deleteMessage} onCancel={() => setDeleteMessageModalOpen(false)} />
			</CustomDialog>
		</Box>
	);
};

export default Message;
