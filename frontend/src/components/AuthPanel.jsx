export function AuthPanel({
  authMode,
  authForm,
  authError,
  setAuthMode,
  onChange,
  onSubmit,
}) {
  return (
    <section className="panel auth-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Доступ</p>
          <h2>{authMode === "login" ? "Вход" : "Регистрация"}</h2>
        </div>
        <div className="segmented">
          <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
            Вход
          </button>
          <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
            Регистрация
          </button>
        </div>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          Логин
          <input name="username" value={authForm.username} onChange={onChange} required />
        </label>
        {authMode === "register" && (
          <label>
            Email
            <input name="email" type="email" value={authForm.email} onChange={onChange} required />
          </label>
        )}
        <label>
          Пароль
          <input name="password" type="password" value={authForm.password} onChange={onChange} required />
        </label>
        {authError ? <p className="error-text">{authError}</p> : null}
        <button className="primary-button" type="submit">
          {authMode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </section>
  );
}
