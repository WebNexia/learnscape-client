import { Box, DialogContent, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import Topic from '../components/layouts/community/communityTopic/Topic';
import { PriorityHigh } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { communityRules, communityRulesIntro, conclusion, consequences } from '../interfaces/communityRules';

import CreateTopicDialog from '../components/layouts/community/createTopic/CreateTopicDialog';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

export interface NewTopic {
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
}

const Community = () => {
	const { sortedTopicsData, setTopicsPageNumber, topicsPageNumber, fetchTopics, numberOfPages } = useContext(CommunityContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false);
	const [createTopicModalOpen, setCreateTopicModalOpen] = useState<boolean>(false);

	const [newTopic, setNewTopic] = useState<NewTopic>({
		title: '',
		text: '',
		imageUrl: '',
		audioUrl: '',
	});

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
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobileSize ? '1.1rem' : '2rem', width: '100%' }}>
				<Box sx={{ mb: '1rem' }}>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ textAlign: 'center', mb: isMobileSize ? '0.5rem' : '1rem', fontWeight: 500 }}>
						Join the Conversation!
					</Typography>
					<Typography variant='body2' sx={{ textAlign: 'justify', lineHeight: 1.6, mb: '0.75rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						Our community is here to support your English learning journey. Each topic is a chance to share your thoughts, ask questions, and improve.
						Dive into the discussions, help others, and don’t be afraid to make mistakes—they're part of the journey! your English in a supportive
						environment.
					</Typography>

					<Typography variant='body2' sx={{ textDecoration: 'underline', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						The more you participate, the more you'll grow!
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '97%' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: '1rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
							<Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
								<PriorityHigh sx={{ mr: '0.25rem' }} color='warning' fontSize={isMobileSize ? 'small' : 'medium'} />
								<Typography
									variant='h6'
									onClick={() => setRulesModalOpen(true)}
									sx={{
										cursor: 'pointer',
										fontSize: isMobileSize ? '0.7rem' : '0.9rem',
										':hover': {
											textDecoration: 'underline',
										},
									}}>
									Read the Community Rules
								</Typography>
								<PriorityHigh sx={{ ml: '0.25rem' }} color='warning' fontSize={isMobileSize ? 'small' : 'medium'} />
							</Box>

							<CustomDialog openModal={rulesModalOpen} closeModal={() => setRulesModalOpen(false)} title='Community Guidelines'>
								<DialogContent>
									<Box>
										<Typography
											variant='body2'
											sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{communityRulesIntro}
										</Typography>
									</Box>
									<Box sx={{ mt: isMobileSize ? '1.5rem' : '2rem' }}>
										{communityRules?.map((rule, index) => (
											<Box key={index} sx={{ mb: '2rem' }}>
												<Box sx={{ mb: '0.5rem' }}>
													<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>
														{rule.rule}
													</Typography>
												</Box>
												<Box>
													<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
														{rule.explanation}
													</Typography>
												</Box>
											</Box>
										))}
									</Box>
									<Box sx={{ mt: isMobileSize ? '2rem' : '3rem' }}>
										<Box sx={{ mb: '0.5rem' }}>
											<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>
												{consequences.title}
											</Typography>
										</Box>
										<Box sx={{ mb: '0.5rem' }}>
											<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{consequences.explanation}
											</Typography>
										</Box>
										<Box>
											{consequences.consequences?.map((data, index) => (
												<ul key={index}>
													<li style={{ margin: '0 0 0.35rem 2rem' }}>
														<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
															{data}
														</Typography>
													</li>
												</ul>
											))}
										</Box>
									</Box>
									<Box sx={{ margin: isMobileSize ? '2rem 0' : '3rem 0' }}>
										<Typography
											variant='body2'
											sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{conclusion}
										</Typography>
									</Box>
								</DialogContent>
							</CustomDialog>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 'auto' }}>
								<CustomSubmitButton
									size='small'
									onClick={() => setCreateTopicModalOpen(true)}
									sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, padding: isMobileSize ? '0.1rem 0.35rem' : undefined }}>
									Create Topic
								</CustomSubmitButton>
							</Box>
							<CreateTopicDialog
								setCreateTopicModalOpen={setCreateTopicModalOpen}
								createTopicModalOpen={createTopicModalOpen}
								topic={newTopic}
								setTopic={setNewTopic}
							/>
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
								<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
									Topics
								</Typography>
							</Box>
							<Box>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Last Message
								</Typography>
							</Box>
						</Box>
						<Box>
							{sortedTopicsData?.map((topic: CommunityTopic) => (
								<Topic key={topic._id} topic={topic} />
							))}
						</Box>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'center', margin: isMobileSize ? '0.75rem' : '1.5rem', width: '95%' }}>
						<CustomTablePagination count={numberOfPages} page={topicsPageNumber} onChange={setTopicsPageNumber} />
					</Box>
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Community;
