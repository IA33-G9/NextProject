type SignInFormField={
    label:string,
    name: string,
    type: string;
    error?: string;
}

export function FormField({label,type,name,error,}:SignInFormField){
    return(
        <div>
            <label htmlFor={label}>
                {label}
            </label>
            <input
                type={type}
                name={name}
                required
            />
            {error && <div>{error}</div>}
        </div>
    );
}