import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../../interfaces/question';
import { Lesson } from '../../interfaces/lessons';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import {
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
} from '@mui/material';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomTableCell from '../layouts/table/CustomTableCell';
import { stripHtml } from '../../utils/stripHtml';
import { truncateText } from '../../utils/utilText';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import { LessonType, QuestionType } from '../../interfaces/enums';
import CustomTextField from '../forms/customFields/CustomTextField';
import { Search } from '@mui/icons-material';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import theme from '../../themes';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';

interface AddNewQuestionDialogProps {
	addNewQuestionModalOpen: boolean;
	singleLessonBeforeSave: Lesson;
	setAddNewQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddNewQuestionDialog = ({
	addNewQuestionModalOpen,
	singleLessonBeforeSave,
	setAddNewQuestionModalOpen,
	setIsLessonUpdated,
	setSingleLessonBeforeSave,
	setIsQuestionUpdated,
	setHasUnsavedChanges,
}: AddNewQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const lessonId = singleLessonBeforeSave._id;

	const {
		sortQuestionsData,
		questions,
		fetchMoreQuestions,
		totalItems,
		loadedPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		fetchQuestions,
		questionTypes,
		updateQuestion,
	} = useContext(QuestionsContext);
	const closeAddNewQuestionModal = () => {
		setAddNewQuestionModalOpen(false);
		setSearchValue('');
		setFilterValue('');
		setSearchResults([]);
		setIsSearchActive(false);
		setQuestionsPageNumber(1);
	};

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<QuestionInterface[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 25;

	// Use search results if active, otherwise use context data (filtered to exclude already added questions)
	const displayQuestions = isSearchActive
		? searchResults
		: questions.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id));

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const questionsNumberOfPages = isSearchActive ? Math.ceil(displayQuestions.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedQuestions = displayQuestions.slice((questionsPageNumber - 1) * pageSize, questionsPageNumber * pageSize);

	const [selectedQuestions, setSelectedQuestions] = useState<QuestionInterface[]>([]);
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	// Helper function to filter questions by lesson type compatibility
	const filterQuestionsByLessonType = (questions: QuestionInterface[]) => {
		return questions.filter((question: QuestionInterface) => {
			const questionTypeName = question.questionType as QuestionType;
			if (singleLessonBeforeSave.type === LessonType.QUIZ) {
				return [
					QuestionType.MULTIPLE_CHOICE,
					QuestionType.TRUE_FALSE,
					QuestionType.OPEN_ENDED,
					QuestionType.AUDIO_VIDEO,
					QuestionType.MATCHING,
					QuestionType.FITB_TYPING,
					QuestionType.FITB_DRAG_DROP,
				].includes(questionTypeName);
			} else if (singleLessonBeforeSave.type === LessonType.PRACTICE_LESSON) {
				return [
					QuestionType.MULTIPLE_CHOICE,
					QuestionType.TRUE_FALSE,
					QuestionType.OPEN_ENDED,
					QuestionType.MATCHING,
					QuestionType.FITB_TYPING,
					QuestionType.FITB_DRAG_DROP,
					QuestionType.FLIP_CARD,
				].includes(questionTypeName);
			}
			return true;
		});
	};

	useEffect(() => {
		if (addNewQuestionModalOpen) {
			setQuestionsPageNumber(1);
		}
	}, [addNewQuestionModalOpen, setQuestionsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchQuestions(questionsPageNumber);
		}
	}, [questionsPageNumber]);

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuestionsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleCheckboxChange = (question: QuestionInterface) => {
		const selectedIndex = selectedQuestionIds.indexOf(question._id);
		let newSelectedQuestionIds: string[] = [];
		let newSelectedQuestions: QuestionInterface[] = [];

		if (selectedIndex === -1) {
			newSelectedQuestionIds = [...selectedQuestionIds, question._id];
			newSelectedQuestions = [...selectedQuestions, question];
		} else {
			newSelectedQuestionIds = selectedQuestionIds?.filter((id) => id !== question._id);
			newSelectedQuestions = selectedQuestions?.filter((selectedQuestion) => selectedQuestion._id !== question._id);
		}

		setSelectedQuestionIds(newSelectedQuestionIds);
		setSelectedQuestions(newSelectedQuestions);

		setIsLessonUpdated(true);
		setHasUnsavedChanges(true);
	};

	const handleAddQuestions = () => {
		const updatedSelectedQuestions = selectedQuestions.map((question) => ({
			...question,
			usedInLessons: question.usedInLessons ? [...question.usedInLessons, lessonId] : [lessonId],
			updatedAt: new Date().toISOString(),
			updatedByName: user ? `${user.firstName} ${user.lastName}` : '',
			updatedByImageUrl: user?.imageUrl || '',
			updatedByRole: user?.role || '',
		}));

		setSingleLessonBeforeSave((prevData) => {
			return {
				...prevData,
				questions: prevData.questions?.concat(updatedSelectedQuestions),
				questionIds: prevData.questionIds?.concat(selectedQuestionIds),
			};
		});

		// Update questions in the context
		updatedSelectedQuestions.forEach((question) => {
			updateQuestion(question);
		});

		const addedQuestionsUpdateData: QuestionUpdateTrack[] = selectedQuestions?.reduce((acc: QuestionUpdateTrack[], value: QuestionInterface) => {
			acc.push({ questionId: value?._id, isUpdated: false });
			return acc;
		}, []);

		setIsQuestionUpdated((prevData) => {
			return [...prevData, ...addedQuestionsUpdateData];
		});

		setIsLessonUpdated(true);

		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
		closeAddNewQuestionModal();
		setHasUnsavedChanges(true);
	};

	const handleResetCheckboxes = () => {
		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
	};

	const handlePageChange = async (newPage: number) => {
		setQuestionsPageNumber(newPage);

		// Only fetch more data if not searching
		if (!isSearchActive) {
			// Check if we need to fetch more data
			const requiredRecords = newPage * pageSize;
			if (questions.length < requiredRecords && newPage <= questionsNumberOfPages) {
				// Calculate which batch of 200 records we need (context fetches 200 at a time)
				const startBatch = Math.floor(((newPage - 1) * pageSize) / 200) + 1;
				const endBatch = Math.ceil((newPage * pageSize) / 200);

				// Check if we already have the required batches loaded
				const batchesNeeded = [];
				for (let batch = startBatch; batch <= endBatch; batch++) {
					if (!loadedPages.includes(batch)) {
						batchesNeeded.push(batch);
					}
				}

				if (batchesNeeded.length > 0) {
					await fetchMoreQuestions(startBatch, endBatch);
				}
			}
		}
	};

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setQuestionsPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setQuestionsPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '200',
			});

			if (searchValue) {
				params.append('search', searchValue);
			}

			if (filterValue) {
				params.append('filter', filterValue);
			}

			if (orderBy && order) {
				params.append('sortBy', orderBy.toString());
				params.append('sortOrder', order);
			}

			console.log('Search params:', { searchValue, filterValue, params: params.toString() });
			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?${params}`);
			console.log('Search response:', response.data.data.length, 'results');

			// Filter out already added questions from search results
			const filteredResults = response.data.data.filter((question: QuestionInterface) => !singleLessonBeforeSave.questionIds?.includes(question._id));

			setSearchResults(filteredResults);
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	return (
		<CustomDialog openModal={addNewQuestionModalOpen} closeModal={closeAddNewQuestionModal} title='Add New Question'>
			<DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '1rem 2rem 0 2rem' }}>
					<Box sx={{ display: 'flex', width: '85%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => {
										setFilterValue(e.target.value);
									}}
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: '12rem',
										fontSize: '0.85rem',
										textTransform: 'capitalize',
									}}>
									<MenuItem disabled value='filter' selected sx={{ fontSize: '0.85rem', fontStyle: 'italic', textTransform: 'capitalize' }}>
										Filter Questions
									</MenuItem>
									<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										All Questions
									</MenuItem>
									<MenuItem disabled value='types' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
										------ Filter by Type ------
									</MenuItem>
									{questionTypes.map((type) => (
										<MenuItem value={type.name.toLowerCase()} key={type._id} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>

						<CustomTextField
							value={searchValue}
							placeholder='Search in question text'
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{ backgroundColor: '#fff' }}
							required={false}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<Search
											sx={{
												mr: '-0.5rem',
											}}
										/>
									</InputAdornment>
								),
							}}
						/>
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue && !filterValue}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							onClick={() => {
								setSearchValue('');
								setFilterValue('');
								setSearchResults([]);
								setIsSearchActive(false);
								setQuestionsPageNumber(1);
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.8rem', alignItems: 'center' }}>
						{isSearchActive && (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
								}}>
								{filterQuestionsByLessonType(paginatedQuestions).length} results
							</Typography>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '0 2rem',
						width: '100%',
						height: '22.5rem',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<QuestionInterface>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'questionType', label: 'Question Type' },
								{ key: 'question', label: 'Question' },
								{ key: 'actions', label: 'Add Questions' },
							]}
						/>
						<TableBody>
							{paginatedQuestions &&
								filterQuestionsByLessonType(paginatedQuestions)?.map((question: QuestionInterface) => {
									const isSelected = selectedQuestionIds.indexOf(question._id) !== -1;
									return (
										<TableRow key={question._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
											<CustomTableCell value={question.questionType} />
											<CustomTableCell value={truncateText(stripHtml(question.question), 35)} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<FormControlLabel
													control={
														<Checkbox
															checked={isSelected}
															onChange={() => handleCheckboxChange(question)}
															sx={{
																'& .MuiSvgIcon-root': {
																	fontSize: '1.25rem',
																},
															}}
														/>
													}
													label=''
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={questionsNumberOfPages} page={questionsPageNumber} onChange={handlePageChange} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewQuestionModalOpen(false);
					handleResetCheckboxes();
					setSearchValue('');
					setFilterValue('');
					setSearchResults([]);
					setIsSearchActive(false);
					setQuestionsPageNumber(1);
				}}
				onSubmit={handleAddQuestions}
				submitBtnText='Add'
				actionSx={{ margin: '1.5rem 1rem 1.5rem 0' }}>
				<CustomCancelButton
					onClick={() => {
						handleResetCheckboxes();
					}}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Deselect All
				</CustomCancelButton>
			</CustomDialogActions>
		</CustomDialog>
	);
};

export default AddNewQuestionDialog;
