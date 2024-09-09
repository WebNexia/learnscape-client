import { Box, Typography, Tooltip } from '@mui/material';
import { Cancel, CheckCircle, DoNotDisturbAltOutlined, RateReviewOutlined } from '@mui/icons-material';
import { QuestionInterface } from '../../../interfaces/question';
import { stripHtml } from '../../../utils/stripHtml';
import { truncateText } from '../../../utils/utilText';
import { getQuestionResult } from '../../../utils/getQuestionResult';
import { QuestionType } from '../../../interfaces/enums';
import theme from '../../../themes';

interface QuestionResponseCardProps {
	response: any;
	index: number;
	fromAdminSubmissions?: boolean;
	fetchQuestionTypeName: (question: QuestionInterface) => string;
	onCardClick: (response: any, index: number) => void;
}

const QuestionResponseCard = ({ response, index, fromAdminSubmissions, fetchQuestionTypeName, onCardClick }: QuestionResponseCardProps) => {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
			<Box
				key={response._id}
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					boxShadow: '0 0.1rem 0.4rem 0.1rem rgba(0, 0,0,0.2)',
					borderRadius: '0.35rem',
					padding: '0.75rem 1rem',
					mb: '0.75rem',
					cursor: 'pointer',
				}}
				onClick={() => onCardClick(response, index)}>
				<Typography
					variant='body2'
					sx={{
						flex: 4,
					}}>
					{truncateText(stripHtml(response.questionId.question), 50)}
				</Typography>

				<Box sx={{ flex: 1.5 }}>
					{(response.teacherFeedback && response.teacherFeedback.trim() !== '') || response.teacherAudioFeedbackUrl ? (
						<Tooltip title={`${fromAdminSubmissions ? 'Feedback' : "Instructor's Feedback"}`} placement='left'>
							<RateReviewOutlined color='success' />
						</Tooltip>
					) : null}
				</Box>

				<Typography
					variant='body2'
					sx={{
						textAlign: 'right',
						flex: 1,
					}}>
					{fetchQuestionTypeName(response.questionId)}
				</Typography>
			</Box>

			<Box sx={{ width: '1.5rem', height: '1.5rem', marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
				{fetchQuestionTypeName(response.questionId) !== QuestionType.AUDIO_VIDEO &&
				fetchQuestionTypeName(response.questionId) !== QuestionType.OPEN_ENDED ? (
					<>
						{getQuestionResult(response, fetchQuestionTypeName) ? (
							<CheckCircle sx={{ color: theme.palette.success.main }} />
						) : (
							<Cancel sx={{ color: '#ef5350' }} />
						)}
					</>
				) : (
					<DoNotDisturbAltOutlined color='disabled' />
				)}
			</Box>
		</Box>
	);
};

export default QuestionResponseCard;
