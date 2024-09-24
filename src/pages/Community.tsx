import { Box, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useRef } from 'react';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import Topic from '../components/layouts/community/communityTopic/Topic';
import { PriorityHigh } from '@mui/icons-material';

const Community = () => {
	const { sortedTopicsData, setTopicsPageNumber, topicsPageNumber, fetchTopics } = useContext(CommunityContext);

	useEffect(() => {
		setTopicsPageNumber(1);
	}, []);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchTopics(topicsPageNumber);
		}
	}, [topicsPageNumber]);

	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', width: '100%' }}>
				<Box sx={{ mb: '2.5rem' }}>
					<Typography variant='h4' sx={{ textAlign: 'center', mb: '1.5rem' }}>
						Join the Conversation!
					</Typography>
					<Typography variant='body1' sx={{ textAlign: 'justify', lineHeight: 1.6, mb: '0.75rem' }}>
						Our community is here to support your English learning journey. Each topic is a chance to share your thoughts, ask questions, and improve
						Dive into the discussions, help others, and don’t be afraid to make mistakes—they're part of the journey! your English in a supportive
						environment.
					</Typography>

					<Typography variant='body1' sx={{ textDecoration: 'underline' }}>
						The more you participate, the more you'll grow!
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '97%' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: '1rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
							<Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
								<PriorityHigh sx={{ mr: '0.25rem' }} color='warning' />
								<Typography
									variant='h6'
									sx={{
										cursor: 'pointer',
										fontSize: '0.9rem',
										':hover': {
											textDecoration: 'underline',
										},
									}}>
									Read the Community Rules
								</Typography>
								<PriorityHigh sx={{ ml: '0.25rem' }} color='warning' />
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 'auto' }}>
								<CustomSubmitButton size='small'>Create Topic</CustomSubmitButton>
							</Box>
						</Box>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							minHeight: '30vh',
							border: 'solid lightgray 0.02rem',
							borderRadius: '0.35rem',
							boxShadow: '0 0.1rem 0.4rem 0.1rem rgba(0,0,0,0.2)',
						}}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								height: '3rem',
								borderBottom: 'solid lightgray 0.1rem',
								padding: '0.75rem',
							}}>
							<Box>
								<Typography variant='h5'>Topics</Typography>
							</Box>
							<Box>
								<Typography variant='body2'>Last Message</Typography>
							</Box>
						</Box>
						<Box>
							{sortedTopicsData?.map((topic: CommunityTopic) => (
								<Topic key={topic._id} topic={topic} />
							))}
						</Box>
					</Box>
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Community;
