import React from 'react';
import PropTypes from 'prop-types';
import css from 'classnames';

import './input.css';

Input.propTypes = {
  multiline: PropTypes.bool,
  highlight: PropTypes.bool,
  large: PropTypes.bool,
};

export default function Input({ multiline, highlight, large, ...props }) {
  let Component = multiline ? 'textarea' : 'input';

  return (
    <>
    {!highlight ? 
      <Component className={css('fs-text-field', 'fs-text-field--input', {'fs-text-field--input__large': large})} {...props} />
    :
      <div className="input-boder__highlight fs-text-field">
        <Component className={css('fs-text-field', 'fs-text-field--input', 'fs-text-field--input__highlight', {'fs-text-field--input__large': large})} {...props} />
      </div>
    }
   </>
  );
}
