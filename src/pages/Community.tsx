import { Box, DialogContent, Typography, FormControl, Select, MenuItem, Chip, InputAdornment, IconButton, Tooltip } from '@mui/material';
import CommunitySkeleton from '../components/layouts/skeleton/CommunitySkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { useContext, useEffect, useState, useMemo } from 'react';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import Topic from '../components/layouts/community/communityTopic/Topic';
import { Info, PriorityHigh, Search } from '@mui/icons-material';
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

export interface NewTopic {
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
}

const Community = () => {
	const { sortedTopicsData, setTopicsPageNumber, topicsPageNumber, fetchMoreTopics, totalItems, loadedPages, enableCommunityFetch, isLoading } =
		useContext(CommunityContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

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

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayTopics,
		numberOfPages: topicsNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchButtonClicked,
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
		limit: 60,
		pageSize: 20,
		contextData: sortedTopicsData || [],
		setContextPageNumber: setTopicsPageNumber,
		fetchMoreContextData: fetchMoreTopics,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
		customSearchParams: (currentFilterValue) => {
			return currentFilterValue?.toLowerCase() === 'my topics' && user?._id ? { userId: user._id } : {};
		},
	});

	const pageSize = 20;

	// Force re-sort when topics data changes
	const [sortKey, setSortKey] = useState(0);

	// Sort the display data
	const sortedTopics = useMemo(() => {
		return (
			displayTopics?.sort((a, b) => {
				const aValue = (a as any)[orderBy] ?? '';
				const bValue = (b as any)[orderBy] ?? '';

				if (order === 'asc') {
					return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
				} else {
					return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
				}
			}) || []
		);
	}, [displayTopics, orderBy, order, sortKey]); // Include sortKey to force re-sort

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : topicsPageNumber;

	// Paginate the data for display
	const paginatedTopics = sortedTopics?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Enable community fetching only once when component mounts
	useEffect(() => {
		enableCommunityFetch();
	}, []); // Empty dependency array - only run once

	useEffect(() => {
		setTopicsPageNumber(1);
	}, []); // Reset page number only once on mount

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

		// Add admin-only options
		if (user?.role === Roles.ADMIN) {
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
						top: '4rem', // Account for DashboardHeader height
						left: isMobileSize ? 0 : '10rem', // Account for sidebar width on desktop
						right: 0,
						zIndex: 100, // Higher z-index to ensure it's above all content
						backgroundColor: theme.palette.background.paper,
						backdropFilter: 'blur(10px)',
						width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						padding: isMobileSize ? '0.5rem 1rem' : '0.5rem 2rem',
					}}>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ textAlign: 'center', fontWeight: 500 }}>
						Join the Conversation!
						<Tooltip title='Introduction to the Community' arrow placement='top'>
							<IconButton onClick={() => setCommunityIntroModalOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<Info />
							</IconButton>
						</Tooltip>
					</Typography>
				</Box>

				{/* Spacer to push content down when sticky */}
				<Box
					sx={{
						height:
							(isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim())
								? isMobileSize
									? '10.5rem'
									: '8rem'
								: isMobileSize
									? '9rem'
									: '6.5rem', // Account for title height
						width: '100%',
					}}
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
						{/* Sticky Filter/Search Row */}
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: isMobileSize ? 'center' : 'space-between',
								padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '1rem 2rem 0rem 2rem',
								width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
								position: 'fixed',
								top: isMobileSize ? '7.5rem' : '6.5rem', // Account for header + title
								left: isMobileSize ? 0 : '10rem',
								right: 0,
								zIndex: 99, // Below title but above content
								backgroundColor: theme.palette.background.paper,
								backdropFilter: 'blur(10px)',
							}}>
							<Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
								<Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
										<Box sx={{ mr: '1rem' }}>
											<FormControl>
												<Select
													size='small'
													value={filterValue}
													onChange={(e) => handleFilterChange(e.target.value)}
													displayEmpty
													sx={{
														backgroundColor: theme.bgColor?.common,
														width: isMobileSizeSmall ? '7rem' : '11rem',
														fontSize: isMobileSize ? '0.7rem' : '0.85rem',
														textTransform: 'capitalize',
													}}>
													<MenuItem
														disabled
														value='filter'
														selected
														sx={{
															fontSize: isMobileSize ? '0.65rem' : '0.85rem',
															fontStyle: 'italic',
															textTransform: 'capitalize',
															padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
															minHeight: '2rem',
														}}>
														Filter Topics
													</MenuItem>
													<MenuItem
														value=''
														selected
														sx={{
															fontSize: isMobileSize ? '0.65rem' : '0.85rem',
															textTransform: 'capitalize',
															padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
															minHeight: '2rem',
														}}>
														All Topics
													</MenuItem>
													{getFilterOptions()?.map((option) => (
														<MenuItem
															value={option.toLowerCase()}
															key={option}
															sx={{
																fontSize: isMobileSize ? '0.65rem' : '0.85rem',
																textTransform: 'capitalize',
																padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
																minHeight: '2rem',
															}}>
															{option}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</Box>
										<CustomTextField
											value={searchValue}
											placeholder={'Search in title, topic message'}
											onChange={(e) => {
												setSearchValue(e.target.value);
											}}
											sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
											required={false}
											InputProps={{
												onKeyDown: (e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														if (searchValue.trim() && !isSearchLoading) {
															handleSearch();
														}
													}
												},
												endAdornment: (
													<InputAdornment position='end'>
														<Search
															sx={{
																mr: '-0.5rem',
															}}
															fontSize={isMobileSize ? 'small' : 'medium'}
														/>
													</InputAdornment>
												),
											}}
										/>
										<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || isSearchLoading}>
											Search
										</CustomSubmitButton>
										<CustomDeleteButton onClick={resetAll}>Reset</CustomDeleteButton>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
										<CustomSubmitButton
											size='small'
											onClick={() => {
												if (user?.hasRegisteredCourse || user?.isSubscribed || user?.role === 'admin') {
													setCreateTopicModalOpen(true);
												} else {
													setMessageNonRegisteredModalOpen(true);
												}
											}}
											sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, padding: isMobileSize ? '0.1rem 0.35rem' : undefined }}>
											Create Topic
										</CustomSubmitButton>
									</Box>
								</Box>
								<Box
									sx={{
										display: 'flex',
										gap: 1,
										flexWrap: 'wrap',
										justifyContent: 'flex-start',
										padding: '0.5rem 1rem 0.5rem 0rem',
										borderRadius: '4px',
										backgroundColor: theme.palette.background.paper,
									}}>
									{isSearchActive && filterValue && filterValue.trim() && (
										<Chip
											label={`Filter: "${filterValue}"`}
											onDelete={resetFilter}
											variant='outlined'
											color='secondary'
											size='small'
											sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
										/>
									)}
									{isSearchActive && searchedValue && searchButtonClicked && (
										<Chip
											label={`Search: "${searchedValue}"`}
											onDelete={resetSearch}
											color='primary'
											variant='filled'
											size='small'
											sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
										/>
									)}
								</Box>
							</Box>
						</Box>

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
											sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, color: theme.textColor?.error.main, mt: '1rem' }}>
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
					<Box sx={{ display: 'flex', justifyContent: 'center', margin: isMobileSize ? '0.75rem' : '1.5rem', width: '95%' }}>
						<CustomTablePagination count={topicsNumberOfPages} page={currentPage} onChange={handlePageChange} />
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
