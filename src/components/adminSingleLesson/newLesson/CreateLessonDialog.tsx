import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { useContext, useState } from 'react';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';
import axios from 'axios';
import { Lesson } from '../../../interfaces/lessons';
import { ChapterLessonData, ChapterUpdateTrack } from '../../../pages/AdminCourseEditPage';
import theme from '../../../themes';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';

interface CreateLessonDialogProps {
	chapter?: ChapterLessonData;
	isNewLessonModalOpen: boolean;
	createNewLesson: boolean;
	setIsNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setLessons?: React.Dispatch<React.SetStateAction<Lesson[]>>;
	setNewLessonsToCreate?: React.Dispatch<React.SetStateAction<Lesson[]>>;
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
	const { addNewLesson } = useContext(LessonsContext);

	const [title, setTitle] = useState<string>('');
	const [type, setType] = useState<string>('');

	const lessonTypes: string[] = ['Quiz', 'Instructional Lesson'];

	const generateUniqueId = (str: string): string => {
		// Generate a random string of characters
		const randomString = Math.random().toString(36).substring(2, 9);

		// Generate a timestamp to ensure uniqueness
		const timestamp = Date.now().toString(36);

		// Concatenate random string and timestamp to create a unique ID
		const uniqueId = str + randomString + timestamp;

		return uniqueId;
	};

	const createLesson = async () => {
		try {
			const response = await axios.post(`${base_url}/lessons`, {
				title,
				type,
				orgId,
			});

			addNewLesson({ _id: response.data._id, title, type });
		} catch (error) {
			console.log(error);
		}
	};

	const createLessonTemplate = () => {
		const newLessonBeforeSave: Lesson = {
			_id: generateUniqueId('temp_lesson_id_'),
			title,
			type,
			isActive: true,
			imageUrl:
				'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGVzc29ufGVufDB8fDB8fHww',
			videoUrl: '',
			text: '',
			questionIds: [],
			questions: [],
			createdAt: '',
			updatedAt: '',
			orgId,
		};
		if (setLessons) {
			setLessons((prevData) => {
				if (prevData) {
					return [newLessonBeforeSave, ...prevData];
				}
				return prevData;
			});
		}
		if (setChapterLessonDataBeforeSave) {
			setChapterLessonDataBeforeSave((prevData) => {
				if (prevData) {
					return prevData.map((currentChapter) => {
						if (currentChapter.chapterId === chapter?.chapterId) {
							const updatedLessons = [newLessonBeforeSave, ...currentChapter.lessons];
							if (setIsChapterUpdated) {
								setIsChapterUpdated((prevData: ChapterUpdateTrack[]) => {
									if (prevData) {
										prevData = prevData.map((data) => {
											if (data.chapterId === chapter.chapterId) {
												return { ...data, isUpdated: true };
											}
											return data;
										})!;
									}
									return prevData;
								});
							}
							return {
								...currentChapter,
								lessons: updatedLessons,
								lessonIds: updatedLessons.map((lesson: Lesson) => lesson._id),
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
			title='Create New Lesson'>
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
							lessonTypes.map((type) => (
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
					submitBtnSx={{ margin: '0.5rem 1.5rem 0.5rem 0' }}></CustomDialogActions>
			</form>
		</CustomDialog>
	);
};

export default CreateLessonDialog;
