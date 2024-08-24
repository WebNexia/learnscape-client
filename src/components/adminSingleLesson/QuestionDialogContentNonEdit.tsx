import { Box, Checkbox, DialogContent, FormControlLabel, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import { QuestionInterface } from '../../interfaces/question';
import theme from '../../themes';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { useContext } from 'react';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionType } from '../../interfaces/enums';
import FlipCardPreview from '../layouts/flipCard/FlipCardPreview';
import MatchingPreview from '../layouts/matching/MatchingPreview';
import FillInTheBlanksDragDrop from '../layouts/FITBDragDrop/FillInTheBlanksDragDrop';

interface QuestionDialogContentNonEditProps {
	question: QuestionInterface | null;
}

const QuestionDialogContentNonEdit = ({ question }: QuestionDialogContentNonEditProps) => {
	const hasMedia = question?.imageUrl || question?.videoUrl;

	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	return (
		<DialogContent>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					margin: hasMedia ? '0.5rem 0 2rem 0' : 'none',
					width: '100%',
					height: hasMedia && fetchQuestionTypeName(question) !== QuestionType.FLIP_CARD ? '15rem' : 'none',
				}}>
				{question?.imageUrl && fetchQuestionTypeName(question) !== QuestionType.FLIP_CARD && (
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
								height: '100%',
								width: 'fit-content',
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								objectFit: 'contain',
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
			{question && fetchQuestionTypeName(question) !== QuestionType.FLIP_CARD && fetchQuestionTypeName(question) !== QuestionType.FITB_DRAG_DROP && (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '0.5rem' }}>
					<Box className='rich-text-content' component='div' sx={{ padding: '0.5rem 1rem', textAlign: 'justify' }}>
						<Typography variant='body1' component='div' dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
					</Box>

					<Box sx={{ alignSelf: 'center', width: '80%' }}>
						{fetchQuestionTypeName(question) === QuestionType.MULTIPLE_CHOICE &&
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
					{fetchQuestionTypeName(question) === QuestionType.TRUE_FALSE && (
						<Box sx={{ width: '6rem' }}>
							<Typography
								variant='h6'
								sx={{
									textAlign: 'center',
									color: theme.textColor?.common.main,
									boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
									padding: '0.5rem 1rem',
									borderRadius: '0.35rem',
									backgroundColor: question.correctAnswer === 'true' ? theme.bgColor?.greenPrimary : 'error.main',
								}}>
								{question.correctAnswer.toUpperCase()}
							</Typography>
						</Box>
					)}
				</Box>
			)}
			{question && fetchQuestionTypeName(question) === QuestionType.FLIP_CARD && <FlipCardPreview question={question} questionNonEditModal={true} />}

			{question && fetchQuestionTypeName(question) === QuestionType.AUDIO_VIDEO && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<Box sx={{ margin: '1rem 3rem 1rem 0' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={question.audio}
									sx={{
										':hover': {
											cursor: 'default',
										},
									}}
								/>
							}
							label='Ask Audio Recording'
							sx={{
								':hover': {
									cursor: 'default',
								},
							}}
						/>
					</Box>
					<Box sx={{ margin: '1rem 0' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={question.video}
									sx={{
										':hover': {
											cursor: 'default',
										},
									}}
								/>
							}
							label='Ask Audio Recording'
							sx={{
								':hover': {
									cursor: 'default',
								},
							}}
						/>{' '}
					</Box>
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.MATCHING && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<MatchingPreview initialPairs={question.matchingPairs} />
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.FITB_DRAG_DROP && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<FillInTheBlanksDragDrop textWithBlanks={question.question} blankValuePairs={question.blankValuePairs} />
				</Box>
			)}
		</DialogContent>
	);
};

export default QuestionDialogContentNonEdit;
