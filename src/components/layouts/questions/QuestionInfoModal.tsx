import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import { QuestionInterface } from '../../../interfaces/question';
import { dateTimeFormatter } from '../../../utils/dateFormatter';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import { useResourceUsage } from '../../../hooks/useResourceUsage';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../../hooks/useAuth';

interface QuestionInfoModalProps {
	question: QuestionInterface;
	onClose: () => void;
}

const QuestionInfoModal = ({ question, onClose }: QuestionInfoModalProps) => {
	const { usageInfo, loading } = useResourceUsage(question);
	const { isInstructor } = useAuth();

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
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={question.createdByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{question.createdByName} ({question.createdByRole}) on {dateTimeFormatter(question.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Last Updated By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={question.updatedByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{question.updatedByName} ({question.updatedByRole}) on {dateTimeFormatter(question.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Used in Lessons:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							{loading ? (
								<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Loading usage info...
								</Typography>
							) : usageInfo.lessons && usageInfo.lessons.length > 0 ? (
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
									No lessons using this question
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
								{question.clonedFromId ? 'Yes' : 'No'}
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

export default QuestionInfoModal;
