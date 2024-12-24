import { Box, Typography } from '@mui/material';
import { CommunityTopic } from '../../../../interfaces/communityTopics';
import { formatMessageTime } from '../../../../utils/formatTime';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import { truncateText } from '../../../../utils/utilText';

interface TopicProps {
	topic: CommunityTopic;
}

const Topic = ({ topic }: TopicProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const { isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				width: '100%',
				height: isMobileSize ? '3.75rem' : '4.5rem',
				borderBottom: 'solid lightgray 0.05rem',
				padding: isMobileSize ? '0.1rem 0.5rem' : '0.35rem 0.75rem',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', flex: 5, height: isMobileSize ? '3.75rem' : '4.5rem' }}>
				<Box sx={{ mr: '0.85rem' }}>
					<img
						src={topic?.userId?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
						alt='profile_pic'
						style={{ height: isMobileSize ? '2rem' : '3rem', width: isMobileSize ? '2rem' : '3rem', borderRadius: '50%' }}
					/>
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
								fontSize: isMobileSize ? '0.7rem' : '0.85rem',
							}}>
							{isVerySmallScreen ? truncateText(topic.title, 15) : isMobileSize ? truncateText(topic.title, 35) : topic.title}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', width: '50%' }}>
						<Typography sx={{ fontSize: isMobileSize ? '0.6rem' : '0.75rem', mr: '1rem' }}>
							{topic?.userId?.username || 'Deactivated User'}
						</Typography>
						<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.5rem' : '0.65rem', color: 'gray' }}>
							{formatMessageTime(topic.createdAt)}
						</Typography>
					</Box>
				</Box>
			</Box>
			<Box sx={{ flex: isVerySmallScreen ? 1.5 : 2 }}>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem' }}>
					Replies: {topic.messageCount}
				</Typography>
			</Box>
			{!isVerySmallScreen && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: '0.75rem' }}>
						<Box>
							<Typography sx={{ fontSize: isMobileSize ? '0.6rem' : '0.75rem' }}>{topic?.lastMessage?.sender?.username}</Typography>
						</Box>
						<Box>
							<Typography sx={{ fontSize: isMobileSize ? '0.6rem' : '0.75rem' }}>{formatMessageTime(topic?.lastMessage?.createdAt)}</Typography>
						</Box>
					</Box>
					<Box>
						{topic?.lastMessage?.sender?.imageUrl && (
							<Box sx={{ mr: '0.85rem' }}>
								<img
									src={topic?.lastMessage?.sender?.imageUrl}
									alt='profile_pic'
									style={{ height: isMobileSize ? '1.5rem' : '2rem', width: isMobileSize ? '1.5rem' : '2rem', borderRadius: '50%' }}
								/>
							</Box>
						)}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default Topic;
