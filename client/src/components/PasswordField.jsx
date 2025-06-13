import React, { useState, useRef } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

const BULLET     = '\u2022';
const REVEAL_MS  = 500;           // how long the last char stays visible (ms)
const COLORS = {
  navy: '#003e83',           // eye colour when password is visible
  gray: '#8f98a3',           // eye colour when password is hidden
};

export default function PasswordField({
  value = '',
  onChange,
  className = '',
  ...rest
}) {
  const [raw,          setRaw]          = useState(value); // real password
  const [showPassword, setShowPassword] = useState(false); // eye toggle
  const [revealIndex,  setRevealIndex]  = useState(-1);    // temp reveal
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
    <div style={{ position: 'relative', width: '100%', height: 44, margin: '6px 0 20px'}}>
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
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',   
          width: 20,
          height: 20,
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
          <EyeIcon width={20} height={20} fill={eyeColour} />
        ) : (
          <EyeSlashIcon width={20} height={20} fill={eyeColour} />
        )}
      </button>
    </div>
  );
}
