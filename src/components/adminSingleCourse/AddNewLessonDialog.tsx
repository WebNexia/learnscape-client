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
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { Lesson } from '../../interfaces/lessons';
import { useContext, useEffect, useState } from 'react';
import { LessonsContext } from '../../contexts/LessonsContextProvider';
import { ChapterLessonData, ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTableCell from '../layouts/table/CustomTableCell';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import { chapterUpdateTrack } from '../../utils/chapterUpdateTrack';
import { LessonType } from '../../interfaces/enums';
import CustomTextField from '../forms/customFields/CustomTextField';
import { Search } from '@mui/icons-material';
import theme from '../../themes';
import { useParams } from 'react-router-dom';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';

interface AddNewLessonDialogProps {
	addNewLessonModalOpen: boolean;
	setAddNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	chapter: ChapterLessonData;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
}

const AddNewLessonDialog = ({
	addNewLessonModalOpen,
	setAddNewLessonModalOpen,
	chapter,
	setIsChapterUpdated,
	setChapterLessonDataBeforeSave,
}: AddNewLessonDialogProps) => {
	const { sortLessonsData, sortedLessonsData } = useContext(LessonsContext);
	const { courseId } = useParams();
	const { user } = useContext(UserAuthContext);

	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	const filteredLessons = sortedLessonsData
		?.filter((lesson) => !chapter.lessonIds?.includes(lesson._id))
		.filter((lesson) => {
			if (searchValue) {
				const lowerSearch = searchValue.toLowerCase();
				return lesson?.title?.toLowerCase().includes(lowerSearch);
			}
			if (filterValue) {
				if (filterValue === 'instructional lessons' && lesson.type === LessonType.INSTRUCTIONAL_LESSON) return true;
				if (filterValue === 'practice lessons' && lesson.type === LessonType.PRACTICE_LESSON) return true;
				if (filterValue === 'quizzes' && lesson.type === LessonType.QUIZ) return true;
				if (filterValue === 'published lessons' && lesson.isActive) return true;
				if (filterValue === 'unpublished lessons' && !lesson.isActive) return true;
			}
			return !searchValue && !filterValue;
		});

	const lessonsNumberOfPages = Math.ceil(filteredLessons.length / pageSize);

	const paginatedLessons = filteredLessons.slice((lessonsPageNumber - 1) * pageSize, lessonsPageNumber * pageSize);

	const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);
	const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		if (addNewLessonModalOpen) {
			setLessonsPageNumber(1);
		}
	}, [addNewLessonModalOpen, setLessonsPageNumber]);

	const handleSort = (property: keyof Lesson) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortLessonsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleCheckboxChange = (lesson: Lesson) => {
		const selectedIndex = selectedLessonIds.indexOf(lesson._id);
		let newSelectedLessonIds: string[] = [];
		let newSelectedLessons: Lesson[] = [];

		if (selectedIndex === -1) {
			newSelectedLessonIds = [...selectedLessonIds, lesson._id];
			newSelectedLessons = [...selectedLessons, lesson];
		} else {
			newSelectedLessonIds = selectedLessonIds?.filter((id) => id !== lesson._id);
			newSelectedLessons = selectedLessons?.filter((selectedLesson) => selectedLesson._id !== lesson._id);
		}

		setSelectedLessonIds(newSelectedLessonIds);
		setSelectedLessons(newSelectedLessons);

		chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);


	};
	const handleAddLessons = () => {
		if (!courseId || !user) return;
		
		setChapterLessonDataBeforeSave((prevData) => {
			if (prevData) {
				const updatedSelectedLessons = selectedLessons.map(lesson => ({
					...lesson,
					usedInCourses: lesson.usedInCourses ? [...lesson.usedInCourses, courseId] : [courseId],
					updatedAt: new Date().toISOString(),
					updatedByName: `${user.firstName} ${user.lastName}`,
					updatedByImageUrl: user.imageUrl,
					updatedByRole: user.role,
				}));

				return prevData.map((currentChapter) => {
					if (currentChapter.chapterId === chapter?.chapterId) {
						return {
							...currentChapter,
							lessons: currentChapter?.lessons?.concat(updatedSelectedLessons),
							lessonIds: currentChapter?.lessonIds?.concat(selectedLessonIds),
						};
					}
					return currentChapter;
				});
			}
			return [{
				chapterId: chapter?.chapterId,
				title: chapter?.title,
				lessons: selectedLessons.map(lesson => ({
					...lesson,
					usedInCourses: lesson.usedInCourses ? [...lesson.usedInCourses, courseId] : [courseId],
					updatedAt: new Date().toISOString(),
					updatedByName: `${user.firstName} ${user.lastName}`,
					updatedByImageUrl: user.imageUrl,
					updatedByRole: user.role,
				})),
				lessonIds: selectedLessonIds,
			}];
		});

		setAddNewLessonModalOpen(false);
		setSelectedLessons([]);
		setSelectedLessonIds([]);
	};

	const handleResetCheckboxes = () => {
		setSelectedLessons([]);
		setSelectedLessonIds([]);
	};

	const closeAddNewLessonModalOpen = () => setAddNewLessonModalOpen(false);
	return (
		<CustomDialog openModal={addNewLessonModalOpen} closeModal={closeAddNewLessonModalOpen} title='Add New Lesson'>
			<DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', padding: '1rem 2rem 0 2rem' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									setSearchValue('');
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
									Filter Lessons
								</MenuItem>
								<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
									All Lessons
								</MenuItem>
								{['Published Lessons', 'Unpublished Lessons'].map((type) => (
									<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										{type}
									</MenuItem>
								))}
								<MenuItem disabled value='types' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
									----- Filter by Type -----
								</MenuItem>
								{['Instructional Lessons', 'Practice Lessons', 'Quizzes'].map((type) => (
									<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{ alignSelf: 'flex-start', width: '35%' }}>
						<CustomTextField
							value={searchValue}
							placeholder={'Search Lesson in Title'}
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
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '1rem 2rem',
						width: '100%',
						height: '22.5rem',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Lesson>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'title', label: 'Title' },
								{ key: 'type', label: 'Type' },
								{ key: 'isActive', label: 'Status' },
								{ key: 'actions', label: 'Add Lessons' },
							]}
						/>
						<TableBody>
							{paginatedLessons &&
								paginatedLessons?.map((lesson: Lesson) => {
									const isSelected = selectedLessonIds.indexOf(lesson._id) !== -1;
									return (
										<TableRow key={lesson._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
											<CustomTableCell value={lesson.title} />
											<CustomTableCell value={lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} />
											<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleCheckboxChange(lesson)} />} label='' />
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={lessonsNumberOfPages} page={lessonsPageNumber} onChange={setLessonsPageNumber} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewLessonModalOpen(false);
					handleResetCheckboxes();
				}}
				onSubmit={handleAddLessons}
				submitBtnText='Add'
				actionSx={{ margin: '0rem 1rem 1.5rem 0' }}>
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

export default AddNewLessonDialog;
