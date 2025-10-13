import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import { Lesson } from '../../../interfaces/lessons';
import { dateTimeFormatter } from '../../../utils/dateFormatter';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import { useResourceUsage } from '../../../hooks/useResourceUsage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface LessonInfoModalProps {
	lesson: Lesson;
	onClose: () => void;
}

const LessonInfoModal = ({ lesson, onClose }: LessonInfoModalProps) => {
	const { usageInfo } = useResourceUsage(lesson);

	const navigate = useNavigate();
	const { isInstructor } = useAuth();
	const handleCourseSelect = (courseId: string) => {
		if (isInstructor) {
			window.open(`/instructor/course-edit/course/${courseId}`, '_blank');
		} else {
			window.open(`/admin/course-edit/course/${courseId}`, '_blank');
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
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={lesson.createdByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{lesson.createdByName} ({lesson.createdByRole}) on {dateTimeFormatter(lesson.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Last Updated By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={lesson.updatedByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{lesson.updatedByName} ({lesson.updatedByRole}) on {dateTimeFormatter(lesson.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Type:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{lesson.type}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Cloned From:
							</Typography>
						</Grid>
						{lesson.clonedFromTitle ? (
							<Grid item xs={9}>
								<Typography
									variant='body2'
									onClick={() => {
										if (isInstructor) {
											navigate(`/instructor/lesson-edit/lesson/${lesson.clonedFromId}`);
										} else {
											navigate(`/admin/lesson-edit/lesson/${lesson.clonedFromId}`);
										}
										onClose();
									}}
									sx={{
										'cursor': 'pointer',
										':hover': {
											textDecoration: 'underline',
										},
										'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
									}}>
									📄 {lesson.clonedFromTitle}
								</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									N/A
								</Typography>
							</Grid>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Published:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{lesson.isActive ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Published At:
							</Typography>
						</Grid>
						{lesson.publishedAt ? (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									🗓️ {dateTimeFormatter(lesson.publishedAt)}
								</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									N/A
								</Typography>
							</Grid>
						)}

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
											<MenuItem
												key={course.id}
												value={course.id}
												sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}
												onClick={() => handleCourseSelect(course.id)}>
												{course.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									No courses using this lesson
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
						margin: '0 1.5rem 0.75rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</>
	);
};

export default LessonInfoModal;
