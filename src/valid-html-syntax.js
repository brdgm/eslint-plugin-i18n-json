const { set, isPlainObject } = require('lodash');
const diff = require('jest-diff');
const deepForOwn = require('./util/deep-for-own');
const getTranslationFileSource = require('./util/get-translation-file-source');
const { parse } = require('parse5');

const validHtmlSyntax = (context, source) => {
  const { settings = {} } = context;

  let translations = null;
  const invalidMessages = [];

  try {
    translations = JSON.parse(source);
  } catch (e) {
    return [];
  }

  const ignorePaths = settings['i18n-json/ignore-keys'] || [];

  deepForOwn(
    translations,
    (value, key, path) => {
      // empty object itself is an error
      if (!isPlainObject(value) && !Array.isArray(value)) {
        try {
          parse(`<div>${value}</div>`);
        } catch (validationError) {
          invalidMessages.push({
            value,
            key,
            path,
            error: validationError
          });
        }
      }
    },
    {
      ignorePaths
    }
  );

  if (invalidMessages.length > 0) {
    const expected = {};
    const received = {};
    invalidMessages.forEach((invalidMessage) => {
      set(expected, invalidMessage.path, invalidMessage);
      set(received, invalidMessage.path, invalidMessage);
    });

    return [
      {
        message: `\n${diff(expected, received)}`,
        loc: {
          start: {
            line: 0,
            col: 0
          }
        }
      }
    ];
  }
  // no errors
  return [];
};

module.exports = {
  meta: {
    docs: {
      category: 'Validation',
      description:
        'Validates HTML syntax for each translation key in the file.',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false
      }
    ]
  },
  create(context) {
    return {
      Program(node) {
        const { valid, source } = getTranslationFileSource({
          context,
          node
        });
        if (!valid) {
          return;
        }
        const errors = validHtmlSyntax(context, source);
        errors.forEach((error) => {
          context.report(error);
        });
      }
    };
  }
};
