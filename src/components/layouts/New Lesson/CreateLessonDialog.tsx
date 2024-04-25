import { Box, Dialog, DialogActions, DialogTitle, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import CustomTextField from '../../forms/Custom Fields/CustomTextField';
import CustomCancelButton from '../../forms/Custom Buttons/CustomCancelButton';
import CustomSubmitButton from '../../forms/Custom Buttons/CustomSubmitButton';
import { ReactNode, useContext, useState } from 'react';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';
import axios from 'axios';
import { Lesson } from '../../../interfaces/lessons';

interface CreateLessonDialogProps {
	lessons?: Lesson[];
	isNewLessonModalOpen: boolean;
	createNewLesson: boolean;
	newLessonsToCreate?: Lesson[];
	setIsNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setLessons?: React.Dispatch<React.SetStateAction<Lesson[]>>;
	setNewLessonsToCreate?: React.Dispatch<React.SetStateAction<Lesson[]>>;
	containerStyle?: React.CSSProperties;
	triggerButton?: ReactNode;
}

const CreateLessonDialog = ({
	lessons,
	isNewLessonModalOpen,
	createNewLesson,
	newLessonsToCreate,
	setIsNewLessonModalOpen,
	setLessons,
	setNewLessonsToCreate,
	containerStyle,
	triggerButton,
}: CreateLessonDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { addNewLesson } = useContext(LessonsContext);

	const [title, setTitle] = useState<string>('');
	const [type, setType] = useState<string>('');

	const lessonTypes: string[] = ['Quiz', 'Instructional Lesson'];

	const generateUniqueId = (): string => {
		// Generate a random string of characters
		const randomString = Math.random().toString(36).substring(2, 9);

		// Generate a timestamp to ensure uniqueness
		const timestamp = Date.now().toString(36);

		// Concatenate random string and timestamp to create a unique ID
		const uniqueId = randomString + timestamp;

		return uniqueId;
	};

	const createLesson = async () => {
		try {
			const response = await axios.post(`${base_url}/lessons`, {
				title,
				type,
			});

			addNewLesson({ _id: response.data._id, title, type });
		} catch (error) {
			console.log(error);
		}
	};

	const createLessonTemplate = () => {
		const newLessonBeforeSave: Lesson = {
			_id: generateUniqueId(),
			title,
			type,
			isActive: false,
			imageUrl:
				'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGVzc29ufGVufDB8fDB8fHww',
			videoUrl: '',
			text: '',
			questionIds: [],
			questions: [],
			createdAt: '',
			updatedAt: '',
		};
		if (setLessons) {
			setLessons((prevData) => {
				if (prevData) {
					return [newLessonBeforeSave, ...prevData];
				}
				return prevData;
			});
		}

		if (setNewLessonsToCreate) {
			setNewLessonsToCreate((prevData) => {
				return [newLessonBeforeSave, ...prevData];
			});
		}
	};
	return (
		<>
			<Dialog
				open={isNewLessonModalOpen}
				onClose={() => {
					setIsNewLessonModalOpen(false);
					setType('');
					setTitle('');
				}}
				fullWidth
				maxWidth='md'>
				<DialogTitle variant='h3'>Create New Lesson</DialogTitle>
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
						<InputLabel id='type' sx={{ fontSize: '0.8rem' }}>
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
							required>
							{lessonTypes &&
								lessonTypes.map((type) => (
									<MenuItem value={type} key={type}>
										{type}
									</MenuItem>
								))}
						</Select>
					</FormControl>

					<DialogActions>
						<CustomCancelButton
							onClick={() => {
								setIsNewLessonModalOpen(false);
								setType('');
								setTitle('');
							}}
							sx={{
								margin: '0.5rem 0.5rem 1.5rem 0',
							}}>
							Cancel
						</CustomCancelButton>
						<CustomSubmitButton
							sx={{
								margin: '0.5rem 1.5rem 1.5rem 0',
							}}>
							Create
						</CustomSubmitButton>
					</DialogActions>
				</form>
			</Dialog>
			<Box sx={containerStyle}>{triggerButton}</Box>
		</>
	);
};

export default CreateLessonDialog;
