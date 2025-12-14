type SignInFormField={
    label:string,
    name: string,
    type: string;
    error?: string;
}

export function FormField({label,type,name,error,}:SignInFormField){
    return(
        <div className="mb-5">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <input
                id={name}
                type={type}
                name={name}
                required
                className={`w-full px-4 py-2 border rounded-lg transition focus:outline-none focus:ring-2 ${
                    error
                        ? 'border-red-500 bg-red-50 focus:ring-red-500'
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}