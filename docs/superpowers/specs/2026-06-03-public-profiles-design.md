# Diseño: Visualización de Perfiles Públicos e Integración en Estadísticas

Este documento detalla la especificación de diseño para permitir a los usuarios visualizar los perfiles públicos de otros jugadores, agregando una tarjeta resumen en la pestaña de estadísticas personales y permitiendo la navegación a una vista detallada (solo lectura) de cualquier perfil.

## Contexto y Objetivos

Actualmente, los jugadores pueden editar su perfil, biografía y posiciones de juego preferidas en una cancha interactiva. Sin embargo, no hay forma de que un usuario vea el perfil de otro jugador. 
Este diseño resuelve esto de dos maneras:
1. **Tarjeta Resumen en Estadísticas**: En `PersonalTab.tsx`, debajo del selector de jugador, se muestra una tarjeta resumen con la biografía, el avatar y las posiciones favoritas del jugador actualmente seleccionado.
2. **Página de Perfil Público**: Un botón en la tarjeta resumen redirige al usuario a la ruta `/profile/[id]`, mostrando el perfil completo del jugador con la cancha táctica en modo de solo lectura.

## Cambios Propuestos

### 1. Servidor / Acciones de Base de Datos (`src/actions/players.ts`)

Añadir una acción de servidor para consultar perfiles por su identificador primario:

```typescript
export async function getPlayerProfileById(
  playerId: string
): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) {
    console.error("Error fetching player profile by id:", error.message);
    return null;
  }

  return data;
}
```

### 2. Componentes del Cliente (`src/components/profile/ProfileView.tsx`)

Actualizar la firma del componente para aceptar una propiedad `readOnly`:

- Firma: `export default function ProfileView({ initialProfile, readOnly = false }: { initialProfile: Profile; readOnly?: boolean; })`
- Ajustes de UI:
  - Cambiar el título a `"PERFIL DE [USERNAME]"` cuando `readOnly` sea verdadero.
  - Ocultar el botón "Editar Perfil" y las opciones "Cancelar"/"Confirmar".
  - Pasar `isEditing={false}` al componente `<FootballField />`.

### 3. Rutas de Next.js (`src/app/profile/[id]/page.tsx`) [NEW]

Crear una nueva ruta dinámica para visualizar perfiles públicos de lectura:

```tsx
import { getPlayerProfileById } from '@/actions/players';
import { getCurrentProfile } from '@/actions/auth';
import { redirect, notFound } from 'next/navigation';
import ProfileView from '@/components/profile/ProfileView';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const currentUser = await getCurrentProfile();
  if (!currentUser) {
    redirect('/auth/login');
  }

  const targetProfile = await getPlayerProfileById(params.id);
  if (!targetProfile) {
    notFound();
  }

  // Si entra a su propio perfil usando su id, le permitimos editarlo (readOnly=false)
  const isOwnProfile = currentUser.id === targetProfile.id;

  return <ProfileView initialProfile={targetProfile} readOnly={!isOwnProfile} />;
}
```

### 4. Integración de Estadísticas (`src/components/history/PersonalTab.tsx`)

- Importar `Link` desde `"next/link"`.
- Obtener el perfil del jugador seleccionado: `const profile = selectedPlayer?.profile;`.
- Renderizar la tarjeta de perfil justo debajo del selector del jugador y por encima de los gráficos.
- Estilizar la tarjeta usando la clase `.card-sport` para mantener la estética Cyber-Sport.
- Añadir un botón `"Ver Perfil Completo"` que enlace a `/profile/${profile.id}` usando el componente `<Link>`.

## Plan de Verificación

### Pruebas Manuales
- **Visualización de perfil propio**: Navegar a `/profile` y comprobar que se puede editar y guardar correctamente.
- **Acceso a perfiles de terceros**: Navegar a Estadísticas Históricas -> Pestaña Personales. Seleccionar otro jugador y verificar que aparezca su tarjeta de perfil con su biografía y posiciones.
- **Navegación al perfil completo**: Hacer clic en "Ver Perfil Completo" en la tarjeta de estadísticas y verificar que redirige a `/profile/[id]`, mostrando la cancha y la biografía correctas de forma no-editable (sin botón de edición).
- **Control de Acceso**: Verificar que si un usuario no está autenticado, es redirigido a `/auth/login`.
