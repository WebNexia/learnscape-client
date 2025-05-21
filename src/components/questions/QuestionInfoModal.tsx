import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useResourceUsage } from '../../hooks/useResourceUsage';
import { useParams } from 'react-router-dom';

interface QuestionInfoModalProps {
	question: QuestionInterface;
	onClose: () => void;
}

const QuestionInfoModal = ({ question, onClose }: QuestionInfoModalProps) => {
	const { usageInfo } = useResourceUsage(question);
	const { userId } = useParams();

	const handleLessonSelect = (lessonId: string) => {
		window.open(`/admin/lesson-edit/user/${userId}/lesson/${lessonId}`, '_blank');
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
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={question.createdByImageUrl} />
							<Typography variant='body2'>
								{question.createdByName} ({question.createdByRole}) on {dateTimeFormatter(question.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Last Updated By:</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={question.updatedByImageUrl} />
							<Typography variant='body2'>
								{question.updatedByName} ({question.updatedByRole}) on {dateTimeFormatter(question.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Used in Lessons:</Typography>
						</Grid>
						<Grid item xs={9}>
							{usageInfo.lessons.length > 0 ? (
								<FormControl fullWidth size='small' sx={{ width: '90%' }}>
									<Select
										value=''
										displayEmpty
										renderValue={() => `${usageInfo.lessons.length} lesson(s)`}
										sx={{ fontSize: '0.85rem' }}>
										{usageInfo.lessons.map((lesson) => (
											<MenuItem 
												key={lesson.id} 
												value={lesson.id} 
												sx={{ fontSize: '0.8rem' }}
												onClick={() => handleLessonSelect(lesson.id)}>
												{lesson.title}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							) : (
								<Typography variant='body2' color='text.secondary'>
									No lessons using this question
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

export default QuestionInfoModal; 