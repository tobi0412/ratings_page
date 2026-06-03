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

  // Permitir edición si entra a su propio ID
  const isOwnProfile = currentUser.id === targetProfile.id;

  return <ProfileView initialProfile={targetProfile} readOnly={!isOwnProfile} />;
}
