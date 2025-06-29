// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./CreatePodridaStyles.css";

//Import React Query functions
import createCronica from "../../../../reactquery/cronica/createCronica";

const CreatePodrida = () => {
  return (
    <>
      {/* Spinner Overlay */}
      {/*       {mutation.isPending && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )} */}

      {/*       <div className={`container ${mutation.isPending ? "blurred" : ""}`}>

        <div className="create-cronica-head">
          <h2>Crear una nueva crónica</h2>
          <Link className="back-btn" to="/admin/cronicas">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </Link>
        </div>

     
      </div> */}
    </>
  );
};

export default CreatePodrida;
