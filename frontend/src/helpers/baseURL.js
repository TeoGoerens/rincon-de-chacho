export const baseURL = process.env.REACT_APP_BASE_URL || "";

// http://localhost:8080
// Esta es la dirección del localhost que se utiliza en desarrollo y cuya información está almacenada en el archivo .env
// En producción, dado que no definí un archivo .env, al no encontrar la variable REACT_APP_BASE_URL directamente trae un string vacío
// Como el frontend y el backend están servidos en el mismo dominio, entonces el string vacío es correcto para manejo de rutas relativas
