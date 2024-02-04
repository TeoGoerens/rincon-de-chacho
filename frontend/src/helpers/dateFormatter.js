import { format } from "date-fns";
import { es } from "date-fns/locale";

//---------- FUNCTION TO DISPLAY DATE IN THE VIEW ----------
export const formatDate = (dateString) => {
  // If dateString is undefined or null the function returns null
  if (!dateString) {
    return null;
  }

  // Parse the MongoDB date string
  const date = new Date(dateString);

  // Adapt date to desired format
  const formattedDate = format(date, "dd LLL yyyy", { locale: es });

  return formattedDate;
};

//---------- FUNCTION TO INPUT DATE IN THE UPDATE INPUT TYPE "DATE" BOX ----------
export const formatDateForInput = (dateString) => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  const formattedDate = format(date, "yyyy-MM-dd", { locale: es });
  return formattedDate;
};
