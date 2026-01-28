import { ConsultationSlot } from '../interfaces/consultation';

export const exportSlotsToCSV = (slots: ConsultationSlot[], consultationTitle: string): void => {
	const headers = ['Date & Time', 'Duration (min)', 'Status', 'Consultants', 'Appointment Info'];
	const rows = slots.map((slot) => {
		const date = new Date(slot.slotStart);
		const dateTimeStr = date.toLocaleString();
		const duration = slot.duration || 30;
		const isBooked = !!slot.appointmentRef;
		const status = isBooked ? 'Booked' : 'Available';

		let consultants = 'Default';
		if (slot.availableConsultantIds && Array.isArray(slot.availableConsultantIds)) {
			if (slot.availableConsultantIds.length > 0) {
				const firstItem = slot.availableConsultantIds[0];
				if (typeof firstItem === 'object' && firstItem !== null) {
					consultants = slot.availableConsultantIds
						.map((c: any) => `${c.firstName} ${c.lastName}`)
						.join(', ');
				} else if (typeof firstItem === 'string') {
					consultants = 'Selected';
				}
			}
		}

		let appointmentInfo = '';
		if (isBooked && slot.appointmentRef && typeof slot.appointmentRef === 'object') {
			appointmentInfo = slot.appointmentRef.guestName || slot.appointmentRef.guestEmail || 'Guest';
		}

		return [dateTimeStr, duration.toString(), status, consultants, appointmentInfo];
	});

	const csvContent = [
		headers.join(','),
		...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', `${consultationTitle}_slots_${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
