import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarComponent.css'; 

const CalendarComponent = () => {
  const [date, setDate] = useState(new Date());

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  return (
    <div className="calendar-wrapper">
      <h2>Calendar</h2>
      <Calendar onChange={handleDateChange} value={date} />
    </div>
  );
};

export default CalendarComponent;
