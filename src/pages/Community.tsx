import { Box, DialogContent, Typography, FormControl, Select, MenuItem, Chip, InputAdornment, IconButton, Tooltip } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { useContext, useEffect, useState } from 'react';
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
import axios from '@utils/axiosInstance';
import { Roles } from '../interfaces/enums';

export interface NewTopic {
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
}

const Community = () => {
	const { sortedTopicsData, setTopicsPageNumber, topicsPageNumber, fetchMoreTopics, totalItems, loadedPages } = useContext(CommunityContext);
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

	// Search and filter state
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<CommunityTopic[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);

	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);

	const pageSize = 20;

	// Use search results if active, otherwise use context data
	const displayTopics =
		(isSearchActive ? searchResults : sortedTopicsData || [])?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) ||
		[];

	// For pagination, use total items from server when not searching
	const topicsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : topicsPageNumber;

	// Paginate the data for display
	const paginatedTopics = displayTopics?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	useEffect(() => {
		setTopicsPageNumber(1);
	}, []);

	// Handle search functionality
	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setTopicsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '60',
					search: searchValue.trim(),
				});

				// Add filter if it exists
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
					// Add userId for "My Topics" filter
					if (filterValue.toLowerCase() === 'my topics' && user?._id) {
						params.append('userId', user._id);
					}
				}

				const response = await axios.get(`${import.meta.env.VITE_SERVER_BASE_URL}/communityTopics/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
				setSearchedValue('');
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${import.meta.env.VITE_SERVER_BASE_URL}/communityTopics/organisation/${orgId}?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	// Handle filter changes
	const handleFilterChange = async (newFilterValue: string) => {
		setFilterValue(newFilterValue);

		// Auto-search when filter is selected
		if (newFilterValue && newFilterValue.trim()) {
			setTopicsPageNumber(1);
			setSearchResultsPage(1);
			setIsSearchActive(true);

			try {
				const params = new URLSearchParams({
					limit: '60',
					filter: newFilterValue.trim(),
				});

				// Include existing search value if it exists
				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}

				// Add userId for "My Topics" filter
				if (newFilterValue.toLowerCase() === 'my topics' && user?._id) {
					params.append('userId', user._id);
				}

				const response = await axios.get(`${import.meta.env.VITE_SERVER_BASE_URL}/communityTopics/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
			} catch (error) {
				console.error('Filter search error:', error);
			}
		} else {
			// If filter is cleared but search value exists, auto-search with search value
			if (searchValue && searchValue.trim()) {
				handleSearch();
			} else {
				// Clear search results and go back to context data
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchResultsPage(1);
			}
		}
	};

	// Handle page change
	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setTopicsPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '60',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
					// Add userId for "My Topics" filter
					if (filterValue.toLowerCase() === 'my topics' && user?._id) {
						params.append('userId', user._id);
					}
				}

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages && searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 60);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (sortedTopicsData.length < requiredRecords && newPage <= topicsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 60);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreTopics(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

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

	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobileSize ? '1.1rem' : '2rem', width: '100%' }}>
				<Box>
					<Typography variant={isMobileSize ? 'h6' : 'h5'} sx={{ textAlign: 'center', mb: isMobileSize ? '0.5rem' : '1rem', fontWeight: 500 }}>
						Join the Conversation!
						<Tooltip title='Introduction to the Community' arrow placement='top'>
							<IconButton onClick={() => setCommunityIntroModalOpen(true)} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<Info />
							</IconButton>
						</Tooltip>
					</Typography>
				</Box>
				<CustomDialog openModal={communityIntroModalOpen} closeModal={() => setCommunityIntroModalOpen(false)} maxWidth='sm'>
					<DialogContent>
						<Typography variant='body2' sx={{ textAlign: 'justify', lineHeight: 1.6, mb: '0.75rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
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
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: isSearchActive ? 'flex-start' : 'center',
							width: '100%',
							mb: '1rem',
						}}>
						<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', flex: 4, alignItems: 'center' }}>
							<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
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
								<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
									Search
								</CustomSubmitButton>
								<CustomDeleteButton
									onClick={() => {
										setSearchValue('');
										setFilterValue('');
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setIsSearchActive(false);
										setTopicsPageNumber(1);
										setSearchResultsPage(1);
										setSearchResultsTotalItems(0);
										setSearchButtonClicked(false);
										setSearchedValue('');
									}}>
									Reset
								</CustomDeleteButton>
							</Box>
							{/* Chips for active search and filter */}
							{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
								<Box
									sx={{
										display: 'flex',
										gap: 1,
										flexWrap: 'wrap',
										justifyContent: 'flex-start',
										borderRadius: '4px',
										alignSelf: 'flex-start',
										marginBottom: '1rem',
									}}>
									{isSearchActive && filterValue && filterValue.trim() && (
										<Chip
											label={`Filter: "${filterValue}"`}
											onDelete={() => {
												setFilterValue('');
												// If search value exists, keep search results
												if (searchValue && searchValue.trim()) {
													handleSearch();
												} else {
													// Clear search results and go back to context data
													setSearchResults([]);
													setSearchResultsLoadedPages([]);
													setSearchResultsTotalItems(0);
													setIsSearchActive(false);
													setSearchResultsPage(1);
												}
											}}
											variant='outlined'
											color='secondary'
											size='small'
											sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
										/>
									)}
									{isSearchActive && searchedValue && searchButtonClicked && (
										<Chip
											label={`Search: "${searchedValue}"`}
											onDelete={() => {
												setSearchValue('');
												setSearchedValue('');
												setSearchButtonClicked(false);
												// If filter is still active, keep filter results
												if (filterValue) {
													// Re-trigger filter search without search value
													const params = new URLSearchParams({
														limit: '60',
														filter: filterValue,
													});
													// Add userId for "My Topics" filter
													if (filterValue.toLowerCase() === 'my topics' && user?._id) {
														params.append('userId', user._id);
													}
													axios
														.get(`${import.meta.env.VITE_SERVER_BASE_URL}/communityTopics/organisation/${orgId}?${params.toString()}`)
														.then((response) => {
															setSearchResults(response.data.data);
															setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
															setSearchResultsLoadedPages([1]);
															setIsSearchActive(true);
															setSearchResultsPage(1);
														})
														.catch((error) => {
															console.error('Filter error:', error);
														});
												} else {
													// Clear everything and go back to context data
													setSearchResults([]);
													setSearchResultsLoadedPages([]);
													setSearchResultsTotalItems(0);
													setIsSearchActive(false);
													setSearchResultsPage(1);
												}
											}}
											color='primary'
											variant='filled'
											size='small'
											sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
										/>
									)}
								</Box>
							)}
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', width: '100%', mb: '0.85rem' }}>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 'auto' }}>
								<CustomSubmitButton
									size='small'
									onClick={() => {
										if (user?.hasRegisteredCourse || user?.role === 'admin') {
											setCreateTopicModalOpen(true);
										} else {
											setMessageNonRegisteredModalOpen(true);
										}
									}}
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
							<CustomDialog openModal={messageNonRegisteredModalOpen} closeModal={() => setMessageNonRegisteredModalOpen(false)} maxWidth='sm'>
								<DialogContent>
									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<Typography
											variant='body2'
											sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, color: theme.textColor?.error.main, mt: '1rem' }}>
											You need to register for a paid platform course to create a topic.
										</Typography>
									</Box>
								</DialogContent>
								<CustomCancelButton
									sx={{ alignSelf: 'end', width: isMobileSize ? '20%' : '10%', margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0', padding: 0 }}
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
	);
};

export default Community;
