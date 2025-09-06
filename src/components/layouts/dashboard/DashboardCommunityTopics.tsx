import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CommunityContext } from '../../../contexts/CommunityContextProvider';
import { CommunityTopic } from '../../../interfaces/communityTopics';
import { truncateText } from '../../../utils/utilText';
import { LightbulbOutlined } from '@mui/icons-material';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const DashboardCommunityTopics = () => {
	const { sortedTopicsData } = useContext(CommunityContext);
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const [recentTopics, setRecentTopics] = useState<CommunityTopic[]>([]);

	useEffect(() => {
		const displayedTopics: CommunityTopic[] = sortedTopicsData?.sort((a, b) => b.createdAt.localeCompare(a.createdAt))?.slice(0, 3) || [];
		setRecentTopics(displayedTopics);
	}, [sortedTopicsData]);

	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'height': '12rem',
				'borderRadius': '0.35rem',
				'cursor': 'pointer',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : null }}>
					Recent Topics
				</Typography>
				<LightbulbOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} fontSize={isMobileSize ? 'small' : 'medium'} />
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '0.65rem 0 0 0.75rem', height: '7rem' }}>
				<ul>
					{recentTopics?.map((topic) => {
						return (
							<Typography key={topic._id} sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', mb: '0.35rem' }}>
								<li>{truncateText(topic.title, 35)}</li>
							</Typography>
						);
					})}
				</ul>
			</Box>
		</Box>
	);
};

export default DashboardCommunityTopics;
