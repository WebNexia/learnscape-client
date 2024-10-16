import { Box, Checkbox, DialogContent, FormControlLabel, Table, TableBody, TableCell, TableRow } from '@mui/material';
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
	const { sortLessonsData, sortedLessonsData, numberOfPages, lessonsPageNumber, setLessonsPageNumber } = useContext(LessonsContext);
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
		setChapterLessonDataBeforeSave((prevData) => {
			if (prevData) {
				return prevData.map((currentChapter) => {
					if (currentChapter.chapterId === chapter?.chapterId) {
						return {
							...currentChapter,
							lessons: currentChapter.lessons.concat(selectedLessons),
							lessonIds: currentChapter.lessonIds.concat(selectedLessonIds),
						};
					}
					return currentChapter; // Return unchanged chapter if not the one being updated
				});
			}
			// Handle the case when prevData is undefined
			return [
				{
					chapterId: chapter?.chapterId,
					title: chapter?.title,
					lessons: selectedLessons,
					lessonIds: selectedLessonIds,
				},
			];
		});

		// Close the dialog
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
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '2rem',
						mt: '1rem',
						width: '100%',
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
							{sortedLessonsData &&
								sortedLessonsData
									?.filter((lesson) => !chapter.lessonIds.includes(lesson._id))
									?.map((lesson: Lesson) => {
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
					<CustomTablePagination count={numberOfPages} page={lessonsPageNumber} onChange={setLessonsPageNumber} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewLessonModalOpen(false);
					handleResetCheckboxes();
				}}
				onSubmit={handleAddLessons}
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

export default AddNewLessonDialog;
