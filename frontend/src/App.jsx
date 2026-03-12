import { useEffect, useState } from "react";
import { AdminPanel, toxinTemplate } from "./components/AdminPanel";
import { AuthPanel } from "./components/AuthPanel";
import { getInitialScenarioForm, ScenarioForm } from "./components/ScenarioForm";
import { ScenarioList } from "./components/ScenarioList";
import { api } from "./services/api";

function normalizeScenarioForm(form) {
  return {
    ...form,
    toxin_type_id: Number(form.toxin_type_id),
    exposure_level: Number(form.exposure_level),
    contact_area_cm2: Number(form.contact_area_cm2),
    contact_duration_min: Number(form.contact_duration_min),
    victim_age: Number(form.victim_age),
  };
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [organisms, setOrganisms] = useState([]);
  const [damageCategories, setDamageCategories] = useState([]);
  const [bodyLocations, setBodyLocations] = useState([]);
  const [toxins, setToxins] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [preview, setPreview] = useState(null);
  const [scenarioForm, setScenarioForm] = useState(getInitialScenarioForm());
  const [toxinForm, setToxinForm] = useState(toxinTemplate);
  const [appError, setAppError] = useState("");

  useEffect(() => {
    Promise.all([api.getOrganisms(), api.getDamageCategories(), api.getBodyLocations()])
      .then(([organismData, damageData, bodyData]) => {
        setOrganisms(organismData);
        setDamageCategories(damageData);
        setBodyLocations(bodyData);
      })
      .catch((error) => setAppError(error.message));
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setScenarios([]);
      return;
    }
    api
      .me(token)
      .then((currentUser) => {
        setUser(currentUser);
        return Promise.all([api.listScenarios(token), api.listToxins(token)]);
      })
      .then(([scenarioData, toxinData]) => {
        setScenarios(scenarioData);
        setToxins(toxinData);
      })
      .catch((error) => {
        setAppError(error.message);
        setToken("");
        localStorage.removeItem("token");
      });
  }, [token]);

  const handleAuthChange = (event) => {
    setAuthForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleScenarioChange = (event) => {
    const { name, value, type, checked } = event.target;
    setScenarioForm((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (name === "organism_type") {
        next.toxin_type_id = "";
      }
      return next;
    });
  };

  const handleToxinChange = (event) => {
    const { name, value } = event.target;
    setToxinForm((current) => ({ ...current, [name]: ["name", "description", "organism_type"].includes(name) ? value : Number(value) }));
  };

  const reloadAdminData = () => {
    if (!token) {
      return Promise.resolve();
    }
    return Promise.all([api.listScenarios(token), api.listToxins(token)]).then(([scenarioData, toxinData]) => {
      setScenarios(scenarioData);
      setToxins(toxinData);
    });
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    try {
      if (authMode === "register") {
        await api.register(authForm);
      }
      const loginResponse = await api.login({
        username: authForm.username,
        password: authForm.password,
      });
      localStorage.setItem("token", loginResponse.access_token);
      setToken(loginResponse.access_token);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const previewScenario = async () => {
    try {
      const result = await api.calculateScenario(token, normalizeScenarioForm(scenarioForm));
      setPreview(result);
    } catch (error) {
      setAppError(error.message);
    }
  };

  const submitScenario = async (event) => {
    event.preventDefault();
    try {
      await api.createScenario(token, normalizeScenarioForm(scenarioForm));
      setScenarioForm(getInitialScenarioForm());
      setPreview(null);
      await reloadAdminData();
    } catch (error) {
      setAppError(error.message);
    }
  };

  const deleteScenario = async (id) => {
    try {
      await api.deleteScenario(token, id);
      await reloadAdminData();
    } catch (error) {
      setAppError(error.message);
    }
  };

  const createToxin = async () => {
    try {
      await api.createToxin(token, toxinForm);
      setToxinForm(toxinTemplate);
      await reloadAdminData();
    } catch (error) {
      setAppError(error.message);
    }
  };

  const deleteToxin = async (id) => {
    try {
      await api.deleteToxin(token, id);
      await reloadAdminData();
    } catch (error) {
      setAppError(error.message);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">REST-проект</p>
          <h1>Симулятор токсичности морских организмов</h1>
          <p className="hero-text">
            Учебная система для моделирования контакта с медузами и ядовитыми рыбами, оценки риска и управления справочником токсинов.
          </p>
        </div>
        {user ? (
          <div className="user-card">
            <strong>{user.username}</strong>
            <span>{user.is_admin ? "Администратор" : "Пользователь"}</span>
            <button
              className="ghost-button"
              onClick={() => {
                setToken("");
                localStorage.removeItem("token");
              }}
              type="button"
            >
              Выйти
            </button>
          </div>
        ) : null}
      </header>

      {appError ? <div className="error-banner">{appError}</div> : null}

      {!token ? (
        <AuthPanel
          authMode={authMode}
          authForm={authForm}
          authError={authError}
          setAuthMode={setAuthMode}
          onChange={handleAuthChange}
          onSubmit={submitAuth}
        />
      ) : (
        <main className="dashboard">
          <ScenarioForm
            form={scenarioForm}
            toxins={toxins}
            organisms={organisms}
            damageCategories={damageCategories}
            bodyLocations={bodyLocations}
            preview={preview}
            onChange={handleScenarioChange}
            onPreview={previewScenario}
            onSubmit={submitScenario}
          />
          <ScenarioList scenarios={scenarios} onDelete={deleteScenario} />
          <AdminPanel
            toxins={toxins}
            token={token}
            user={user}
            onCreate={createToxin}
            onDelete={deleteToxin}
            onChange={handleToxinChange}
            toxinForm={toxinForm}
          />
        </main>
      )}
    </div>
  );
}
