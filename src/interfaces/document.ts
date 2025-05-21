export interface Document {
	_id: string;
	name: string;
	orgId: string;
	userId: string;
	documentUrl: string;
	createdAt: string;
	updatedAt: string;
	clonedFromId:string;
	clonedFromTitle:string;
	createdBy: string;
	updatedBy: string;
	createdByName:string;
	updatedByName:string;
	createdByImageUrl:string;
	updatedByImageUrl:string;
	createdByRole:string;
	updatedByRole:string;
}
