import { getCurrentProfile } from '@/actions/auth';
import { redirect } from 'next/navigation';
import ProfileView from '@/components/profile/ProfileView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  if (!profile) {
    return <div className="p-4">Perfil no encontrado.</div>;
  }

  return <ProfileView initialProfile={profile} />;
}
