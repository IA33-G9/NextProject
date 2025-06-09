export type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
};

export const validateField = (name: string, value: string, relatedValue?: string): string | undefined => {
  switch (name) {
    case 'username':
      if (!value.trim()) {
        return 'ユーザー名は必須です';
      }
      if (value.length < 3) {
        return 'ユーザー名は3文字以上である必要があります';
      }
      if (value.length > 20) {
        return 'ユーザー名は20文字以下である必要があります';
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます';
      }
      return undefined;

    case 'email':
      if (!value.trim()) {
        return 'メールアドレスは必須です';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return '有効なメールアドレスを入力してください';
      }
      return undefined;

    case 'password':
      if (!value.trim()) {
        return 'パスワードは必須です';
      }
      if (value.length < 8) {
        return 'パスワードは8文字以上である必要があります';
      }
      if (!/[A-Z]/.test(value)) {
        return 'パスワードには少なくとも1つの大文字を含めてください';
      }
      if (!/[a-z]/.test(value)) {
        return 'パスワードには少なくとも1つの小文字を含めてください';
      }
      if (!/[0-9]/.test(value)) {
        return 'パスワードには少なくとも1つの数字を含めてください';
      }
      return undefined;

    case 'password2':
      if (!value) {
        return 'パスワード(確認)は必須です';
      }
      if (relatedValue && value !== relatedValue) {
        return 'パスワードが一致しません';
      }
      return undefined;

    default:
      return undefined;
  }
};
