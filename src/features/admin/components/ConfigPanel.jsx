import { Edit2, Trash2, Plus } from 'lucide-react';

export const ConfigPanel = ({ configs, configForm, onConfigChange, onSubmit, editingConfig, onEdit, onCancel, onDelete }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">System Settings Configuration</h3>
        
        {/* Settings Box Inputs */}
        <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
          <div className="w-full sm:max-w-xs flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Config Key</label>
            <input
              type="text"
              value={configForm.key}
              onChange={(e) => onConfigChange((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="e.g. APP_MAINTENANCE"
              className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Config Value</label>
            <input
              type="text"
              value={configForm.value}
              onChange={(e) => onConfigChange((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="e.g. true"
              className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
            <button
              onClick={onSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={16} />
              <span>{editingConfig ? 'Save Config' : 'Add Config'}</span>
            </button>
            {editingConfig && (
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

      {/* Configuration Entries Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm text-left text-slate-600 border-collapse">
          <thead className="text-xs font-semibold text-slate-700 bg-lime-50/60 uppercase border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Key</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {configs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-medium">
                  No system configuration entries yet.
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr key={config.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs tracking-wider">{config.key}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{config.value}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(config)}
                        className="p-1.5 rounded-md border border-slate-100 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(config.id)}
                        className="p-1.5 rounded-md border border-slate-100 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors"
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