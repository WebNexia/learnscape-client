import { FormControl, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import CustomTextField from '../customFields/CustomTextField';
import { useContext, useState } from 'react';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';

import { Lesson } from '../../../interfaces/lessons';
import { ChapterLessonData, ChapterUpdateTrack } from '../../../pages/AdminCourseEditPage';
import theme from '../../../themes';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { chapterUpdateTrack } from '../../../utils/chapterUpdateTrack';
import axios from '@utils/axiosInstance';
import { useAuth } from '../../../hooks/useAuth';
import { Roles } from '../../../interfaces/enums';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CreateLessonDialogProps {
	chapter?: ChapterLessonData;
	isNewLessonModalOpen: boolean;
	createNewLesson: boolean;
	setIsNewLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setLessons?: React.Dispatch<React.SetStateAction<Lesson[]>>;
	setChapterLessonDataBeforeSave?: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated?: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateLessonDialog = ({
	chapter,
	isNewLessonModalOpen,
	createNewLesson,
	setIsNewLessonModalOpen,
	setLessons,
	setChapterLessonDataBeforeSave,
	setIsChapterUpdated,
	setHasUnsavedChanges,
}: CreateLessonDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { addNewLesson, lessonTypes } = useContext(LessonsContext);
	const { user } = useAuth();
	const isInstructor = user?.role === Roles.INSTRUCTOR;
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [title, setTitle] = useState<string>('');
	const [type, setType] = useState<string>('');

	const createLesson = async () => {
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/lessons/instructor' : '/lessons'}`, {
				title: title.trim(),
				type,
				orgId,
			});

			const responseNewLessonData = response.data;

			addNewLesson({
				_id: responseNewLessonData._id,
				title: title.trim(),
				type,
				createdAt: responseNewLessonData.createdAt,
				updatedAt: responseNewLessonData.updatedAt,
				createdByName: responseNewLessonData.createdByName,
				updatedByName: responseNewLessonData.updatedByName,
				createdByImageUrl: responseNewLessonData.createdByImageUrl,
				updatedByImageUrl: responseNewLessonData.updatedByImageUrl,
				createdByRole: responseNewLessonData.createdByRole,
				updatedByRole: responseNewLessonData.updatedByRole,
			} as Lesson);
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
			imageUrl: 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Image',
			videoUrl: '',
			text: '',
			questionIds: [],
			questions: [],
			createdAt: '',
			updatedAt: '',
			orgId,
			documentIds: [],
			documents: [],
			clonedFromId: '',
			clonedFromTitle: '',
			usedInCourses: [],
			createdBy: '',
			updatedBy: '',
			publishedAt: '',
			createdByName: '',
			updatedByName: '',
			createdByImageUrl: '',
			updatedByImageUrl: '',
			createdByRole: '',
			updatedByRole: '',
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
								lessonIds: updatedLessons?.map((lesson: Lesson) => lesson._id) || [],
							};
						}
						return currentChapter; // Return unchanged chapter if not the one being updated
					});
				}
				return prevData;
			});
		}
		setHasUnsavedChanges?.(true);
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
					sx={{ margin: isMobileSize ? '0.5rem 2rem' : '1rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
					InputProps={{ inputProps: { maxLength: 100 } }}
				/>
				<FormControl sx={{ margin: isMobileSize ? '0.5rem 2rem' : '1rem 2rem' }}>
					<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Type
					</Typography>
					<Select
						id='lesson_type'
						value={type}
						onChange={(event: SelectChangeEvent) => {
							setType(event.target.value);
						}}
						size='small'
						required
						displayEmpty
						sx={{ backgroundColor: theme.bgColor?.common, color: type == '' ? 'lightgray' : 'inherit', fontSize: '0.8rem' }}>
						<MenuItem disabled value='' sx={{ fontSize: '0.85rem' }}>
							Select Type
						</MenuItem>
						{lessonTypes &&
							lessonTypes?.map((type) => (
								<MenuItem value={type} key={type} sx={{ fontSize: '0.85rem' }}>
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
