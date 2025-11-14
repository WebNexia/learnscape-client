import { FormControl, MenuItem, Select, SelectChangeEvent, Typography, IconButton, Tooltip, Box, Chip, DialogContent } from '@mui/material';
import { Info } from '@mui/icons-material';
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
	onLessonAdded?: () => void;
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
	onLessonAdded,
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
	const [isLessonTypeInfoDialogOpen, setIsLessonTypeInfoDialogOpen] = useState<boolean>(false);

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

		// Auto-expand chapter when lesson is created and added
		onLessonAdded?.();
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
				<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 2rem', textAlign: 'right' }}>
					{title?.length}/100 Characters
				</Typography>

				<FormControl sx={{ margin: isMobileSize ? '0.5rem 2rem' : '1rem 2rem' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem', gap: '0.5rem' }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Type
						</Typography>
						<Tooltip title='Learn about lesson types' placement='top' arrow>
							<IconButton
								size='small'
								onClick={() => setIsLessonTypeInfoDialogOpen(true)}
								sx={{
									'padding': '0.25rem',
									'&:hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<Info sx={{ color: theme.palette.primary.main, fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
							</IconButton>
						</Tooltip>
					</Box>
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

			{/* Lesson Type Info Dialog */}
			<CustomDialog
				openModal={isLessonTypeInfoDialogOpen}
				closeModal={() => setIsLessonTypeInfoDialogOpen(false)}
				maxWidth='sm'
				title='Lesson Types Explained'>
				<DialogContent>
					<Box sx={{ p: 1, pt: 2 }}>
						<Typography
							sx={{
								mb: '1.5rem',
								mt: '-1rem',
								fontFamily: theme.fontFamily?.main,
								fontSize: isMobileSize ? '0.8rem' : '0.9rem',
								color: theme.palette.text.secondary,
							}}>
							Choose the appropriate lesson type based on your content and learning objectives:
						</Typography>

						{/* Instructional Lesson */}
						<Box sx={{ mb: '2rem' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem', gap: '0.75rem' }}>
								<Chip
									label='Instructional Lesson'
									color='primary'
									size='small'
									sx={{
										fontFamily: theme.fontFamily?.main,
										fontWeight: 600,
										minWidth: '10rem',
										color: '#fff',
										fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									}}
								/>
							</Box>
							<Typography
								sx={{
									fontFamily: theme.fontFamily?.main,
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									color: theme.palette.text.primary,
									lineHeight: 1.6,
									pl: '0.5rem',
								}}>
								This lesson type is designed for instructional content delivery. It supports:
							</Typography>
							<Box component='ul' sx={{ pl: 4, mt: '0.5rem', mb: 0 }}>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Single video content
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Written lesson instructions and materials
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: 0, lineHeight: 1.6 }}>
									PDF documents and downloadable materials
								</Typography>
							</Box>
						</Box>

						{/* Practice Lesson */}
						<Box sx={{ mb: '2rem' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem', gap: '0.75rem' }}>
								<Chip
									label='Practice Lesson'
									color='success'
									size='small'
									sx={{
										fontFamily: theme.fontFamily?.main,
										fontWeight: 600,
										minWidth: '10rem',
										color: '#fff',
										fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									}}
								/>
							</Box>
							<Typography
								sx={{
									fontFamily: theme.fontFamily?.main,
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									color: theme.palette.text.primary,
									lineHeight: 1.6,
									pl: '0.5rem',
								}}>
								This lesson type focuses on interactive practice and skill development:
							</Typography>
							<Box component='ul' sx={{ pl: 4, mt: '0.5rem', mb: 0 }}>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Students progress through questions as they answer correctly
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Immediate feedback on answers to reinforce learning
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: 0, lineHeight: 1.6 }}>
									<strong>Note:</strong> Audio/Video question type is not available for this lesson type
								</Typography>
							</Box>
						</Box>

						{/* Quiz */}
						<Box sx={{ mb: '1rem' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '0.75rem', gap: '0.75rem' }}>
								<Chip
									label='Quiz'
									color='warning'
									size='small'
									sx={{
										fontFamily: theme.fontFamily?.main,
										fontWeight: 600,
										minWidth: '10rem',
										color: '#fff',
										fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									}}
								/>
							</Box>
							<Typography
								sx={{
									fontFamily: theme.fontFamily?.main,
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									color: theme.palette.text.primary,
									lineHeight: 1.6,
									pl: '0.5rem',
								}}>
								This lesson type is designed for assessment and evaluation:
							</Typography>
							<Box component='ul' sx={{ pl: 4, mt: '0.5rem', mb: 0 }}>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Students submit their answers and can view results after submission
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Instructors can provide detailed feedback for each question individually
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.25rem', lineHeight: 1.6 }}>
									Overall quiz feedback can be provided by instructors
								</Typography>
								<Typography component='li' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: 0, lineHeight: 1.6 }}>
									<strong>Note:</strong> Flip card question type is not available for this lesson type
								</Typography>
							</Box>
						</Box>
					</Box>
				</DialogContent>
				<CustomDialogActions
					onSubmit={() => setIsLessonTypeInfoDialogOpen(false)}
					submitBtnText='Got It'
					actionSx={{ mb: '0.5rem', mr: '1rem', mt: '-1rem' }}
					showCancelBtn={false}
				/>
			</CustomDialog>
		</CustomDialog>
	);
};

export default CreateLessonDialog;
