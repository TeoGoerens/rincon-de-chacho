import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { logoutUserAction, updateLocalProfilePictureAction } from "../../../redux/slices/users/usersSlices";
import uploadProfilePicture from "../../../reactquery/users/uploadProfilePicture";
import "./UserMenuStyle.css";

const hasCustomPhoto = (pic) => pic && !pic.includes("pixabay.com");

function UserMenu({ userMenuOpen, handleToggleUserMenu }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userAuth } = useSelector((store) => store.users);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const firstName      = userAuth?.userToDisplay?.first_name      ?? userAuth?.first_name      ?? "";
  const lastName       = userAuth?.userToDisplay?.last_name       ?? userAuth?.last_name       ?? "";
  const email          = userAuth?.userToDisplay?.email           ?? userAuth?.email           ?? "";
  const profilePicture = userAuth?.userToDisplay?.profile_picture ?? userAuth?.profile_picture ?? "";
  const userId         = userAuth?.userToDisplay?._id ?? userAuth?._id ?? "";
  const initial        = firstName.charAt(0).toUpperCase();

  const photoMutation = useMutation({
    mutationFn: ({ id, file }) => uploadProfilePicture({ id, file }),
    onSuccess: (data) => {
      setUploading(false);
      dispatch(updateLocalProfilePictureAction(data.updatedUser.profile_picture));
      toast.success("Foto de perfil actualizada correctamente.");
    },
    onError: (err) => {
      setUploading(false);
      toast.error(`Error al subir la foto: ${err.message}`);
    },
  });

  const handleLogout = () => {
    dispatch(logoutUserAction());
    /* El cache de React Query es del USUARIO: si queda vivo, el próximo
       login en este navegador arranca viendo datos del anterior (ej. el
       pronóstico de otro participante en el form del Prode) */
    queryClient.clear();
    handleToggleUserMenu();
    navigate("/");
  };

  const handlePhotoClick = () => {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setUploading(true);
    photoMutation.mutate({ id: userId, file });
  };

  return (
    <>
      {/* Overlay — click fuera cierra el menú */}
      <div
        className={`um-overlay${userMenuOpen ? " um-overlay-active" : ""}`}
        onClick={handleToggleUserMenu}
      />

      {/* Panel */}
      <div className={`um${userMenuOpen ? " um-open" : ""}`}>

        {/* ── Header: avatar + nombre + email + cerrar ── */}
        <div className="um-header">
          <div className="um-avatar">
            {hasCustomPhoto(profilePicture)
              ? <img className="um-avatar-img" src={profilePicture} alt={firstName} />
              : initial
            }
          </div>
          <div className="um-identity">
            <span className="um-name">{firstName} {lastName}</span>
            <span className="um-email">{email}</span>
          </div>
          <div className="um-close" onClick={handleToggleUserMenu}>
            <span className="material-symbols-outlined">close</span>
          </div>
        </div>

        <div className="um-divider" />

        {/* ── Acciones ── */}
        <nav className="um-actions">
          <button className="um-action-link" onClick={handlePhotoClick} disabled={uploading}>
            <div className="um-action-ico">
              <div className="material-symbols-outlined">
                {uploading ? "sync" : "photo_camera"}
              </div>
            </div>
            <div className="um-action-label">
              {uploading ? "Subiendo..." : "Cambiar foto de perfil"}
            </div>
          </button>

          <Link
            to="/forgot-password"
            className="um-action-link"
            onClick={handleToggleUserMenu}
          >
            <div className="um-action-ico">
              <div className="material-symbols-outlined">lock_reset</div>
            </div>
            <div className="um-action-label">Cambiar contraseña</div>
          </Link>

          <button className="um-action-link um-logout" onClick={handleLogout}>
            <div className="um-action-ico um-action-ico--red">
              <div className="material-symbols-outlined">logout</div>
            </div>
            <div className="um-action-label">Cerrar sesión</div>
          </button>
        </nav>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}

export default UserMenu;
