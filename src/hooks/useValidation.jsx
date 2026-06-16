import { useState, useCallback } from 'react';

export const useValidation = (validators) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const validator = validators[name];
    if (!validator) return null;
    return validator(value);
  }, [validators]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateField, touched]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const getFieldStatus = useCallback((name) => {
    if (!touched[name]) return 'default';
    if (errors[name]) return 'error';
    const value = values[name];
    if (name === 'password' || name === 'new_password') {
      if (value && value.length < 8) return 'warning';
    }
    if (value && value.length > 0) return 'success';
    return 'default';
  }, [touched, errors, values]);

  const isValid = useCallback(() => {
    return Object.keys(validators).every(name => {
      const value = values[name];
      if (!value) return false;
      return !validateField(name, value);
    });
  }, [values, validators, validateField]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    getFieldStatus,
    isValid,
    setValues,
  };
};