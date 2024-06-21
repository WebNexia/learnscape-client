import { Box, DialogContent, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import { QuestionInterface } from '../../interfaces/question';
import theme from '../../themes';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { questionTypeNameFinder } from '../../utils/questionTypeNameFinder';
import { useContext } from 'react';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';

interface QuestionDialogContentNonEditProps {
	question: QuestionInterface | null;
}

const QuestionDialogContentNonEdit = ({ question }: QuestionDialogContentNonEditProps) => {
	const hasMedia = question?.imageUrl || question?.videoUrl;

	const { questionTypes } = useContext(QuestionsContext);

	return (
		<DialogContent>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					margin: hasMedia ? '0.5rem 0 2rem 0' : 'none',
					width: '100%',
					height: hasMedia ? '15rem' : 'none',
				}}>
				{question?.imageUrl && (
					<Box
						sx={{
							height: '100%',
							flex: 1,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<img
							src={question?.imageUrl}
							alt='question_img'
							style={{
								height: 'auto',
								maxHeight: '100%',
								width: question?.videoUrl ? '90%' : '50%',
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
					</Box>
				)}

				{question?.videoUrl && (
					<Box
						sx={{
							height: '100%',
							flex: 1,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<ReactPlayer
							url={question.videoUrl}
							width={question?.imageUrl ? '90%' : '50%'}
							height='100%'
							style={{
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
							controls
						/>
					</Box>
				)}
			</Box>
			{question && (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '0.5rem' }}>
					<Box className='rich-text-content' component='div' sx={{ padding: '0.5rem 1rem', textAlign: 'justify' }}>
						<Typography variant='body1' component='html' dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
					</Box>

					<Box sx={{ alignSelf: 'center', width: '80%' }}>
						{questionTypeNameFinder(question.questionType, questionTypes) === 'Multiple Choice' &&
							question.options &&
							question.options.map((option, index) => {
								const choiceLabel = String.fromCharCode(97 + index) + ')';
								return (
									<Typography
										variant='body1'
										key={index}
										sx={{
											margin: '1rem 0 0 2rem',
											color: option === question.correctAnswer ? theme.textColor?.greenPrimary.main : null,
											fontStyle: option === question.correctAnswer ? 'italic' : null,
										}}>
										{choiceLabel} {option}
									</Typography>
								);
							})}
					</Box>
					{questionTypeNameFinder(question.questionType, questionTypes) === 'True-False' && (
						<Box sx={{ width: '6rem' }}>
							<Typography
								variant='h6'
								sx={{
									textAlign: 'center',
									color: theme.textColor?.common.main,
									boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
									padding: '1rem',
									borderRadius: '0.35rem',
									backgroundColor: question.correctAnswer === 'true' ? theme.bgColor?.greenPrimary : 'error.main',
								}}>
								{question.correctAnswer.toUpperCase()}
							</Typography>
						</Box>
					)}
				</Box>
			)}
		</DialogContent>
	);
};

export default QuestionDialogContentNonEdit;
