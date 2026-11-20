const { writeFile } = require('fs');
const { promisify } = require('util');
const dotenv = require('dotenv');

dotenv.config();

const writeFilePromisified = promisify(writeFile);
const targetPath = './src/app/environments/environment.ts';

const envConfigFile = `export const environment = {
  production: ${process.env['PRODUCTION'] || 'false'},
  apiUrl: '${process.env['BACKEND_URL'] || 'http://localhost:8080/api'}'
};
`;

(async () => {
  try {
    await writeFilePromisified(targetPath, envConfigFile);
    console.log(`Archivo generado exitosamente en ${targetPath}`);
  } catch (err) {
    console.error('Error al generar el archivo de entorno:', err);
    process.exit(1);
  }
})();