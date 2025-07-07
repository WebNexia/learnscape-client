import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import { Document } from '../../interfaces/document';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useResourceUsage } from '../../hooks/useResourceUsage';

interface DocumentInfoModalProps {
	document: Document;
	onClose: () => void;
}

const DocumentInfoModal = ({ document, onClose }: DocumentInfoModalProps) => {
	const { usageInfo } = useResourceUsage(document);

	const handleCourseSelect = (courseId: string) => {
		window.open(`/admin/course-edit/course/${courseId}`, '_blank');
	};

	const handleLessonSelect = (lessonId: string) => {
		window.open(`/admin/lesson-edit/lesson/${lessonId}`, '_blank');
	};

	return (
		<>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25} alignItems='center'>
						<Grid item xs={3}>
							<Typography variant='body2'>Created By:</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={document.createdByImageUrl} />
							<Typography variant='body2'>
								{document.createdByName} ({document.createdByRole}) on {dateTimeFormatter(document.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Last Updated By:</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={document.updatedByImageUrl} />
							<Typography variant='body2'>
								{document.updatedByName} ({document.updatedByRole}) on {dateTimeFormatter(document.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Used in Courses:</Typography>
						</Grid>
						<Grid item xs={9}>
							{usageInfo.courses.length > 0 ? (
								<FormControl fullWidth size='small' sx={{ width: '90%' }}>
									<Select value='' displayEmpty renderValue={() => `${usageInfo.courses.length} course(s)`} sx={{ fontSize: '0.85rem' }}>
										{usageInfo.courses.map((course) => (
											<MenuItem key={course.id} value={course.id} sx={{ fontSize: '0.8rem' }} onClick={() => handleCourseSelect(course.id)}>
												{course.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary'>
									No courses using this document
								</Typography>
							)}
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Used in Lessons:</Typography>
						</Grid>
						<Grid item xs={9}>
							{usageInfo.lessons.length > 0 ? (
								<FormControl fullWidth size='small' sx={{ width: '90%' }}>
									<Select value='' displayEmpty renderValue={() => `${usageInfo.lessons.length} lesson(s)`} sx={{ fontSize: '0.85rem' }}>
										{usageInfo.lessons.map((lesson) => (
											<MenuItem key={lesson.id} value={lesson.id} sx={{ fontSize: '0.8rem' }} onClick={() => handleLessonSelect(lesson.id)}>
												{lesson.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary'>
									No lessons using this document
								</Typography>
							)}
						</Grid>
					</Grid>
				</Box>
			</DialogContent>
			<DialogActions>
				<CustomCancelButton
					onClick={onClose}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</>
	);
};

export default DocumentInfoModal;
