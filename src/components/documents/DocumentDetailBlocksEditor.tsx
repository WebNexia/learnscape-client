import { Box, Button, IconButton, Typography, Tooltip } from '@mui/material';
import { ArrowDownward, ArrowUpward, Delete, PostAdd, Image as ImageIcon, FormatListBulleted, Campaign } from '@mui/icons-material';
import { Document, DocumentDetailBlock } from '../../interfaces/document';
import {
	MAX_DOCUMENT_DETAIL_BLOCKS,
	MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH,
	MAX_DOCUMENT_DETAIL_SECTION_BODY_LENGTH,
	MAX_DOCUMENT_DETAIL_BULLET_ITEMS,
	MAX_DOCUMENT_DETAIL_BULLET_ITEM_LENGTH,
	MAX_DOCUMENT_DETAIL_CTA_LENGTH,
	MAX_DOCUMENT_DETAIL_CAPTION_LENGTH,
} from '../../constants/documentDetailBlocksLimits';
import LandingPageSectionBodyEditor from '../adminSingleCourse/LandingPageSectionBodyEditor';
import CustomTextField from '../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../forms/uploadImageVideoDocument/ImageThumbnail';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';
import { documentEditorScope } from '../../utils/editorImageScopes';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

type Props = {
	document: Document;
	setDocument: (doc: Document | null) => void;
	onDeleteImageFromStorage?: (urls: string[]) => void | Promise<void>;
};

const emptySection = (): DocumentDetailBlock => ({
	type: 'section',
	title: '',
	body: '',
	rowKey: generateUniqueId('ddsec_'),
});

const emptyImage = (): DocumentDetailBlock => ({
	type: 'image',
	imageUrl: '',
	caption: '',
	rowKey: generateUniqueId('ddimg_'),
});

const emptyBullets = (): DocumentDetailBlock => ({
	type: 'bullets',
	title: '',
	items: [''],
	rowKey: generateUniqueId('ddbul_'),
});

const emptyCta = (): DocumentDetailBlock => ({
	type: 'cta',
	body: '',
	rowKey: generateUniqueId('ddcta_'),
});

function ensureRowKeys(blocks: DocumentDetailBlock[]): DocumentDetailBlock[] {
	return blocks.map((b) => (b.rowKey ? b : { ...b, rowKey: generateUniqueId('ddblk_') }));
}

/** Map legacy intro fields into blocks when detailBlocks is empty (edit UX only). */
export function hydrateDetailBlocksFromLegacy(doc: Document): DocumentDetailBlock[] {
	if (Array.isArray(doc.detailBlocks) && doc.detailBlocks.length > 0) {
		return ensureRowKeys(doc.detailBlocks);
	}
	const blocks: DocumentDetailBlock[] = [];
	const intro = (doc.detailIntroText || '').trim();
	if (intro) {
		blocks.push({
			type: 'section',
			title: 'Hakkında',
			body: `<p>${intro.replace(/\n/g, '<br/>')}</p>`,
			rowKey: generateUniqueId('ddlegacy_'),
		});
	}
	for (const url of doc.detailImageUrls || []) {
		if (url?.trim()) {
			blocks.push({
				type: 'image',
				imageUrl: url.trim(),
				caption: '',
				rowKey: generateUniqueId('ddlegacyimg_'),
			});
		}
	}
	return blocks;
}

const DocumentDetailBlocksEditor = ({ document, setDocument, onDeleteImageFromStorage }: Props) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const blocks = ensureRowKeys(document.detailBlocks || []);
	const [enterImageUrlByKey, setEnterImageUrlByKey] = useState<Record<string, boolean>>({});

	const updateBlocks = (next: DocumentDetailBlock[]) => {
		setDocument({ ...document, detailBlocks: next });
	};

	const moveBlock = (index: number, dir: -1 | 1) => {
		const target = index + dir;
		if (target < 0 || target >= blocks.length) return;
		const next = [...blocks];
		[next[index], next[target]] = [next[target], next[index]];
		updateBlocks(next);
	};

	const removeBlock = async (index: number) => {
		const block = blocks[index];
		if (block.type === 'image' && block.imageUrl) {
			try {
				await onDeleteImageFromStorage?.([block.imageUrl]);
			} catch {
				/* ignore */
			}
		}
		updateBlocks(blocks.filter((_, i) => i !== index));
	};

	const addBlock = (factory: () => DocumentDetailBlock) => {
		if (blocks.length >= MAX_DOCUMENT_DETAIL_BLOCKS) return;
		updateBlocks([...blocks, factory()]);
	};

	const patchBlock = (index: number, patch: DocumentDetailBlock) => {
		const next = [...blocks];
		next[index] = patch;
		updateBlocks(next);
	};

	return (
		<Box sx={{ width: '100%', margin: isMobileSize ? '1rem 0' : '1rem' }}>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
					Detail page content ({blocks.length}/{MAX_DOCUMENT_DETAIL_BLOCKS})
				</Typography>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					<Button
						size='small'
						variant='outlined'
						startIcon={<PostAdd />}
						disabled={blocks.length >= MAX_DOCUMENT_DETAIL_BLOCKS}
						onClick={() => addBlock(emptySection)}>
						Section
					</Button>
					<Button
						size='small'
						variant='outlined'
						startIcon={<ImageIcon />}
						disabled={blocks.length >= MAX_DOCUMENT_DETAIL_BLOCKS}
						onClick={() => addBlock(emptyImage)}>
						Image
					</Button>
					<Button
						size='small'
						variant='outlined'
						startIcon={<FormatListBulleted />}
						disabled={blocks.length >= MAX_DOCUMENT_DETAIL_BLOCKS}
						onClick={() => addBlock(emptyBullets)}>
						List
					</Button>
					<Button
						size='small'
						variant='outlined'
						startIcon={<Campaign />}
						disabled={blocks.length >= MAX_DOCUMENT_DETAIL_BLOCKS}
						onClick={() => addBlock(emptyCta)}>
						CTA
					</Button>
				</Box>
			</Box>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
				Build the book intro page in order. Place images between text sections. Section body uses rich text (TinyMCE).
			</Typography>

			{blocks.map((block, index) => {
				const key = block.rowKey || `blk-${index}`;
				return (
					<Box
						key={key}
						sx={{
							mb: '1.25rem',
							pb: '1.25rem',
							borderBottom: index < blocks.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
							<Typography variant='subtitle2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.875rem', textTransform: 'capitalize' }}>
								{index + 1}. {block.type}
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Tooltip title='Move up'>
									<span>
										<IconButton size='small' disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label='Move block up'>
											<ArrowUpward fontSize='small' />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title='Move down'>
									<span>
										<IconButton
											size='small'
											disabled={index === blocks.length - 1}
											onClick={() => moveBlock(index, 1)}
											aria-label='Move block down'>
											<ArrowDownward fontSize='small' />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title='Remove block'>
									<IconButton size='small' onClick={() => removeBlock(index)} aria-label='Remove block'>
										<Delete fontSize='small' />
									</IconButton>
								</Tooltip>
							</Box>
						</Box>

						{block.type === 'section' && (
							<>
								<CustomTextField
									fullWidth
									label='Section title'
									value={block.title}
									onChange={(e) => {
										const v = e.target.value.slice(0, MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH);
										patchBlock(index, { ...block, title: v });
									}}
									InputProps={{ inputProps: { maxLength: MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH } }}
									sx={{ mb: '0.5rem', backgroundColor: '#fff' }}
								/>
								<Typography sx={{ fontSize: '0.7rem', textAlign: 'right', mb: 0.5 }}>
									{block.title.length}/{MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH}
								</Typography>
								<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
									Section body (rich text)
								</Typography>
								<LandingPageSectionBodyEditor
									key={key}
									editorId={`doc-detail-section-${key}`}
									maxLength={MAX_DOCUMENT_DETAIL_SECTION_BODY_LENGTH}
									imageScopedEntityId={document._id ? documentEditorScope(document._id) : undefined}
									seedHtml={block.body ?? ''}
									onHtmlChange={(trimmed) => patchBlock(index, { ...block, body: trimmed })}
								/>
								{!document._id && (
									<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
										Inline images in the editor are available after the document is saved (edit mode).
									</Typography>
								)}
							</>
						)}

						{block.type === 'image' && (
							<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row', gap: 2, alignItems: 'flex-start' }}>
								<Box sx={{ flex: 1, width: '100%' }}>
									<HandleImageUploadURL
										label='Detail image'
										onImageUploadLogic={(url) => patchBlock(index, { ...block, imageUrl: url })}
										onChangeImgUrl={(e) => patchBlock(index, { ...block, imageUrl: e.target.value })}
										imageUrlValue={block.imageUrl || ''}
										imageFolderName='DocumentDetailImages'
										scopedEntityId={document._id}
										enterImageUrl={enterImageUrlByKey[key] ?? true}
										setEnterImageUrl={(val) =>
											setEnterImageUrlByKey((prev) => ({
												...prev,
												[key]: typeof val === 'function' ? val(prev[key] ?? true) : val,
											}))
										}
									/>
									<CustomTextField
										fullWidth
										label='Caption (optional)'
										value={block.caption || ''}
										onChange={(e) =>
											patchBlock(index, {
												...block,
												caption: e.target.value.slice(0, MAX_DOCUMENT_DETAIL_CAPTION_LENGTH),
											})
										}
										sx={{ mt: 1, backgroundColor: '#fff' }}
										InputProps={{ inputProps: { maxLength: MAX_DOCUMENT_DETAIL_CAPTION_LENGTH } }}
									/>
								</Box>
								<ImageThumbnail
									imgSource={block.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Detail+Image'}
									removeImage={async () => {
										if (block.imageUrl) {
											try {
												await onDeleteImageFromStorage?.([block.imageUrl]);
											} catch {
												/* ignore */
											}
										}
										patchBlock(index, { ...block, imageUrl: '' });
									}}
									boxStyle={{ width: '8rem', height: '8rem' }}
									imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
								/>
							</Box>
						)}

						{block.type === 'bullets' && (
							<>
								<CustomTextField
									fullWidth
									label='List title'
									value={block.title}
									onChange={(e) =>
										patchBlock(index, {
											...block,
											title: e.target.value.slice(0, MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH),
										})
									}
									sx={{ mb: 1, backgroundColor: '#fff' }}
									InputProps={{ inputProps: { maxLength: MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH } }}
								/>
								{(block.items || []).map((item, itemIndex) => (
									<Box key={`${key}-item-${itemIndex}`} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
										<CustomTextField
											fullWidth
											label={`Item ${itemIndex + 1}`}
											value={item}
											onChange={(e) => {
												const items = [...(block.items || [])];
												items[itemIndex] = e.target.value.slice(0, MAX_DOCUMENT_DETAIL_BULLET_ITEM_LENGTH);
												patchBlock(index, { ...block, items });
											}}
											sx={{ backgroundColor: '#fff' }}
											InputProps={{ inputProps: { maxLength: MAX_DOCUMENT_DETAIL_BULLET_ITEM_LENGTH } }}
										/>
										<IconButton
											size='small'
											disabled={(block.items || []).length <= 1}
											onClick={() => {
												const items = (block.items || []).filter((_, i) => i !== itemIndex);
												patchBlock(index, { ...block, items: items.length ? items : [''] });
											}}>
											<Delete fontSize='small' />
										</IconButton>
									</Box>
								))}
								<Button
									size='small'
									disabled={(block.items || []).length >= MAX_DOCUMENT_DETAIL_BULLET_ITEMS}
									onClick={() => patchBlock(index, { ...block, items: [...(block.items || []), ''] })}>
									Add item
								</Button>
							</>
						)}

						{block.type === 'cta' && (
							<>
								<CustomTextField
									fullWidth
									label='Closing CTA text'
									value={block.body}
									onChange={(e) =>
										patchBlock(index, {
											...block,
											body: e.target.value.slice(0, MAX_DOCUMENT_DETAIL_CTA_LENGTH),
										})
									}
									multiline
									rows={2}
									sx={{ backgroundColor: '#fff' }}
									InputProps={{ inputProps: { maxLength: MAX_DOCUMENT_DETAIL_CTA_LENGTH } }}
								/>
								<Typography sx={{ fontSize: '0.7rem', textAlign: 'right', mt: 0.5 }}>
									{block.body.length}/{MAX_DOCUMENT_DETAIL_CTA_LENGTH}
								</Typography>
							</>
						)}
					</Box>
				);
			}			)}
		</Box>
	);
};

export default DocumentDetailBlocksEditor;
