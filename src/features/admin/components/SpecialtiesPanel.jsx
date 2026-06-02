import { Edit2, Trash2, Plus } from 'lucide-react';

export const SpecialtiesPanel = ({
  specialties,
  specialtyForm,
  onSpecialtyChange,
  onSubmit,
  editingSpecialty,
  onEdit,
  onCancel,
  onDelete,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Medical Specialties Management</h3>
        
        {/* Input Form Fields Box */}
        <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
          <div className="w-full sm:max-w-xs flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Specialty Name</label>
            <input
              type="text"
              value={specialtyForm.name}
              onChange={(e) => onSpecialtyChange((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Cardiology"
              className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
            <button
              onClick={onSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={16} />
              <span>{editingSpecialty ? 'Save Specialty' : 'Add Specialty'}</span>
            </button>
            {editingSpecialty && (
              <button
                onClick={onCancel}
                className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Specialties List Data Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm text-left text-slate-600 border-collapse">
          <thead className="text-xs font-semibold text-slate-700 bg-purple-50/60 uppercase border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {specialties.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">
                  No specialties configured yet.
                </td>
              </tr>
            ) : (
              specialties.map((specialty) => (
                <tr key={specialty.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{specialty.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(specialty)}
                        className="p-1.5 rounded-md border border-slate-100 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors"
                        title="Edit Specialty"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(specialty.id)}
                        className="p-1.5 rounded-md border border-slate-100 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors"
                        title="Delete Specialty"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};