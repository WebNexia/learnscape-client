import { Box } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import TopicPaper from '../components/layouts/community/topicPage/TopicPaper';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CommunityMessage, TopicInfo } from '../interfaces/communityMessage';

const CommunityTopicPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { topicId } = useParams();

	const [messages, setMessages] = useState<CommunityMessage[]>([]);
	const [topic, setTopic] = useState<TopicInfo | null>(null);

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
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000 }}>
				<TopicPaper topic={topic} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default CommunityTopicPage;
