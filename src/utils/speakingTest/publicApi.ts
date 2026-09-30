import type { SpeakingAnswerDraft } from './types';

const apiBase = () => String(import.meta.env.VITE_SERVER_BASE_URL || '').replace(/\/$/, '');

async function readError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as { message?: string } | null;
	return payload?.message || fallback;
}

function blobToBase64(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result || '');
			const comma = result.indexOf(',');
			resolve(comma >= 0 ? result.slice(comma + 1) : result);
		};
		reader.onerror = () => reject(reader.error || new Error('Kayıt okunamadı.'));
		reader.readAsDataURL(blob);
	});
}

export async function uploadSpeakingRecording(slug: string, questionId: string, kind: 'audio' | 'video', blob: Blob) {
	const response = await fetch(`${apiBase()}/speaking-test/campaigns/public/${encodeURIComponent(slug)}/recordings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			questionId,
			kind,
			data: await blobToBase64(blob),
			website: '',
		}),
	});
	const payload = (await response.json().catch(() => null)) as { data?: { url?: string }; message?: string } | null;
	if (!response.ok || !payload?.data?.url) {
		throw new Error(payload?.message || 'Kayıt yüklenemedi.');
	}
	return payload.data.url;
}

export async function discardSpeakingRecording(slug: string, url: string) {
	const response = await fetch(
		`${apiBase()}/speaking-test/campaigns/public/${encodeURIComponent(slug)}/recordings/discard`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url, website: '' }),
		},
	);
	if (!response.ok) {
		throw new Error(await readError(response, 'Önceki kayıt silinemedi.'));
	}
}

export async function submitSpeakingTest(slug: string, participant: { name: string; email: string; phone: string }, answers: SpeakingAnswerDraft[]) {
	const response = await fetch(
		`${apiBase()}/speaking-test/campaigns/public/${encodeURIComponent(slug)}/submissions`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...participant, answers, website: '' }),
		},
	);
	if (!response.ok) {
		throw new Error(await readError(response, 'Cevaplar kaydedilemedi.'));
	}
}
