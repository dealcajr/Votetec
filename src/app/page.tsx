import { VoteApp } from "@/components/vote-app";

export default function Home() {
  return (
    <div className="bg-background min-h-screen w-full">
      <main className="flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 min-h-screen">
        <VoteApp />
      </main>
    </div>
  );
}
