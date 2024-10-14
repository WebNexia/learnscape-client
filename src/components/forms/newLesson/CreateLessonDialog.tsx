import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import CustomTextField from '../customFields/CustomTextField';
import { useContext, useState } from 'react';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';
import axios from 'axios';
import { Lesson } from '../../../interfaces/lessons';
import { ChapterLessonData, ChapterUpdateTrack } from '../../../pages/AdminCourseEditPage';
import theme from '../../../themes';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { chapterUpdateTrack } from '../../../utils/chapterUpdateTrack';

interface CreateLessonDialogProps {
	chapter?: ChapterLessonData;
	isNewLessonModalOpen: boolean;
	createNewLesson: boolean;
	setIsNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setLessons?: React.Dispatch<React.SetStateAction<Lesson[]>>;
	setChapterLessonDataBeforeSave?: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated?: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
}

const CreateLessonDialog = ({
	chapter,
	isNewLessonModalOpen,
	createNewLesson,
	setIsNewLessonModalOpen,
	setLessons,
	setChapterLessonDataBeforeSave,
	setIsChapterUpdated,
}: CreateLessonDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { addNewLesson, lessonTypes } = useContext(LessonsContext);

	const [title, setTitle] = useState<string>('');
	const [type, setType] = useState<string>('');

	const createLesson = async () => {
		try {
			const response = await axios.post(`${base_url}/lessons`, {
				title: title.trim(),
				type,
				orgId,
			});

			addNewLesson({ _id: response.data._id, title: title.trim(), type });
		} catch (error) {
			console.log(error);
		}
	};

	const createLessonTemplate = () => {
		const newLessonBeforeSave: Lesson = {
			_id: generateUniqueId('temp_lesson_id_'),
			title,
			type,
			isActive: false,
			imageUrl: 'https://directmobilityonline.co.uk/assets/img/noimage.png',
			videoUrl: '',
			text: '',
			questionIds: [],
			questions: [],
			createdAt: '',
			updatedAt: '',
			orgId,
			documentIds: [],
			documents: [],
		};
		if (setLessons) {
			setLessons((prevData) => {
				if (prevData) {
					return [...prevData, newLessonBeforeSave];
				}
				return prevData;
			});
		}
		if (setChapterLessonDataBeforeSave) {
			setChapterLessonDataBeforeSave((prevData) => {
				if (prevData) {
					return prevData?.map((currentChapter) => {
						if (currentChapter.chapterId === chapter?.chapterId) {
							const updatedLessons = [...currentChapter.lessons, newLessonBeforeSave];
							if (setIsChapterUpdated) {
								chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
							}
							return {
								...currentChapter,
								lessons: updatedLessons,
								lessonIds: updatedLessons?.map((lesson: Lesson) => lesson._id),
							};
						}
						return currentChapter; // Return unchanged chapter if not the one being updated
					});
				}
				return prevData;
			});
		}
	};

	return (
		<CustomDialog
			openModal={isNewLessonModalOpen}
			closeModal={() => {
				setIsNewLessonModalOpen(false);
				setType('');
				setTitle('');
			}}
			title='Create New Lesson'
			maxWidth='sm'>
			<form
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					if (createNewLesson) {
						createLesson();
					} else {
						createLessonTemplate();
					}
					setIsNewLessonModalOpen(false);
					setType('');
					setTitle('');
				}}
				style={{ display: 'flex', flexDirection: 'column' }}>
				<CustomTextField
					fullWidth={false}
					label='Title'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					sx={{ margin: '1rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
				/>
				<FormControl sx={{ margin: '1rem 2rem' }}>
					<InputLabel id='type' sx={{ fontSize: '0.8rem' }} required>
						Type
					</InputLabel>
					<Select
						labelId='type'
						id='lesson_type'
						value={type}
						onChange={(event: SelectChangeEvent) => {
							setType(event.target.value);
						}}
						size='medium'
						label='Type'
						required
						sx={{ backgroundColor: theme.bgColor?.common }}>
						{lessonTypes &&
							lessonTypes?.map((type) => (
								<MenuItem value={type} key={type}>
									{type}
								</MenuItem>
							))}
					</Select>
				</FormControl>
				<CustomDialogActions
					onCancel={() => {
						setIsNewLessonModalOpen(false);
						setType('');
						setTitle('');
					}}
					cancelBtnSx={{ margin: '0.5rem 0.5rem 0.5rem 0' }}
					submitBtnSx={{ margin: '0.5rem 1.5rem 0.5rem 0' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateLessonDialog;
