import { Box, Typography, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useContext, useState, useMemo } from 'react';
import { ConsultationSlot } from '../../interfaces/consultation';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

const locales = {
	'en-US': enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

interface ConsultationSlotsCalendarProps {
	slots: ConsultationSlot[];
	onSlotClick?: (slot: ConsultationSlot) => void;
}

const ConsultationSlotsCalendar = ({ slots, onSlotClick }: ConsultationSlotsCalendarProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [currentView, setCurrentView] = useState<View>('month');

	const calendarEvents = useMemo(() => {
		return slots.map((slot) => {
			const start = new Date(slot.slotStart);
			const end = new Date(new Date(slot.slotStart).getTime() + (slot.duration ?? 60) * 60000);

			const isBooked = !!slot.appointmentRef;
			const appointmentInfo =
				slot.appointmentRef && typeof slot.appointmentRef === 'object'
					? slot.appointmentRef
					: null;

			return {
				id: slot._id,
				title: isBooked
					? `Booked${appointmentInfo?.guestName ? `: ${appointmentInfo.guestName}` : ''}`
					: 'Available',
				start,
				end,
				resource: slot,
				isBooked,
			};
		});
	}, [slots]);

	const eventStyleGetter = (event: any) => {
		const isBooked = event.isBooked;
		return {
			style: {
				backgroundColor: isBooked ? theme.palette.grey[400] : theme.palette.success.main,
				borderColor: isBooked ? theme.palette.grey[500] : theme.palette.success.dark,
				color: 'white',
				borderRadius: '0.25rem',
				opacity: 0.9,
				border: 'none',
				padding: '0.25rem',
				fontSize: isMobileSize ? '0.7rem' : '0.75rem',
			},
		};
	};

	const handleSelectEvent = (event: any) => {
		if (onSlotClick && event.resource) {
			// Allow opening the edit dialog for both available and booked slots
			onSlotClick(event.resource);
		}
	};

	const handleViewChange = (view: View) => {
		setCurrentView(view);
	};

	return (
		<Box
			sx={{
				backgroundColor: theme.bgColor?.common,
				borderRadius: '0.75rem',
				padding: isMobileSize ? '1rem' : '1.25rem',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
				mb: '2rem',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
					Calendar View
				</Typography>
				<FormControl size='small' sx={{ minWidth: 120 }}>
					<Select
						value={currentView}
						onChange={(e: SelectChangeEvent) => handleViewChange(e.target.value as View)}
						sx={{
							backgroundColor: theme.bgColor?.common,
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
						}}>
						<MenuItem value='month' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Month
						</MenuItem>
						<MenuItem value='week' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Week
						</MenuItem>
						<MenuItem value='day' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Day
						</MenuItem>
						<MenuItem value='agenda' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Agenda
						</MenuItem>
					</Select>
				</FormControl>
			</Box>

			<Box sx={{ display: 'flex', gap: '1rem', mb: '1rem', alignItems: 'center' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<Box
						sx={{
							width: '1rem',
							height: '1rem',
							backgroundColor: theme.palette.success.main,
							borderRadius: '0.25rem',
						}}
					/>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
						Available
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<Box
						sx={{
							width: '1rem',
							height: '1rem',
							backgroundColor: theme.palette.grey[400],
							borderRadius: '0.25rem',
						}}
					/>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
						Booked
					</Typography>
				</Box>
			</Box>

			<style>
				{`
					.rbc-toolbar button {
						font-size: ${isMobileSize ? '0.75rem' : '0.85rem'};
					}
					.rbc-toolbar-label {
						font-size: ${isMobileSize ? '0.8rem' : '0.9rem'};
					}
					.rbc-event {
						font-size: ${isMobileSize ? '0.7rem' : '0.75rem'};
					}
					.rbc-header {
						font-size: ${isMobileSize ? '0.7rem' : '0.8rem'};
					}
				`}
			</style>
			<Calendar
				localizer={localizer}
				events={calendarEvents}
				startAccessor='start'
				endAccessor='end'
				style={{
					height: isMobileSizeSmall ? '50vh' : isMobileSize ? '60vh' : '70vh',
					fontSize: isMobileSizeSmall ? '0.7rem' : '0.8rem',
					backgroundColor: '#fff',
					padding: '0.5rem',
					borderRadius: '0.5rem',
					border: `1px solid ${theme.palette.divider}`,
				}}
				eventPropGetter={eventStyleGetter}
				onSelectEvent={handleSelectEvent}
				view={currentView}
				onView={handleViewChange}
				defaultView='month'
			/>
		</Box>
	);
};

export default ConsultationSlotsCalendar;
