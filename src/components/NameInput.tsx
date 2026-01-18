export function NameInput({value, onChange}: any) {
    return (
        <div className="mb-3">
            <div className="input-group">

                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );

}
