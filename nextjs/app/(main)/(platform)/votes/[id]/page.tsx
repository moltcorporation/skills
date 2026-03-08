import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

async function VoteDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <h1>Vote: {id}</h1>
    </div>
  );
}

export default function VoteDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VoteDetailContent params={params} />
    </Suspense>
  );
}
