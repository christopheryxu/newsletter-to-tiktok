import UrlInputForm from "@/components/landing/UrlInputForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
          Newsletter → TikTok
        </h1>
        <p className="text-gray-400 max-w-md">
          Paste any newsletter URL and we&apos;ll generate a ready-to-post 9:16 TikTok video with
          AI voiceover, stock footage, and subtitles.
        </p>
      </div>
      <UrlInputForm />
    </main>
  );
}
