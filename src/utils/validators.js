export const validators = {
  username: (value) => {
    if (!value) return 'Le nom d\'utilisateur est requis';
    if (value.length < 3) return 'Minimum 3 caractères';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Caractères autorisés : lettres, chiffres, _';
    return null;
  },
  email: (value) => {
    if (!value) return 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalide';
    return null;
  },
  password: (value) => {
    if (!value) return 'Le mot de passe est requis';
    if (value.length < 6) return 'Minimum 6 caractères';
    return null;
  },
  passwordStrength: (value) => {
    if (!value) return 'Le mot de passe est requis';
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;
    if (strength < 2) return 'Mot de passe faible';
    if (strength < 3) return 'Mot de passe moyen';
    return null;
  },
  confirmPassword: (value, password) => {
    if (!value) return 'Confirmation requise';
    if (value !== password) return 'Les mots de passe ne correspondent pas';
    return null;
  },
  required: (value) => {
    if (!value) return 'Ce champ est requis';
    return null;
  },
};