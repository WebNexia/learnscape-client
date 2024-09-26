import { Alert, Box, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import TopicPaper from '../components/layouts/community/topicPage/TopicPaper';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CommunityMessage, TopicInfo } from '../interfaces/communityMessage';
import Message from '../components/layouts/community/communityMessage/Message';
import theme from '../themes';
import { Edit } from '@mui/icons-material';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

const CommunityTopicPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { topicId } = useParams();
	const { user } = useContext(UserAuthContext);

	const [messages, setMessages] = useState<CommunityMessage[]>([]);
	const [topic, setTopic] = useState<TopicInfo | null>(null);

	const isTopicWriter: boolean = user?._id === topic?.userId._id;
	const vertical = 'top';
	const horizontal = 'center';

	const [displayDeleteTopicMsg, setDisplayDeleteTopicMsg] = useState<boolean>(false);

	useEffect(() => {
		if (topicId) {
			const fetchTopicMessages = async () => {
				try {
					const messagesResponse = await axios.get(`${base_url}/communityMessages/topic/${topicId}`);

					setMessages(messagesResponse.data.messages);
					setTopic(messagesResponse.data.topic);
				} catch (error) {
					console.log(error);
				}
			};

			fetchTopicMessages();
		}
	}, []);
	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<TopicPaper topic={topic} messages={messages} setDisplayDeleteTopicMsg={setDisplayDeleteTopicMsg} />
			</Box>
			<Snackbar
				open={displayDeleteTopicMsg}
				autoHideDuration={7000}
				onClose={() => setDisplayDeleteTopicMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setDisplayDeleteTopicMsg(false)} severity='success' sx={{ width: '100%' }}>
					You have successfully deleted the topic!
				</Alert>
			</Snackbar>
			<Box
				sx={{
					display: 'flex',

					width: '87%',
					minHeight: '5rem',
					border: 'solid lightgray 0.1rem',
					marginTop: '11rem',
					borderRadius: '0.35rem',
					boxShadow: '0rem 0.2rem 0.5rem 0.1rem rgba(0,0,0,0.2)',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'center',
						flex: 1,
						padding: '0.5rem',
						borderRight: 'solid lightgray 0.1rem',
					}}>
					<Box>
						<img src={topic?.userId.imageUrl} alt='profile' style={{ height: '4rem', width: '4rem', borderRadius: '50%' }} />
					</Box>
					<Box>
						<Typography variant='body2'>{topic?.userId.username}</Typography>
					</Box>
				</Box>
				<Box sx={{ flex: 8, padding: '1rem' }}>
					<Box>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mb: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
							{topic?.text}
						</Typography>
					</Box>
					{topic?.imageUrl && (
						<Box>
							<img src={topic.imageUrl} alt='img' style={{ maxHeight: '15rem', objectFit: 'contain', borderRadius: '0.15rem' }} />
						</Box>
					)}
					{topic?.audioUrl && (
						<Box>
							<audio
								src={topic.audioUrl}
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
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
						{isTopicWriter && (
							<Box>
								<Tooltip title='Edit ' placement='left'>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Edit fontSize='small' />
									</IconButton>
								</Tooltip>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
			<Box sx={{ width: '87%', margin: '3rem 0 5rem 0' }}>
				{messages?.map((message: CommunityMessage) => (
					<Message key={message._id} message={message} />
				))}
			</Box>
		</DashboardPagesLayout>
	);
};

export default CommunityTopicPage;
