import React from 'react';

interface StopwatchProps {
  time: number;
}

const Stopwatch: React.FC<StopwatchProps> = ({ time }) => {
  // Convert time to hours, minutes, and seconds
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  // Format the time into HH:MM:SS format
  const formattedTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="stopwatch">
      {/* <h2>Stopwatch</h2> */}
      <div className="time">{formattedTime}</div>
    </div>
  );
};

export default Stopwatch;
