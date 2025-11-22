export default function Placeholder({ message }) {
  return (
    <div className="card flex items-center justify-center h-48 text-center text-accent font-bold">
      {message || "No articles available yet."}
    </div>
  );
}