import React from "react";

const CustomAdminTable = ({
  columns,
  data,

  lastColumnContent,
}) => {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index}>{column.label}</th>
          ))}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex}>{row[column.key]}</td>
            ))}
            <td>{lastColumnContent}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomAdminTable;
