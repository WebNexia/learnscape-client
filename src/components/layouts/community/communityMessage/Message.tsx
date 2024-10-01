import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import { Delete, Edit, Flag } from '@mui/icons-material';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useContext, useState } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import axios from 'axios';
import CustomDialog from '../../dialog/CustomDialog';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import EditMessageDialog from './EditMessageDialog';

interface MessageProps {
	message: CommunityMessage;
	isFirst?: boolean;
	isLast?: boolean;
	setMessages: React.Dispatch<React.SetStateAction<CommunityMessage[]>>;
}

const Message = ({ message, isFirst, isLast, setMessages }: MessageProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	const isMessageWriter: boolean = user?._id === message?.userId?._id;

	const [deleteMessageModalOpen, setDeleteMessageModalOpen] = useState<boolean>(false);
	const [reportMsgModalOpen, setReportMsgModalOpen] = useState<boolean>(false);
	const [editMsgModalOpen, setEditMsgModalOpen] = useState<boolean>(false);

	const [isMsgEdited, setIsMsgEdited] = useState<boolean>(message.updatedAt > message.createdAt);

	const deleteMessage = async () => {
		try {
			await axios.delete(`${base_url}/communityMessages/${message._id}`);

			setMessages((prevData) => prevData.filter((data) => data._id !== message._id));
		} catch (error) {
			console.log(error);
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
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Box
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
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 8, padding: '0.5rem' }}>
				<Box>
					<Box>
						<Typography sx={{ lineHeight: 1.7, margin: '0.5rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
							{message?.text}
						</Typography>
					</Box>
					{message.imageUrl && (
						<Box>
							<img src={message.imageUrl} alt='img' style={{ maxHeight: '15rem', objectFit: 'contain', borderRadius: '0.15rem' }} />
						</Box>
					)}
					{message?.audioUrl && (
						<Box>
							<audio
								src={message.audioUrl}
								controls
								style={{
									margin: '1rem 0',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									borderRadius: '0.35rem',
									width: '50%',
								}}
							/>
						</Box>
					)}
				</Box>
				<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
					{(message.updatedAt > message.createdAt || isMsgEdited) && (
						<Typography sx={{ color: 'gray', ml: '0.5rem', fontStyle: 'italic', fontSize: '0.65rem' }}>Edited</Typography>
					)}

					{!isMessageWriter && !isAdmin && (
						<Tooltip title='Report Message' placement='left'>
							<IconButton
								onClick={() => setReportMsgModalOpen(true)}
								disabled={message.isReported}
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<Flag fontSize='small' color={message.isReported ? 'error' : 'inherit'} />
								{message.isReported && <Typography sx={{ color: 'red', ml: '0.5rem', fontSize: '0.65rem' }}>Reported (Under Review)</Typography>}
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
							<Tooltip title='Edit Message' placement='left'>
								<IconButton
									onClick={() => setEditMsgModalOpen(true)}
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
						<Typography sx={{ color: 'orange', ml: '0.5rem', fontStyle: 'italic', fontSize: '0.65rem' }}>Reported</Typography>
					)}
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
