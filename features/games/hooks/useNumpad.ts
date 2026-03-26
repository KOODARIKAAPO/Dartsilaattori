import { useState } from 'react';

export const useNumpad = (initial = '') => {
    const [value, setValue] = useState(initial);

    const pressNumber = (num: number) => {
        setValue(prev => prev + num.toString());
    };

    const backspace = () => {
        setValue(prev => prev.slice(0, -1));
    };

    return {
        value,
        setValue,
        pressNumber,
        backspace,
    };
};