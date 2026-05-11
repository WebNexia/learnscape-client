import { Avatar, Box, Card, CardContent, CardMedia, LinearProgress, Typography, Chip } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { truncateText } from '../../utils/utilText';
import { useContext } from 'react';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { setCurrencySymbol } from '@utils/setCurrencySymbol';

interface DashboardCourseCardProps {
	course: SingleCourse;
	isEnrolled?: boolean;
	displayMyCourses?: boolean;
	userCourseId?: string;
	isCourseCompleted?: boolean;
	fromHomePage?: boolean;
}

const DashboardCourseCard = ({ course, isEnrolled, displayMyCourses, userCourseId, isCourseCompleted, fromHomePage }: DashboardCourseCardProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const location = useGeoLocation();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const isCourseFree: boolean =
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '0' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === 'Free' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '';

	const topAccent = '#0052a3';
	const hoverBorderGradient = `linear-gradient(90deg, ${topAccent} 0%, ${topAccent}80 100%)`;

	return (
		<Box
			sx={{
				display: !isEnrolled && displayMyCourses ? 'none' : 'block',
				width: isMobileSize ? '15rem' : '19rem',
				height: isMobileSize ? '21rem' : '25rem',
				p: '4px',
				borderRadius: '0.75rem',
				boxSizing: 'border-box',
				position: 'relative',
				margin: '0 1rem 2rem 1rem',
				backgroundColor: 'transparent',
				boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
				transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
				cursor: 'pointer',
				'&::before': {
					content: '""',
					position: 'absolute',
					inset: 0,
					borderRadius: '0.75rem',
					background: hoverBorderGradient,
					opacity: 0,
					transition: 'opacity 0.25s ease-out',
					pointerEvents: 'none',
					zIndex: 0,
				},
				'&:hover': {
					transform: 'translate3d(0, -4px, 0)',
					boxShadow: `0 8px 24px ${topAccent}28`,
					'&::before': { opacity: 1 },
				},
			}}
			onClick={() => {
				if (user && !fromHomePage) {
					// Logged-in user from dashboard - go to course page
					navigate(`/course/${course._id}/userCourseId/${!userCourseId ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`);
				} else if (user && fromHomePage) {
					// Logged-in user from home page - still go to course page
					navigate(`/course/${course._id}/userCourseId/${!userCourseId ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`);
				} else {
					// Non-logged-in user - go to landing page
					navigate(`/landing-page-course/${encodeURIComponent(course?.title)}/${course?._id}`);
				}
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}}>
			<Card
				sx={{
					position: 'relative',
					zIndex: 1,
					height: '100%',
					width: '100%',
					borderRadius: 'calc(0.75rem - 4px)',
					overflow: 'hidden',
					margin: 0,
					backgroundColor: '#FFFFFF',
					border: 'none',
					boxShadow: 'none',
				}}>
				{course.isExpired && (
					<Box
						sx={{
							position: 'absolute',
							top: '0.5rem',
							right: '0.5rem',
							backgroundColor: theme.palette.error.main,
							color: 'white',
							px: 1.5,
							py: 0.25,
							borderRadius: '4px',
							fontSize: '0.7rem',
							fontWeight: 500,
							zIndex: 1,
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						}}>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
							Closed
						</Typography>
					</Box>
				)}

				{course?.courseManagement && (
					<Chip
						label={course?.courseManagement?.isExternal ? <span>Partner</span> : <span>Platform</span>}
						color={course?.courseManagement?.isExternal ? 'info' : 'success'}
						size='small'
						sx={{
							position: 'absolute',
							top: '0.5rem',
							left: '0.5rem',
							fontFamily: 'Varela Round',
							fontWeight: 500,
							color: 'white',
							ml: 'auto',
							px: 1,
						}}
					/>
				)}

				<CardMedia
					sx={{ height: isMobileSize ? '7rem' : '10rem', width: isMobileSize ? '17rem' : '22rem', objectFit: 'cover' }}
					image={
						course.imageUrl ||
						'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
					}
				/>
				<CardContent sx={{ padding: '1rem 1.5rem' }}>
					<Typography
						sx={{
							fontSize: {
								xs: '0.8rem',
								sm: '0.8rem',
								md: course?.title?.length > 35 ? '0.95rem' : '1rem',
								lg: course?.title?.length > 35 ? '1rem' : '1.1rem',
							},
							textAlign: 'center',
							color: fromHomePage ? 'black' : theme.palette.primary.main,
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							fontWeight: fromHomePage ? 900 : 400,
						}}>
						{course.title.toUpperCase()}
					</Typography>
					<Typography
						variant='body2'
						sx={{
							textAlign: 'justify',
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
							lineHeight: isMobileSize ? '1.4' : '1.5',
							marginTop: isMobileSize ? '0.5rem' : '0.75rem',
							width: '100%',
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						}}>
						{truncateText(course.description, isEnrolled && isMobileSize ? 100 : isEnrolled ? 125 : 150)}
					</Typography>
				</CardContent>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						position: 'absolute',
						bottom: 0,
					}}>
					<Box
						sx={{
							visibility: isEnrolled ? 'visible' : 'hidden',
							width: '90%',
							alignSelf: 'center',
						}}>
						{/* <Typography
							sx={{
								fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								textAlign: 'center',
								marginBottom: '0.2rem',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{isCourseCompleted ? 'Completed' : 'In Progress'}
						</Typography> */}
						<LinearProgress variant='determinate' color='success' value={isCourseCompleted ? 100 : 70} />
					</Box>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '0.5rem 1.25rem',
							borderTop: '1px solid rgba(0, 82, 163, 0.1)',
							backgroundColor: 'rgba(0, 82, 163, 0.04)',
							borderRadius: '0 0 calc(0.75rem - 4px) calc(0.75rem - 4px)',
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
							<Avatar
								src={course?.instructor?.imageUrl}
								sx={{
									width: '1.75rem',
									height: '1.75rem',
									objectFit: 'cover',
									border: '2px solid #fff',
									boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
								}}
							/>
							<Box sx={{ display: 'flex', flexDirection: 'column', visibility: isEnrolled ? 'hidden' : 'visible' }}>
								<Typography
									sx={{
										fontSize: '0.65rem',
										letterSpacing: '0.5px',
										textTransform: 'uppercase',
										color: 'black',
										fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
									}}>
									Eğitmen
								</Typography>
								<Typography
									variant='body2'
									sx={{
										fontSize: isMobileSize ? '0.72rem' : '0.8rem',
										fontWeight: 600,
										color: fromHomePage ? '#0052a3' : theme.palette.primary.main,
										fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
										lineHeight: 1.2,
									}}>
									{course?.instructor?.name}
								</Typography>
							</Box>
						</Box>

						{fromHomePage && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: 0.25,
									flexShrink: 0,
									textAlign: 'right',
									minWidth: 0,
									pl: isCourseFree ? 0 : 1,
									borderLeft: isCourseFree ? 'none' : '2px solid',
									borderLeftColor: isCourseFree ? 'transparent' : 'rgba(0, 82, 163, 0.35)',
								}}>
								{!isCourseFree && (
									<Typography
										component='span'
										sx={{
											fontFamily: 'Varela Round',
											fontSize: '0.5625rem',
											fontWeight: 700,
											letterSpacing: '0.14em',
											textTransform: 'uppercase',
											color: 'text.secondary',
											lineHeight: 1,
										}}>
										Ücret
									</Typography>
								)}
								<Typography
									component='span'
									sx={{
										fontFamily: 'Varela Round',
										fontWeight: 700,
										fontSize: isMobileSize ? '0.8125rem' : '0.9375rem',
										fontVariantNumeric: 'tabular-nums',
										letterSpacing: isCourseFree ? 'normal' : '-0.02em',
										lineHeight: 1.2,
										color: isCourseFree ? '#047857' : '#0f172a',
									}}>
									{isCourseFree
										? 'Ücretsiz'
										: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
								</Typography>
							</Box>
						)}

						{!fromHomePage && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: 0.25,
									flexShrink: 0,
									textAlign: 'right',
									minWidth: 0,
									pl: isEnrolled || isCourseFree ? 0 : 1,
									borderLeft: isEnrolled || isCourseFree ? 'none' : '2px solid',
									borderLeftColor: 'rgba(0, 82, 163, 0.35)',
								}}>
								{!isEnrolled && !isCourseFree && (
									<Typography
										component='span'
										sx={{
											fontFamily: theme.fontFamily?.main,
											fontSize: '0.5625rem',
											fontWeight: 700,
											letterSpacing: '0.14em',
											textTransform: 'uppercase',
											color: 'text.secondary',
											lineHeight: 1,
										}}>
										Price
									</Typography>
								)}
								<Typography
									component='span'
									sx={{
										fontFamily: theme.fontFamily?.main,
										fontWeight: isEnrolled ? 600 : 700,
										fontSize: isMobileSize ? '0.75rem' : '0.875rem',
										fontVariantNumeric: !isEnrolled && !isCourseFree ? 'tabular-nums' : undefined,
										letterSpacing: !isEnrolled && !isCourseFree ? '-0.02em' : undefined,
										lineHeight: 1.25,
										color: isEnrolled ? theme.palette.primary.main : isCourseFree ? '#047857' : '#0f172a',
									}}>
									{isEnrolled && isCourseCompleted
										? 'Review Course'
										: isEnrolled && !isCourseCompleted
											? 'Continue'
											: isCourseFree
												? 'Free'
												: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			</Card>
		</Box>
	);
};

export default DashboardCourseCard;
