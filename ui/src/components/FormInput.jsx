import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const FormInput = ({ formData, onSubmit }) => {
  const [formState, setFormState] = useState(
    formData.fields.reduce((acc, field) => {
      acc[field.label] = field.defaultValue || '';
      return acc;
    }, {})
  );

  const handleInputChange = (label, value) => {
    setFormState(prev => ({
      ...prev,
      [label]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = formData.fields.map(field => ({
      ...field,
      value: formState[field.label]
    }));
    onSubmit(formattedData);
  };

  const renderField = (field) => {
    const commonClasses = "w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    switch (field.type) {
      case 'textarea':
        return (
          <TextareaAutosize
            minRows={field.rows || 3}
            maxRows={field.maxRows || 10}
            className={commonClasses}
            placeholder={field.placeholder}
            value={formState[field.label] || ''}
            onChange={(e) => handleInputChange(field.label, e.target.value)}
            disabled={field.disabled}
            readOnly={field.readonly}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            className={commonClasses}
            value={formState[field.label] || ''}
            onChange={(e) => handleInputChange(field.label, e.target.value)}
            disabled={field.disabled}
            required={field.required}
            multiple={field.multiple}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-sm text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formState[field.label] || false}
              onChange={(e) => handleInputChange(field.label, e.target.checked)}
              disabled={field.disabled}
              required={field.required}
            />
            <span className="ml-2 text-sm text-gray-600">{field.placeholder}</span>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  name={field.label}
                  value={option.value}
                  checked={formState[field.label] === option.value}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  disabled={field.disabled}
                  required={field.required}
                />
                <span className="ml-2 text-sm text-gray-600">{option.label}</span>
              </div>
            ))}
          </div>
        );

      case 'switch':
        return (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formState[field.label] || false}
              onChange={(e) => handleInputChange(field.label, e.target.checked)}
              disabled={field.disabled}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">{field.placeholder}</span>
          </label>
        );

      case 'range':
        return (
          <div className="flex flex-col">
            <input
              type="range"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min={field.min}
              max={field.max}
              step={field.step}
              value={formState[field.label] || field.min || 0}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              disabled={field.disabled}
            />
            <span className="text-sm text-gray-500 mt-1">
              Value: {formState[field.label] || field.min || 0}
            </span>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            className={commonClasses}
            placeholder={field.placeholder}
            value={formState[field.label] || ''}
            onChange={(e) => handleInputChange(field.label, e.target.value)}
            min={field.min}
            max={field.max}
            step={field.step}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            autoComplete={field.autocomplete}
            disabled={field.disabled}
            readOnly={field.readonly}
            required={field.required}
          />
        );
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const errorClasses = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{formData.heading}</h2>
        <p className="text-sm text-gray-500">{formData.description}</p>
      </div>

      <div className="space-y-4">
        {formData.fields.map((field, index) => (
          <div key={index} className="space-y-1">
            <label className={labelClasses}>{field.label}</label>
            {renderField(field)}
            {field.description && (
              <p className="text-sm text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {formData.submitButton?.label || 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default FormInput; 