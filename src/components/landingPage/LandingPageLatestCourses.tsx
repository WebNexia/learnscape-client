import { InfoOutlined, SchoolOutlined, MenuBookOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import DashboardCourseCard from '../userCourses/DashboardCourseCard';
import { forwardRef, useContext, useMemo, useState } from 'react';
import { LandingPageLatestCoursesContext } from '../../contexts/LandingPageLatestCoursesContextProvider';
import { SingleCourse } from '../../interfaces/course';
import LandingPageCoursesInfoDialog from './LandingPageCoursesInfoDialog';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { mulberry32, scatterNonOverlapping } from '../../utils/lpDecorScatter';

const DIALOG_FONT = 'Varela Round';

const LATEST_COURSES_DECOR_COUNT = 15;

const SECTION_BG =
	'linear-gradient(165deg, #e8f0f8 0%, #f0f4f8 38%, #eef6fc 72%, #e4eef8 100%), radial-gradient(ellipse 85% 55% at 18% 20%, rgba(0, 102, 204, 0.09) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 75%, rgba(0, 76, 153, 0.07) 0%, transparent 50%)';

const LandingPageLatestCourses = forwardRef<HTMLDivElement>((_, ref) => {
	const { latestCourses } = useContext(LandingPageLatestCoursesContext);

	const { orgId } = useContext(OrganisationContext);

	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

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
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '100%',
						textAlign: 'center',
						mb: { xs: 2, sm: 3 },
						px: 2,
					}}>
					<Typography
						sx={{
							fontSize: responsiveStyles.typography.h2,
							fontFamily: DIALOG_FONT,
							background: 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
							letterSpacing: '-0.02em',
							lineHeight: 1.2,
							fontWeight: 700,
							// Soft halo so BG icons do not read through the gradient text (no separate title bar)
							filter:
								'drop-shadow(0 0 10px rgba(240, 244, 248, 0.95)) drop-shadow(0 0 22px rgba(232, 240, 248, 0.85)) drop-shadow(0 0 36px rgba(228, 238, 248, 0.55))',
						}}>
						Son Eklenen Kurslar
					</Typography>
					{/* <IconButton
						size='small'
						sx={{
							ml: { xs: '0.5rem', sm: '0.75rem' },
							'& svg': {
								fontSize: { xs: '1.1rem', sm: '1.25rem' },
								color: '#64748b',
								filter:
									'drop-shadow(0 0 6px rgba(240, 244, 248, 0.98)) drop-shadow(0 0 14px rgba(232, 240, 248, 0.9))',
							},
							'&:hover': { backgroundColor: 'rgba(91, 141, 239, 0.12)' },
						}}
						onClick={() => setIsInfoDialogOpen(true)}>
						<InfoOutlined />
					</IconButton> */}
				</Box>

				<Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', mt: '3rem', px: { xs: 1.5, sm: 2 } }}>
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
								fontSize: '1.25rem',
								color: '#334155',
								fontFamily: DIALOG_FONT,
								mt: '3rem',
							}}>
							Henüz yayınlanmış kurs bulunmamaktadır.
						</Typography>
					)}
				</Box>

				<LandingPageCoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
			</Box>
		</Box>
	);
});

export default LandingPageLatestCourses;
