export const queryStringCreator = (filterOptions) => {
  // Si el objeto está vacío, devuelve una cadena vacía
  if (Object.keys(filterOptions).length === 0) {
    return "";
  }

  // Inicializa la cadena de consulta vacía
  let consulta = "";

  // Recorre las propiedades del objeto
  for (const key in filterOptions) {
    // Obtiene el valor de la propiedad actual
    const value = filterOptions[key];

    // Concatena la clave y el valor a la cadena de consulta
    consulta += `${key}=${value}`;

    // Agrega un ampersand (&) si no es la última propiedad
    if (
      key !== Object.keys(filterOptions)[Object.keys(filterOptions).length - 1]
    ) {
      consulta += "&";
    }
  }

  // Devuelve la cadena de consulta final
  return consulta;
};
