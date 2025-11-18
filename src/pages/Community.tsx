import { Box, DialogContent, Typography, IconButton, Tooltip } from '@mui/material';
import CommunitySkeleton from '../components/layouts/skeleton/CommunitySkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState, useMemo } from 'react';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import Topic from '../components/layouts/community/communityTopic/Topic';
import { Info, PriorityHigh } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { communityRules, communityRulesIntro, conclusion, consequences } from '../interfaces/communityRules';

import CreateTopicDialog from '../components/layouts/community/createTopic/CreateTopicDialog';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Roles } from '../interfaces/enums';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { useAuth } from '../hooks/useAuth';

export interface NewTopic {
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
}

const Community = () => {
	const { sortedTopicsData, setTopicsPageNumber, fetchMoreTopics, totalItems, loadedPages, enableCommunityFetch, refreshCommunityData, isLoading } =
		useContext(CommunityContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const { isLearner, hasAdminAccess } = useAuth();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false);
	const [createTopicModalOpen, setCreateTopicModalOpen] = useState<boolean>(false);
	const [communityIntroModalOpen, setCommunityIntroModalOpen] = useState<boolean>(false);

	const [messageNonRegisteredModalOpen, setMessageNonRegisteredModalOpen] = useState<boolean>(false);

	const [newTopic, setNewTopic] = useState<NewTopic>({
		title: '',
		text: '',
		imageUrl: '',
		audioUrl: '',
	});
	const pageSize = 20;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayTopics,
		numberOfPages: topicsNumberOfPages,
		currentPage: topicsCurrentPage,
		searchResultsTotalItems,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		resetSearch,
		resetFilter,
		resetAll,
	} = useFilterSearch<CommunityTopic>({
		getEndpoint: () => `${import.meta.env.VITE_SERVER_BASE_URL}/communityTopics/organisation/${orgId}`,
		limit: 100,
		pageSize,
		contextData: sortedTopicsData || [],
		setContextPageNumber: setTopicsPageNumber,
		fetchMoreContextData: fetchMoreTopics,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
		customSearchParams: (currentFilterValue) => {
			return currentFilterValue?.toLowerCase() === 'my topics' && user?._id ? { userId: user._id } : {};
		},
	});

	// Force re-sort when topics data changes
	const [sortKey, setSortKey] = useState(0);

	// Sort the display data
	const sortedTopics = useMemo(() => {
		if (!displayTopics) return [];
		const sorted = [...displayTopics].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
		return sorted;
	}, [displayTopics, orderBy, order, sortKey]);

	// Paginate the data for display
	const paginatedTopics = sortedTopics;
	// Enable community fetching and refresh data when component mounts
	useEffect(() => {
		enableCommunityFetch();
		refreshCommunityData();
	}, []); // Empty dependency array - only run once on mount

	// Force re-sort when topics data changes
	useEffect(() => {
		if (sortedTopicsData && sortedTopicsData.length > 0 && !isSearchActive) {
			setSortKey((prev) => prev + 1);
		}
	}, [sortedTopicsData, isSearchActive]);

	// Filter options based on user role
	const getFilterOptions = () => {
		const baseOptions = [
			'Active Topics',
			'My Topics',
			'Popular Topics',
			'New Topics',
			'Active Discussions',
			'Quiet Topics',
			'Recent Topics',
			'This Week',
			'This Month',
		];

		// Add admin-only options (admin, owner, super-admin)
		if (hasAdminAccess) {
			baseOptions?.splice(2, 0, 'Inactive Topics', 'Reported Topics', 'Non-reported Topics');
		}

		return baseOptions;
	};

	// Show loading state while community topics are being fetched or when data is empty and not loading yet
	if (isLoading) {
		return (
			<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<CommunitySkeleton />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Community'>
			<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				{/* Sticky Title */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
						position: 'fixed',
						top: isMobileSize ? '3.5rem' : '4rem', // Account for DashboardHeader height
						left: isMobileSize ? 0 : '10rem', // Account for sidebar width on desktop
						right: 0,
						zIndex: 100, // Higher z-index to ensure it's above all content
						backgroundColor: theme.bgColor?.secondary,
						backdropFilter: 'blur(10px)',
						width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						padding: isMobileSize ? '0.5rem 1rem' : '0.5rem 2rem',
					}}>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ textAlign: 'center', fontWeight: 500 }}>
						Join the Conversation!
						<Tooltip title='Introduction to the Community' arrow placement='top'>
							<IconButton onClick={() => setCommunityIntroModalOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<Info fontSize='small' />
							</IconButton>
						</Tooltip>
					</Typography>
				</Box>

				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Topics' },
						...getFilterOptions().map((option) => ({
							value: option.toLowerCase(),
							label: option,
						})),
					]}
					filterPlaceholder='Filter Topics'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder={isMobileSize ? 'Search Topics' : 'Search in title, topic message'}
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems || sortedTopicsData?.length || 0}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isMobileSize ? 'Create' : 'Create Topic',
							onClick: () => {
								if (user?.hasRegisteredCourse || user?.isSubscribed || !isLearner) {
									setCreateTopicModalOpen(true);
								} else {
									setMessageNonRegisteredModalOpen(true);
								}
							},
						},
					]}
					isSticky={true}
					isCommunity={true}
				/>

				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobileSize ? '1.1rem' : '2rem', width: '100%' }}>
					<CustomDialog
						openModal={communityIntroModalOpen}
						closeModal={() => setCommunityIntroModalOpen(false)}
						maxWidth='sm'
						title='Welcome to our Community'>
						<DialogContent sx={{ padding: '2rem' }}>
							<Typography
								variant='body2'
								sx={{ textAlign: 'justify', lineHeight: 1.6, mb: '0.75rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
								Our community is here to support your English learning journey. Each topic is a chance to share your thoughts, ask questions, and
								improve. Dive into the discussions, help others, and don't be afraid to make mistakes—they're part of the journey! your English in a
								supportive environment.
							</Typography>

							<Typography variant='body2' sx={{ textDecoration: 'underline', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
								The more you participate, the more you'll grow!
							</Typography>
						</DialogContent>

						<CustomCancelButton
							sx={{ alignSelf: 'end', width: isMobileSize ? '20%' : '10%', margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0', padding: 0 }}
							onClick={() => setCommunityIntroModalOpen(false)}>
							Close
						</CustomCancelButton>
					</CustomDialog>
					<Box sx={{ display: 'flex', flexDirection: 'column', width: '97%' }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', width: '97%' }}>
							<CreateTopicDialog
								setCreateTopicModalOpen={setCreateTopicModalOpen}
								createTopicModalOpen={createTopicModalOpen}
								topic={newTopic}
								setTopic={setNewTopic}
							/>
							<CustomDialog openModal={messageNonRegisteredModalOpen} closeModal={() => setMessageNonRegisteredModalOpen(false)} maxWidth='xs'>
								<DialogContent>
									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<Typography
											variant='body2'
											sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, color: theme.textColor?.error.main, mt: '1rem' }}>
											You need to enroll in a paid course or subscribe to create a topic.
										</Typography>
									</Box>
								</DialogContent>
								<CustomCancelButton
									sx={{
										alignSelf: 'end',
										width: isMobileSize ? '20%' : '10%',
										margin: isMobileSize ? '0 1rem 1rem 0' : '0 1rem 1rem 0',
										padding: 0,
									}}
									onClick={() => setMessageNonRegisteredModalOpen(false)}>
									Close
								</CustomCancelButton>
							</CustomDialog>
						</Box>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							height: 'fit-content',
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
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
									Topics
								</Typography>
								<Tooltip title='Read the Community Rules' arrow placement='top'>
									<IconButton onClick={() => setRulesModalOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
										<PriorityHigh sx={{ mr: '0.25rem' }} color='warning' fontSize={isMobileSize ? 'small' : 'medium'} />
									</IconButton>
								</Tooltip>
							</Box>
							<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										whiteSpace: 'nowrap',
									}}>
									{isSearchActive ? searchResultsTotalItems : totalItems}{' '}
									{isSearchActive ? (searchResultsTotalItems === 1 ? 'Result' : 'Results') : totalItems === 1 ? 'Topic' : 'Topics'}
								</Typography>
							</Box>
							<Box>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Last Message
								</Typography>
							</Box>
						</Box>
						<Box>
							{paginatedTopics?.map((topic: CommunityTopic) => (
								<Topic key={topic._id} topic={topic} />
							))}
						</Box>
					</Box>
					{displayTopics && displayTopics.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No topics found matching your search criteria.' : 'No topics found.'}
							sx={{ marginTop: '3rem' }}
						/>
					)}
					<Box sx={{ display: 'flex', justifyContent: 'center', margin: isMobileSize ? '0.75rem' : '1.5rem', width: '95%' }}>
						<CustomTablePagination count={topicsNumberOfPages} page={topicsCurrentPage} onChange={handlePageChange} />
					</Box>
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
					<CustomCancelButton
						sx={{ alignSelf: 'end', width: isMobileSize ? '20%' : '10%', margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0', padding: 0 }}
						onClick={() => setRulesModalOpen(false)}>
						Close
					</CustomCancelButton>
				</CustomDialog>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default Community;
