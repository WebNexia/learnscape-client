export interface ResourceFolder {
	_id: string;
	name: string;
	orgId: string;
	createdBy: string;
	updatedBy?: string;
	createdAt: string;
	updatedAt: string;
	itemCount?: number; // Added by aggregation in getFolders
}

export interface ResourceItem {
	_id: string;
	folderId: string | ResourceFolder;
	type: 'file' | 'url' | 'video';
	title: string;
	url: string;
	orgId: string;
	createdBy: string;
	updatedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ResourceAccessInfo {
	canAccess: boolean;
	accessLevel: 'subscription' | 'full' | 'limited' | string;
	source: string;
	validUntil: string | null;
	reason: string | null;
}
