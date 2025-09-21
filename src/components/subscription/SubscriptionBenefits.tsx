import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, Group, Message, School, TrendingUp, Support, Security, Star } from '@mui/icons-material';
import theme from '../../themes';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface SubscriptionBenefitsProps {
	subscriptionType: 'monthly' | 'yearly';
}

const SubscriptionBenefits: React.FC<SubscriptionBenefitsProps> = ({ subscriptionType }) => {
	const { isSmallScreen, isRotatedMedium } = React.useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const benefits = [
		{
			icon: <Group sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Community Access',
			description: 'Join our vibrant learning community and connect with fellow learners',
			features: ['Access to community forums', 'Participate in discussions', 'Share knowledge and experiences', 'Connect with like-minded learners'],
		},
		{
			icon: <Message sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Direct Messaging',
			description: 'Communicate directly with instructors and other learners',
			features: ['Private messaging with instructors', 'Group messaging capabilities', 'Real-time notifications', 'Message history and search'],
		},
		{
			icon: <School sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Free Course Access',
			description: 'Unlimited access to all free courses on the platform',
			features: ['Access to all free courses', 'Progress tracking', 'Certificates of completion', 'Downloadable resources'],
		},
		{
			icon: <TrendingUp sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Learning Analytics',
			description: 'Track your learning progress with detailed analytics',
			features: ['Personal learning dashboard', 'Progress tracking', 'Performance insights', 'Learning streak tracking'],
		},
		{
			icon: <Support sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Priority Support',
			description: 'Get priority customer support and faster response times',
			features: ['Priority email support', 'Faster response times', 'Technical assistance', 'Feature requests priority'],
		},
		{
			icon: <Security sx={{ color: theme.textColor?.greenPrimary?.main || '#4CAF50' }} />,
			title: 'Enhanced Security',
			description: 'Advanced security features and data protection',
			features: ['Enhanced data encryption', 'Secure file storage', 'Privacy controls', 'Account security features'],
		},
	];

	// const additionalFeatures = [
	// 	'Ad-free learning experience',
	// 	'Early access to new features',
	// 	'Exclusive learning materials',
	// 	'Mobile app access',
	// 	'Offline content download',
	// 	'Advanced search capabilities',
	// ];

	return (
		<Box sx={{ p: isMobileSize ? 2 : 3 }}>
			{/* Header */}
			<Box sx={{ textAlign: 'center', mb: 4 }}>
				<Typography
					variant={isMobileSize ? 'h5' : 'h4'}
					sx={{
						fontWeight: 600,
						mb: 1,
					}}>
					{subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'} Subscription Benefits
				</Typography>
				<Typography
					variant='body1'
					sx={{
						color: theme.textColor?.common,
						fontFamily: theme.fontFamily?.main,
					}}>
					Unlock the full potential of your learning journey
				</Typography>
			</Box>

			{/* Main Benefits Grid */}
			<Grid container spacing={3} sx={{ mb: 2 }}>
				{benefits.map((benefit, index) => (
					<Grid item xs={12} md={6} key={index}>
						<Card
							sx={{
								'height': '100%',
								'borderRadius': 2,
								'boxShadow': '0 4px 12px rgba(0,0,0,0.1)',
								'transition': 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
								},
							}}>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
									{benefit.icon}
									<Typography
										variant='h6'
										sx={{
											ml: 1,
											fontWeight: 600,
										}}>
										{benefit.title}
									</Typography>
								</Box>

								<Typography
									variant='body2'
									sx={{
										mb: 2,
									}}>
									{benefit.description}
								</Typography>

								<List dense>
									{benefit.features.map((feature, featureIndex) => (
										<ListItem key={featureIndex} sx={{ px: 0, py: 0.1 }}>
											<ListItemIcon sx={{ minWidth: 32 }}>
												<CheckCircle
													sx={{
														fontSize: 16,
														color: theme.textColor?.greenPrimary?.main || '#4CAF50',
													}}
												/>
											</ListItemIcon>
											<ListItemText
												primary={feature}
												primaryTypographyProps={{
													variant: 'body2',
												}}
											/>
										</ListItem>
									))}
								</List>
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>

			{/* Additional Features */}
			{/* <Box sx={{ mt: 4 }}>
				<Typography
					variant='h6'
					sx={{
						fontWeight: 600,
						mb: 2,
					}}>
					Additional Features
				</Typography>

				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					{additionalFeatures.map((feature, index) => (
						<Chip
							key={index}
							label={feature}
							icon={<Star sx={{ fontSize: 16 }} />}
							sx={{
								'backgroundColor': '#E8F5E8',
								'color': theme.textColor?.greenPrimary?.main || '#4CAF50',
								'fontSize': '0.8rem',
								'& .MuiChip-icon': {
									color: theme.textColor?.greenPrimary?.main || '#4CAF50',
								},
							}}
						/>
					))}
				</Box>
			</Box> */}

			{/* Yearly Savings Highlight */}
			{subscriptionType === 'yearly' && (
				<Box
					sx={{
						mt: 4,
						p: 3,
						backgroundColor: '#E8F5E8',
						borderRadius: 2,
						textAlign: 'center',
						border: `2px solid ${theme.textColor?.greenPrimary?.main || '#4CAF50'}`,
					}}>
					<Typography
						variant='h6'
						sx={{
							fontWeight: 600,
							color: theme.textColor?.greenPrimary?.main || '#4CAF50',
							fontFamily: theme.fontFamily?.main,
						}}>
						🎉 Save More with Yearly Subscription!
					</Typography>
					<Typography
						variant='body2'
						sx={{
							mt: 1,
						}}>
						Get 2 months free when you subscribe yearly
					</Typography>
				</Box>
			)}
		</Box>
	);
};

export default SubscriptionBenefits;
