// Date Range Picker Component for Analytics
import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { start: string; end: string }) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = ''
}) => {
  const handleStartDateChange = (newStart: string) => {
    onChange({ start: newStart, end: endDate });
  };

  const handleEndDateChange = (newEnd: string) => {
    onChange({ start: startDate, end: newEnd });
  };

  const setPresetRange = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    onChange({ start, end });
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Quick Preset Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setPresetRange(7)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          7 Days
        </button>
        <button
          onClick={() => setPresetRange(30)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          30 Days
        </button>
        <button
          onClick={() => setPresetRange(90)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          90 Days
        </button>
      </div>

      {/* Date Inputs */}
      <div className="flex items-center space-x-2">
        <div className="flex flex-col">
          <label htmlFor="start-date" className="text-xs text-gray-600 mb-1">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            max={endDate}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="end-date" className="text-xs text-gray-600 mb-1">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;