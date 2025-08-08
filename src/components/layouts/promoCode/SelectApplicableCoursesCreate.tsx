import { Box, Checkbox, FormControlLabel, IconButton, InputAdornment, Typography } from '@mui/material';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { Cancel, Search } from '@mui/icons-material';
import { truncateText } from '../../../utils/utilText';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { useContext, useState } from 'react';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { PromoCode } from '../../../interfaces/promoCode';

interface SelectApplicableCoursesProps {
	newPromoCode: PromoCode;
	setNewPromoCode: React.Dispatch<React.SetStateAction<PromoCode>>;
}

const SelectApplicableCoursesCreate = ({ newPromoCode, setNewPromoCode }: SelectApplicableCoursesProps) => {
	const { courses } = useContext(CoursesContext);

	const [filteredCourses, setFilteredCourses] = useState<SingleCourse[]>([]);
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	const filterCourses = (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setFilteredCourses([]);
			return;
		}

		const coursesIds = newPromoCode?.coursesApplicable || [];
		const searchResults = courses.filter(
			(course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()) && !coursesIds.includes(course._id)
		);

		setFilteredCourses(searchResults);
	};

	return (
		<Box sx={{ mt: newPromoCode.coursesApplicable.length > 0 ? '0rem' : '1.25rem' }}>
			{newPromoCode.coursesApplicable.length > 0 && (
				<Box sx={{ display: 'flex', margin: '0.75rem 0 0.75rem 0', flexWrap: 'wrap' }}>
					{newPromoCode.coursesApplicable?.map((id) => {
						const course = courses.find((course) => course._id === id);
						return (
							<Box
								key={course?._id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									border: 'solid lightgray 0.1rem',
									padding: '0 0.25rem',
									height: '1.75rem',
									borderRadius: '0.25rem',
									margin: '0.35rem 0.35rem 0 0',
								}}>
								<Typography sx={{ fontSize: '0.85rem' }}>{truncateText(course?.title!, 20)}</Typography>
								<IconButton
									onClick={() => {
										const updatedCourses = newPromoCode.coursesApplicable.filter((filteredCourseId) => course?._id !== filteredCourseId);

										setNewPromoCode((prevData) => ({ ...prevData, coursesApplicable: updatedCourses }));
									}}>
									<Cancel sx={{ fontSize: '0.95rem' }} />
								</IconButton>
							</Box>
						);
					})}
				</Box>
			)}
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
					<CustomTextField
						label=''
						value={searchCourseValue}
						disabled={newPromoCode.isAllCoursesSelected}
						placeholder={newPromoCode.isAllCoursesSelected ? '' : 'Search Course'}
						onChange={(e) => {
							setSearchCourseValue(e.target.value);
							filterCourses(e.target.value);
						}}
						sx={{ width: '80%', backgroundColor: newPromoCode.isAllCoursesSelected ? 'transparent' : '#fff' }}
						required={false}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Search
										sx={{
											mr: '-0.5rem',
											color: newPromoCode.isAllCoursesSelected ? 'lightgray' : null,
										}}
									/>
								</InputAdornment>
							),
						}}
					/>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '21%', mb: '0.85rem' }}>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={newPromoCode.isAllCoursesSelected}
									onChange={(e) => {
										setSearchCourseValue('');
										setNewPromoCode((prevData) => ({ ...prevData, isAllCoursesSelected: e.target.checked }));
										if (e.target.checked) {
											setNewPromoCode((prevData) => ({ ...prevData, coursesApplicable: [] }));
										}
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1.25rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='All Courses'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.7rem', // Adjust the label font size
								},
							}}
						/>
					</Box>
				</Box>

				{filteredCourses.length !== 0 && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							alignItems: 'flex-start',
							width: '60%',
							maxHeight: '10rem',
							overflowY: 'auto',
							overflowX: 'hidden',
							margin: '-1rem auto 1.5rem auto',
							border: 'solid 0.05rem lightgray',
							position: 'absolute',
							top: '3.25rem',
							left: 0,
							zIndex: 3,
							backgroundColor: theme.bgColor?.common,
							boxShadow: '0.15rem 0.2rem 0.3rem 0rem rgba(0,0,0,0.1)',
						}}>
						{filteredCourses?.map((course) => (
							<Box
								key={course._id}
								sx={{
									'display': 'flex',
									'justifyContent': 'flex-start',
									'alignItems': 'center',
									'width': '100%',
									'padding': '0.5rem',
									'transition': '0.5s',
									'borderRadius': '0.25rem',
									':hover': {
										'backgroundColor': theme.bgColor?.primary,
										'color': '#fff',
										'cursor': 'pointer',
										'& .username': {
											color: '#fff',
										},
									},
								}}
								onClick={() => {
									setNewPromoCode((prevData) => {
										const updatedCoursesIds = [...prevData.coursesApplicable];
										updatedCoursesIds.push(course._id);
										return { ...prevData, coursesApplicable: updatedCoursesIds };
									});
									setSearchCourseValue('');
									setFilteredCourses([]);
								}}>
								{course.imageUrl && (
									<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
										<img
											src={course.imageUrl}
											alt='img'
											style={{
												height: '2rem',
												width: '2rem',
												borderRadius: '100%',
												border: 'solid lightgray 0.1rem',
											}}
										/>
									</Box>
								)}
								<Box>
									<Typography className='username' sx={{ fontSize: '0.85rem' }}>
										{truncateText(course.title, 30)}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default SelectApplicableCoursesCreate;
