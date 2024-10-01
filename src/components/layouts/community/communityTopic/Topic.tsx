import { Box, Typography } from '@mui/material';
import { CommunityTopic } from '../../../../interfaces/communityTopics';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';

interface TopicProps {
	topic: CommunityTopic;
}

const Topic = ({ topic }: TopicProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				width: '100%',
				height: '4.5rem',
				borderBottom: 'solid lightgray 0.05rem',
				padding: '0.35rem 0.75rem',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', flex: 5, height: '4.5rem' }}>
				<Box sx={{ mr: '0.85rem' }}>
					<img src={topic?.userId?.imageUrl} alt='profile_pic' style={{ height: '3rem', width: '3rem', borderRadius: '50%' }} />
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
					<Box sx={{ mb: '0.25rem' }}>
						<Typography
							variant='body2'
							onClick={() => {
								navigate(`/${user?.role !== Roles.ADMIN ? 'community' : 'admin/community'}/user/${user?._id}/topic/${topic._id}`);
							}}
							sx={{
								cursor: 'pointer',
								':hover': {
									textDecoration: 'underline',
								},
							}}>
							{topic.title}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', width: '30%' }}>
						<Typography sx={{ fontSize: '0.75rem', mr: '1rem' }}>{topic?.userId?.username}</Typography>
						<Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'gray' }}>
							{formatMessageTime(topic.createdAt)}
						</Typography>
					</Box>
				</Box>
			</Box>
			<Box sx={{ flex: 2 }}>
				<Typography variant='body2'>Replies: {topic.messageCount}</Typography>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: '0.75rem' }}>
					<Box>
						<Typography sx={{ fontSize: '0.75rem' }}>{topic?.lastMessage?.sender?.username}</Typography>
					</Box>
					<Box>
						<Typography sx={{ fontSize: '0.75rem' }}>{formatMessageTime(topic?.lastMessage?.createdAt)}</Typography>
					</Box>
				</Box>
				<Box>
					{topic?.lastMessage?.sender?.imageUrl && (
						<Box sx={{ mr: '0.85rem' }}>
							<img src={topic?.lastMessage?.sender?.imageUrl} alt='profile_pic' style={{ height: '2rem', width: '2rem', borderRadius: '50%' }} />
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Topic;
