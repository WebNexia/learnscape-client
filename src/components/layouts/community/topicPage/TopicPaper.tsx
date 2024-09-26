import { Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import theme from '../../../../themes';
import { useContext } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import { Delete, Flag, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CommunityMessage, TopicInfo } from '../../../../interfaces/communityMessage';
import { formatMessageTime } from '../../../../utils/formatTime';
import axios from 'axios';

interface TopicPaperProps {
	topic: TopicInfo | null;
	messages: CommunityMessage[];
	setDisplayDeleteTopicMsg: React.Dispatch<React.SetStateAction<boolean>>;
}

const TopicPaper = ({ topic, messages, setDisplayDeleteTopicMsg }: TopicPaperProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const navigate = useNavigate();
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	const isTopicWriter: boolean = user?._id === topic?.userId._id;

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
			setDisplayDeleteTopicMsg(true);

			setTimeout(() => {
				if (isAdmin) {
					navigate(`/admin/community/user/${user?._id}`);
				} else {
					navigate(`/community/user/${user?._id}`);
				}
			}, 2000);
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
				marginTop: '2.25rem',
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
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
							{!isTopicWriter && !isAdmin ? (
								<Tooltip title='Report Topic' placement='right'>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Flag color='secondary' />
									</IconButton>
								</Tooltip>
							) : (
								<Tooltip title='Delete Topic' placement='right'>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={deleteTopic}>
										<Delete color='secondary' />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'flex-start',
						flex: 1,
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
							<Box>
								<Typography variant='h5' sx={{ color: theme.textColor?.common.main }}>
									{topic?.title}
								</Typography>
							</Box>
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
								<Typography sx={{ mx: 1 }}>-</Typography>
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
