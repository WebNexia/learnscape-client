import type { CheckoutCopyLocale } from './courseAccessCheckoutCopy';

export interface DocumentCheckoutCopy {
	needsWithdrawalWaiver: boolean;
	withdrawalWaiverLabel: string;
	waiverRequiredError: string;
}

export function getDocumentCheckoutCopy(locale: CheckoutCopyLocale = 'tr'): DocumentCheckoutCopy {
	if (locale === 'tr') {
		return {
			needsWithdrawalWaiver: true,
			withdrawalWaiverLabel:
				'Dijital kaynağa satın alma sonrası hemen erişim istiyorum. Hizmetin derhal başlayacağını biliyor ve 14 günlük cayma hakkımdan feragat ettiğimi kabul ediyorum.',
			waiverRequiredError: 'Lütfen dijital içeriğe hemen erişim ve cayma hakkından feragat onayını işaretleyin.',
		};
	}

	return {
		needsWithdrawalWaiver: true,
		withdrawalWaiverLabel:
			'I request immediate access to the digital resource after purchase. I understand that the service will begin straight away and I waive my 14-day right of withdrawal.',
		waiverRequiredError: 'Please confirm immediate access and waiver of your right of withdrawal.',
	};
}
