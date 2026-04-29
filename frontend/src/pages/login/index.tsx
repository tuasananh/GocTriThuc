import { OAuthLogin } from '@/pages/login/_components/OAuthLogin';

export function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#f7f7fa] overflow-hidden relative font-sans text-foreground">
      {/* Decorative blurry blobs behind */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none mix-blend-multiply" />

      {/* The main form container */}
      <div className="relative z-10 p-4">
        <OAuthLogin />
      </div>
    </div>
  );
}
