import { Box } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SingleCourse } from '../../interfaces/course';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { getPriceForCountry } from '../../utils/getPriceForCountry';
import { resolvePricingCountryCode } from '../../utils/resolvePricingCountryCode';
import CourseWaitingListDialog from './CourseWaitingListDialog';
import { useIsLpQaPreview } from '../../hooks/useIsLpQaPreview';

type Props = {
	course: SingleCourse;
};

const enrollButtonSx = {
	width: 'fit-content',
	minWidth: { xs: '12rem', sm: '14rem' },
	padding: { xs: '0.85rem 2rem', sm: '1rem 2.5rem' },
	fontSize: { xs: '0.95rem', sm: '1.05rem' },
	fontFamily: 'Varela Round',
	fontWeight: 700,
	textTransform: 'none',
	background: '#FF6F4E !important',
	borderRadius: '0.75rem',
	color: '#fff !important',
	boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
	'&:hover': {
		color: '#fff !important',
		backgroundColor: '#ff7d55 !important',
		transform: 'translateY(-2px)',
		boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
	},
	transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

const LandingPageCourseEnrollCta = ({ course }: Props) => {
	const navigate = useNavigate();
	const location = useGeoLocation();
	const isQaPreview = useIsLpQaPreview();
	const resolvedCountryCode = resolvePricingCountryCode(undefined, location?.countryCode);
	const [waitlistOpen, setWaitlistOpen] = useState(false);

	const price = getPriceForCountry(course, resolvedCountryCode);
	const isCourseFree = price?.amount === 'Free' || price?.amount === '' || price?.amount === '0';
	const isManuallyClosed = Boolean(course?.isRegistrationClosedByAdmin);
	const isCapacityFull = Boolean(course?.isCapacityFull);

	const canEnroll = !course.isExpired && !isManuallyClosed && !isCapacityFull && !isCourseFree;
	const canJoinWaitlist = !course.isExpired && !isCourseFree && (isManuallyClosed || isCapacityFull);

	if (!canEnroll && !canJoinWaitlist) return null;

	const handleEnroll = () => {
		if (isQaPreview) return;
		navigate(`/landing-page-course/${encodeURIComponent(course.title ?? '')}/${course._id}/payment`);
	};

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					width: '100%',
					maxWidth: { xs: '95vw', md: '90vw' },
					mx: 'auto',
					px: { xs: 2, sm: 3 },
					mt: { xs: 1, md: 2 },
					mb: { xs: 4, md: 6 },
				}}>
				{canEnroll ? (
					<CustomSubmitButton variant='contained' onClick={handleEnroll} sx={enrollButtonSx}>
						Kursu Satın Al
					</CustomSubmitButton>
				) : (
					<CustomSubmitButton
						variant='contained'
						onClick={() => {
							if (isQaPreview) return;
							setWaitlistOpen(true);
						}}
						sx={enrollButtonSx}>
						Bekleme Listesine Kaydol
					</CustomSubmitButton>
				)}
			</Box>
			{!isQaPreview && (
				<CourseWaitingListDialog
					open={waitlistOpen}
					onClose={() => setWaitlistOpen(false)}
					courseId={course._id}
					courseTitle={course.title}
				/>
			)}
		</>
	);
};

export default LandingPageCourseEnrollCta;
