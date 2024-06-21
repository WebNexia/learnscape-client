import { Box, Typography, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import theme from '../../../themes';

interface TrueFalseOptionsProps {
	correctAnswer: string;
	fromLessonEditPage?: boolean;
	correctAnswerAdminQuestions?: string;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setIsCorrectAnswerMissing: React.Dispatch<React.SetStateAction<boolean>>;
	setCorrectAnswerAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
}

const TrueFalseOptions = ({
	correctAnswer,
	fromLessonEditPage,
	correctAnswerAdminQuestions,
	setCorrectAnswer,
	setIsCorrectAnswerMissing,
	setCorrectAnswerAdminQuestions,
}: TrueFalseOptionsProps) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCorrectAnswer((event.target as HTMLInputElement).value);
		setIsCorrectAnswerMissing(false);
		if (!fromLessonEditPage && setCorrectAnswerAdminQuestions) {
			setCorrectAnswerAdminQuestions((event.target as HTMLInputElement).value);
		}
	};

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mt: '1.5rem' }}>
			<RadioGroup row value={fromLessonEditPage ? correctAnswer : correctAnswerAdminQuestions} onChange={handleChange}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box
						sx={{
							width: '7rem',
							padding: '1.5rem 2rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							transition: '0.3s',
							backgroundColor: theme.bgColor?.greenPrimary,
							textAlign: 'center',
							borderRadius: '0.3rem',
							position: 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='true'
							control={<Radio color='secondary' />}
							label={
								<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
									True
								</Typography>
							}
							sx={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						/>
					</Box>
					<Box
						sx={{
							width: '7rem',
							padding: '1.5rem 2rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0, 0, 0, 0.2)',
							transition: '0.3s',
							marginLeft: '1.5rem',
							backgroundColor: 'error.main',
							textAlign: 'center',
							borderRadius: '0.3rem',
							position: 'relative',
							':hover': {
								boxShadow: '0 0 0.4rem 0.3rem rgba(0,0,0,0.3)',
							},
						}}>
						<FormControlLabel
							value='false'
							control={<Radio color='secondary' />}
							label={
								<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
									False
								</Typography>
							}
							sx={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
							}}
						/>
					</Box>
				</Box>
			</RadioGroup>
		</Box>
	);
};

export default TrueFalseOptions;
