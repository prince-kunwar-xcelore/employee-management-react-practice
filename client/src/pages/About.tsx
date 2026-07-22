export default function About({ text }: { text?: string }) {
  return (
    <>
      <div className="px-6 py-4">About Page : {text}</div>
    </>
  );
}
