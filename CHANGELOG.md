# Registro de Cambios (Changelog)

Todos los cambios y evoluciones del proyecto "UADE EATS" quedarán documentados aquí.

## [v0.2.0] - Implementación de Backend Inicial (Prisma + SQLite)

**Agregado:**
- **Base de Datos:** Se inicializó Prisma con SQLite (`dev.db`).
- **Esquema:** Se definió el modelo `User` en `prisma/schema.prisma` con campos: `id`, `name`, `email`, `passwordHash`, `role`, `createdAt`.
- **Rutas de API:** 
  - `POST /api/auth/register`: Valida email `@uade.edu.ar`, hashea contraseña (usando `bcryptjs`), crea el usuario y genera un JWT (usando `jose`) que se guarda en una cookie HTTP-only. Auto-loguea al usuario tras registro exitoso.
  - `POST /api/auth/login`: Valida credenciales, genera JWT y guarda la cookie segura.
  - `POST /api/auth/logout`: Elimina las cookies de sesión.
- **Frontend Login:** Se añadió un campo de `password` debajo de `email` y se integró el formulario con el endpoint `/api/auth/login`.
- **Frontend Register:** Se integró el formulario con el endpoint `/api/auth/register`.

**Cambiado:**
- **Estilos (Login/Register):** Se centró el formulario de inicio de sesión y registro de manera absoluta en la vista mobile para mayor armonía visual (usando clases de Tailwind como `justify-center` y ajustando posición de los footers).
- **Dependencias:** Se agregaron paquetes de servidor: `prisma`, `@prisma/client`, `bcryptjs`, `jose` y las correspondientes dependencias de desarrollo (`@types/bcryptjs`).
