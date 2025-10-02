// File: /apps/client/src/components/common/PublicFooter.tsx (CORREGIDO)

import { Container, Text, Anchor, Group } from '@mantine/core';
import classes from './PublicFooter.module.css';

export function PublicFooter() {
  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <Text c="dimmed" size="sm">
          &copy; {new Date().getFullYear()} AquaClean Car Wash. Todos los derechos reservados.
        </Text>
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          {/* Aquí podríamos añadir enlaces a redes sociales o a páginas como "Política de Privacidad" */}
          <Anchor c="dimmed" href="#" size="sm">
            Términos
          </Anchor>
          <Anchor c="dimmed" href="#" size="sm">
            Privacidad
          </Anchor>
        </Group>
      </Container>
    </footer>
  );
}