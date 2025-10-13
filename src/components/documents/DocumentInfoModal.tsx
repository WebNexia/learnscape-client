import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import { Document } from '../../interfaces/document';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useResourceUsage } from '../../hooks/useResourceUsage';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';

interface DocumentInfoModalProps {
	document: Document;
	onClose: () => void;
}

const DocumentInfoModal = ({ document, onClose }: DocumentInfoModalProps) => {
	const { usageInfo } = useResourceUsage(document);
	const { isInstructor } = useAuth();

	const handleCourseSelect = (courseId: string) => {
		if (isInstructor) {
			window.open(`/instructor/course-edit/course/${courseId}`, '_blank');
		} else {
			window.open(`/admin/course-edit/course/${courseId}`, '_blank');
		}
	};

	const handleLessonSelect = (lessonId: string) => {
		if (isInstructor) {
			window.open(`/instructor/lesson-edit/lesson/${lessonId}`, '_blank');
		} else {
			window.open(`/admin/lesson-edit/lesson/${lessonId}`, '_blank');
		}
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25} alignItems='center'>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Created By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={document.createdByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{document.createdByName} ({document.createdByRole}) on {dateTimeFormatter(document.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Last Updated By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={document.updatedByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{document.updatedByName} ({document.updatedByRole}) on {dateTimeFormatter(document.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Used in Courses:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							{usageInfo.courses && usageInfo.courses.length > 0 ? (
								<FormControl fullWidth size='small' sx={{ width: '90%' }}>
									<Select
										value=''
										displayEmpty
										renderValue={() => `${usageInfo.courses.length} course(s)`}
										sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{usageInfo.courses?.map((course) => (
											<MenuItem key={course.id} value={course.id} sx={{ fontSize: '0.8rem' }} onClick={() => handleCourseSelect(course.id)}>
												{course.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									No courses using this document
								</Typography>
							)}
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Used in Lessons:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							{usageInfo.lessons && usageInfo.lessons.length > 0 ? (
								<FormControl fullWidth size='small' sx={{ width: '90%' }}>
									<Select
										value=''
										displayEmpty
										renderValue={() => `${usageInfo.lessons.length} lesson(s)`}
										sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{usageInfo.lessons?.map((lesson) => (
											<MenuItem
												key={lesson.id}
												value={lesson.id}
												sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
												onClick={() => handleLessonSelect(lesson.id)}>
												{lesson.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									No lessons using this document
								</Typography>
							)}
						</Grid>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Cloned:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{document.clonedFromId ? 'Yes' : 'No'}
							</Typography>
						</Grid>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								On Landing Page:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{document.isOnLandingPage ? 'Yes' : 'No'}
							</Typography>
						</Grid>
					</Grid>
				</Box>
			</DialogContent>
			<DialogActions>
				<CustomCancelButton
					onClick={onClose}
					sx={{
						margin: '0 1.5rem 0.75rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</>
	);
};

export default DocumentInfoModal;
