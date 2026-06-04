import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { updateLocalProfilePictureAction } from "../../../redux/slices/users/usersSlices";
import AdminMenu from "../AdminMenu";
import fetchAllUsers from "../../../reactquery/admin/fetchAllUsers";
import updateUser from "../../../reactquery/admin/updateUser";
import fetchAllChachosPlayers from "../../../reactquery/chachos/fetchAllChachosPlayers";
import fetchAllPodridaPlayers from "../../../reactquery/podrida/fetchAllPodridaPlayers";
import fetchAllProdePlayers from "../../../reactquery/prode/fetchAllProdePlayers";
import uploadProfilePicture from "../../../reactquery/users/uploadProfilePicture";
import "./AdminUsersPanelStyles.css";

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const hasCustomPhoto = (pic) => pic && !pic.includes("pixabay.com");

const getLoginStatus = (lastLogin) => {
  if (!lastLogin) return { label: "Sin conexión", colorClass: "neutral" };
  const days = Math.floor((Date.now() - new Date(lastLogin)) / 86400000);
  const label = new Date(lastLogin).toLocaleDateString("es-AR");
  if (days < 14) return { label, colorClass: "green" };
  if (days < 60) return { label, colorClass: "yellow" };
  return { label, colorClass: "red" };
};

const AdminUsersPanel = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { userAuth } = useSelector((store) => store.users);
  const loggedInId = userAuth?.userToDisplay?._id ?? userAuth?._id ?? "";
  const [saving, setSaving] = useState({});
  const fileInputRef = useRef(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  const photoMutation = useMutation({
    mutationFn: ({ id, file }) => uploadProfilePicture({ id, file }),
    onSuccess: (data, variables) => {
      setUploadingFor(null);
      queryClient.invalidateQueries(["admin-users"]);
      // Si el usuario actualizado es el mismo que está logueado, actualizar el store
      if (variables.id === loggedInId) {
        dispatch(updateLocalProfilePictureAction(data.updatedUser.profile_picture));
      }
      toast.success("Foto de perfil actualizada correctamente.");
    },
    onError: (err) => {
      setUploadingFor(null);
      toast.error(`Error al subir la foto: ${err.message}`);
    },
  });

  const handleAvatarClick = (userId) => {
    setUploadingFor(userId);
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingFor) return;
    photoMutation.mutate({ id: uploadingFor, file });
  };

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAllUsers,
  });

  const { data: chachosPlayers = [] } = useQuery({
    queryKey: ["chachos-players"],
    queryFn: fetchAllChachosPlayers,
  });

  const { data: podridaPlayers = [] } = useQuery({
    queryKey: ["podrida-players"],
    queryFn: fetchAllPodridaPlayers,
  });

  const { data: prodePlayers = [] } = useQuery({
    queryKey: ["prode-players"],
    queryFn: fetchAllProdePlayers,
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }) => updateUser({ id, data }),
    onSuccess: (_, variables) => {
      setSaving((prev) => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err, variables) => {
      setSaving((prev) => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      toast.error(`Error al actualizar: ${err.message}`);
    },
  });

  const handleAssign = (userId, field, value) => {
    const key = `${userId}-${field}`;
    setSaving((prev) => ({ ...prev, [key]: true }));
    mutation.mutate({ id: userId, data: { [field]: value || null }, key });
  };

  return (
    <>
      <AdminMenu />
      <div className="aup">
        <div className="aup-header">
          <div className="aup-eyebrow">
            <span className="aup-eyebrow-dot" />
            Panel de administración
          </div>
          <h1 className="aup-title">Usuarios</h1>
          <p className="aup-subtitle">
            {users ? `${users.length} usuarios registrados` : "Cargando..."}
          </p>
        </div>

        {isLoading && <p className="aup-state">Cargando usuarios...</p>}
        {isError && <p className="aup-state">Error al cargar los usuarios.</p>}

        {!isLoading && !isError && (
          <div className="aup-table-wrap">
            <table className="aup-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Mail</th>
                  <th>Acceso</th>
                  <th>Chachos</th>
                  <th>Podrida</th>
                  <th>Prode</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => {
                  const loginStatus = getLoginStatus(user.last_login);
                  const initial = user.first_name?.[0]?.toUpperCase() ?? "?";
                  return (
                    <tr key={user._id}>
                      {/* Avatar — desktop */}
                      <td>
                        <div
                          className={`aup-avatar-wrap${uploadingFor === user._id ? " aup-avatar-wrap--uploading" : ""}`}
                          onClick={() => uploadingFor !== user._id && handleAvatarClick(user._id)}
                        >
                          {hasCustomPhoto(user.profile_picture)
                            ? <img className="aup-avatar-img" src={user.profile_picture} alt={user.first_name} />
                            : <div className="aup-avatar">{initial}</div>
                          }
                          <div className="aup-avatar-overlay">
                            {uploadingFor === user._id
                              ? <span className="aup-avatar-spinner" />
                              : <CameraIcon />
                            }
                          </div>
                        </div>
                      </td>

                      {/* Nombre — desktop muestra solo el nombre, mobile muestra card con avatar+email */}
                      <td>
                        <span className="aup-cell-name aup-desktop-only">
                          {user.first_name} {user.last_name}
                        </span>
                        <div className="aup-card-top">
                          <div
                            className={`aup-avatar-wrap${uploadingFor === user._id ? " aup-avatar-wrap--uploading" : ""}`}
                            onClick={() => uploadingFor !== user._id && handleAvatarClick(user._id)}
                          >
                            {hasCustomPhoto(user.profile_picture)
                              ? <img className="aup-avatar-img" src={user.profile_picture} alt={user.first_name} />
                              : <div className="aup-avatar">{initial}</div>
                            }
                            <div className="aup-avatar-overlay">
                              {uploadingFor === user._id
                                ? <span className="aup-avatar-spinner" />
                                : <CameraIcon />
                              }
                            </div>
                          </div>
                          <div>
                            <div className="aup-cell-name">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="aup-cell-email">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Mail — visible solo en desktop (en mobile va dentro de aup-card-top) */}
                      <td>
                        <span className="aup-cell-email">{user.email}</span>
                      </td>

                      {/* Last login */}
                      <td>
                        <div className={`aup-login-badge aup-login-badge--${loginStatus.colorClass}`}>
                          <span className="aup-login-dot" />
                          {loginStatus.label}
                        </div>
                      </td>

                      {/* Dropdowns — en mobile se muestran como campos etiquetados */}
                      <td>
                        <div className="aup-mobile-field">
                          <span className="aup-mobile-label">Chachos</span>
                          <select
                            className={`aup-select${saving[`${user._id}-chacho_player`] ? " aup-select--saving" : ""}${user.chacho_player?._id ? " aup-select--assigned" : ""}`}
                            disabled={!!saving[`${user._id}-chacho_player`]}
                            value={user.chacho_player?._id ?? ""}
                            onChange={(e) => handleAssign(user._id, "chacho_player", e.target.value)}
                          >
                            <option value="">— Sin asignar —</option>
                            {chachosPlayers.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.shirt ? `#${p.shirt} ` : ""}{p.first_name} {p.last_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td>
                        <div className="aup-mobile-field">
                          <span className="aup-mobile-label">Podrida</span>
                          <select
                            className={`aup-select${saving[`${user._id}-podrida_player`] ? " aup-select--saving" : ""}${user.podrida_player?._id ? " aup-select--assigned" : ""}`}
                            disabled={!!saving[`${user._id}-podrida_player`]}
                            value={user.podrida_player?._id ?? ""}
                            onChange={(e) => handleAssign(user._id, "podrida_player", e.target.value)}
                          >
                            <option value="">— Sin asignar —</option>
                            {podridaPlayers.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td>
                        <div className="aup-mobile-field">
                          <span className="aup-mobile-label">Prode</span>
                          <select
                            className={`aup-select${saving[`${user._id}-prode_player`] ? " aup-select--saving" : ""}${user.prode_player?._id ? " aup-select--assigned" : ""}`}
                            disabled={!!saving[`${user._id}-prode_player`]}
                            value={user.prode_player?._id ?? ""}
                            onChange={(e) => handleAssign(user._id, "prode_player", e.target.value)}
                          >
                            <option value="">— Sin asignar —</option>
                            {prodePlayers.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
};

export default AdminUsersPanel;
