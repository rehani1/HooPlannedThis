import React, { useState, useRef } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

const BULLET     = '\u2022';
const REVEAL_MS  = 500;           
const COLORS = {
  navy: '#003e83',           
  gray: '#8f98a3',           
};

export default function PasswordField({
  value = '',
  onChange,
  className = '',
  ...rest
}) {
  const [raw,          setRaw]          = useState(value); 
  const [showPassword, setShowPassword] = useState(false); 
  const [revealIndex,  setRevealIndex]  = useState(-1);    
  const timerRef = useRef(null);

  const propagate = v => onChange?.({ target: { value: v } });

  const handleChange = e => {
    if (showPassword) {                  
      setRaw(e.target.value);
      propagate(e.target.value);
      return;
    }

    const newLen = e.target.value.length;
    const oldLen = raw.length;
    let newRaw = raw;

    if (newLen > oldLen) {                
      const typed = e.nativeEvent?.data ?? e.target.value.slice(-1);
      newRaw = raw + typed;
      clearTimeout(timerRef.current);
      setRevealIndex(oldLen);             
      timerRef.current = setTimeout(() => setRevealIndex(-1), REVEAL_MS);
    } else if (newLen < oldLen) {        
      newRaw = raw.slice(0, newLen);
      clearTimeout(timerRef.current);
      setRevealIndex(-1);
    }

    setRaw(newRaw);
    propagate(newRaw);
  };

  const toggleVisibility = () => {
    setShowPassword(v => !v);
    clearTimeout(timerRef.current);
    setRevealIndex(-1);
  };

  let display = raw;
  if (!showPassword) {
    display = raw
      .split('')
      .map((ch, idx) => (idx === revealIndex ? ch : BULLET))
      .join('');
  }

  const sizeClass = showPassword ? 'pw-visible' : 'pw-mask';
  const eyeColour = showPassword ? COLORS.navy : COLORS.gray;

  return (
    <div style={{ position: 'relative', width: '100%', height: 44, margin: '0px 0 20px'}}>
      <input
        {...rest}
        type="text"                         
        value={display}
        onChange={handleChange}
        className={`${className} ${sizeClass}`}
        style={{ paddingRight: '44px', margin: 0 }}   
        autoComplete="current-password"
      />

      <button
        type="button"
        onClick={toggleVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',   
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {showPassword ? (
          <EyeIcon width={24} height={24} fill={eyeColour} />
        ) : (
          <EyeSlashIcon width={24} height={24} fill={eyeColour} />
        )}
      </button>
    </div>
  );
}
