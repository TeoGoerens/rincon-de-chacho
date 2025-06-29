// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./UpdatePodridaStyles.css";

//Import React Query functions
import fetchCronicaById from "../../../../reactquery/cronica/fetchCronicaById";
import updateCronica from "../../../../reactquery/cronica/updateCronica";

// Import components
import AdminMenu from "../../AdminMenu";

// Import React Quill & configurations
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
const modules = {
  toolbar: [
    [{ font: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

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

const UpdateCronica = () => {
  const { id: cronicaId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: cronicaData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchCronicaById", cronicaId],
    queryFn: () => fetchCronicaById(cronicaId),
    enabled: !!cronicaId,
  });

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [year, setYear] = useState("");
  const [body, setBody] = useState("");
  const [heroImage, setHeroImage] = useState(null);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [videos, setVideos] = useState([]);

  // Una vez que la data de la crónica está cargada, prellenar el formulario
  useEffect(() => {
    if (cronicaData?.cronica) {
      const { title, subtitle, year, body } = cronicaData.cronica;
      setTitle(title || "");
      setSubtitle(subtitle || "");
      setYear(year || "");
      setBody(body || "");

      // Hero image no la prellenamos con file, pues no tenemos un file input con valor inicial
      // El user deberá elegir una nueva si quiere cambiarla.

      // Para imágenes, audios y videos:
      // Podemos mostrarlas como vacías inicialmente o crear una lógica especial:
      // Supongamos que si ya hay imágenes, audios o videos, le damos la opción de reemplazarlas completamente.
      // Por simplicidad, las dejamos vacías: el admin deberá subir nuevos files si quiere reemplazar.

      setImages([]);
      setAudios([]);
      setVideos([]);
    }
  }, [cronicaData]);

  const mutation = useMutation({
    mutationFn: ({ cronicaId, formData }) =>
      updateCronica({ cronicaId, formData }),
    onSuccess: (data) => {
      const successMessage = data?.message || "Crónica actualizada con éxito!";
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 3000,
        pauseOnHover: true,
      });
      queryClient.invalidateQueries(["fetchAllCronicas"]);
      setTimeout(() => {
        navigate("/admin/cronicas");
      }, 4000);
    },
    onError: (error) => {
      console.error("Error al actualizar la crónica:", error.message);
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

    // Si se selecciona una nueva heroImage, la agregamos
    if (heroImage) {
      formData.append("heroImage", heroImage);
    }

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

    mutation.mutate({ cronicaId, formData });
  };

  if (isLoading) return <p>Cargando datos de la crónica...</p>;
  if (isError) return <p>Error: {error.message}</p>;

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
        <div className="create-cronica-head">
          <h2>Actualizar crónica</h2>
          <Link className="back-btn" to="/admin/cronicas">
            <i className="fa-solid fa-arrow-left"></i> Volver
          </Link>
        </div>

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
            <label>Hero Image (opcional si querés cambiar):</label>
            <input
              type="file"
              onChange={(e) => setHeroImage(e.target.files[0])}
              accept="image/*"
            />
          </div>

          <div className="create-cronica-form-separator"></div>

          <div className="create-cronica-form-multimedia">
            <div className="create-cronica-form-multimedia-head">
              <h3>Imágenes adicionales (opcional):</h3>
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
              <h3>Audios (opcional):</h3>
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
              <h3>Videos (opcional):</h3>
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
            {mutation.isLoading ? "Actualizando..." : "Actualizar Crónica"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdateCronica;
