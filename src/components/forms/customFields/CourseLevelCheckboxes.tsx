import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { COURSE_LEVELS, CourseLevel } from '../../../interfaces/course';

interface CourseLevelCheckboxesProps {
	value: CourseLevel[];
	onChange: (levels: CourseLevel[]) => void;
	isMobileSize?: boolean;
}

const CourseLevelCheckboxes = ({ value, onChange, isMobileSize }: CourseLevelCheckboxesProps) => {
	const selected = Array.isArray(value) ? value : [];

	const toggle = (level: CourseLevel) => {
		const next = selected.includes(level) ? selected.filter((item) => item !== level) : [...selected, level];
		onChange(COURSE_LEVELS.filter((item) => next.includes(item)));
	};

	return (
		<Box>
			<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
				Level
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.15rem 0.75rem', mt: '0.25rem' }}>
				{COURSE_LEVELS.map((level) => (
					<FormControlLabel
						key={level}
						control={
							<Checkbox
								checked={selected.includes(level)}
								onChange={() => toggle(level)}
								sx={{
									'& .MuiSvgIcon-root': {
										fontSize: isMobileSize ? '1rem' : '1.15rem',
									},
								}}
							/>
						}
						label={level}
						sx={{
							'mr': 0,
							'& .MuiFormControlLabel-label': {
								fontSize: isMobileSize ? '0.75rem' : '0.85rem',
							},
						}}
					/>
				))}
			</Box>
		</Box>
	);
};

export default CourseLevelCheckboxes;
