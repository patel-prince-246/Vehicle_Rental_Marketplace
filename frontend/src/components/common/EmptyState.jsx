function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 my-6">
      {Icon && <Icon size={48} className="text-slate-400" />}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm max-w-md text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
