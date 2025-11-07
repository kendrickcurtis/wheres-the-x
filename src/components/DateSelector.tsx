import React from 'react';

interface DateSelectorProps {
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  onDateChange: (date: string) => void;
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  maxDate
}) => {
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const newDateStr = date.toISOString().split('T')[0];
    if (!minDate || newDateStr >= minDate) {
      onDateChange(newDateStr);
    }
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const newDateStr = date.toISOString().split('T')[0];
    if (!maxDate || newDateStr <= maxDate) {
      onDateChange(newDateStr);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      // Validate date is within range
      if ((!minDate || newDate >= minDate) && (!maxDate || newDate <= maxDate)) {
        onDateChange(newDate);
      }
    }
  };

  const isPreviousDisabled = !!(minDate && selectedDate <= minDate);
  const isNextDisabled = !!(maxDate && selectedDate >= maxDate);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '20px',
      padding: '10px'
    }}>
      <button
        onClick={handlePreviousDay}
        disabled={isPreviousDisabled}
        style={{
          padding: '8px 12px',
          fontSize: '16px',
          cursor: isPreviousDisabled ? 'not-allowed' : 'pointer',
          opacity: isPreviousDisabled ? 0.5 : 1,
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white'
        }}
      >
        ←
      </button>
      
      <input
        type="date"
        value={selectedDate}
        onChange={handleDateInputChange}
        min={minDate}
        max={maxDate}
        style={{
          padding: '8px',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
      
      <button
        onClick={handleNextDay}
        disabled={isNextDisabled}
        style={{
          padding: '8px 12px',
          fontSize: '16px',
          cursor: isNextDisabled ? 'not-allowed' : 'pointer',
          opacity: isNextDisabled ? 0.5 : 1,
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white'
        }}
      >
        →
      </button>
    </div>
  );
};

