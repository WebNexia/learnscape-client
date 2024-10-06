import { Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import theme from '../../../../themes';
import { useContext, useState } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import { Cancel, Delete, Edit, Flag, KeyboardBackspaceOutlined, PlayCircleFilledOutlined, Verified } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CommunityMessage, TopicInfo } from '../../../../interfaces/communityMessage';
import { formatMessageTime } from '../../../../utils/formatTime';
import axios from 'axios';
import CustomDialog from '../../dialog/CustomDialog';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import { CommunityContext } from '../../../../contexts/CommunityContextProvider';
import EditTopicDialog from '../editTopic/EditTopicDialog';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { truncateText } from '../../../../utils/utilText';

interface TopicPaperProps {
	refreshTopics: boolean;
	topic: TopicInfo;
	messages: CommunityMessage[];
	isTopicClosed: boolean;
	setIsTopicClosed: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayDeleteTopicMsg: React.Dispatch<React.SetStateAction<boolean>>;
	setTopic: React.Dispatch<React.SetStateAction<TopicInfo>>;
}

const TopicPaper = ({ topic, messages, setDisplayDeleteTopicMsg, setTopic, refreshTopics, isTopicClosed, setIsTopicClosed }: TopicPaperProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { adminUsers } = useContext(OrganisationContext);
	const { removeTopic, fetchTopics } = useContext(CommunityContext);
	const navigate = useNavigate();
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	const isTopicWriter: boolean = user?._id === topic?.userId._id;

	const [deleteTopicModalOpen, setDeleteTopicModalOpen] = useState<boolean>(false);
	const [editTopicModalOpen, setEditTopicModalOpen] = useState<boolean>(false);
	const [reportTopicModalOpen, setReportTopicModalOpen] = useState<boolean>(false);
	const [closeTopicModalOpen, setCloseTopicModalOpen] = useState<boolean>(false);
	const [restartTopicModalOpen, setRestartTopicModalOpen] = useState<boolean>(false);
	const [resolveReportModalOpen, setResolveReportModalOpen] = useState<boolean>(false);

	const deleteTopic = async () => {
		try {
			await axios.delete(`${base_url}/communityTopics/${topic?._id}`);

			await Promise.all(
				messages.map(async (message) => {
					try {
						await axios.delete(`${base_url}/communityMessages/${message._id}`);
					} catch (error) {
						console.log(error);
					}
				})
			);
			removeTopic(topic?._id);
			setDeleteTopicModalOpen(false);
			setDisplayDeleteTopicMsg(true);

			setTimeout(() => {
				if (isAdmin) {
					navigate(`/admin/community/user/${user?._id}`);
				} else {
					navigate(`/community/user/${user?._id}`);
				}
			}, 1500);
		} catch (error) {
			console.log(error);
		}
	};

	const reportTopic = async () => {
		try {
			await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
				isReported: true,
			});

			setReportTopicModalOpen(false);

			setTopic((prevData) => {
				return { ...prevData, isReported: true };
			});

			// Create the notification data
			const notificationData = {
				title: 'Topic Reported',
				message: `${user?.username} reported ${truncateText(topic.title, 25)} in community topics`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'ReportTopic',
				userImageUrl: user?.imageUrl,
				communityTopicId: topic._id,
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
			await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
				isReported: false,
			});

			setResolveReportModalOpen(false);
			setTopic((prevData) => {
				return { ...prevData, isReported: false };
			});
		} catch (error) {
			console.log(error);
		}
	};

	const closeReopenTopic = async (action: string) => {
		try {
			if (action === 'close') {
				await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
					isActive: false,
				});
				setIsTopicClosed(true);
				setCloseTopicModalOpen(false);
			} else if (action === 'restart') {
				await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
					isActive: true,
				});
				setIsTopicClosed(false);
				setRestartTopicModalOpen(false);
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				marginTop: '1.5rem',
				backgroundColor: !isAdmin ? theme.bgColor?.primary : theme.bgColor?.adminPaper,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						flex: 2,
						padding: '0.5rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								if (refreshTopics) fetchTopics(1);

								if (isAdmin) {
									navigate(`/admin/community/user/${user?._id}`);
								} else {
									navigate(`/community/user/${user?._id}`);
								}

								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to topics
						</Button>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
							{!isTopicWriter && !isAdmin ? (
								<Tooltip title='Report Topic' placement='right'>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => setReportTopicModalOpen(true)}
										disabled={topic.isReported}>
										<Flag color={topic.isReported ? 'error' : 'secondary'} fontSize='small' />
										{topic.isReported && (
											<Typography variant='body2' sx={{ color: 'red', ml: '0.5rem' }}>
												Reported (Under Review)
											</Typography>
										)}
									</IconButton>
								</Tooltip>
							) : (
								<>
									{isTopicWriter && (
										<Tooltip title='Edit Topic' placement='top'>
											<IconButton
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
													mr: '-0.25rem',
												}}
												onClick={() => setEditTopicModalOpen(true)}>
												<Edit color='secondary' fontSize='small' />
											</IconButton>
										</Tooltip>
									)}

									{(isTopicWriter || isAdmin) && (
										<>
											<Tooltip title='Delete Topic' placement='top'>
												<IconButton
													sx={{
														':hover': {
															backgroundColor: 'transparent',
														},
														mr: '-0.25rem',
													}}
													onClick={() => setDeleteTopicModalOpen(true)}>
													<Delete color='secondary' fontSize='small' />
												</IconButton>
											</Tooltip>
											{!isTopicClosed ? (
												<Tooltip title='Close Topic' placement='top'>
													<IconButton
														sx={{
															':hover': {
																backgroundColor: 'transparent',
															},
														}}
														onClick={() => setCloseTopicModalOpen(true)}>
														<Cancel color='secondary' fontSize='small' />
													</IconButton>
												</Tooltip>
											) : (
												<Tooltip title='Restart Topic' placement='top'>
													<IconButton
														sx={{
															':hover': {
																backgroundColor: 'transparent',
															},
														}}
														onClick={() => setRestartTopicModalOpen(true)}>
														<PlayCircleFilledOutlined color='secondary' fontSize='small' />
													</IconButton>
												</Tooltip>
											)}
										</>
									)}
									{topic.isReported && isAdmin && (
										<Box sx={{ display: 'flex', alignItems: 'center' }}>
											<Tooltip title='Resolve Report' placement='top'>
												<IconButton
													onClick={() => setResolveReportModalOpen(true)}
													sx={{
														':hover': {
															backgroundColor: 'transparent',
														},
													}}>
													<Verified color='secondary' fontSize='small' />
												</IconButton>
											</Tooltip>
											<Typography variant='body2' sx={{ color: 'darkorange', ml: '0.1rem', fontStyle: 'italic', mr: '0.25rem' }}>
												Reported
											</Typography>
										</Box>
									)}
								</>
							)}
						</Box>
					</Box>
				</Box>

				<CustomDialog
					openModal={deleteTopicModalOpen}
					closeModal={() => setDeleteTopicModalOpen(false)}
					title='Delete Topic'
					content='Are you sure you want to delete the topic?'
					maxWidth='sm'>
					<CustomDialogActions deleteBtn onDelete={deleteTopic} onCancel={() => setDeleteTopicModalOpen(false)} />
				</CustomDialog>

				<EditTopicDialog topic={topic} setTopic={setTopic} editTopicModalOpen={editTopicModalOpen} setEditTopicModalOpen={setEditTopicModalOpen} />

				<CustomDialog
					openModal={reportTopicModalOpen}
					closeModal={() => setReportTopicModalOpen(false)}
					title='Report Topic'
					content='Are you sure you want to report the topic?'
					maxWidth='sm'>
					<CustomDialogActions deleteBtn onDelete={reportTopic} onCancel={() => setReportTopicModalOpen(false)} deleteBtnText='Report' />
				</CustomDialog>

				<CustomDialog
					openModal={resolveReportModalOpen}
					closeModal={() => setResolveReportModalOpen(false)}
					title='Resolve Report'
					content='Are you sure you want to resolve the report?'
					maxWidth='sm'>
					<CustomDialogActions onSubmit={resolveReport} onCancel={() => setResolveReportModalOpen(false)} submitBtnText='Resolve' />
				</CustomDialog>

				<CustomDialog
					openModal={closeTopicModalOpen}
					closeModal={() => setCloseTopicModalOpen(false)}
					title='Close Topic'
					content='Are you sure you want to close the topic?'
					maxWidth='sm'>
					<CustomDialogActions
						onDelete={() => closeReopenTopic('close')}
						onCancel={() => setCloseTopicModalOpen(false)}
						deleteBtn
						deleteBtnText='Close'
					/>
				</CustomDialog>

				<CustomDialog
					openModal={restartTopicModalOpen}
					closeModal={() => setRestartTopicModalOpen(false)}
					title='Restart Topic'
					content='Are you sure you want to restart the topic?'
					maxWidth='sm'>
					<CustomDialogActions
						onSubmit={() => closeReopenTopic('restart')}
						onCancel={() => setRestartTopicModalOpen(false)}
						submitBtnText='Restart'
					/>
				</CustomDialog>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'flex-start',
						flex: 5,
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
							<Typography variant='h5' sx={{ color: theme.textColor?.common.main, textAlign: 'right' }}>
								{topic?.title}
							</Typography>
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography variant='body2' sx={{ color: theme.textColor?.common.main }}>
									{topic?.userId.username}
								</Typography>
								<Typography sx={{ mx: 1, color: '#fff' }}>-</Typography>
								<Typography variant='caption' sx={{ color: theme.textColor?.common.main }}>
									{formatMessageTime(topic?.createdAt)}
								</Typography>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default TopicPaper;
