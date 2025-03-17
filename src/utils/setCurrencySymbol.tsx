export const setCurrencySymbol = (currency: string) => {
	if (currency?.toLowerCase() === 'usd') {
		return '$';
	} else if (currency?.toLowerCase() === 'gbp') {
		return '£';
	} else if (currency?.toLowerCase() === 'eur') {
		return '€';
	} else if (currency?.toLowerCase() === 'try') {
		return '₺';
	} else {
		return '';
	}
};
