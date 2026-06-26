// Labeled input with a leading Lucide icon and inline validation message.
export const AuthField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoComplete,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-navy-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-navy-400">
        {Icon && <Icon className="h-5 w-5" />}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={`block w-full pl-11 pr-4 py-3 bg-navy-50 border rounded-xl text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
          error
            ? 'border-rose-300 focus:ring-rose-400'
            : 'border-navy-200 focus:ring-teal-500'
        }`}
      />
    </div>
    {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
  </div>
);
