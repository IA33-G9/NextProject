type SignUpFormField={
    label:string,
    name: string,
    type: string;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormField({ label,type, name, onChange,error,  }: SignUpFormField) {
    return (
        <div>
            <label htmlFor={label}>
                {label}
            </label>
            <input
                type={type}
                name={name}
                required
                onChange={onChange}
            />
            {error && <div>{error}</div>}
        </div>
    );
}