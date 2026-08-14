/** Keep in sync with learnscape-server-qa/constants/documentDetailBlocksLimits.js */
export const MAX_DOCUMENT_DETAIL_BLOCKS = 20;
export const MAX_DOCUMENT_DETAIL_SECTION_TITLE_LENGTH = 120;
export const MAX_DOCUMENT_DETAIL_SECTION_BODY_LENGTH = 15000;
export const MAX_DOCUMENT_DETAIL_BULLET_ITEMS = 20;
export const MAX_DOCUMENT_DETAIL_BULLET_ITEM_LENGTH = 300;
export const MAX_DOCUMENT_DETAIL_CTA_LENGTH = 500;
export const MAX_DOCUMENT_DETAIL_CAPTION_LENGTH = 200;
export const DOCUMENT_DETAIL_BLOCK_TYPES = ['section', 'image', 'bullets', 'cta'] as const;

export type DocumentDetailBlockType = (typeof DOCUMENT_DETAIL_BLOCK_TYPES)[number];
