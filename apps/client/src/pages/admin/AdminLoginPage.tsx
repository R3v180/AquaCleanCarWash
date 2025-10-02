import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Text,
  LoadingOverlay,
  Stack,
} from '@mantine/core';
import apiClient from '../../lib/apiClient';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@aquaclean.com'); // Pre-rellenado para facilitar las pruebas
  const [password, setPassword] = useState('password123'); // Pre-rellenado para facilitar las pruebas
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Aquí es donde guardaremos el token más adelante (ej. en Zustand)
      console.log('Login exitoso:', response.data);
      // Por ahora, solo guardamos en localStorage para que funcione la protección de rutas
      localStorage.setItem('authToken', response.data.token);
      
      // Redirigimos al dashboard de admin
      navigate('/admin');

    } catch (err: any) {
      console.error('Error en el login:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ha ocurrido un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">AquaClean Admin</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Inicia sesión para acceder al panel de administración
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={handleLogin}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Tu contraseña"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          {error && (
            <Text c="red" size="sm" ta="center">
              {error}
            </Text>
          )}
          <Button fullWidth mt="xl" type="submit">
            Iniciar Sesión
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}