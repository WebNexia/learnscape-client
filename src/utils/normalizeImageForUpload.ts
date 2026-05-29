const MAX_DIMENSION = 2048;
const DISPLAYABLE_TYPES = /^image\/(jpeg|jpg|png|webp)$/i;

function loadViaImageElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Could not load image'));
		};
		img.src = url;
	});
}

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; cleanup?: () => void }> {
	if (typeof createImageBitmap === 'function') {
		try {
			const bitmap = await createImageBitmap(file);
			return { source: bitmap, cleanup: () => bitmap.close() };
		} catch {
			// Fall back to Image element (some mobile browsers handle HEIC here)
		}
	}

	const img = await loadViaImageElement(file);
	return { source: img };
}

/**
 * Converts HEIC/large mobile photos to a JPEG under the size limit so preview + upload work reliably.
 */
export async function normalizeImageForUpload(file: File, maxSizeInMB: number): Promise<File> {
	const maxBytes = maxSizeInMB * 1024 * 1024;

	if (DISPLAYABLE_TYPES.test(file.type) && file.size <= maxBytes) {
		return file;
	}

	const { source, cleanup } = await loadImageSource(file);

	try {
		let width = 0;
		let height = 0;

		if (source instanceof ImageBitmap) {
			width = source.width;
			height = source.height;
		} else {
			const img = source as HTMLImageElement;
			width = img.naturalWidth;
			height = img.naturalHeight;
		}

		const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
		const targetWidth = Math.max(1, Math.round(width * scale));
		const targetHeight = Math.max(1, Math.round(height * scale));

		const canvas = document.createElement('canvas');
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not prepare image');
		}

		ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

		let quality = 0.9;
		let blob: Blob | null = null;

		while (quality >= 0.45) {
			blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
			if (!blob) {
				throw new Error('Could not prepare image');
			}
			if (blob.size <= maxBytes) {
				break;
			}
			quality -= 0.1;
		}

		if (!blob || blob.size > maxBytes) {
			throw new Error(`Image must be under ${maxSizeInMB} MB`);
		}

		const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
		return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
	} finally {
		cleanup?.();
	}
}
