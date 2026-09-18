import { Box, Button, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPageLatestCoursesContext } from '../../contexts/LandingPageLatestCoursesContextProvider';
import { SingleCourse } from '../../interfaces/course';
import LandingPageCoursesInfoDialog from './LandingPageCoursesInfoDialog';
import LandingPageSectionHeader from './LandingPageSectionHeader';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { mulberry32, scatterNonOverlapping } from '../../utils/lpDecorScatter';
import { ArrowForward, SchoolOutlined, MenuBookOutlined } from '@mui/icons-material';
import { useIsLpQaPreview } from '../../hooks/useIsLpQaPreview';
import { LP_QA_PREVIEW_SEGMENT } from '../../utils/lpQaPreview';

const DIALOG_FONT = 'Varela Round';

const LATEST_COURSES_DECOR_COUNT = 15;

const SECTION_BG =
	'linear-gradient(165deg, #e8f0f8 0%, #f0f4f8 38%, #eef6fc 72%, #e4eef8 100%), radial-gradient(ellipse 85% 55% at 18% 20%, rgba(0, 102, 204, 0.09) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 75%, rgba(0, 76, 153, 0.07) 0%, transparent 50%)';

const LandingPageLatestCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { latestCourses } = useContext(LandingPageLatestCoursesContext);

	const { orgId } = useContext(OrganisationContext);
	const navigate = useNavigate();
	const isQaPreview = useIsLpQaPreview();

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	const goToAllCourses = () => {
		navigate(isQaPreview ? `/landing-page-courses/${LP_QA_PREVIEW_SEGMENT}` : '/landing-page-courses');
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const backgroundDecor = useMemo(() => {
		const positions = scatterNonOverlapping(0x4c415445, LATEST_COURSES_DECOR_COUNT, {
			topMin: 0.12,
			minNormDist: 0.13,
		});
		const rand = mulberry32(0x4c415445 ^ 0xace5);
		return positions.map((pos, i) => ({
			Icon: i % 2 === 0 ? SchoolOutlined : MenuBookOutlined,
			top: `${pos.y * 100}%`,
			left: `${pos.x * 100}%`,
			rotate: (rand() - 0.5) * 55,
			fontSize: 20 + rand() * 28,
			opacity: 0.04 + rand() * 0.1,
		}));
	}, []);

	// Filter courses by organization
	const publishedCourses = latestCourses?.filter((course: SingleCourse) => course.orgId === orgId) || [];

	return (
		<Box
			ref={ref}
			sx={{
				position: 'relative',
				overflow: 'hidden',
				py: '3rem',
				width: '100%',
				boxSizing: 'border-box',
				background: SECTION_BG,
			}}>
			<Box
				aria-hidden
				sx={{
					position: 'absolute',
					inset: 0,
					zIndex: 0,
					pointerEvents: 'none',
					overflow: 'hidden',
				}}>
				{backgroundDecor.map(({ Icon, top, left, rotate, fontSize, opacity }, index) => (
					<Icon
						key={index}
						sx={{
							position: 'absolute',
							top,
							left,
							transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
							fontSize,
							opacity,
							color: '#004c99',
						}}
					/>
				))}
			</Box>
			<Box sx={{ position: 'relative', zIndex: 1 }}>
				<LandingPageSectionHeader
					title='Son Eklenen Kurslar'
					subtitle='Güncel programlarımızdan öne çıkan kurslara göz atın. Size en uygun eğitimi seçerek hemen öğrenmeye başlayın.'
				/>

				<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
					{publishedCourses && publishedCourses.length > 0 ? (
						publishedCourses?.map((course: SingleCourse) => {
							return (
								<Box
									key={course._id}
									sx={{
										transition: 'transform 0.2s ease-out',
										'&:hover': {
											transform: 'translate3d(0, -4px, 0)',
										},
									}}>
									<DashboardCourseCard course={course} fromHomePage={true} />
								</Box>
							);
						})
					) : (
						<Typography
							sx={{
								textAlign: 'center',
								fontSize: '1.05rem',
								color: '#475569',
								fontFamily: DIALOG_FONT,
								lineHeight: 1.65,
								maxWidth: '28rem',
								mt: '2rem',
								px: 2,
							}}>
							Yeni kurslarımız çok yakında burada olacak. Programlar hakkında bilgi almak için bizimle iletişime geçebilirsiniz.
						</Typography>
					)}
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 }, px: { xs: 1.5, sm: 2 } }}>
					<Button
						variant='contained'
						endIcon={<ArrowForward />}
						onClick={goToAllCourses}
						sx={{
							fontFamily: DIALOG_FONT,
							fontWeight: 600,
							textTransform: 'none',
							background: '#FF6B3D',
							color: '#FFFFFF',
							borderRadius: { xs: '0.75rem', sm: '1rem' },
							px: { xs: 2, sm: 2.75 },
							py: { xs: 0.85, sm: 1 },
							fontSize: { xs: '0.9rem', sm: '1rem' },
							boxShadow: '0 4px 15px rgba(255, 107, 61, 0.35)',
							'&:hover': {
								background: '#ff7d55',
								transform: 'translateY(-2px)',
								boxShadow: '0 6px 20px rgba(255, 107, 61, 0.45)',
							},
							transition: 'all 0.25s ease',
						}}>
						Tüm Kurslar
					</Button>
				</Box>

				<LandingPageCoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
			</Box>
		</Box>
	);
});

export default LandingPageLatestCourses;
