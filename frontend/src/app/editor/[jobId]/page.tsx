import EditorShell from "@/components/editor/EditorShell";

interface Props {
  params: { jobId: string };
}

export default function EditorPage({ params }: Props) {
  return <EditorShell jobId={params.jobId} />;
}
