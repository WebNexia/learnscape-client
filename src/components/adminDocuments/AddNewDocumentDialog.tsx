import { Box, Checkbox, DialogContent, FormControlLabel, Link, Table, TableBody, TableCell, TableRow } from '@mui/material';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useContext, useEffect, useState } from 'react';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTableCell from '../layouts/table/CustomTableCell';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import { DocumentsContext } from '../../contexts/DocumentsContextProvider';
import { Document } from '../../interfaces/document';
import { truncateText } from '../../utils/utilText';
import { Lesson } from '../../interfaces/lessons';
import { SingleCourse } from '../../interfaces/course';

interface AddNewDocumentDialogProps {
	addNewDocumentModalOpen?: boolean;
	setAddNewDocumentModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	singleLessonBeforeSave: Lesson | undefined;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>> | undefined;
	fromAdminCourses?: boolean;
	singleCourse: SingleCourse | undefined;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>> | undefined;
}

const AddNewDocumentDialog = ({
	addNewDocumentModalOpen,
	setAddNewDocumentModalOpen,
	setSingleLessonBeforeSave,
	singleLessonBeforeSave,
	setIsLessonUpdated,
	fromAdminCourses,
	singleCourse,
	setSingleCourse,
}: AddNewDocumentDialogProps) => {
	const { sortDocumentsData, sortedDocumentsData, numberOfPages, documentsPageNumber, setDocumentsPageNumber } = useContext(DocumentsContext);
	const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
	const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Document>('name');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		if (addNewDocumentModalOpen) {
			setDocumentsPageNumber(1);
		}
	}, [addNewDocumentModalOpen, setDocumentsPageNumber]);

	const handleSort = (property: keyof Document) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortDocumentsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleCheckboxChange = (document: Document) => {
		const selectedIndex = selectedDocumentIds.indexOf(document._id);
		let newSelectedDocumentIds: string[] = [];
		let newSelectedDocuments: Document[] = [];

		if (selectedIndex === -1) {
			newSelectedDocumentIds = [...selectedDocumentIds, document._id];
			newSelectedDocuments = [...selectedDocuments, document];
		} else {
			newSelectedDocumentIds = selectedDocumentIds?.filter((id) => id !== document._id);
			newSelectedDocuments = selectedDocuments?.filter((selectedDocument) => selectedDocument._id !== document._id);
		}

		setSelectedDocumentIds(newSelectedDocumentIds);
		setSelectedDocuments(newSelectedDocuments);
	};
	const handleAddDocuments = () => {
		if (!fromAdminCourses) {
			if (setSingleLessonBeforeSave) {
				setSingleLessonBeforeSave((prevData) => {
					if (prevData) {
						return {
							...prevData,
							documents: [...selectedDocuments, ...prevData.documents],
							documentIds: [...selectedDocumentIds, ...prevData.documentIds],
						};
					}
					return prevData;
				});
			}
			if (setIsLessonUpdated) setIsLessonUpdated(true);
		} else {
			if (setSingleCourse) {
				setSingleCourse((prevData) => {
					if (prevData) {
						return {
							...prevData,
							documents: [...selectedDocuments, ...prevData.documents],
							documentIds: [...selectedDocumentIds, ...prevData.documentIds],
						};
					}
					return prevData;
				});
			}
		}

		// Close the dialog
		if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
	};

	const handleResetCheckboxes = () => {
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
	};

	const closeAddNewDocumentModalOpen = () => {
		if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
	};
	return (
		<CustomDialog openModal={addNewDocumentModalOpen} closeModal={closeAddNewDocumentModalOpen} title='Add New Document'>
			<DialogContent>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '2rem',
						mt: '1rem',
						width: '100%',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Document>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'name', label: 'Name' },
								{ key: 'documentUrl', label: 'URL' },
								{ key: 'actions', label: 'Add Documents' },
							]}
						/>
						<TableBody>
							{sortedDocumentsData &&
								sortedDocumentsData
									?.filter((document) =>
										!fromAdminCourses
											? !singleLessonBeforeSave?.documentIds.includes(document._id)
											: !singleCourse?.documentIds.includes(document._id)
									)
									?.map((document: Document) => {
										const isSelected = selectedDocumentIds.indexOf(document._id) !== -1;
										return (
											<TableRow key={document._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
												<CustomTableCell value={document.name} />

												<CustomTableCell>
													<Link href={document.documentUrl} target='_blank' rel='noopener noreferrer'>
														{truncateText(document.documentUrl, 30)}
													</Link>
												</CustomTableCell>

												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleCheckboxChange(document)} />} label='' />
												</TableCell>
											</TableRow>
										);
									})}
						</TableBody>
					</Table>
					<CustomTablePagination count={numberOfPages} page={documentsPageNumber} onChange={setDocumentsPageNumber} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
					handleResetCheckboxes();
				}}
				onSubmit={handleAddDocuments}
				submitBtnText='Add'
				actionSx={{ margin: '1.5rem 1rem 1.5rem 0' }}
				disableBtn={selectedDocuments.length === 0}>
				<CustomCancelButton
					onClick={() => {
						handleResetCheckboxes();
					}}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Deselect All
				</CustomCancelButton>
			</CustomDialogActions>
		</CustomDialog>
	);
};

export default AddNewDocumentDialog;
