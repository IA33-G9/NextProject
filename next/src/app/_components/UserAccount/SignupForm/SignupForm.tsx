import { useState } from 'react';
import { FormField } from '@/app/_components/UserAccount/SignupForm/FormField';
import { validateField, FieldErrors } from '@/app/_components/UserAccount/SignupForm/valid';

type SignupFormProps = {
  onSubmit: (email: string, username: string, password:string) => Promise<void>;
};

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form,setForm] = useState({password:"",password2:""})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

    let error;
    if (name === 'password2') {
      error = validateField(name, value, form.password);
    } else if (name === 'password') {

      error = validateField(name, value);
      const password2Error = validateField('password2', form.password2, value);
      setFieldErrors(prev => ({
        ...prev,
        password2: password2Error
      }));
    } else {
      error = validateField(name, value);
    }

    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  async function handleSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;

    const emailError = validateField('email', email);
    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);
    const password2Error = validateField('password2', password2,password);

    if (emailError || usernameError || passwordError|| password2Error) {
      setFieldErrors({
        email: emailError,
        username: usernameError,
        password:passwordError,
        password2:password2Error
      });
      return;
    }

    await onSubmit(email, username,password);
  }

  return (
    <form action={handleSubmit}>
      <FormField
          label="ユーザー名"
          name="username"
          type="text"
          error={fieldErrors.username}
          onChange={handleInputChange}
      />

      <FormField
          label="メールアドレス"
          name="email"
          type="email"
          error={fieldErrors.email}
          onChange={handleInputChange}
      />
      <FormField
          label="パスワード"
          name="password"
          type="password"
          error={fieldErrors.password}
          onChange={handleInputChange}
      />

      <FormField
          label="パスワード確認"
          name="password2"
          type="password"
          error={fieldErrors.password2}
          onChange={handleInputChange}
      />

      <button
        type="submit"
        className="w-full mt-6 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        新規登録
      </button>
    </form>
  );

}