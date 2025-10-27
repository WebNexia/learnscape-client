import { useState, useEffect, useContext, useMemo } from 'react';
import { Box, Table, TableBody, TableCell, TableRow, Typography, IconButton, DialogContent, Snackbar, Alert } from '@mui/material';
import { Restore, DeleteForever, Info } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import { useRecycleBinQuestions } from '../../../contexts/RecycleBinQuestionsContextProvider';
import { QuestionInterface } from '../../../interfaces/question';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import { dateFormatter } from '../../../utils/dateFormatter';
import FilterSearchRow from '../FilterSearchRow';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { truncateText } from '@utils/utilText';
import { stripHtml } from '@utils/stripHtml';
import { decode } from 'html-entities';

interface ArchivedQuestion extends QuestionInterface {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
	questionTypeName?: string;
}

const AdminRecycleBinQuestionsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewQuestion, questionTypes, fetchQuestionTypeName } = useContext(QuestionsContext);
	const {
		archivedQuestions,
		totalItems,
		fetchArchivedQuestions,
		setCurrentPage,
		setArchivedQuestions,
		setTotalItems,
		loadedPages,
		setLoadedPages,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	} = useRecycleBinQuestions();

	const pageSize = 50;

	// Create a wrapper function for fetchArchivedQuestions to match the hook's expected signature
	const fetchMoreContextData = async (startPage: number, endPage: number) => {
		const promises = [];
		for (let page = startPage; page <= endPage; page++) {
			if (!loadedPages?.includes(page)) {
				promises.push(fetchArchivedQuestions(page));
			}
		}
		await Promise.all(promises);
	};

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayQuestions,
		numberOfPages: questionsNumberOfPages,
		currentPage: questionsCurrentPage,
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
		handleSort,
		resetSearch,
		resetFilter,
		resetAll,
		removeFromSearchResults,
	} = useFilterSearch<ArchivedQuestion>({
		getEndpoint: () => `${base_url}/questions/organisation/${orgId}/archived`,
		limit: 200,
		pageSize,
		contextData: archivedQuestions || [],
		setContextPageNumber: setCurrentPage,
		fetchMoreContextData,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'archivedAt',
		defaultOrder: 'desc',
	});

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Apply client-side sorting when not in search mode
	const sortedQuestions = useMemo(() => {
		if (!displayQuestions) return [];

		const getNestedValue = (obj: any, path: string) => {
			return path.split('.').reduce((current, key) => current?.[key], obj) ?? '';
		};

		return [...displayQuestions].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (orderBy === 'autoRemoveDate') {
				const getDeletionDate = (archivedAt: string) => {
					const archivedDate = new Date(archivedAt);
					return new Date(archivedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
				};
				aValue = getDeletionDate(a.archivedAt || '');
				bValue = getDeletionDate(b.archivedAt || '');
			} else if (orderBy === 'questionType') {
				aValue = a.questionTypeName || '';
				bValue = b.questionTypeName || '';
			} else {
				aValue = getNestedValue(a, orderBy as string);
				bValue = getNestedValue(b, orderBy as string);
			}

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			}
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayQuestions, orderBy, order]);

	const paginatedQuestions = sortedQuestions;

	// Modal states
	const [restoreModalOpen, setRestoreModalOpen] = useState<boolean[]>([]);
	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean[]>([]);
	const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState<boolean>(false);
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

	// Selection states
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Load initial data when component mounts
	useEffect(() => {
		(async () => {
			await fetchArchivedQuestions(1);
			setLoadedPages([1]);
		})();
	}, []); // Empty dependency array - only run once on mount

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (displayQuestions && displayQuestions.length !== 0) {
			setRestoreModalOpen(Array(displayQuestions.length).fill(false));
			setDeleteModalOpen(Array(displayQuestions.length).fill(false));
		}
	}, [displayQuestions]);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setSelectAll(checked);
		if (checked) {
			setSelectedItems(paginatedQuestions?.map((question) => question._id) || []);
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (questionId: string) => {
		setSelectedItems((prev) => {
			if (prev?.includes(questionId)) {
				const updatedItems = prev?.filter((id) => id !== questionId) || [];
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, questionId];
				if (updatedItems.length === paginatedQuestions.length) {
					setSelectAll(true);
				}
				return updatedItems;
			}
		});
	};

	const openRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = true;
		setRestoreModalOpen(newModalState);
	};

	const closeRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = false;
		setRestoreModalOpen(newModalState);
	};

	const openDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = true;
		setDeleteModalOpen(newModalState);
	};

	const closeDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = false;
		setDeleteModalOpen(newModalState);
	};

	const restoreQuestion = async (questionId: string) => {
		try {
			const response = await axios.patch(`${base_url}/questions/${questionId}/restore`);

			if (response.data.status === 200) {
				// Remove from archived questions
				setArchivedQuestions((prev = []) => (prev.some((q) => q._id === questionId) ? prev.filter((q) => q._id !== questionId) : prev));

				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(questionId);
				}

				// Add to questions context
				if (response.data.data) {
					addNewQuestion({ ...response.data.data, questionType: fetchQuestionTypeName(response.data.data) });
					setSelectAll(false);
					setSelectedItems([]);
				}

				setSnackbarMessage('Question restored successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error) {
			console.error('Restore error:', error);
			setSnackbarMessage('Failed to restore question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteQuestion = async (questionId: string) => {
		try {
			const response = await axios.delete(`${base_url}/questions/${questionId}/hard`);

			if (response.data.status === 200) {
				// Remove from archived questions
				setArchivedQuestions((prev = []) => (prev.some((q) => q._id === questionId) ? prev.filter((q) => q._id !== questionId) : prev));

				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(questionId);
				}

				setSnackbarMessage('Question permanently deleted');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				setSelectAll(false);
				setSelectedItems([]);
			}
		} catch (error) {
			console.error('Delete error:', error);
			setSnackbarMessage('Failed to delete question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems?.map((questionId) => {
					return (async () => {
						const response = await axios.patch(`${base_url}/questions/${questionId}/restore`);
						if (response.data.data) {
							addNewQuestion({ ...response.data.data, questionType: fetchQuestionTypeName(response.data.data) });
						}
					})();
				}) || []
			);

			// Remove the questions from the list
			setArchivedQuestions((prev = []) => {
				const setIds = new Set(selectedItems);
				return prev.filter((q) => !setIds.has(q._id));
			});

			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((questionId) => removeFromSearchResults(questionId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} question(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore questions');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems?.map((questionId) => axios.delete(`${base_url}/questions/${questionId}/hard`)) || []);

			// Remove the questions from the list
			setArchivedQuestions((prev = []) => {
				const setIds = new Set(selectedItems);
				return prev.filter((q) => !setIds.has(q._id));
			});
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((questionId) => removeFromSearchResults(questionId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} question(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete questions');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const getDeletionDateStatus = (archivedAt: string) => {
		const archivedDate = new Date(archivedAt);
		const deletionDate = new Date(archivedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
		const now = new Date();
		const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilDeletion <= 0) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'error' as const };
		} else if (daysUntilDeletion <= 1) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else if (daysUntilDeletion <= 3) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else {
			return { label: `${dateFormatter(deletionDate)}`, color: 'default' as const };
		}
	};

	return (
		<>
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All deleted questions' },
					{ value: 'recently deleted', label: 'Recently deleted' },
					{ value: 'ai generated', label: 'AI Generated' },
					{ value: 'non-ai generated', label: 'Non-AI Generated' },
					{ value: 'cloned', label: 'Cloned' },
					{ value: 'original', label: 'Original' },
					...(questionTypes?.map((type) => ({
						value: type.name.toLowerCase(),
						label: type.name,
					})) || []),
				]}
				filterPlaceholder='Filter Questions'
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearch={handleSearch}
				onReset={resetAll}
				searchPlaceholder='Search in question, type'
				isSearchLoading={isSearchLoading}
				isSearchActive={isSearchActive}
				searchResultsTotalItems={searchResultsTotalItems}
				totalItems={totalItems || archivedQuestions?.length || 0}
				searchedValue={searchedValue}
				onResetSearch={resetSearch}
				onResetFilter={resetFilter}
				actionButtons={[
					...(selectedItems && selectedItems.length > 0
						? [
								{
									label: `Restore (${selectedItems.length})`,
									onClick: () => setIsBulkRestoreModalOpen(true),
								},
								{
									label: `Delete (${selectedItems.length})`,
									onClick: () => setIsBulkDeleteModalOpen(true),
								},
							]
						: []),
				]}
				isSticky={true}
				isRecycleBin={true}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0rem 2rem 0rem' : '0rem 0rem 2rem 0rem',
					width: '100%',
				}}>
				<Table
					sx={{
						'mb': '2rem',
						'tableLayout': 'fixed',
						'width': '100%',
						'borderCollapse': 'collapse',
						'borderSpacing': 0,
						'& .MuiTableHead-root': {
							position: 'fixed',
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '13.5rem'
									: '11rem'
								: isMobileSize
									? '16rem'
									: '13.25rem', // Account for header + tabs + filter row
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.bgColor?.secondary,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.bgColor?.secondary,
							padding: isMobileSize ? '0.25rem 0.25rem' : '0.25rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableHead-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						'& .MuiTableBody-root .MuiTableCell-root': {
							padding: '0.5rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableBody-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						// Column widths for mobile (4 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
							minWidth: isMobileSize ? '50px' : '50px',
							width: isMobileSize ? '10%' : '5%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
							minWidth: isMobileSize ? '200px' : '300px',
							width: isMobileSize ? '45%' : '25%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
							minWidth: isMobileSize ? '120px' : '150px',
							width: isMobileSize ? '25%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '15%',
						},
						// Desktop columns (6 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
							minWidth: isMobileSize ? '0px' : '150px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
							minWidth: isMobileSize ? '0px' : '120px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
					}}
					size='small'
					aria-label='a dense table'>
					{/* Spacer row to ensure header alignment */}
					<TableRow sx={{ height: 0, visibility: 'hidden' }}>
						<TableCell sx={{ width: isMobileSize ? '10%' : '5%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '45%' : '25%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
					</TableRow>
					<CustomTableHead<ArchivedQuestion>
						orderBy={orderBy as keyof ArchivedQuestion}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isMobileSize
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'question', label: 'Question' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'question', label: 'Question' },
										{ key: 'questionType', label: 'Type' },
										{ key: 'archivedByName', label: 'Deleted By' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{
											key: 'autoRemoveDate',
											label: 'Auto-Remove',
											infoIcon: (
												<IconButton
													size='small'
													onClick={(e) => {
														e.stopPropagation();
														setIsInfoDialogOpen(true);
													}}
													sx={{ 'p': 0.5, 'ml': 0.5, '&:hover': { backgroundColor: 'transparent' } }}>
													<Info
														sx={{
															fontSize: '1rem',
															color: 'text.secondary',
														}}
													/>
												</IconButton>
											),
										},
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedQuestions &&
							paginatedQuestions?.map((question: ArchivedQuestion, index) => {
								const deletionDateStatus = getDeletionDateStatus(question.archivedAt || '');
								const isSelected = selectedItems?.includes(question._id);

								return (
									<TableRow key={question._id} hover selected={isSelected}>
										<TableCell padding='checkbox' sx={{ textAlign: 'center' }}>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(question._id)} />
										</TableCell>
										<CustomTableCell
											value={
												isMobileSize ? truncateText(stripHtml(decode(question.question)), 25) : truncateText(stripHtml(decode(question.question)), 45)
											}
										/>
										{!isMobileSize && <CustomTableCell value={question.questionTypeName || 'N/A'} />}
										{!isMobileSize && <CustomTableCell value={question.archivedByName || 'N/A'} />}
										<CustomTableCell value={question.archivedAt ? dateFormatter(question.archivedAt) : 'N/A'} />
										{!isMobileSize && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn
												title='Restore Question'
												onClick={() => openRestoreModal(index)}
												icon={
													<Restore fontSize='small' sx={{ mr: isMobileSize ? '0rem' : '-0.6rem', fontSize: isMobileSize ? '1rem' : undefined }} />
												}
											/>
											<CustomActionBtn
												title='Delete Permanently'
												onClick={() => openDeleteModal(index)}
												icon={<DeleteForever fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedQuestions && paginatedQuestions.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted questions found matching your search criteria.' : 'No deleted questions found.'}
						sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
					/>
				)}
				{isMobileSize && <CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />}
				<CustomTablePagination count={questionsNumberOfPages} page={questionsCurrentPage} onChange={handlePageChange} />
			</Box>

			{/* Restore Modal */}
			{paginatedQuestions?.map((question, index) => (
				<CustomDialog
					key={`restore-${question._id}`}
					openModal={restoreModalOpen[index] || false}
					closeModal={() => closeRestoreModal(index)}
					title='Restore Question'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Are you sure you want to restore "{truncateText(stripHtml(decode(question.question)), 25)}"?
						</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							This question can be added to lessons manually
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreModal(index)}
						onSubmit={() => {
							restoreQuestion(question._id);
							closeRestoreModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Modal */}
			{paginatedQuestions?.map((question, index) => (
				<CustomDialog
					key={`delete-${question._id}`}
					openModal={deleteModalOpen[index] || false}
					closeModal={() => closeDeleteModal(index)}
					title='Delete Question Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Are you sure you want to permanently delete "{truncateText(stripHtml(decode(question.question)), 25)}"?
						</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteModal(index)}
						onDelete={() => {
							hardDeleteQuestion(question._id);
							closeDeleteModal(index);
						}}
						deleteBtn={true}
						deleteBtnText='Delete Permanently'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Bulk Restore Modal */}
			<CustomDialog
				openModal={isBulkRestoreModalOpen}
				closeModal={() => setIsBulkRestoreModalOpen(false)}
				title='Restore Multiple Questions'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Are you sure you want to restore {selectedItems.length} selected question(s)?
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						These questions can be added to lessons manually
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkRestoreModalOpen(false)}
					onSubmit={handleBulkRestore}
					submitBtnText='Restore All'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Bulk Delete Modal */}
			<CustomDialog
				openModal={isBulkDeleteModalOpen}
				closeModal={() => setIsBulkDeleteModalOpen(false)}
				title='Delete Multiple Questions Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Are you sure you want to permanently delete {selectedItems.length} selected question(s)?
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						This action cannot be undone.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkDeleteModalOpen(false)}
					onDelete={handleBulkDelete}
					deleteBtn={true}
					deleteBtnText='Delete All Permanently'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Info Dialog */}
			<CustomDialog openModal={isInfoDialogOpen} closeModal={() => setIsInfoDialogOpen(false)} title='Auto-Removal Information' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Questions in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						You can restore questions before this date or manually delete them immediately using the "Delete Permanently" button.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsInfoDialogOpen(false)}
					onSubmit={() => setIsInfoDialogOpen(false)}
					submitBtnText='Got it'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Snackbar */}
			<Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={snackbarSeverity}
					sx={{
						'mt': '8.5rem',
						'width': isMobileSize ? '60%' : '100%',
						'backgroundColor': theme.bgColor?.greenSecondary,
						'color': theme.textColor?.common.main,
						'fontSize': isMobileSize ? '0.75rem' : undefined,
						'& .MuiAlert-icon': {
							color: 'white',
						},
					}}>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</>
	);
};

export default AdminRecycleBinQuestionsTab;
