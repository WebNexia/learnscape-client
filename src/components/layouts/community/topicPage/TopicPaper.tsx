import { Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import theme from '../../../../themes';
import { useContext, useState } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Delete, Edit, Flag, KeyboardBackspaceOutlined, Lock, LockOpenOutlined, Verified } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TopicInfo } from '../../../../interfaces/communityMessage';
import { formatMessageTime } from '../../../../utils/formatTime';
import axios from '@utils/axiosInstance';
import CustomDialog from '../../dialog/CustomDialog';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import { CommunityContext } from '../../../../contexts/CommunityContextProvider';
import EditTopicDialog from '../editTopic/EditTopicDialog';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { truncateText } from '../../../../utils/utilText';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import { useStickyPaper } from '../../../../hooks/useStickyPaper';
import { useAuth } from '../../../../hooks/useAuth';

interface TopicPaperProps {
	refreshTopics: boolean;
	topic: TopicInfo;
	isTopicLocked: boolean;
	setIsTopicLocked: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayDeleteTopicMsg: React.Dispatch<React.SetStateAction<boolean>>;
	setTopic: React.Dispatch<React.SetStateAction<TopicInfo>>;
}

const TopicPaper = ({ topic, setDisplayDeleteTopicMsg, setTopic, refreshTopics, isTopicLocked, setIsTopicLocked }: TopicPaperProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { removeTopic, fetchTopics } = useContext(CommunityContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { isInstructor, hasAdminAccess } = useAuth();

	const navigate = useNavigate();
	const isTopicWriter: boolean = user?._id === topic?.userId?._id;

	const { isSticky, paperRef } = useStickyPaper(isMobileSize);

	const [deleteTopicModalOpen, setDeleteTopicModalOpen] = useState<boolean>(false);
	const [editTopicModalOpen, setEditTopicModalOpen] = useState<boolean>(false);
	const [reportTopicModalOpen, setReportTopicModalOpen] = useState<boolean>(false);
	const [closeTopicModalOpen, setLockTopicModalOpen] = useState<boolean>(false);
	const [restartTopicModalOpen, setRestartTopicModalOpen] = useState<boolean>(false);
	const [resolveReportModalOpen, setResolveReportModalOpen] = useState<boolean>(false);

	const deleteTopic = async () => {
		try {
			await axios.delete(`${base_url}/communityTopics/${topic?._id}`);

			removeTopic(topic?._id);
			setDeleteTopicModalOpen(false);
			setDisplayDeleteTopicMsg(true);

			setTimeout(() => {
				if (hasAdminAccess) {
					navigate(`/admin/community`);
				} else {
					navigate(`/community`);
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

			// Fetch all admins and instructors for notifications (not limited by pagination)
			const adminInstructorResponse = await axios.get(`${base_url}/users/organisation/${orgId}/admin-instructor-users`);
			const allAdminsAndInstructors = adminInstructorResponse.data.data || [];

			// Send notifications AFTER topic is marked as reported (non-blocking)
			const notificationData = {
				title: 'Topic Reported',
				message: `${user?.username} reported ${truncateText(topic.title, 25)} in community topics`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'ReportTopic',
				userImageUrl: user?.imageUrl,
				communityTopicId: topic._id,
			};

			// Use batch operation with content-based deduplication (non-blocking)
			const batch = writeBatch(db);
			const usersAlreadyNotified = new Set<string>();

			// Send notifications to each admin and instructor
			for (const user of allAdminsAndInstructors) {
				if (user.firebaseUserId && !usersAlreadyNotified.has(user.firebaseUserId)) {
					const notificationDocRef = doc(db, 'notifications', user.firebaseUserId, 'userNotifications', `topic-report-${topic._id}`);
					batch.set(notificationDocRef, notificationData, { merge: true });
					usersAlreadyNotified.add(user.firebaseUserId);
				}
			}

			// Non-blocking notification - topic reporting success is not dependent on notification success
			batch.commit().catch((error) => {
				console.warn('Failed to send topic report notifications:', error);
			});
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

	const lockUnlockTopic = async (action: string) => {
		try {
			if (action === 'lock') {
				await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
					isActive: false,
				});
				setIsTopicLocked(true);
				setLockTopicModalOpen(false);
			} else if (action === 'unlock') {
				await axios.patch(`${base_url}/communityTopics/${topic?._id}`, {
					isActive: true,
				});
				setIsTopicLocked(false);
				setRestartTopicModalOpen(false);
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Paper
			ref={paperRef}
			elevation={10}
			sx={{
				width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				height: isSticky ? (isMobileSize ? '2.5rem' : '3rem') : isMobileSize ? '4rem' : '6rem',
				marginTop: isSticky ? 0 : '1.5rem',
				backgroundColor:
					!hasAdminAccess && !isInstructor
						? theme.bgColor?.primary
						: !hasAdminAccess && isInstructor
							? theme.bgColor?.instructorPaper
							: theme.bgColor?.adminPaper,
				position: isSticky ? 'fixed' : 'relative',
				top: isSticky ? (isMobileSize ? '3.5rem' : '4rem') : 'auto', // Assuming DashboardHeader height is 64px
				left: isSticky ? (isMobileSize ? '0' : '10rem') : 'auto', // Align with main content area
				right: isSticky ? 0 : 'auto', // Align with main content area
				zIndex: 10000,
				transition: 'all 0.5s ease',
				borderRadius: isSticky ? 0 : undefined,
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
						flexDirection: isSticky ? 'row' : 'column',
						justifyContent: isSticky ? 'space-between' : 'space-between',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: 2,
						padding: isSticky ? (isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem') : isMobileSize ? '0.1rem' : '0.5rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
								'fontSize': isMobileSize ? '0.65rem' : isSticky ? '0.85rem' : undefined,
							}}
							onClick={() => {
								if (refreshTopics) fetchTopics(1);

								if (hasAdminAccess) {
									navigate(`/admin/community`);
								} else if (isInstructor) {
									navigate(`/instructor/community`);
								} else {
									navigate(`/community`);
								}

								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isMobileSize || isSticky ? 'Topics' : 'Back to topics'}
						</Button>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
							{!isTopicWriter && !hasAdminAccess ? (
								<Tooltip title='Report Topic' placement='right' arrow>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => setReportTopicModalOpen(true)}
										disabled={topic?.isReported}>
										<Flag
											color={topic?.isReported ? 'error' : 'secondary'}
											fontSize='small'
											sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}
										/>
										{topic?.isReported && (
											<Typography variant='body2' sx={{ color: 'red', ml: '0.5rem', fontSize: isMobileSize ? '0.75rem' : undefined }}>
												Reported (Under Review)
											</Typography>
										)}
									</IconButton>
								</Tooltip>
							) : (
								<>
									{isTopicWriter && (
										<Tooltip title='Edit Topic' placement='top' arrow>
											<IconButton
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
													'mr': '-0.25rem',
												}}
												onClick={() => setEditTopicModalOpen(true)}>
												<Edit color='secondary' fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
											</IconButton>
										</Tooltip>
									)}

									{(isTopicWriter || hasAdminAccess) && (
										<>
											<Tooltip title='Delete Topic' placement='top' arrow>
												<IconButton
													sx={{
														':hover': {
															backgroundColor: 'transparent',
														},
														'mr': '-0.25rem',
													}}
													onClick={() => setDeleteTopicModalOpen(true)}>
													<Delete color='secondary' fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
												</IconButton>
											</Tooltip>
											{!isTopicLocked ? (
												<Tooltip title='Lock Topic' placement='top' arrow>
													<IconButton
														sx={{
															':hover': {
																backgroundColor: 'transparent',
															},
														}}
														onClick={() => setLockTopicModalOpen(true)}>
														<Lock color='secondary' fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
													</IconButton>
												</Tooltip>
											) : (
												<Tooltip title='Unlock Topic' placement='top' arrow>
													<IconButton
														sx={{
															':hover': {
																backgroundColor: 'transparent',
															},
														}}
														onClick={() => setRestartTopicModalOpen(true)}>
														<LockOpenOutlined color='secondary' fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
													</IconButton>
												</Tooltip>
											)}
										</>
									)}
									{topic?.isReported && hasAdminAccess && (
										<Box sx={{ display: 'flex', alignItems: 'center' }}>
											<Tooltip title='Resolve Report' placement='top' arrow>
												<IconButton
													onClick={() => setResolveReportModalOpen(true)}
													sx={{
														':hover': {
															backgroundColor: 'transparent',
														},
													}}>
													<Verified color='secondary' fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
												</IconButton>
											</Tooltip>
											<Typography
												variant='body2'
												sx={{
													color: 'darkorange',
													ml: '0.1rem',
													fontStyle: 'italic',
													mr: '0.25rem',
													fontSize: isMobileSize ? '0.75rem' : undefined,
												}}>
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
					content={`Are you sure you want to delete "${topic.title}"?`}
					maxWidth='xs'>
					<CustomDialogActions deleteBtn onDelete={deleteTopic} onCancel={() => setDeleteTopicModalOpen(false)} actionSx={{ mb: '0.5rem' }} />
				</CustomDialog>

				<EditTopicDialog topic={topic} setTopic={setTopic} editTopicModalOpen={editTopicModalOpen} setEditTopicModalOpen={setEditTopicModalOpen} />

				<CustomDialog
					openModal={reportTopicModalOpen}
					closeModal={() => setReportTopicModalOpen(false)}
					title='Report Topic'
					content='Are you sure you want to report the topic?'
					maxWidth='xs'>
					<CustomDialogActions
						deleteBtn
						onDelete={reportTopic}
						onCancel={() => setReportTopicModalOpen(false)}
						deleteBtnText='Report'
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>

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

				<CustomDialog
					openModal={closeTopicModalOpen}
					closeModal={() => setLockTopicModalOpen(false)}
					title='Lock Topic'
					content='Are you sure you want to lock the topic?'
					maxWidth='xs'>
					<CustomDialogActions
						onDelete={() => lockUnlockTopic('lock')}
						onCancel={() => setLockTopicModalOpen(false)}
						deleteBtn
						deleteBtnText='Lock'
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>

				<CustomDialog
					openModal={restartTopicModalOpen}
					closeModal={() => setRestartTopicModalOpen(false)}
					title='Unlock Topic'
					content='Are you sure you want to unlock the topic?'
					maxWidth='xs'>
					<CustomDialogActions
						onSubmit={() => lockUnlockTopic('unlock')}
						onCancel={() => setRestartTopicModalOpen(false)}
						submitBtnText='Unlock'
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: 5,
						padding: isSticky ? (isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem') : isMobileSize ? '0.5rem' : '1rem',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isSticky ? 'row' : 'column',
							alignItems: isSticky ? 'center' : 'flex-end',
							justifyContent: isSticky ? 'flex-end' : 'space-between',
							height: '100%',
							width: '100%',
							gap: isSticky ? 4 : 0,
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
							<Typography
								variant='h5'
								sx={{
									color: theme.textColor?.common.main,
									textAlign: 'right',
									fontSize: isSticky ? (isMobileSize ? '0.7rem' : '0.9rem') : isMobileSize ? '0.8rem' : undefined,
								}}>
								{topic?.title}
							</Typography>
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: isSticky ? 'auto' : '100%',
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography
									variant='body2'
									sx={{
										color: theme.textColor?.common.main,
										fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.7rem') : isMobileSize ? '0.7rem' : '0.85rem',
									}}>
									{isSticky ? '(' + topic?.userId?.username || '(Deactivated User' : (topic?.userId?.username ?? 'Deactivated User')}
								</Typography>
								<Typography sx={{ mx: 1, color: '#fff' }}>-</Typography>
								<Typography
									variant='caption'
									sx={{
										color: theme.textColor?.common.main,
										fontSize: isSticky ? (isMobileSize ? '0.5rem' : '0.7rem') : isMobileSize ? '0.6rem' : undefined,
									}}>
									{isSticky ? formatMessageTime(topic?.createdAt) + ')' : formatMessageTime(topic?.createdAt)}
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
