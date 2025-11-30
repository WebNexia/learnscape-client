import {
	Box,
	Checkbox,
	DialogContent,
	FormControlLabel,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import theme from '../../themes';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { useContext } from 'react';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionType } from '../../interfaces/enums';
import FlipCardPreview from '../layouts/flipCard/FlipCardPreview';
import MatchingPreview from '../layouts/matching/MatchingPreview';
import FillInTheBlanksDragDrop from '../layouts/FITBDragDrop/FillInTheBlanksDragDrop';
import FillInTheBlanksTyping from '../layouts/FITBTyping/FillInTheBlanksTyping';
import { Lesson } from '../../interfaces/lessons';
import { decode } from 'html-entities';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface QuestionDialogContentNonEditProps {
	question: QuestionInterface | null;
	singleLessonBeforeSave?: Lesson;
}

const QuestionDialogContentNonEdit = ({ question, singleLessonBeforeSave }: QuestionDialogContentNonEditProps) => {
	const hasMedia = question?.imageUrl || question?.videoUrl;

	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

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
					padding: question && fetchQuestionTypeName(question) === QuestionType.FLIP_CARD && isMobileSize ? '2rem 0' : undefined,
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
						<UniversalVideoPlayer
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
			{question &&
				fetchQuestionTypeName(question) !== QuestionType.FLIP_CARD &&
				fetchQuestionTypeName(question) !== QuestionType.FITB_DRAG_DROP &&
				fetchQuestionTypeName(question) !== QuestionType.FITB_TYPING && (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '0.5rem' }}>
						<Box
							className='rich-text-content'
							component='div'
							sx={{ padding: isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem', textAlign: 'justify' }}>
							<Typography
								variant='body1'
								component='div'
								dangerouslySetInnerHTML={{ __html: sanitizeHtml(decode(question.question)) }}
								sx={{
									'& img': {
										maxWidth: '100%',
										height: 'auto',
										borderRadius: '0.25rem',
										margin: '0.5rem 0',
										boxShadow: '0 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.15)',
									},
									'fontSize': isMobileSize ? '0.8rem' : '1rem',
								}}
							/>
						</Box>

						<Box sx={{ alignSelf: 'center', width: '80%' }}>
							{fetchQuestionTypeName(question) === QuestionType.MULTIPLE_CHOICE &&
								question.options &&
								question.options?.map((option, index) => {
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
										padding: isMobileSize ? '0.25rem 0.75rem' : '0.5rem 1rem',
										borderRadius: '0.35rem',
										backgroundColor: question.correctAnswer === 'true' ? theme.bgColor?.greenPrimary : 'error.main',
										fontSize: isMobileSize ? '0.8rem' : undefined,
									}}>
									{question.correctAnswer.toUpperCase()}
								</Typography>
							</Box>
						)}
					</Box>
				)}
			{question && fetchQuestionTypeName(question) === QuestionType.FLIP_CARD && (
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						padding: '2rem',
						mt: isMobileSize ? '-5rem' : '2rem',
						mb: '2rem',
					}}>
					<FlipCardPreview question={question} questionNonEditModal={true} />
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.AUDIO_VIDEO && (
				<Box sx={{ display: 'flex', justifyContent: isMobileSize ? 'space-between' : 'center' }}>
					<Box sx={{ margin: isMobileSize ? '1rem 0' : '1rem 3rem 1rem 0' }}>
						<FormControlLabel
							control={
								<Checkbox
									checked={question.audio}
									sx={{
										':hover': {
											cursor: 'default',
										},
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1.25rem' : undefined,
										},
									}}
								/>
							}
							label='Ask Audio Recording'
							sx={{
								':hover': {
									cursor: 'default',
								},
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
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
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1.25rem' : undefined,
										},
									}}
								/>
							}
							label='Ask Audio Recording'
							sx={{
								':hover': {
									cursor: 'default',
								},
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								},
							}}
						/>
					</Box>
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.MATCHING && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<MatchingPreview initialPairs={question.matchingPairs} lessonType={singleLessonBeforeSave?.type} />
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.FITB_DRAG_DROP && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<FillInTheBlanksDragDrop
						textWithBlanks={question.question}
						blankValuePairs={question.blankValuePairs}
						lessonType={singleLessonBeforeSave?.type}
					/>
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.FITB_TYPING && (
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: '2rem' }}>
					<FillInTheBlanksTyping
						textWithBlanks={question.question}
						blankValuePairs={question.blankValuePairs}
						lessonType={singleLessonBeforeSave?.type}
					/>
				</Box>
			)}

			{question && fetchQuestionTypeName(question) === QuestionType.TRANSLATE && (
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: '2rem' }}>
					<TableContainer component={Paper} sx={{ maxWidth: '90%', boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.2)' }}>
						<Table size='small' aria-label='translate pairs table'>
							<TableHead>
								<TableRow>
									<TableCell
										sx={{
											backgroundColor: theme.bgColor?.secondary,
											fontWeight: 'bold',
											fontSize: isMobileSize ? '0.8rem' : '1rem',
											textAlign: 'center',
											color: theme.textColor?.secondary.main,
										}}>
										Original Text
									</TableCell>
									<TableCell
										sx={{
											backgroundColor: theme.bgColor?.secondary,
											fontWeight: 'bold',
											fontSize: isMobileSize ? '0.8rem' : '1rem',
											textAlign: 'center',
											color: theme.textColor?.secondary.main,
										}}>
										Translation
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{question.translatePairs?.map((pair, index) => (
									<TableRow key={index} hover>
										<TableCell
											sx={{
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												wordBreak: 'break-word',
												textAlign: 'center',
												color: theme.textColor?.secondary.main,
											}}>
											{pair.originalText.trim()}
										</TableCell>
										<TableCell
											sx={{
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												wordBreak: 'break-word',
												textAlign: 'center',
												color: theme.textColor?.secondary.main,
											}}>
											{pair.translation.trim()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			)}
		</DialogContent>
	);
};

export default QuestionDialogContentNonEdit;
