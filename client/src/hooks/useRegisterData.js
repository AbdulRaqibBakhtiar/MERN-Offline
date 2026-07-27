import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useRegisterData() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form Input Values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status Controls
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString());
  const [nodePing, setNodePing] = useState(24);

  useEffect(() => {
    const clock = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    const ping = setInterval(() => setNodePing(Math.floor(Math.random() * 25) + 15), 3000);
    return () => {
      clearInterval(clock);
      clearInterval(ping);
    };
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      return setError('Please fill out Username, Email, and Password.');
    }
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be 8+ characters.');

    try {
      setLoading(true);
      await register(
        username.trim(),
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
        phoneNumber.trim()
      );
      alert('Account created successfully!');
      navigate('/login');
    } catch (err) {
      console.error("Registration error intercept:", err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return {
    username, setUsername, email, setEmail, firstName, setFirstName,
    lastName, setLastName, phoneNumber, setPhoneNumber, password, setPassword,
    confirmPassword, setConfirmPassword, error, setError, loading,
    sysTime, nodePing, handleRegisterSubmit
  };
}
