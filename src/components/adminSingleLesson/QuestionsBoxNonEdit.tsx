import { Box, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { Lesson } from '../../interfaces/lessons';
import { QuestionInterface } from '../../interfaces/question';
import { stripHtml } from '../../utils/stripHtml';
import { truncateText } from '../../utils/utilText';
import { useContext } from 'react';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { LessonType, QuestionType } from '../../interfaces/enums';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';
import CustomInfoMessageAlignedRight from '../layouts/infoMessage/CustomInfoMessageAlignedRight';
import { AutoAwesome, InfoOutlined } from '@mui/icons-material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { calculateQuizTotalScore } from '../../utils/calculateQuizTotalScore';

interface QuestionsBoxNonEditProps {
	singleLesson?: Lesson;
	setIsDisplayNonEditQuestion: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayedQuestionNonEdit: React.Dispatch<React.SetStateAction<QuestionInterface | null>>;
}

const QuestionsBoxNonEdit = ({ singleLesson, setIsDisplayNonEditQuestion, setDisplayedQuestionNonEdit }: QuestionsBoxNonEditProps) => {
	const { fetchQuestionTypeName } = useContext(QuestionsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: '90%',
				mt: singleLesson?.type === LessonType.INSTRUCTIONAL_LESSON ? '1rem' : '0rem',
			}}>
			<Box sx={{ margin: isMobileSize ? '2rem 0' : '3rem 0' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<Typography variant={isMobileSize ? 'h6' : 'h5'}>Questions</Typography>
						{(() => {
							if (!singleLesson) return null;
							const totalScore = calculateQuizTotalScore({
								lesson: singleLesson,
								fetchQuestionTypeName,
							});
							return singleLesson.isGraded && singleLesson.type === LessonType.QUIZ && totalScore > 0 ? (
								<Typography
									variant={isMobileSize ? 'body2' : 'body1'}
									sx={{
										color: theme.palette.text.secondary,
										fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									}}>
									(Total: {totalScore} pts)
								</Typography>
							) : null;
						})()}
					</Box>
					<CustomInfoMessageAlignedRight message='Click the questions to preview as a student' />
				</Box>
				{singleLesson?.questionIds?.length === 0 || singleLesson?.questions?.filter((question) => question !== null)?.length === 0 ? (
					<NoContentBoxAdmin content='No question for this lesson' />
				) : (
					<>
						{singleLesson &&
							singleLesson.questions &&
							singleLesson.questions?.map((question) => {
								if (question !== null) {
									return (
										<Box
											key={question._id}
											sx={{
												display: 'flex',
												alignItems: 'center',
												height: '3rem',
												width: '100%',
												backgroundColor: theme.bgColor?.common,
												margin: '1rem 0',
												borderRadius: '0.25rem',
												boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
												cursor: 'pointer',
												bgcolor: theme.bgColor?.common,
												position: 'relative',
											}}
											onClick={() => {
												setDisplayedQuestionNonEdit(question);
												setIsDisplayNonEditQuestion(true);
											}}>
											{question.isAiGenerated && (
												<Tooltip title='AI Generated' placement='top' arrow>
													<AutoAwesome
														sx={{
															position: 'absolute',
															top: '0.25rem',
															right: '0.25rem',
															fontSize: '1rem',
															color: '#2196F3',
															zIndex: 1,
														}}
													/>
												</Tooltip>
											)}

											<Box
												sx={{
													height: '3rem',
													width: '2rem',
												}}>
												<img
													src='https://images.unsplash.com/photo-1601027847350-0285867c31f7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cXVlc3Rpb24lMjBtYXJrfGVufDB8fDB8fHww'
													alt='question_img'
													height='100%'
													width='100%'
													style={{
														borderRadius: '0.25rem 0 0 0.25rem',
													}}
												/>
											</Box>
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													width: '100%',
													margin: isMobileSize ? '0 0.5rem' : '0 1rem',
												}}>
												<Box sx={{ width: '35%' }}>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined }}>
														{truncateText(stripHtml(question.question), isMobileSize ? 40 : 60)}
													</Typography>
												</Box>
												<Box sx={{ display: 'flex', alignItems: 'center' }}>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined }}>
														{fetchQuestionTypeName(question)}
													</Typography>
												</Box>
												<Box sx={{ display: 'flex', alignItems: 'center' }}>
													{singleLesson?.isGraded &&
														singleLesson?.questionScores &&
														(() => {
															const questionTypeName = fetchQuestionTypeName(question);
															const questionId = question._id;
															const currentScore = singleLesson.questionScores[questionId];

															// FITB-Typing or FITB-DragDrop
															if (questionTypeName === QuestionType.FITB_TYPING || questionTypeName === QuestionType.FITB_DRAG_DROP) {
																const scoreObj =
																	typeof currentScore === 'object' && currentScore !== null
																		? (currentScore as { total?: number; perBlank?: number })
																		: null;
																const perBlank = scoreObj?.perBlank;
																const blankCount = question.blankValuePairs?.length || 0;
																const total = perBlank !== undefined && perBlank !== null && blankCount > 0 ? Number(perBlank) * blankCount : 0;

																return perBlank !== undefined && perBlank !== null ? (
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
																		<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, textAlign: 'right' }}>
																			{total} pts
																		</Typography>
																		<Tooltip title={`Points per blank: ${perBlank} (Total: ${total} points)`} placement='top' arrow>
																			<InfoOutlined
																				sx={{
																					fontSize: '0.75rem',
																					mr: '-0.75rem',
																					color: theme.palette.text.secondary,
																					cursor: 'help',
																				}}
																			/>
																		</Tooltip>
																	</Box>
																) : null;
															}

															// Matching
															if (questionTypeName === QuestionType.MATCHING) {
																const scoreObj =
																	typeof currentScore === 'object' && currentScore !== null
																		? (currentScore as { total?: number; perMatch?: number })
																		: null;
																const perMatch = scoreObj?.perMatch;
																const matchCount = question.matchingPairs?.length || 0;
																const total = perMatch !== undefined && perMatch !== null && matchCount > 0 ? Number(perMatch) * matchCount : 0;

																return perMatch !== undefined && perMatch !== null ? (
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
																		<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, textAlign: 'right' }}>
																			{total} pts
																		</Typography>
																		<Tooltip title={`Points per match: ${perMatch} (Total: ${total} points)`} placement='top' arrow>
																			<InfoOutlined
																				sx={{
																					fontSize: '0.75rem',
																					mr: '-0.75rem',
																					color: theme.palette.text.secondary,
																					cursor: 'help',
																				}}
																			/>
																		</Tooltip>
																	</Box>
																) : null;
															}

															// Simple questions (True/False, Multiple Choice, Open-ended, Audio/Video)
															const score =
																typeof currentScore === 'number'
																	? currentScore
																	: typeof currentScore === 'object' && currentScore !== null
																		? ((currentScore as { total?: number }).total ?? undefined)
																		: undefined;

															return score !== undefined && score !== null ? (
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, textAlign: 'right' }}>
																	{score} pts
																</Typography>
															) : null;
														})()}
												</Box>
											</Box>
										</Box>
									);
								}
							})}
					</>
				)}
			</Box>
		</Box>
	);
};

export default QuestionsBoxNonEdit;
