
type Props = {
    onFileSelected: (file: File) => void;
    acceptedFormats?: string;
};


export function FileUpload({ onFileSelected, acceptedFormats }: Props) {

    return (
        <div className="mb-3">

            <input
                type="file"
                accept={acceptedFormats}
                className="form-control"
                onChange={(e) =>
                    e.target.files && onFileSelected(e.target.files[0])
                }
            />

            <div className="form-text">
                PDF, DOC, or DOCX up to 10MB
            </div>
        </div>
    );
}
