import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { isGapFillQuestion } from '../../utils/levelTest/scoring';
import { ANSWER_OPTION_IDS } from '../../utils/levelTest/types';
import type { AnswerOptionId, AnswerSelection, ReadingQuestion } from '../../utils/levelTest/types';
import { levelTestCardSx } from './styles';

const isOptionId = (value: string): value is AnswerOptionId =>
	(ANSWER_OPTION_IDS as readonly string[]).includes(value);

type Props = {
	questions: ReadingQuestion[];
	answers: AnswerSelection;
	onChange: (questionId: string, value: string) => void;
};

const LevelTestQuestions = ({ questions, answers, onChange }: Props) => (
	<Box sx={{ display: 'grid', gap: 1.5 }}>
		{questions.map((question, index) => {
			const labelId = `level-test-question-${question.id}`;
			const selected = answers[question.id] ?? '';
			return (
				<Box key={question.id} sx={{ ...levelTestCardSx, p: { xs: 2, sm: 2.5 }, boxShadow: '0 8px 24px rgba(1,67,90,.06)' }}>
					<FormControl component='fieldset' fullWidth>
						<FormLabel component='legend' id={labelId} sx={{ color: '#01435A !important' }}>
							<Typography component='span' sx={{ display: 'block', mb: 0.5, color: '#0052a3', fontSize: '.75rem', fontWeight: 700 }}>
								SORU {index + 1} / {questions.length}
							</Typography>
							<Typography component='span' lang='en' sx={{ display: 'block', color: '#172b35', fontWeight: 700, lineHeight: 1.55 }}>
								{question.prompt}
							</Typography>
						</FormLabel>
						{isGapFillQuestion(question) ? (
							<TextField
								value={selected}
								onChange={(event) => onChange(question.id, event.target.value.slice(0, 80))}
								placeholder='İngilizce cevabını yaz'
								inputProps={{ maxLength: 80, lang: 'en', 'aria-labelledby': labelId }}
								fullWidth
								size='small'
								sx={{ mt: 1.5 }}
							/>
						) : (
							<RadioGroup
								aria-labelledby={labelId}
								value={selected}
								onChange={(event) => isOptionId(event.target.value) && onChange(question.id, event.target.value)}
								sx={{ mt: 1.25, gap: 0.75 }}>
								{question.options.map((option) => (
									<FormControlLabel
										key={option.id}
										value={option.id}
										control={<Radio sx={{ color: '#6d8993', '&.Mui-checked': { color: '#0052a3' } }} />}
										label={
											<Typography component='span' lang='en' sx={{ color: '#263f49', lineHeight: 1.5 }}>
												<Box component='span' sx={{ fontWeight: 700, mr: 0.75 }}>{option.id}.</Box>
												{option.text}
											</Typography>
										}
										sx={{
											m: 0,
											px: 1,
											minHeight: 50,
											border: '1px solid',
											borderColor: selected === option.id ? '#0052a3' : 'rgba(1,67,90,.18)',
											borderRadius: 2,
											bgcolor: selected === option.id ? 'rgba(0,82,163,.06)' : '#fff',
										}}
									/>
								))}
							</RadioGroup>
						)}
					</FormControl>
				</Box>
			);
		})}
	</Box>
);

export default LevelTestQuestions;
