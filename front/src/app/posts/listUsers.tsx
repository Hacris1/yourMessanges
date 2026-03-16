import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { buildApiUrl } from "../../utils/apiUrl";
import "../../styles/usersList.css";

interface User {
  _id: string;
  name: string;
  email: string;
  publicKey: string;
}

export function UsersList({
  onSelect,
}: {
  onSelect: (user: User) => void;
}) {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  };

  useEffect(() => {
    if (!token || !currentUser) return;

    fetchUsers();
  }, [token, currentUser]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(buildApiUrl("/api/user"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Error al cargar los usuarios");
      }

      const data = await response.json();
      
      // Filtrar al usuario actual
      const filtered = data.filter(
        (user: User) => user._id !== currentUser?._id
      );
      setUsers(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="users-list">
        <h4 className="users-list__header">Usuarios disponibles</h4>
        <div className="users-list__body">
          <p className="users-list__status">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-list">
        <h4 className="users-list__header">Usuarios disponibles</h4>
        <div className="users-list__body">
          <p className="error">{error}</p>
          <button className="users-list__retry" onClick={fetchUsers}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-list">
      <h4 className="users-list__header">Usuarios disponibles</h4>
      <div className="users-list__body">
        {users.length === 0 ? (
          <p className="no-users">No hay otros usuarios disponibles</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user._id}>
                <button
                  className={`user-item ${selectedUserId === user._id ? "user-item--active" : ""}`.trim()}
                  onClick={() => {
                    setSelectedUserId(user._id);
                    onSelect(user);
                  }}
                >
                  <span className="user-avatar">{getInitials(user.name)}</span>
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}