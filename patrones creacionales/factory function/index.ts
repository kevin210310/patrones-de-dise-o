/**
 * ! Factory Function
 * Es un patrón de diseño que nos permite crear objetos o funciones de manera dinámica que serán
 * usados posteriormente en el código.
 *
 * * Es útil cuando necesitamos crear objetos o funciones de manera dinámica,
 * * es decir, en tiempo de ejecución y no en tiempo de compilación.
 *
 */

const COLORS = {
  brown: 'color: brown',
  red: 'color: red',
  green: 'color: green',
  blue: 'color: blue',
  yellow: 'color: yellow',
  purple: 'color: purple',
  cyan: 'color: cyan',
  white: 'color: white',
  black: 'color: black',
  gray: 'color: gray',
  orange: 'color: orange',
  pink: 'color: pink',
  violet: 'color: violet',
};

type Language = 'es' | 'en' | 'fr';

// i18n
function createGreeter(lang: Language) {
  return function (name: string) {
    const messages = {
      es: `Hola, %c${name}!`,
      en: `Hello, %c${name}!`,
      fr: `Bonjour, %c${name}!`,
    };

    return console.log(messages[lang], COLORS.red);
  };
}

function main() {
  const spanishGreeter = createGreeter('es');
  const englishGreeter = createGreeter('en');
  const frenchGreeter = createGreeter('fr');

  spanishGreeter('Fernando');
  englishGreeter('Alice');
  frenchGreeter('Pierre');
}

main();