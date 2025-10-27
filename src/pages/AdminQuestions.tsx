import { Box, Table, TableBody, TableCell, TableRow, Tooltip, Typography, Snackbar, Alert, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { AutoAwesome, Delete, Edit, Info } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../interfaces/question';
import useNewQuestion from '../hooks/useNewQuestion';
import CreateQuestionDialog from '../components/forms/newQuestion/CreateQuestionDialog';
import { useAuth } from '../hooks/useAuth';
import { stripHtml } from '../utils/stripHtml';
import { truncateText } from '../utils/utilText';
import AdminQuestionsEditQuestionDialog from '../components/forms/editQuestion/AdminQuestionsEditQuestionDialog';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { dateFormatter } from '../utils/dateFormatter';
import QuestionInfoModal from '../components/layouts/questions/QuestionInfoModal';
import { decode } from 'html-entities';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';

const AdminQuestions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isInstructor } = useAuth();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const {
		questions,
		loading,
		error,
		fetchMoreQuestions,
		removeQuestion,
		totalItems,
		loadedPages,
		setQuestionsPageNumber,
		questionTypes,
		enableQuestionsFetch,
	} = useContext(QuestionsContext);

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'type', label: 'Type' },
					{ key: 'question', label: 'Question' },
					{ key: 'actions', label: 'Actions' },
				]
			: isInstructor
				? [
						{ key: 'type', label: 'Type' },
						{ key: 'question', label: 'Question' },
						{ key: 'createdAt', label: 'Created On' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					]
				: [
						{ key: 'type', label: 'Type' },
						{ key: 'question', label: 'Question' },
						{ key: 'createdByName', label: 'Created By' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					];
	};

	useEffect(() => {
		enableQuestionsFetch();
	}, []);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayQuestions,
		numberOfPages: questionsNumberOfPages,
		currentPage: questionsCurrentPage,
		searchResultsTotalItems,
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
	} = useFilterSearch<QuestionInterface>({
		getEndpoint: () => `${base_url}/questions/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: questions,
		setContextPageNumber: setQuestionsPageNumber,
		fetchMoreContextData: fetchMoreQuestions,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	const sortedQuestions = useMemo(() => {
		if (!displayQuestions) return [];

		return [...displayQuestions].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});
	}, [displayQuestions, orderBy, order]);

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedQuestions = sortedQuestions;

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean[]>([]);
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<boolean[]>([]);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);
	const [isQuestionInfoModalOpen, setIsQuestionInfoModalOpen] = useState<boolean[]>([]);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const {
		options,
		setOptions,
		correctAnswerIndex,
		setCorrectAnswerIndex,
		correctAnswer,
		setCorrectAnswer,
		isDuplicateOption,
		setIsDuplicateOption,
		setIsMinimumOptions,
		isMinimumOptions,
		addOption,
		removeOption,
		handleCorrectAnswerChange,
		handleOptionChange,
	} = useNewQuestion();

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedQuestions && paginatedQuestions.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedQuestions.length;
			setIsQuestionDeleteModalOpen(Array(paginatedQuestions.length).fill(false));
			setEditQuestionModalOpen(Array(paginatedQuestions.length).fill(false));
			setIsQuestionInfoModalOpen(Array(paginatedQuestions.length).fill(false));
		}
	}, [questionsCurrentPage, filterValue, searchValue]);

	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while questions are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout
				pageName={isInstructor ? 'My Questions' : 'Questions'}
				customSettings={{ justifyContent: 'flex-start' }}
				showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}

	const openDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = true;
		setIsQuestionDeleteModalOpen(updatedState);
	};
	const closeDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = false;
		setIsQuestionDeleteModalOpen(updatedState);
	};

	const deleteQuestion = async (questionId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}/questions${isInstructor ? '/instructor' : ''}/${questionId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				removeQuestion(questionId);

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(questionId);
				}

				// Show success message
				setSnackbarMessage('Question deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete question failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete question');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete question error:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Function to toggle edit modal for a specific question
	const toggleQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setEditQuestionModalOpen(newEditModalOpen);
	};
	const closeQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = false;
		setEditQuestionModalOpen(newEditModalOpen);
	};

	const openQuestionInfoModal = (index: number) => {
		const updatedState = [...isQuestionInfoModalOpen];
		updatedState[index] = true;
		setIsQuestionInfoModalOpen(updatedState);
	};

	const closeQuestionInfoModal = (index: number) => {
		const updatedState = [...isQuestionInfoModalOpen];
		updatedState[index] = false;
		setIsQuestionInfoModalOpen(updatedState);
	};

	return (
		<AdminPageErrorBoundary pageName={isInstructor ? 'My Questions' : 'Questions'}>
			<DashboardPagesLayout
				pageName={isInstructor ? 'My Questions' : 'Questions'}
				customSettings={{ justifyContent: 'flex-start' }}
				showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Questions' },
							{ value: 'ai generated', label: 'AI Generated' },
							{ value: 'non ai generated', label: 'Non-AI Generated' },
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
						totalItems={totalItems || questions?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: isMobileSize ? 'New' : 'New Question',
								onClick: () => {
									setIsQuestionCreateModalOpen(true);
									setQuestionType('');
									setOptions(['']);
									setCorrectAnswer('');
									setIsDuplicateOption(false);
									setCorrectAnswerIndex(-1);
								},
							},
						]}
						isSticky={true}
					/>

					<CreateQuestionDialog
						createNewQuestion={true}
						isQuestionCreateModalOpen={isQuestionCreateModalOpen}
						questionType={questionType}
						options={options}
						correctAnswer={correctAnswer}
						correctAnswerIndex={correctAnswerIndex}
						setQuestionType={setQuestionType}
						setOptions={setOptions}
						setCorrectAnswer={setCorrectAnswer}
						setCorrectAnswerIndex={setCorrectAnswerIndex}
						setIsQuestionCreateModalOpen={setIsQuestionCreateModalOpen}
						addOption={addOption}
						removeOption={removeOption}
						handleCorrectAnswerChange={handleCorrectAnswerChange}
						handleOptionChange={handleOptionChange}
						setIsMinimumOptions={setIsMinimumOptions}
						isMinimumOptions={isMinimumOptions}
						isDuplicateOption={isDuplicateOption}
					/>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
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
									top:
										(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())
											? !isMobileSize
												? '10rem'
												: '12.5rem'
											: isMobileSize
												? '10.25rem'
												: '8rem',
									left: isMobileSize ? 0 : '10rem',
									right: 0,
									zIndex: 99,
									backgroundColor: theme.bgColor?.secondary,
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
									display: 'table',
									tableLayout: 'fixed',
									width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
								},
								'& .MuiTableHead-root .MuiTableCell-root': {
									backgroundColor: theme.bgColor?.secondary,
									padding: '0.5rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.35rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								// Column widths - better balanced ratios
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '25%' : '18%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '200px' : '300px',
									width: isMobileSize ? '55%' : '38%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '20%' : '15%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '60px' : '100px',
									width: isMobileSize ? '0%' : '15%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '0px' : '80px',
									width: isMobileSize ? '0%' : '15%',
								},
								// Column widths for body cells - exact same as header
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '25%' : '18%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '200px' : '300px',
									width: isMobileSize ? '55%' : '38%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '20%' : '15%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '60px' : '100px',
									width: isMobileSize ? '0%' : '15%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '0px' : '80px',
									width: isMobileSize ? '0%' : '15%',
								},
							}}
							size='small'
							aria-label='a dense table'>
							<TableBody>
								{/* Spacer row to ensure header alignment */}
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									<TableCell sx={{ width: isMobileSize ? '25%' : '18%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '55%' : '38%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
								</TableRow>
							</TableBody>
							<CustomTableHead<QuestionInterface>
								orderBy={orderBy as keyof QuestionInterface}
								order={order}
								handleSort={handleSort}
								columns={getColumns(isMobileSize)}
							/>
							<TableBody>
								{paginatedQuestions &&
									paginatedQuestions?.map((question: QuestionInterface, index) => {
										return (
											<TableRow key={question._id} hover>
												<CustomTableCell value={question.questionType}>
													{question.isAiGenerated && (
														<Tooltip title='AI Generated' placement='top' arrow>
															<AutoAwesome
																sx={{
																	fontSize: '1rem',
																	color: '#2196F3',
																	marginLeft: '0.5rem',
																}}
															/>
														</Tooltip>
													)}
												</CustomTableCell>
												<CustomTableCell
													value={
														isMobileSize
															? truncateText(stripHtml(decode(question.question)), 30)
															: truncateText(stripHtml(decode(question.question)), 45)
													}
												/>

												{!isMobileSize && !isInstructor && <CustomTableCell value={question.createdByName || 'N/A'} />}
												{!isMobileSize && isInstructor && <CustomTableCell value={dateFormatter(question.createdAt)} />}
												{!isMobileSize && <CustomTableCell value={dateFormatter(question.updatedAt)} />}

												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															setOptions(question.options);
															setCorrectAnswer(question.correctAnswer);
															const correctAnswerIndex = question.options?.indexOf(question.correctAnswer) || -1;
															setCorrectAnswerIndex(correctAnswerIndex);
															toggleQuestionEditModal(index);
															setIsDuplicateOption(false);
															setIsMinimumOptions(true);
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													<AdminQuestionsEditQuestionDialog
														question={question}
														correctAnswerIndex={correctAnswerIndex}
														index={index}
														options={options}
														correctAnswer={question.correctAnswer}
														questionType={question.questionType}
														isMinimumOptions={isMinimumOptions}
														isDuplicateOption={isDuplicateOption}
														handleCorrectAnswerChange={handleCorrectAnswerChange}
														setCorrectAnswerIndex={setCorrectAnswerIndex}
														handleOptionChange={handleOptionChange}
														closeQuestionEditModal={closeQuestionEditModal}
														editQuestionModalOpen={editQuestionModalOpen}
														addOption={addOption}
														removeOption={removeOption}
														setCorrectAnswer={setCorrectAnswer}
														setIsDuplicateOption={setIsDuplicateOption}
														setIsMinimumOptions={setIsMinimumOptions}
													/>

													<CustomActionBtn
														title='Delete'
														onClick={() => {
															openDeleteQuestionModal(index);
														}}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													<CustomActionBtn
														title='More Info'
														onClick={() => {
															openQuestionInfoModal(index);
														}}
														icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													{isQuestionDeleteModalOpen[index] !== undefined && (
														<CustomDialog
															openModal={isQuestionDeleteModalOpen[index]}
															closeModal={() => closeDeleteQuestionModal(index)}
															title='Delete Question'
															content={``}
															maxWidth='xs'>
															<DialogContent>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																	Are you sure you want to delete "{truncateText(stripHtml(decode(question.question)), 25)}"?
																</Typography>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																	You can restore it later from the recycle bin
																</Typography>
															</DialogContent>
															<CustomDialogActions
																onCancel={() => closeDeleteQuestionModal(index)}
																deleteBtn={true}
																onDelete={() => {
																	deleteQuestion(question._id);
																	closeDeleteQuestionModal(index);
																}}
																actionSx={{ mb: '0.5rem' }}
															/>
														</CustomDialog>
													)}
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
						{displayQuestions && displayQuestions.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No questions found matching your search criteria.' : 'No questions found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
						{isMobileSize && !(displayQuestions && displayQuestions.length === 0) && (
							<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
						)}
						<CustomTablePagination count={questionsNumberOfPages} page={questionsCurrentPage} onChange={handlePageChange} />
					</Box>

					{isQuestionInfoModalOpen?.map(
						(isOpen, index) =>
							isOpen && (
								<CustomDialog
									key={index}
									openModal={isOpen}
									closeModal={() => closeQuestionInfoModal(index)}
									title='Question Information'
									maxWidth='sm'>
									<QuestionInfoModal question={paginatedQuestions[index]} onClose={() => closeQuestionInfoModal(index)} />
								</CustomDialog>
							)
					)}
				</Box>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={5000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					sx={{ mt: '4rem' }}
					onClose={() => setSnackbarOpen(false)}>
					<Alert
						onClose={() => setSnackbarOpen(false)}
						severity={snackbarSeverity}
						sx={{
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
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminQuestions;
