import { Box, DialogContent, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import { QuestionInterface } from '../../interfaces/question';
import theme from '../../themes';
import { stripHtml } from '../../utils/stripHtml';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface QuestionDialogContentNonEditProps {
	question: QuestionInterface | null;
}

const QuestionDialogContentNonEdit = ({ question }: QuestionDialogContentNonEditProps) => {
	return (
		<DialogContent>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					margin: '0.5rem 0.5rem 2rem 0.5rem',
				}}>
				{question?.imageUrl && (
					<Box
						sx={{
							marginRight: '1rem',
							flex: 1,
						}}>
						<img
							src={question?.imageUrl}
							alt='question_img'
							height='100%'
							width='100%'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
					</Box>
				)}

				{question?.videoUrl && (
					<Box sx={{ flex: 1 }}>
						<ReactPlayer
							url={question?.videoUrl}
							height='20rem'
							width='100%'
							style={{
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
							controls={true}
						/>
					</Box>
				)}
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{question && (
					<Box>
						<Typography dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
					</Box>
				)}
				<Box sx={{ alignSelf: 'start' }}>
					{question &&
						question.options &&
						question.options.map((option, index) => {
							const choiceLabel = String.fromCharCode(97 + index) + ')';
							return (
								<Typography
									key={index}
									sx={{
										margin: '1rem 0 0 2rem',
										color: option === question.correctAnswer ? theme.textColor?.greenSecondary.main : null,
										fontStyle: option === question.correctAnswer ? 'italic' : null,
									}}>
									{choiceLabel} {option}
								</Typography>
							);
						})}
				</Box>
			</Box>
		</DialogContent>
	);
};

export default QuestionDialogContentNonEdit;
