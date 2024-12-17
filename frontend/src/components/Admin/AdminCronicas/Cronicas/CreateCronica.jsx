// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./CreateCronicaStyles.css";

//Import React Query functions
import createCronica from "../../../../reactquery/cronica/createCronica";

// Import components
import AdminMenu from "../../AdminMenu";

// import React Quill & options configurations
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Estilos por defecto de Quill
// -----------> Opciones para la barra de herramientas (toolbar)
const modules = {
  toolbar: [
    // Selección de fuente
    [{ font: [] }],
    // Tamaños de encabezado
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    // Formato básico de texto: negrita, cursiva, subrayado, tachado, cita
    ["bold", "italic", "underline", "strike", "blockquote"],
    // Color de texto y fondo
    [{ color: [] }, { background: [] }],
    // Subíndice y superíndice
    [{ script: "sub" }, { script: "super" }],
    // Listas ordenadas y no ordenadas, indentación
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    // Alineación
    [{ align: [] }],
    // Insertar enlaces, imágenes y videos
    ["link", "image", "video"],
    // Botón para limpiar formato
    ["clean"],
  ],
};

// -----------> Formatos soportados por el editor
const formats = [
  "font",
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "color",
  "background",
  "script",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
  "video",
];

const CreateCronica = () => {
  // Instancia de QueryClient
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Definicion de variables
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [year, setYear] = useState("");
  const [body, setBody] = useState("");
  const [heroImage, setHeroImage] = useState(null);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [videos, setVideos] = useState([]);

  // Creacion de mutation para llamar al endpoint POST de CreateCronica
  const mutation = useMutation({
    mutationFn: createCronica,
    onSuccess: (data) => {
      // data contiene la respuesta del backend, por ejemplo: { message: "Cronica creada correctamente", cronicaLoaded: {...} }
      const successMessage = data?.message || "Crónica creada con éxito!";

      // Mostrar notificación exitosa
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 3000,
        pauseOnHover: true,
      });

      // Invalida la cache para refrescar el listado de crónicas
      queryClient.invalidateQueries(["fetchAllCronicas"]);

      // Redirigir después de 4 segundos
      setTimeout(() => {
        navigate("/admin/cronicas");
      }, 4000);
    },
    onError: (error) => {
      console.error("Error al crear la crónica:", error.message);
    },
  });

  const handleAddImage = () => {
    setImages([...images, { file: null, caption: "" }]);
  };

  const handleAddAudio = () => {
    setAudios([...audios, { file: null, caption: "" }]);
  };

  const handleAddVideo = () => {
    setVideos([...videos, { file: null, caption: "" }]);
  };

  const handleImageChange = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  const handleAudioChange = (index, field, value) => {
    const newAudios = [...audios];
    newAudios[index][field] = value;
    setAudios(newAudios);
  };

  const handleVideoChange = (index, field, value) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("year", year);
    formData.append("body", body);

    // HeroImage
    formData.append("heroImage", heroImage);

    // Para cada imagen, audio o video, el backend espera una convención:
    // - Para imágenes: field name "images"
    // - Para audios: field name "audios"
    // - Para videos: field name "videos"
    //
    // Además, el backend busca un caption con la key: imageCaption_originalname del file.
    // Para esto, debemos usar el `originalname` en backend, pero desde frontend no lo tenemos.
    // El backend usa `originalname` del file upload de multer. Nosotros podemos mapear el epígrafe
    // con la `file.name` del File input. Ejemplo:
    //   caption key = `imageCaption_${file.name}`
    //
    // Luego el backend debe interpretar estos captions.
    // En caso de que el backend ya esté preparado para eso:
    // images, audios, videos son arrays: formData.append("images", file), etc.
    // y para captions: formData.append(`imageCaption_${file.name}`, caption)
    // Ajusta esto según la lógica de tu backend.

    // Imágenes
    images.forEach((imgObj) => {
      if (imgObj.file && imgObj.caption) {
        formData.append("images", imgObj.file);
        formData.append(`imageCaption_${imgObj.file.name}`, imgObj.caption);
      }
    });

    // Audios
    audios.forEach((audioObj) => {
      if (audioObj.file && audioObj.caption) {
        formData.append("audios", audioObj.file);
        formData.append(`audioCaption_${audioObj.file.name}`, audioObj.caption);
      }
    });

    // Videos
    videos.forEach((videoObj) => {
      if (videoObj.file && videoObj.caption) {
        formData.append("videos", videoObj.file);
        formData.append(`videoCaption_${videoObj.file.name}`, videoObj.caption);
      }
    });

    mutation.mutate(formData);
  };

  return (
    <>
      <AdminMenu />

      {/* Spinner Overlay */}
      {mutation.isPending && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className={`container ${mutation.isPending ? "blurred" : ""}`}>
        {/*    Titulo para crear nueva crónica */}
        <div className="create-cronica-head">
          <h2>Crear una nueva crónica</h2>
          <Link className="back-btn" to="/admin/cronicas">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </Link>
        </div>

        {/*         Formulario para crear nueva crónica */}
        <form className="create-cronica-form" onSubmit={handleSubmit}>
          <div className="create-cronica-form-field">
            <label>Título:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="create-cronica-form-field">
            <label>Descripción:</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              required
            />
          </div>

          <div className="create-cronica-form-field">
            <label>Año:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div className="create-cronica-form-quill">
            <label>Contenido:</label>
            <ReactQuill
              className="quill-editor"
              modules={modules}
              formats={formats}
              value={body}
              onChange={setBody}
            />
          </div>

          <div className="create-cronica-form-field">
            <label>Hero Image:</label>
            <input
              type="file"
              onChange={(e) => setHeroImage(e.target.files[0])}
              accept="image/*"
              required
            />
          </div>

          <div className="create-cronica-form-separator"></div>

          <div className="create-cronica-form-multimedia">
            <div className="create-cronica-form-multimedia-head">
              <h3>Imágenes adicionales:</h3>
              <button type="button" onClick={handleAddImage}>
                Agregar otra imagen
              </button>
            </div>

            {images.map((img, index) => (
              <div
                className="create-cronica-form-multimedia-content"
                key={index}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(index, "file", e.target.files[0])
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Epígrafe de la imagen"
                  value={img.caption}
                  onChange={(e) =>
                    handleImageChange(index, "caption", e.target.value)
                  }
                  required
                />
              </div>
            ))}
          </div>

          <div className="create-cronica-form-separator"></div>

          <div className="create-cronica-form-multimedia">
            <div className="create-cronica-form-multimedia-head">
              <h3>Audios</h3>
              <button type="button" onClick={handleAddAudio}>
                Agregar otro audio
              </button>
            </div>
            {audios.map((audio, index) => (
              <div
                className="create-cronica-form-multimedia-content"
                key={index}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    handleAudioChange(index, "file", e.target.files[0])
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Epígrafe del audio"
                  value={audio.caption}
                  onChange={(e) =>
                    handleAudioChange(index, "caption", e.target.value)
                  }
                  required
                />
              </div>
            ))}
          </div>

          <div className="create-cronica-form-separator"></div>

          <div className="create-cronica-form-multimedia">
            <div className="create-cronica-form-multimedia-head">
              <h3>Videos</h3>
              <button type="button" onClick={handleAddVideo}>
                Agregar otro video
              </button>
            </div>

            {videos.map((video, index) => (
              <div
                className="create-cronica-form-multimedia-content"
                key={index}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    handleVideoChange(index, "file", e.target.files[0])
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Epígrafe del video"
                  value={video.caption}
                  onChange={(e) =>
                    handleVideoChange(index, "caption", e.target.value)
                  }
                  required
                />
              </div>
            ))}
          </div>

          <div className="create-cronica-form-separator"></div>

          <button
            className="create-cronica-form-btn"
            type="submit"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Creando..." : "Crear Crónica"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateCronica;
