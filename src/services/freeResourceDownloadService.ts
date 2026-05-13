import axios from '@utils/axiosInstance';

export type RequestFreeResourceEmailParams = {
	orgId: string;
	documentId: string;
	email: string;
	currency: string;
	marketingOptIn: boolean;
};

export async function requestFreeResourceEmail(params: RequestFreeResourceEmailParams): Promise<{ message: string }> {
	const { orgId, documentId, email, currency, marketingOptIn } = params;
	const { data } = await axios.post<{ status: number; message: string }>(
		`documents/landing/${orgId}/${documentId}/request-free-email`,
		{ email, currency, marketingOptIn },
	);
	return { message: data.message || 'Tamamlandı.' };
}
