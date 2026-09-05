import { useContext, useMemo, useState } from 'react';
import {
	Avatar,
	Box,
	Chip,
	CircularProgress,
	Divider,
	FormControlLabel,
	LinearProgress,
	Switch,
	Typography,
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
	Devices,
	Language,
	PeopleAltOutlined,
	QueryStats,
	Speed,
	TravelExplore,
	Visibility,
} from '@mui/icons-material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { AnalyticsRangeKey, useSiteAnalytics } from '../hooks/useSiteAnalytics';
import theme from '../themes';

Chart.register(...registerables);

const RANGES: { key: AnalyticsRangeKey; label: string }[] = [
	{ key: '24h', label: 'Last 24 hours' },
	{ key: '7d', label: 'Last 7 days' },
	{ key: '30d', label: 'Last 30 days' },
	{ key: '90d', label: 'Last 90 days' },
];

const SOURCE_COLORS: Record<string, string> = {
	direct: '#01435A',
	organic: '#1EC28B',
	referral: '#3B82F6',
	social: '#8B5CF6',
	campaign: '#F59E0B',
};

const DEVICE_COLORS: Record<string, string> = {
	desktop: '#01435A',
	mobile: '#1EC28B',
	tablet: '#3B82F6',
};

function countryFlag(code?: string) {
	if (!code || code.length !== 2) return '🌍';
	return code
		.toUpperCase()
		.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function formatNumber(value?: number) {
	return new Intl.NumberFormat('en-GB').format(value || 0);
}

function formatDuration(seconds?: number) {
	const total = Math.max(0, seconds || 0);
	if (total < 60) return `${total}s`;
	const minutes = Math.floor(total / 60);
	const rest = total % 60;
	if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h ${minutes % 60}m`;
}

function formatDateTime(value?: string) {
	if (!value) return '';
	const date = new Date(value);
	return date.toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function titleCase(value?: string) {
	if (!value) return 'Unknown';
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function visitorName(session: { username?: string; userRole?: string; city?: string; country?: string }) {
	if (session.username) return session.username;
	if (session.city && session.country) return `Visitor from ${session.city}`;
	if (session.country) return `Visitor from ${session.country}`;
	return 'Anonymous visitor';
}

function sourceLabel(source?: string) {
	if (source === 'organic') return 'Organic Search';
	if (source === 'referral') return 'Referral';
	if (source === 'social') return 'Social';
	if (source === 'campaign') return 'Campaign';
	return 'Direct';
}

const cardSx = {
	backgroundColor: '#fff',
	borderRadius: '1rem',
	border: '1px solid #E2E8F0',
	boxShadow: '0 10px 30px rgba(1, 67, 90, 0.06)',
	p: { xs: '1rem', md: '1.25rem' },
	height: '100%',
};

const AdminSiteAnalytics = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [range, setRange] = useState<AnalyticsRangeKey>('7d');
	const [excludeStaff, setExcludeStaff] = useState(true);
	const { data, isLoading, isFetching, error } = useSiteAnalytics(range, excludeStaff);

	const kpis = data?.kpis;
	const maxPageViews = Math.max(...(data?.topPages.map((page) => page.views) || [1]), 1);
	const maxCountryViews = Math.max(...(data?.countries.map((country) => country.views) || [1]), 1);

	const timelineChart = useMemo(
		() => ({
			labels: data?.timeline.map((point) => point.label.replace(`${new Date().getFullYear()}-`, '')) || [],
			datasets: [
				{
					label: 'Page views',
					data: data?.timeline.map((point) => point.views) || [],
					borderColor: '#01435A',
					backgroundColor: 'rgba(1, 67, 90, 0.12)',
					fill: true,
					tension: 0.35,
					pointRadius: 2,
					borderWidth: 2,
				},
				{
					label: 'Visitors',
					data: data?.timeline.map((point) => point.visitors) || [],
					borderColor: '#1EC28B',
					backgroundColor: 'rgba(30, 194, 139, 0.08)',
					fill: true,
					tension: 0.35,
					pointRadius: 2,
					borderWidth: 2,
				},
			],
		}),
		[data]
	);

	const deviceChart = useMemo(
		() => ({
			labels: data?.devices.map((item) => titleCase(item.name)) || [],
			datasets: [
				{
					data: data?.devices.map((item) => item.views) || [],
					backgroundColor: data?.devices.map((item) => DEVICE_COLORS[item.name] || '#94A3B8') || [],
					borderWidth: 0,
				},
			],
		}),
		[data]
	);

	const sourceChart = useMemo(
		() => ({
			labels: data?.sources.map((item) => item.name) || [],
			datasets: [
				{
					data: data?.sources.map((item) => item.views) || [],
					backgroundColor: data?.sources.map((item) => SOURCE_COLORS[item.key] || '#94A3B8') || [],
					borderWidth: 0,
				},
			],
		}),
		[data]
	);

	const kpiItems = [
		{ label: 'Unique visitors', value: formatNumber(kpis?.uniqueVisitors), hint: `${formatNumber(kpis?.newVisitors)} new`, icon: PeopleAltOutlined, color: '#01435A' },
		{ label: 'Page views', value: formatNumber(kpis?.pageViews), hint: `${kpis?.avgPagesPerSession || 0} per session`, icon: Visibility, color: '#1EC28B' },
		{ label: 'Sessions', value: formatNumber(kpis?.sessions), hint: `${formatDuration(kpis?.avgSessionSeconds)} avg`, icon: QueryStats, color: '#3B82F6' },
		{ label: 'Bounce rate', value: `${kpis?.bounceRate || 0}%`, hint: `${formatNumber(kpis?.returningVisitors)} returning`, icon: Speed, color: '#F59E0B' },
	];

	return (
		<AdminPageErrorBoundary pageName='Analytics'>
			<DashboardPagesLayout pageName='Analytics' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', p: isMobileSize ? '1rem' : '1.5rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobileSize ? 'stretch' : 'center', flexDirection: isMobileSize ? 'column' : 'row', gap: 1.5 }}>
						<Box>
							<Typography sx={{ fontSize: isMobileSize ? '1.15rem' : '1.5rem', fontWeight: 700, color: '#0F172A' }}>
								Website Analytics
							</Typography>
							<Typography sx={{ color: '#64748B', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mt: 0.25 }}>
								Who visited, where they came from, and which pages they viewed.
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							{RANGES.map((item) => (
								<Chip
									key={item.key}
									label={item.label}
									onClick={() => setRange(item.key)}
									sx={{
										backgroundColor: range === item.key ? '#01435A' : '#F8FAFC',
										color: range === item.key ? '#fff' : '#334155',
										fontWeight: 600,
										fontSize: isMobileSize ? '0.7rem' : '0.8rem',
										border: range === item.key ? 'none' : '1px solid #E2E8F0',
										'&:hover': { backgroundColor: range === item.key ? '#01384b' : '#EEF2F6' },
									}}
								/>
							))}
							<FormControlLabel
								control={<Switch size='small' checked={excludeStaff} onChange={(event) => setExcludeStaff(event.target.checked)} />}
								label='Hide staff'
								sx={{ ml: 0.5, '& .MuiFormControlLabel-label': { fontSize: '0.8rem', color: '#475569' } }}
							/>
						</Box>
					</Box>

					{error ? (
						<Box sx={{ ...cardSx, py: 6, textAlign: 'center' }}>
							<Typography sx={{ color: theme.textColor?.error.main }}>Could not load analytics. Please try again.</Typography>
						</Box>
					) : isLoading && !data ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
							<CircularProgress />
						</Box>
					) : (
						<>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, opacity: isFetching ? 0.85 : 1 }}>
								{kpiItems.map((item) => (
									<Box key={item.label} sx={{ ...cardSx, display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
										<Box sx={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: `${item.color}14`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
											<item.icon fontSize='small' />
										</Box>
										<Box>
											<Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{item.label}</Typography>
											<Typography sx={{ fontSize: isMobileSize ? '1.25rem' : '1.6rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
												{item.value}
											</Typography>
											<Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.hint}</Typography>
										</Box>
									</Box>
								))}
							</Box>

							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 1.5 }}>
								<Box sx={cardSx}>
									<Typography sx={{ fontWeight: 700, mb: 2 }}>Traffic over time</Typography>
									<Box sx={{ height: isMobileSize ? 220 : 280 }}>
										<Line
											data={timelineChart}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												plugins: { legend: { display: true, position: 'top' } },
												scales: {
													x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 11 } } },
													y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#F1F5F9' } },
												},
											}}
										/>
									</Box>
								</Box>
								<Box sx={cardSx}>
									<Typography sx={{ fontWeight: 700, mb: 2 }}>Devices</Typography>
									<Box sx={{ height: 180, display: 'flex', justifyContent: 'center' }}>
										{data?.devices?.length ? (
											<Doughnut
												data={deviceChart}
												options={{
													responsive: true,
													maintainAspectRatio: false,
													cutout: '68%',
													plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
												}}
											/>
										) : (
											<Typography sx={{ color: '#94A3B8', alignSelf: 'center' }}>No device data yet</Typography>
										)}
									</Box>
									<Divider sx={{ my: 2 }} />
									<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Traffic sources</Typography>
									<Box sx={{ height: 150, display: 'flex', justifyContent: 'center' }}>
										{data?.sources?.length ? (
											<Doughnut
												data={sourceChart}
												options={{
													responsive: true,
													maintainAspectRatio: false,
													cutout: '65%',
													plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
												}}
											/>
										) : (
											<Typography sx={{ color: '#94A3B8', alignSelf: 'center' }}>No source data yet</Typography>
										)}
									</Box>
								</Box>
							</Box>

							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 1.5 }}>
								<Box sx={cardSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
										<Visibility fontSize='small' sx={{ color: '#01435A' }} />
										<Typography sx={{ fontWeight: 700 }}>Top pages</Typography>
									</Box>
									{data?.topPages?.length ? (
										data.topPages.map((page) => (
											<Box key={page.path} sx={{ mb: 1.4 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
													<Box sx={{ minWidth: 0 }}>
														<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{page.label}</Typography>
														<Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{page.path}
														</Typography>
													</Box>
													<Typography sx={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
														{formatNumber(page.views)} views
													</Typography>
												</Box>
												<LinearProgress
													variant='determinate'
													value={(page.views / maxPageViews) * 100}
													sx={{ height: 7, borderRadius: 99, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#01435A', borderRadius: 99 } }}
												/>
											</Box>
										))
									) : (
										<Typography sx={{ color: '#94A3B8' }}>No page views yet.</Typography>
									)}
								</Box>

								<Box sx={cardSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
										<Language fontSize='small' sx={{ color: '#01435A' }} />
										<Typography sx={{ fontWeight: 700 }}>Where visitors came from</Typography>
									</Box>
									{data?.countries?.length ? (
										data.countries.map((country) => (
											<Box key={`${country.countryCode}-${country.country}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
												<Typography sx={{ fontSize: '1.1rem', width: 28 }}>{countryFlag(country.countryCode)}</Typography>
												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
														<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{country.country || 'Unknown'}</Typography>
														<Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{formatNumber(country.visitors)} visitors</Typography>
													</Box>
													<LinearProgress
														variant='determinate'
														value={(country.views / maxCountryViews) * 100}
														sx={{ height: 6, borderRadius: 99, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#1EC28B', borderRadius: 99 } }}
													/>
												</Box>
											</Box>
										))
									) : (
										<Typography sx={{ color: '#94A3B8' }}>No location data yet.</Typography>
									)}
									{!!data?.cities?.length && (
										<>
											<Divider sx={{ my: 1.5 }} />
											<Typography sx={{ fontWeight: 700, mb: 1, fontSize: '0.9rem' }}>Top cities</Typography>
											{data.cities.map((city) => (
												<Box key={`${city.city}-${city.countryCode}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.45 }}>
													<Typography sx={{ fontSize: '0.82rem' }}>
														{countryFlag(city.countryCode)} {city.city}
													</Typography>
													<Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{formatNumber(city.views)}</Typography>
												</Box>
											))}
										</>
									)}
								</Box>
							</Box>

							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
								<Box sx={cardSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
										<TravelExplore fontSize='small' sx={{ color: '#01435A' }} />
										<Typography sx={{ fontWeight: 700 }}>Referrers</Typography>
									</Box>
									{data?.referrers?.length ? (
										data.referrers.map((item) => (
											<Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.7, borderBottom: '1px solid #F1F5F9' }}>
												<Typography sx={{ fontSize: '0.85rem' }}>{item.name}</Typography>
												<Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>{formatNumber(item.views)} views</Typography>
											</Box>
										))
									) : (
										<Typography sx={{ color: '#94A3B8' }}>Most visits are arriving directly for now.</Typography>
									)}
									{!!data?.campaigns?.length && (
										<>
											<Typography sx={{ fontWeight: 700, mt: 2, mb: 1, fontSize: '0.9rem' }}>Campaigns</Typography>
											{data.campaigns.map((campaign, index) => (
												<Box key={`${campaign.source}-${campaign.campaign}-${index}`} sx={{ py: 0.7, borderBottom: '1px solid #F1F5F9' }}>
													<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{campaign.campaign || campaign.source}</Typography>
													<Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
														{campaign.source}
														{campaign.medium ? ` / ${campaign.medium}` : ''} · {formatNumber(campaign.views)} views
													</Typography>
												</Box>
											))}
										</>
									)}
								</Box>
								<Box sx={cardSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
										<Devices fontSize='small' sx={{ color: '#01435A' }} />
										<Typography sx={{ fontWeight: 700 }}>Browsers</Typography>
									</Box>
									{data?.browsers?.length ? (
										data.browsers.map((item) => (
											<Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
												<Typography sx={{ fontSize: '0.85rem' }}>{item.name}</Typography>
												<Chip size='small' label={`${formatNumber(item.views)} views`} sx={{ backgroundColor: '#F8FAFC', fontSize: '0.7rem' }} />
											</Box>
										))
									) : (
										<Typography sx={{ color: '#94A3B8' }}>No browser data yet.</Typography>
									)}
								</Box>
							</Box>

							<Box sx={cardSx}>
								<Typography sx={{ fontWeight: 700, mb: 0.5 }}>Recent visitor journeys</Typography>
								<Typography sx={{ color: '#64748B', fontSize: '0.8rem', mb: 2 }}>
									Each row is a session: who they are, where they arrived from, and the pages they opened.
								</Typography>
								{data?.recentSessions?.length ? (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
										{data.recentSessions.map((session) => (
											<Box
												key={session.sessionId}
												sx={{
													border: '1px solid #E2E8F0',
													borderRadius: '0.9rem',
													p: isMobileSize ? '0.85rem' : '1rem',
													background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
												}}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexDirection: isMobileSize ? 'column' : 'row' }}>
													<Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
														<Avatar sx={{ bgcolor: session.username ? '#01435A' : '#94A3B8', width: 40, height: 40, fontSize: '0.9rem' }}>
															{(session.username || session.countryCode || 'A').slice(0, 1).toUpperCase()}
														</Avatar>
														<Box sx={{ minWidth: 0 }}>
															<Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{visitorName(session)}</Typography>
															<Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
																{countryFlag(session.countryCode)} {session.city ? `${session.city}, ` : ''}
																{session.country || 'Unknown location'}
																{session.userRole ? ` · ${session.userRole}` : ' · Guest'}
															</Typography>
														</Box>
													</Box>
													<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
														<Chip size='small' label={sourceLabel(session.source)} sx={{ backgroundColor: `${SOURCE_COLORS[session.source] || '#01435A'}18`, color: SOURCE_COLORS[session.source] || '#01435A', fontWeight: 600 }} />
														<Chip size='small' label={`${titleCase(session.deviceType)} · ${session.browser}`} sx={{ backgroundColor: '#F1F5F9' }} />
														<Chip size='small' label={`${session.pageCount} pages`} sx={{ backgroundColor: '#ECFDF5', color: '#047857' }} />
													</Box>
												</Box>
												<Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 1 }}>
													Entered via {session.landingLabel || session.landingPage}
													{session.referrerHost ? ` from ${session.referrerHost}` : session.utmSource ? ` via ${session.utmSource}` : ' (direct)'}
													{' · '}
													{formatDateTime(session.startedAt)}
												</Typography>
												<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
													{(session.pages || []).map((page, index) => (
														<Chip
															key={`${session.sessionId}-${page.path}-${index}`}
															size='small'
															label={`${index + 1}. ${page.label || page.path}`}
															sx={{ backgroundColor: '#EEF6F8', color: '#01435A', fontSize: '0.72rem' }}
														/>
													))}
												</Box>
											</Box>
										))}
									</Box>
								) : (
									<Box sx={{ py: 5, textAlign: 'center' }}>
										<Typography sx={{ fontWeight: 700, mb: 0.5 }}>No visits recorded yet</Typography>
										<Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
											Analytics starts as soon as someone opens a page. Cookieless measurement does not require optional cookies.
										</Typography>
									</Box>
								)}
							</Box>
						</>
					)}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminSiteAnalytics;
