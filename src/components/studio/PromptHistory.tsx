import { useProjectStore } from "../../store/project-store.js";

export function PromptHistory() {
  const versions = useProjectStore((project) => project.versions);
  return (
    <aside className="space-y-5 overflow-y-auto border-r border-rule p-4">
      <h2 className="studio-label text-muted">Prompt history</h2>
      {versions.map((item, index) => (
        <div key={item.id} className="space-y-3 border-t border-rule pt-3">
          <p className="studio-label text-muted">
            [{String(index + 1).padStart(2, "0")}] {item.source}
          </p>
          <p className="text-body-s">{item.instruction}</p>
        </div>
      ))}
    </aside>
  );
}
