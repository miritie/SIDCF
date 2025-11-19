/* ============================================
   Form Widgets
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Create form field
 */
export function formField(config) {
  const {
    type = 'text',
    name,
    label,
    value = '',
    placeholder = '',
    required = false,
    options = [], // for select
    help = null,
    error = null
  } = config;

  const labelEl = el('label', {
    className: `form-label ${required ? 'form-label-required' : ''}`,
    for: name
  }, label);

  let inputEl;

  if (type === 'select') {
    const optionEls = options.map(opt =>
      el('option', { value: opt.value || opt.code }, opt.label)
    );

    // Add empty option if not required
    if (!required) {
      optionEls.unshift(el('option', { value: '' }, '-- Sélectionnez --'));
    }

    inputEl = el('select', {
      id: name,
      name,
      className: `form-select ${error ? 'error' : ''}`,
      required
    }, optionEls);

    if (value) {
      inputEl.value = value;
    }
  } else if (type === 'textarea') {
    inputEl = el('textarea', {
      id: name,
      name,
      className: `form-textarea ${error ? 'error' : ''}`,
      placeholder,
      required
    }, value);
  } else {
    inputEl = el('input', {
      type,
      id: name,
      name,
      className: `form-input ${error ? 'error' : ''}`,
      placeholder,
      required,
      value
    });
  }

  const children = [labelEl, inputEl];

  if (help) {
    children.push(el('div', { className: 'form-help' }, help));
  }

  if (error) {
    children.push(el('div', { className: 'form-error' }, error));
  }

  return el('div', { className: 'form-field' }, children);
}

/**
 * Create form grid
 */
export function formGrid(fields) {
  const fieldEls = fields.map(field => formField(field));
  return el('div', { className: 'form-grid' }, fieldEls);
}

/**
 * Create form actions (buttons)
 */
export function formActions(buttons) {
  const buttonEls = buttons.map(btn =>
    el('button', {
      type: btn.type || 'button',
      className: `btn ${btn.className || 'btn-primary'}`,
      onclick: btn.onClick
    }, btn.label)
  );

  return el('div', { className: 'form-actions' }, buttonEls);
}

/**
 * Get form data
 */
export function getFormData(formEl) {
  const formData = new FormData(formEl);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

export default { formField, formGrid, formActions, getFormData };
