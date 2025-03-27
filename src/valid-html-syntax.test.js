const { RuleTester } = require('eslint');
const rule = require('./valid-html-syntax');

const ruleTester = new RuleTester();

jest.mock(
  'path/to/upper-case-only-format.js',
  () => (message) => {
    if (message.toUpperCase() !== message) {
      throw new SyntaxError('MESSAGE MUST BE IN UPPERCASE!');
    }
  },
  {
    virtual: true
  }
);

ruleTester.run('valid-html-syntax', rule, {
  valid: [
    // ignores non json files
    {
      code: `
        /*var x = 123;*//*path/to/file.js*/
      `,
      options: [],
      filename: 'file.js'
    },
    // valid HTML snippets
    {
      code: `
      /*{
          "translationKeyA": "translation value a",
          "translationKeyB": "translation <b>value b</b>",
          "translationKeyC": "translation <b><i>value</i> escaped curly</b> brackets '{}'",
          "translationKeyD": "<b>translation</b> value with <b>backslash</b> \u005C"
      }*//*path/to/file.json*/
      `,
      filename: 'file.json'
    }
  ],
  invalid: [
    // invalid HTML snippet
    {
      code: `
      /*{
          "translationKeyB": "translation <b>value b"
      }*//*path/to/file.json*/
      `,
      filename: 'file.json',
      errors: [
        {
          message: /XYZ /gi,
          line: 0
        }
      ]
    }
  ]
});
