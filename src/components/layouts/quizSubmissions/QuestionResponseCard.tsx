import { Box, Typography, Tooltip } from '@mui/material';
import { Cancel, CheckCircle, DoNotDisturbAltOutlined, RateReviewOutlined } from '@mui/icons-material';
import { QuestionInterface } from '../../../interfaces/question';
import { stripHtml } from '../../../utils/stripHtml';
import { truncateText } from '../../../utils/utilText';
import { getQuestionResult } from '../../../utils/getQuestionResult';
import { QuestionType } from '../../../interfaces/enums';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface QuestionResponseCardProps {
	response: any;
	index: number;
	fromAdminSubmissions?: boolean;
	fetchQuestionTypeName: (question: QuestionInterface) => string;
	onCardClick: (response: any, index: number) => void;
}

const QuestionResponseCard = ({ response, index, fromAdminSubmissions, fetchQuestionTypeName, onCardClick }: QuestionResponseCardProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
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
					padding: isMobileSizeSmall ? '0.5rem 0.75rem' : '0.75rem 1rem',
					mb: isMobileSizeSmall ? '0.6rem' : '0.75rem',
					cursor: 'pointer',
				}}
				onClick={() => onCardClick(response, index)}>
				<Typography
					variant='body2'
					sx={{
						flex: isMobileSize ? 3 : 4,
						fontSize: isMobileSize ? '0.65rem' : '0.85rem',
					}}>
					{isVerySmallScreen
						? truncateText(stripHtml(response.questionId.question), 25)
						: isMobileSize
							? truncateText(stripHtml(response.questionId.question), 40)
							: truncateText(stripHtml(response.questionId.question), 60)}
				</Typography>

				<Box sx={{ flex: isMobileSize ? 1 : 1.5 }}>
					{(response.teacherFeedback && response.teacherFeedback.trim() !== '') || response.teacherAudioFeedbackUrl ? (
						<Tooltip title={`${fromAdminSubmissions ? 'Feedback' : "Instructor's Feedback"}`} placement='left' arrow>
							<RateReviewOutlined color='success' fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
						</Tooltip>
					) : null}
				</Box>

				<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
					<Typography
						variant='body2'
						sx={{
							textAlign: 'right',
							fontSize: isMobileSize ? '0.65rem' : '0.85rem',
						}}>
						{fetchQuestionTypeName(response.questionId)}
					</Typography>
					{response.pointsEarned !== undefined &&
						response.pointsEarned !== null &&
						response.pointsPossible !== undefined &&
						response.pointsPossible !== null && (
							<Typography
								variant='body2'
								sx={{
									textAlign: 'right',
									fontSize: isMobileSize ? '0.6rem' : '0.7rem',
									color: theme.palette.text.secondary,
									fontWeight: 600,
								}}>
								{(() => {
									const questionType = fetchQuestionTypeName(response.questionId);
									const isOpenEndedOrAudioVideo = questionType === QuestionType.OPEN_ENDED || questionType === QuestionType.AUDIO_VIDEO;
									const displayEarned = isOpenEndedOrAudioVideo && response.pointsEarned === 0 ? '-' : response.pointsEarned;
									return `${displayEarned}/${response.pointsPossible} pts`;
								})()}
							</Typography>
						)}
				</Box>
			</Box>

			<Box
				sx={{
					width: isMobileSize ? '0.5rem' : '1.5rem',
					height: isMobileSize ? '0.5rem' : '1.5rem',
					marginLeft: isMobileSizeSmall ? '0.5rem' : '1rem',
					display: 'flex',
					alignItems: 'center',
				}}>
				{fetchQuestionTypeName(response.questionId) !== QuestionType.AUDIO_VIDEO &&
				fetchQuestionTypeName(response.questionId) !== QuestionType.OPEN_ENDED ? (
					<>
						{getQuestionResult(response, fetchQuestionTypeName) ? (
							<CheckCircle sx={{ color: theme.palette.success.main, fontSize: isMobileSize ? '1rem' : undefined }} fontSize='small' />
						) : (
							<Cancel sx={{ color: '#ef5350', fontSize: isMobileSize ? '1rem' : undefined }} fontSize='small' />
						)}
					</>
				) : (
					<DoNotDisturbAltOutlined color='disabled' fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
				)}
			</Box>
		</Box>
	);
};

export default QuestionResponseCard;
