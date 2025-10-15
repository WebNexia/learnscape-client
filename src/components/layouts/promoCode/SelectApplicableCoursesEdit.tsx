import { Box, Checkbox, FormControlLabel, IconButton, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { truncateText } from '../../../utils/utilText';
import { useContext, useState, useRef } from 'react';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { PromoCode } from '../../../interfaces/promoCode';
import PromoCodeCourseSearchSelect from '../../PromoCodeCourseSearchSelect';
import { SearchCourse } from '../../../interfaces/search';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface SelectApplicableCoursesProps {
	singleCode: PromoCode | null;
	setSingleCode: React.Dispatch<React.SetStateAction<PromoCode | null>>;
}

const SelectApplicableCoursesEdit = ({ singleCode, setSingleCode }: SelectApplicableCoursesProps) => {
	const { courses } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const courseSearchRef = useRef<any>(null);

	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	const handleCourseSelect = (course: SearchCourse) => {
		setSingleCode((prevData) => {
			if (!prevData) return prevData;
			const updatedCoursesIds = [...prevData.coursesApplicable];
			updatedCoursesIds.push(course._id);
			return { ...prevData, coursesApplicable: updatedCoursesIds };
		});
		setSearchCourseValue('');
		// Reset the search component
		if (courseSearchRef.current) {
			courseSearchRef.current.reset();
		}
	};

	return (
		<Box sx={{ mt: singleCode?.coursesApplicable.length! > 0 ? '0rem' : '1.25rem' }}>
			{singleCode?.coursesApplicable.length! > 0 && (
				<Box sx={{ display: 'flex', margin: '0.75rem 0 0.75rem 0', flexWrap: 'wrap' }}>
					{singleCode?.coursesApplicable?.map((id) => {
						const course = courses?.find((course) => course._id === id);
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
										const updatedCourses = singleCode.coursesApplicable?.filter((filteredCourseId) => course?._id !== filteredCourseId) || [];

										setSingleCode((prevData) => ({ ...prevData!, coursesApplicable: updatedCourses }));
									}}>
									<Cancel sx={{ fontSize: '0.95rem' }} />
								</IconButton>
							</Box>
						);
					})}
				</Box>
			)}
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
					<Box sx={{ flex: 1, mr: 2 }}>
						<PromoCodeCourseSearchSelect
							ref={courseSearchRef}
							value={searchCourseValue}
							onChange={setSearchCourseValue}
							onSelect={handleCourseSelect}
							placeholder={singleCode?.isAllCoursesSelected ? '' : 'Search in Title and Description'}
							disabled={singleCode?.isAllCoursesSelected}
							selectedCourseIds={singleCode?.coursesApplicable || []}
							sx={{
								backgroundColor: singleCode?.isAllCoursesSelected ? 'transparent' : '#fff',
							}}
						/>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content', mb: '1rem' }}>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={singleCode?.isAllCoursesSelected}
									onChange={(e) => {
										setSearchCourseValue('');
										setSingleCode((prevData) => ({ ...prevData!, isAllCoursesSelected: e.target.checked }));
										if (e.target.checked) {
											setSingleCode((prevData) => ({ ...prevData!, coursesApplicable: [] }));
										}
										// Reset the search component
										if (courseSearchRef.current) {
											courseSearchRef.current.reset();
										}
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1rem',
										},
									}}
								/>
							}
							label='All Courses'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									fontWeight: 500,
								},
							}}
						/>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default SelectApplicableCoursesEdit;
