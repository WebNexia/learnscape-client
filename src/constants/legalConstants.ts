export const LEGAL_LAST_UPDATED = '2026-07-01';

export const COMPANY_NAME = 'NEXTEDU LTD';
export const COMPANY_NUMBER = '16823566';
export const COMPANY_ADDRESS = '124 City Road, London EC1V 2NX, England';
export const COMPANY_SIC = '85590';
export const COMPANY_BRAND = 'Aden Academy';

export const COMPANY_REGISTRATION_EN = `Registered in England & Wales | Company No. ${COMPANY_NUMBER} | SIC: ${COMPANY_SIC}`;
export const COMPANY_REGISTRATION_TR = `İngiltere ve Galler'de kayıtlı | Şirket No: ${COMPANY_NUMBER} | SIC: ${COMPANY_SIC}`;

export function formatLegalLastUpdated(locale: 'tr' | 'en'): string {
	return new Date(LEGAL_LAST_UPDATED).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}
