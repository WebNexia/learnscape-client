import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../../interfaces/question';
import { Lesson } from '../../interfaces/lessons';
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
import axios from 'axios';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';

interface AddNewQuestionDialogProps {
	addNewQuestionModalOpen: boolean;
	singleLessonBeforeSave: Lesson;
	setAddNewQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
}

const AddNewQuestionDialog = ({
	addNewQuestionModalOpen,
	singleLessonBeforeSave,
	setAddNewQuestionModalOpen,
	setIsLessonUpdated,
	setSingleLessonBeforeSave,
	setIsQuestionUpdated,
}: AddNewQuestionDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const {
		sortQuestionsData,
		sortedQuestionsData,
		numberOfPages,
		questionsPageNumber,
		setQuestionsPageNumber,
		setNumberOfPages,
		fetchQuestions,
		questionTypes,
	} = useContext(QuestionsContext);
	const closeAddNewQuestionModal = () => setAddNewQuestionModalOpen(false);

	const [filteredQuestions, setFilteredQuestions] = useState<QuestionInterface[]>(sortedQuestionsData);
	const [originalQuestions, setOriginalQuestions] = useState<QuestionInterface[]>(sortedQuestionsData);
	const [numberOfPagesOfAllQuestions, setNumberOfPagesOfAllQuestions] = useState<number>(numberOfPages);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const [selectedQuestions, setSelectedQuestions] = useState<QuestionInterface[]>([]);
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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
	};

	const handleAddQuestions = () => {
		setSingleLessonBeforeSave((prevData) => {
			return {
				...prevData,
				questions: prevData.questions.concat(selectedQuestions),
				questionIds: prevData.questionIds.concat(selectedQuestionIds),
			};
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
	};

	const handleResetCheckboxes = () => {
		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
	};

	const handleSearchQuestions = async (page: number) => {
		if (!searchValue) {
			setNumberOfPages(numberOfPagesOfAllQuestions);
			setFilteredQuestions(originalQuestions);

			return;
		}

		try {
			const response = await axios.post(`${base_url}/questions/search`, {
				orgId,
				page,
				limit: 75,
				search: searchValue,
			});
			setFilteredQuestions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	const handleFilterQuestions = async (page: number, filterValue: string) => {
		if (!filterValue) {
			setNumberOfPages(numberOfPagesOfAllQuestions);
			setFilteredQuestions(originalQuestions);
			return;
		}

		try {
			const response = await axios.post(`${base_url}/questions/filter`, {
				orgId,
				page,
				limit: 75,
				questionTypeName: filterValue,
			});
			setFilteredQuestions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<CustomDialog openModal={addNewQuestionModalOpen} closeModal={closeAddNewQuestionModal} title='Add New Question'>
			<DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '1rem 2rem' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: '25rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder='Search Question'
							onChange={(e) => {
								setSearchValue(e.target.value);
								setFilterValue('filter');
								if (e.target.value === '') {
									setFilterValue('');
								}
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
						<CustomSubmitButton
							sx={{ height: '2.1rem', marginLeft: '0.5rem' }}
							type='button'
							onClick={async () => {
								await handleSearchQuestions(1);
							}}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							sx={{ height: '2.1rem', marginLeft: '0.5rem' }}
							type='button'
							onClick={async () => {
								setFilterValue('');
								setSearchValue('');
								setFilteredQuestions(originalQuestions);
								setQuestionsPageNumber(1);
								setNumberOfPages(numberOfPagesOfAllQuestions);
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
					<Box>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={async (e) => {
									setSearchValue('');
									setFilterValue(e.target.value);
									if (e.target.value !== '') {
										await handleFilterQuestions(1, e.target.value);
									} else {
										setFilteredQuestions(originalQuestions);
									}
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
							{filteredQuestions &&
								filteredQuestions
									?.filter((question) => {
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
									})
									?.filter((question) => !singleLessonBeforeSave.questionIds.includes(question._id))
									?.map((question: QuestionInterface) => {
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
					<CustomTablePagination count={numberOfPages} page={questionsPageNumber} onChange={setQuestionsPageNumber} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewQuestionModalOpen(false);
					handleResetCheckboxes();
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
