import React from 'react';

export const FilterGroup = ({ label, children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block font-medium mb-2">{label}</label>}
    {children}
  </div>
);

export const SelectFilter = ({ label, name, value, onChange, options, placeholder = "-- Todas --" }) => (
  <FilterGroup label={label}>
    <select
      className="w-full p-2 border rounded"
      name={name}
      value={value}
      onChange={onChange}
    >
      <option value="">{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  </FilterGroup>
);