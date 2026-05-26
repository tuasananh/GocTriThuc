import { OAuthLogin } from '@/pages/login/_components/OAuthLogin';

export function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-background overflow-hidden relative font-sans text-foreground">
      {/* Decorative blurry blobs behind */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none mix-blend-normal dark:mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none mix-blend-normal dark:mix-blend-screen" />

      {/* The main form container */}
      <div className="relative z-10 p-4 w-full max-w-md">
        <OAuthLogin />
      </div>
    </div>
  );
}
