export function numberFormatting(number) {
  return new Intl.NumberFormat("es-CL").format(number);
}

export function restyleCategory(category) {
  const array = category.split("-");

  for (let i = 0; i < array.length; i++) {
    array[i] = array[i].charAt(0).toUpperCase() + array[i].slice(1);
  }

  const string = array.join(" ");
  return string;
}
