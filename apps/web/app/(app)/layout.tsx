import { loadFinances } from '@/lib/data';
import { Sidebar } from '@/components/Sidebar';
import { BootScreen } from '@/components/BootScreen';
import { signOut } from '../login/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await loadFinances();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <BootScreen />
      <Sidebar name={profile.fullName} school={profile.school} signOut={signOut} />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-7">{children}</div>
      </main>
    </div>
  );
}
